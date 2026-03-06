import { query } from '@/lib/db';
import { subMonths, format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export type DreRowType = 'metric' | 'section' | 'subtotal' | 'total' | 'detail' | 'margin';

export interface DreDemonstrativoRow {
  id: string;
  label: string;
  rowType: DreRowType;
  expandable: boolean;
  parentId?: string;
  values: Record<string, number>; // month key 'YYYY-MM' or 'ytd'
  children?: DreDemonstrativoRow[];
}

export interface DreDemonstrativoResult {
  mesRef: string;       // 'YYYY-MM'
  mesRefLabel: string;  // 'MM/YYYY'
  meses: { key: string; label: string }[];
  ytdKey: string;
  rows: DreDemonstrativoRow[];
}

/**
 * DRE em regime de CAIXA: receitas pela data do recebimento, custos/despesas pela data do pagamento.
 */

export class DreDemonstrativoService {
  private readonly ytdKey = 'ytd';

  /**
   * Gera o demonstrativo de resultado por mês + YTD (regime de caixa).
   * mesRef: mês de referência (YYYY-MM). São retornados os 12 meses terminando em mesRef + YTD do ano.
   * Receitas = valores recebidos (contas_receber_recebimentos.data_recebimento).
   * Custos/Despesas = valores pagos (contas_pagar_pagamentos.data_pagamento).
   */
  async getDemonstrativo(mesRef: string): Promise<DreDemonstrativoResult> {
    const ref = /^\d{4}-\d{2}$/.test(mesRef) ? mesRef : format(subMonths(new Date(), 1), 'yyyy-MM');
    const refDate = parseISO(`${ref}-01`);
    const meses: { key: string; label: string }[] = [];
    for (let i = 11; i >= 0; i--) {
      const d = subMonths(refDate, i);
      const key = format(d, 'yyyy-MM');
      meses.push({ key, label: format(d, 'MM/yyyy', { locale: ptBR }) });
    }
    const anoRef = format(refDate, 'yyyy');

    const [receitasPorMes, receitasPorCategoria, custosPorMes, despesasPorMes, numClientes, numColaboradores] = await Promise.all([
      this.getReceitasPorMes(anoRef, ref),
      this.getReceitasPorCategoria(anoRef, ref),
      this.getCustosPorMes(anoRef, ref),
      this.getDespesasPorMes(anoRef, ref),
      this.getNumClientes(),
      this.getNumColaboradores(),
    ]);

    const rows: DreDemonstrativoRow[] = [];
    const valuesByMonth = (map: Record<string, number>) => {
      const v: Record<string, number> = { [this.ytdKey]: 0 };
      meses.forEach((m) => {
        v[m.key] = map[m.key] ?? 0;
        v[this.ytdKey] += v[m.key];
      });
      return v;
    };

    // Métricas (contagem atual)
    const metricValues: Record<string, number> = { [this.ytdKey]: numClientes };
    meses.forEach((m) => { metricValues[m.key] = numClientes; });
    rows.push({
      id: 'metric-clientes',
      label: 'Nº Clientes',
      rowType: 'metric',
      expandable: false,
      values: { ...metricValues, [this.ytdKey]: numClientes },
    });
    const metricColab: Record<string, number> = { [this.ytdKey]: numColaboradores };
    meses.forEach((m) => { metricColab[m.key] = numColaboradores; });
    rows.push({
      id: 'metric-colaboradores',
      label: 'Nº Colaboradores',
      rowType: 'metric',
      expandable: false,
      values: metricColab,
    });

    // Receita por linha de produto (totais por mês = receitasPorMes; detalhe por categoria)
    const receitaSectionValues = valuesByMonth(receitasPorMes);

    const receitaLinhaChildren: DreDemonstrativoRow[] = receitasPorCategoria.map((cat) => ({
      id: `receita-cat-${cat.id}`,
      label: cat.nome,
      rowType: 'detail' as const,
      expandable: false,
      parentId: 'receita-linha',
      values: valuesByMonth(cat.values),
    }));

    rows.push({
      id: 'receita-linha',
      label: 'Receita por Linha de Produto',
      rowType: 'section',
      expandable: true,
      values: receitaSectionValues,
      children: receitaLinhaChildren.length > 0 ? receitaLinhaChildren : undefined,
    });

    // (-) Receita Líquida
    rows.push({
      id: 'receita-liquida',
      label: '(-) Receita Líquida',
      rowType: 'subtotal',
      expandable: false,
      values: receitaSectionValues,
    });

    // (-) Custo dos Produtos Vendidos (custos variáveis)
    const cpvValues = valuesByMonth(custosPorMes);
    rows.push({
      id: 'cpv',
      label: '(-) Custo dos Produtos Vendidos',
      rowType: 'subtotal',
      expandable: true,
      values: cpvValues,
    });

    // (=) Lucro Bruto
    const lucroBrutoValues: Record<string, number> = { [this.ytdKey]: 0 };
    meses.forEach((m) => {
      const r = receitaSectionValues[m.key] ?? 0;
      const c = custosPorMes[m.key] ?? 0;
      lucroBrutoValues[m.key] = r - c;
      lucroBrutoValues[this.ytdKey] += r - c;
    });
    rows.push({
      id: 'lucro-bruto',
      label: '(=) Lucro Bruto',
      rowType: 'total',
      expandable: false,
      values: lucroBrutoValues,
    });

    // Margem Bruta %
    const margemBrutaValues: Record<string, number> = { [this.ytdKey]: 0 };
    meses.forEach((m) => {
      const receita = receitaSectionValues[m.key] ?? 0;
      const lb = lucroBrutoValues[m.key] ?? 0;
      margemBrutaValues[m.key] = receita > 0 ? (lb / receita) * 100 : 0;
    });
    const receitaYtd = receitaSectionValues[this.ytdKey] ?? 0;
    const lbYtd = lucroBrutoValues[this.ytdKey] ?? 0;
    margemBrutaValues[this.ytdKey] = receitaYtd > 0 ? (lbYtd / receitaYtd) * 100 : 0;
    rows.push({
      id: 'margem-bruta',
      label: 'Margem Bruta',
      rowType: 'margin',
      expandable: false,
      values: margemBrutaValues,
    });

    // Despesas Administrativas e Comerciais (despesas fixas)
    const despAdmValues = valuesByMonth(despesasPorMes);
    rows.push({
      id: 'desp-adm',
      label: 'Despesas Administrativas e Comerciais',
      rowType: 'subtotal',
      expandable: true,
      values: despAdmValues,
    });

    // (-) Outras Despesas (placeholder 0)
    const outrasDespValues: Record<string, number> = { [this.ytdKey]: 0 };
    meses.forEach((m) => { outrasDespValues[m.key] = 0; });
    rows.push({
      id: 'outras-despesas',
      label: '(-) Outras Despesas',
      rowType: 'subtotal',
      expandable: true,
      values: outrasDespValues,
    });

    // (-) Despesas Financeiras (placeholder 0)
    rows.push({
      id: 'desp-financeiras',
      label: '(-) Despesas Financeiras',
      rowType: 'subtotal',
      expandable: true,
      values: { ...outrasDespValues },
    });

    // (=) Resultado antes das Receitas e Despesas Financeiras
    const resultadoAntesValues: Record<string, number> = { [this.ytdKey]: 0 };
    meses.forEach((m) => {
      const lb = lucroBrutoValues[m.key] ?? 0;
      const desp = (despAdmValues[m.key] ?? 0) + (outrasDespValues[m.key] ?? 0);
      resultadoAntesValues[m.key] = lb - desp;
      resultadoAntesValues[this.ytdKey] += lb - desp;
    });
    rows.push({
      id: 'resultado-antes',
      label: '(=) Resultado antes das Receitas e Despesas Financeiras',
      rowType: 'total',
      expandable: false,
      values: resultadoAntesValues,
    });

    // (-/-) Resultado de Equivalência Patrimonial, (+) Outras Receitas, (+) Receitas Financeiras (placeholders)
    rows.push({
      id: 'rep',
      label: '(-/-) Resultado de Equivalência Patrimonial',
      rowType: 'detail',
      expandable: false,
      values: { ...outrasDespValues },
    });
    rows.push({
      id: 'outras-receitas',
      label: '(+) Outras Receitas',
      rowType: 'detail',
      expandable: false,
      values: { ...outrasDespValues },
    });
    rows.push({
      id: 'receitas-financeiras',
      label: '(+) Receitas Financeiras',
      rowType: 'detail',
      expandable: false,
      values: { ...outrasDespValues },
    });

    // Margem Operacional %
    const margemOpValues: Record<string, number> = { [this.ytdKey]: 0 };
    meses.forEach((m) => {
      const receita = receitaSectionValues[m.key] ?? 0;
      const res = resultadoAntesValues[m.key] ?? 0;
      margemOpValues[m.key] = receita > 0 ? (res / receita) * 100 : 0;
    });
    margemOpValues[this.ytdKey] = receitaYtd > 0 ? ((resultadoAntesValues[this.ytdKey] ?? 0) / receitaYtd) * 100 : 0;
    rows.push({
      id: 'margem-operacional',
      label: 'Margem Operacional',
      rowType: 'margin',
      expandable: false,
      values: margemOpValues,
    });

    return {
      mesRef: ref,
      mesRefLabel: format(refDate, 'MM/yyyy', { locale: ptBR }),
      meses,
      ytdKey: this.ytdKey,
      rows,
    };
  }

  /** Receitas por mês: soma dos recebimentos pela data do recebimento (caixa). */
  private async getReceitasPorMes(anoRef: string, mesFim: string): Promise<Record<string, number>> {
    const start = `${anoRef}-01-01`;
    const end = `${mesFim}-31`;
    const rows = await query<{ ano_mes: string; total: string }[]>(
      `SELECT DATE_FORMAT(rr.data_recebimento, '%Y-%m') AS ano_mes, COALESCE(SUM(rr.valor_recebido), 0) AS total
       FROM contas_receber_recebimentos rr
       INNER JOIN contas_receber cr ON cr.id = rr.conta_receber_id AND cr.ativo = 1
       WHERE rr.data_recebimento BETWEEN ? AND ?
       GROUP BY ano_mes`,
      [start, end]
    );
    const map: Record<string, number> = { ytd: 0 };
    for (const r of Array.isArray(rows) ? rows : []) {
      const val = Number(r.total);
      map[r.ano_mes] = val;
      map.ytd += val;
    }
    return map;
  }

  /** Receitas por categoria por mês: por data do recebimento (caixa). */
  private async getReceitasPorCategoria(
    anoRef: string,
    mesFim: string
  ): Promise<{ id: number; nome: string; values: Record<string, number> }[]> {
    const start = `${anoRef}-01-01`;
    const end = `${mesFim}-31`;
    const rows = await query<{ categoria_id: number | null; categoria_nome: string | null; ano_mes: string; total: string }[]>(
      `SELECT cr.categoria_receita_id AS categoria_id, cat.nome AS categoria_nome,
              DATE_FORMAT(rr.data_recebimento, '%Y-%m') AS ano_mes, COALESCE(SUM(rr.valor_recebido), 0) AS total
       FROM contas_receber_recebimentos rr
       INNER JOIN contas_receber cr ON cr.id = rr.conta_receber_id AND cr.ativo = 1
       LEFT JOIN categorias_receita cat ON cat.id = cr.categoria_receita_id
       WHERE rr.data_recebimento BETWEEN ? AND ?
       GROUP BY cr.categoria_receita_id, cat.nome, ano_mes`,
      [start, end]
    );
    const byCat = new Map<number, { id: number; nome: string; values: Record<string, number> }>();
    for (const r of Array.isArray(rows) ? rows : []) {
      const id = r.categoria_id ?? 0;
      const nome = r.categoria_nome ?? 'Sem categoria';
      if (!byCat.has(id)) byCat.set(id, { id, nome, values: { ytd: 0 } });
      const entry = byCat.get(id)!;
      const val = Number(r.total);
      entry.values[r.ano_mes] = val;
      entry.values.ytd = (entry.values.ytd ?? 0) + val;
    }
    return Array.from(byCat.values());
  }

  /** Custos (variável) por mês: soma dos pagamentos pela data do pagamento (caixa). */
  private async getCustosPorMes(anoRef: string, mesFim: string): Promise<Record<string, number>> {
    const start = `${anoRef}-01-01`;
    const end = `${mesFim}-31`;
    const rows = await query<{ ano_mes: string; total: string }[]>(
      `SELECT DATE_FORMAT(pp.data_pagamento, '%Y-%m') AS ano_mes, COALESCE(SUM(pp.valor_pago), 0) AS total
       FROM contas_pagar_pagamentos pp
       INNER JOIN contas_pagar cp ON cp.id = pp.conta_pagar_id AND cp.ativo = 1
         AND (cp.tipo_custo = 'variavel' OR cp.tipo_custo IS NULL)
       WHERE pp.data_pagamento BETWEEN ? AND ?
       GROUP BY ano_mes`,
      [start, end]
    );
    const map: Record<string, number> = { ytd: 0 };
    for (const r of Array.isArray(rows) ? rows : []) {
      const val = Number(r.total);
      map[r.ano_mes] = val;
      map.ytd += val;
    }
    return map;
  }

  /** Despesas (fixo) por mês: soma dos pagamentos pela data do pagamento (caixa). */
  private async getDespesasPorMes(anoRef: string, mesFim: string): Promise<Record<string, number>> {
    const start = `${anoRef}-01-01`;
    const end = `${mesFim}-31`;
    const rows = await query<{ ano_mes: string; total: string }[]>(
      `SELECT DATE_FORMAT(pp.data_pagamento, '%Y-%m') AS ano_mes, COALESCE(SUM(pp.valor_pago), 0) AS total
       FROM contas_pagar_pagamentos pp
       INNER JOIN contas_pagar cp ON cp.id = pp.conta_pagar_id AND cp.ativo = 1 AND cp.tipo_custo = 'fixo'
       WHERE pp.data_pagamento BETWEEN ? AND ?
       GROUP BY ano_mes`,
      [start, end]
    );
    const map: Record<string, number> = { ytd: 0 };
    for (const r of Array.isArray(rows) ? rows : []) {
      const val = Number(r.total);
      map[r.ano_mes] = val;
      map.ytd += val;
    }
    return map;
  }

  private async getNumClientes(): Promise<number> {
    const rows = await query<{ total: number }[]>(
      `SELECT COUNT(*) AS total FROM clientes WHERE ativo = 1 AND tipo_cadastro = 'cliente'`
    );
    return (Array.isArray(rows) ? rows[0]?.total : 0) ?? 0;
  }

  private async getNumColaboradores(): Promise<number> {
    const rows = await query<{ total: number }[]>(
      `SELECT COUNT(*) AS total FROM clientes WHERE ativo = 1 AND tipo_cadastro = 'funcionario'`
    );
    return (Array.isArray(rows) ? rows[0]?.total : 0) ?? 0;
  }
}
