import { query } from '@/lib/db';

export interface CashFlowEntry {
  data: string;
  tipo: 'entrada' | 'saida';
  valor: number;
  descricao?: string;
  conta_bancaria_id?: number | null;
  categoria_id?: number | null;
  categoria_nome?: string | null;
  centro_custo_id?: number | null;
  centro_custo_nome?: string | null;
}

export interface CashFlowParams {
  dataInicio: string;
  dataFim: string;
  contaBancariaId?: number | null;
  centroCustoId?: number | null;
  categoriaId?: number | null;
}

export class CashFlowRepository {
  /**
   * Entradas = recebimentos (data_recebimento) no período.
   */
  async getEntradas(params: CashFlowParams): Promise<CashFlowEntry[]> {
    const { dataInicio, dataFim, contaBancariaId, categoriaId } = params;
    let where = 'WHERE r.data_recebimento BETWEEN ? AND ?';
    const qparams: (string | number)[] = [dataInicio, dataFim];
    if (contaBancariaId != null && contaBancariaId > 0) {
      where += ' AND r.conta_bancaria_id = ?';
      qparams.push(contaBancariaId);
    }
    if (categoriaId != null && categoriaId > 0) {
      where += ' AND cr.categoria_receita_id = ?';
      qparams.push(categoriaId);
    }
    const rows = await query<
      { data: string; valor: number; descricao: string | null; conta_bancaria_id: number | null; categoria_id: number | null; categoria_nome: string | null; centro_custo_id: number | null; centro_custo_nome: string | null }[]
    >(
      `SELECT DATE_FORMAT(r.data_recebimento, '%Y-%m-%d') AS data, r.valor_recebido AS valor, cr.descricao,
              r.conta_bancaria_id, cr.categoria_receita_id AS categoria_id, cat.nome AS categoria_nome,
              NULL AS centro_custo_id, NULL AS centro_custo_nome
       FROM contas_receber_recebimentos r
       INNER JOIN contas_receber cr ON cr.id = r.conta_receber_id AND cr.ativo = 1
       LEFT JOIN categorias_receita cat ON cat.id = cr.categoria_receita_id
       ${where}
       ORDER BY r.data_recebimento, r.id`,
      qparams
    );
    return (Array.isArray(rows) ? rows : []).map((r) => ({
      data: typeof r.data === 'string' ? r.data.slice(0, 10) : String(r.data).slice(0, 10),
      tipo: 'entrada' as const,
      valor: Number(r.valor),
      descricao: r.descricao ?? undefined,
      conta_bancaria_id: r.conta_bancaria_id,
      categoria_id: r.categoria_id,
      categoria_nome: r.categoria_nome ?? undefined,
      centro_custo_id: r.centro_custo_id,
      centro_custo_nome: r.centro_custo_nome ?? undefined,
    }));
  }

  /**
   * Saídas = pagamentos (data_pagamento) no período.
   */
  async getSaidas(params: CashFlowParams): Promise<CashFlowEntry[]> {
    const { dataInicio, dataFim, contaBancariaId, centroCustoId, categoriaId } = params;
    let where = 'WHERE p.data_pagamento BETWEEN ? AND ?';
    const qparams: (string | number)[] = [dataInicio, dataFim];
    if (contaBancariaId != null && contaBancariaId > 0) {
      where += ' AND (p.conta_bancaria_id = ? OR p.conta_bancaria_id IS NULL)';
      qparams.push(contaBancariaId);
    }
    if (centroCustoId != null && centroCustoId > 0) {
      where += ' AND cp.centro_custo_id = ?';
      qparams.push(centroCustoId);
    }
    if (categoriaId != null && categoriaId > 0) {
      where += ' AND cp.categoria_id = ?';
      qparams.push(categoriaId);
    }
    const rows = await query<
      { data: string; valor: number; descricao: string | null; conta_bancaria_id: number | null; categoria_id: number; categoria_nome: string | null; centro_custo_id: number | null; centro_custo_nome: string | null }[]
    >(
      `SELECT DATE_FORMAT(p.data_pagamento, '%Y-%m-%d') AS data, p.valor_pago AS valor, cp.descricao,
              p.conta_bancaria_id, cp.categoria_id, cd.nome AS categoria_nome, cp.centro_custo_id, cc.nome AS centro_custo_nome
       FROM contas_pagar_pagamentos p
       INNER JOIN contas_pagar cp ON cp.id = p.conta_pagar_id AND cp.ativo = 1
       LEFT JOIN categorias_despesa cd ON cd.id = cp.categoria_id
       LEFT JOIN centros_custo cc ON cc.id = cp.centro_custo_id
       ${where}
       ORDER BY p.data_pagamento, p.id`,
      qparams
    );
    return (Array.isArray(rows) ? rows : []).map((r) => ({
      data: typeof r.data === 'string' ? r.data.slice(0, 10) : String(r.data).slice(0, 10),
      tipo: 'saida' as const,
      valor: Number(r.valor),
      descricao: r.descricao ?? undefined,
      conta_bancaria_id: r.conta_bancaria_id,
      categoria_id: r.categoria_id,
      categoria_nome: r.categoria_nome ?? undefined,
      centro_custo_id: r.centro_custo_id,
      centro_custo_nome: r.centro_custo_nome ?? undefined,
    }));
  }

  /**
   * Entradas do extrato bancário (OFX): transações type = 'credit' em bank_transactions.
   */
  async getEntradasFromExtrato(params: CashFlowParams): Promise<CashFlowEntry[]> {
    const { dataInicio, dataFim, contaBancariaId } = params;
    let where = 'WHERE bt.posted_at BETWEEN ? AND ? AND bt.type = ?';
    const qparams: (string | number)[] = [dataInicio, dataFim, 'credit'];
    if (contaBancariaId != null && contaBancariaId > 0) {
      where += ' AND bt.bank_account_id = ?';
      qparams.push(contaBancariaId);
    }
    const rows = await query<
      { data: string; valor: number; descricao: string | null; conta_bancaria_id: number | null }[]
    >(
      `SELECT bt.posted_at AS data, bt.amount AS valor,
              COALESCE(bt.memo, bt.payee) AS descricao, bt.bank_account_id AS conta_bancaria_id
       FROM bank_transactions bt
       ${where}
       ORDER BY bt.posted_at, bt.id`,
      qparams
    );
    return (Array.isArray(rows) ? rows : []).map((r) => ({
      data: typeof r.data === 'string' ? r.data.slice(0, 10) : String(r.data).slice(0, 10),
      tipo: 'entrada' as const,
      valor: Number(r.valor),
      descricao: r.descricao ?? undefined,
      conta_bancaria_id: r.conta_bancaria_id,
      categoria_id: null,
      categoria_nome: undefined,
      centro_custo_id: null,
      centro_custo_nome: undefined,
    }));
  }

  /**
   * Saídas do extrato bancário (OFX): transações type = 'debit' em bank_transactions.
   */
  async getSaidasFromExtrato(params: CashFlowParams): Promise<CashFlowEntry[]> {
    const { dataInicio, dataFim, contaBancariaId } = params;
    let where = 'WHERE bt.posted_at BETWEEN ? AND ? AND bt.type = ?';
    const qparams: (string | number)[] = [dataInicio, dataFim, 'debit'];
    if (contaBancariaId != null && contaBancariaId > 0) {
      where += ' AND bt.bank_account_id = ?';
      qparams.push(contaBancariaId);
    }
    const rows = await query<
      { data: string; valor: number; descricao: string | null; conta_bancaria_id: number | null }[]
    >(
      `SELECT bt.posted_at AS data, bt.amount AS valor,
              COALESCE(bt.memo, bt.payee) AS descricao, bt.bank_account_id AS conta_bancaria_id
       FROM bank_transactions bt
       ${where}
       ORDER BY bt.posted_at, bt.id`,
      qparams
    );
    return (Array.isArray(rows) ? rows : []).map((r) => ({
      data: typeof r.data === 'string' ? r.data.slice(0, 10) : String(r.data).slice(0, 10),
      tipo: 'saida' as const,
      valor: Number(r.valor),
      descricao: r.descricao ?? undefined,
      conta_bancaria_id: r.conta_bancaria_id,
      categoria_id: null,
      categoria_nome: undefined,
      centro_custo_id: null,
      centro_custo_nome: undefined,
    }));
  }

  /**
   * Saldo inicial antes de uma data: soma saldo_inicial das contas + recebimentos antes - pagamentos antes.
   * Usado para fluxo dia a dia (saldo acumulado).
   */
  async getSaldoInicialAntesDe(dataAntesDe: string, contaBancariaId?: number | null): Promise<number> {
    let whereContas = 'WHERE ativo = 1';
    const paramsContas: (string | number)[] = [];
    if (contaBancariaId != null && contaBancariaId > 0) {
      whereContas += ' AND id = ?';
      paramsContas.push(contaBancariaId);
    }
    const saldoContasRows = await query<{ total: number }[]>(
      `SELECT COALESCE(SUM(saldo_inicial), 0) AS total FROM contas_bancarias ${whereContas}`,
      paramsContas
    );
    const saldoContas = Number((Array.isArray(saldoContasRows) ? saldoContasRows[0]?.total : 0) ?? 0);

    let whereR = 'WHERE r.data_recebimento < ?';
    const paramsR: (string | number)[] = [dataAntesDe];
    if (contaBancariaId != null && contaBancariaId > 0) {
      whereR += ' AND r.conta_bancaria_id = ?';
      paramsR.push(contaBancariaId);
    }
    const entradasRows = await query<{ total: number }[]>(
      `SELECT COALESCE(SUM(r.valor_recebido), 0) AS total
       FROM contas_receber_recebimentos r
       INNER JOIN contas_receber cr ON cr.id = r.conta_receber_id AND cr.ativo = 1
       ${whereR}`,
      paramsR
    );
    const entradasAntes = Number((Array.isArray(entradasRows) ? entradasRows[0]?.total : 0) ?? 0);

    let whereP = 'WHERE p.data_pagamento < ?';
    const paramsP: (string | number)[] = [dataAntesDe];
    if (contaBancariaId != null && contaBancariaId > 0) {
      whereP += ' AND p.conta_bancaria_id = ?';
      paramsP.push(contaBancariaId);
    }
    const saidasRows = await query<{ total: number }[]>(
      `SELECT COALESCE(SUM(p.valor_pago), 0) AS total
       FROM contas_pagar_pagamentos p
       INNER JOIN contas_pagar cp ON cp.id = p.conta_pagar_id AND cp.ativo = 1
       ${whereP}`,
      paramsP
    );
    const saidasAntes = Number((Array.isArray(saidasRows) ? saidasRows[0]?.total : 0) ?? 0);

    return saldoContas + entradasAntes - saidasAntes;
  }

  /** Entradas previstas: contas a receber em_aberto/parcial por data_vencimento, valor pendente. */
  async getEntradasPrevistas(params: CashFlowParams): Promise<CashFlowEntry[]> {
    const { dataInicio, dataFim, contaBancariaId, categoriaId } = params;
    let where = `WHERE (cr.ativo = 1 OR cr.ativo IS NULL) AND LOWER(TRIM(cr.situacao)) IN ('em_aberto', 'parcial')
      AND cr.data_vencimento BETWEEN ? AND ?`;
    const qparams: (string | number)[] = [dataInicio, dataFim];
    if (contaBancariaId != null && contaBancariaId > 0) {
      where += ' AND (cr.conta_bancaria_id = ? OR cr.conta_bancaria_id IS NULL)';
      qparams.push(contaBancariaId);
    }
    if (categoriaId != null && categoriaId > 0) {
      where += ' AND cr.categoria_receita_id = ?';
      qparams.push(categoriaId);
    }
    const rows = await query<
      { data: string; valor: number; descricao: string | null; conta_bancaria_id: number | null; categoria_id: number | null; categoria_nome: string | null }[]
    >(
      `SELECT DATE_FORMAT(cr.data_vencimento, '%Y-%m-%d') AS data,
              (cr.valor - COALESCE((SELECT SUM(rr.valor_recebido) FROM contas_receber_recebimentos rr WHERE rr.conta_receber_id = cr.id), 0)) AS valor,
              cr.descricao, cr.conta_bancaria_id, cr.categoria_receita_id AS categoria_id, cat.nome AS categoria_nome
       FROM contas_receber cr
       LEFT JOIN categorias_receita cat ON cat.id = cr.categoria_receita_id
       ${where}
       HAVING valor > 0
       ORDER BY cr.data_vencimento, cr.id`,
      qparams
    );
    return (Array.isArray(rows) ? rows : []).map((r) => ({
      data: typeof r.data === 'string' ? r.data.slice(0, 10) : String(r.data).slice(0, 10),
      tipo: 'entrada' as const,
      valor: Number(r.valor),
      descricao: r.descricao ?? undefined,
      conta_bancaria_id: r.conta_bancaria_id,
      categoria_id: r.categoria_id ?? null,
      categoria_nome: r.categoria_nome ?? undefined,
      centro_custo_id: null,
      centro_custo_nome: undefined,
    }));
  }

  /** Saídas previstas: contas a pagar em_aberto/parcial por data_vencimento, valor pendente. */
  async getSaidasPrevistas(params: CashFlowParams): Promise<CashFlowEntry[]> {
    const { dataInicio, dataFim, contaBancariaId, centroCustoId, categoriaId } = params;
    let where = `WHERE (cp.ativo = 1 OR cp.ativo IS NULL) AND LOWER(TRIM(cp.situacao)) IN ('em_aberto', 'parcial')
      AND cp.data_vencimento BETWEEN ? AND ?`;
    const qparams: (string | number)[] = [dataInicio, dataFim];
    if (contaBancariaId != null && contaBancariaId > 0) {
      where += ' AND (cp.conta_bancaria_id = ? OR cp.conta_bancaria_id IS NULL)';
      qparams.push(contaBancariaId);
    }
    if (centroCustoId != null && centroCustoId > 0) {
      where += ' AND cp.centro_custo_id = ?';
      qparams.push(centroCustoId);
    }
    if (categoriaId != null && categoriaId > 0) {
      where += ' AND cp.categoria_id = ?';
      qparams.push(categoriaId);
    }
    const rows = await query<
      { data: string; valor: number; descricao: string | null; conta_bancaria_id: number | null; categoria_id: number | null; categoria_nome: string | null; centro_custo_id: number | null; centro_custo_nome: string | null }[]
    >(
      `SELECT DATE_FORMAT(cp.data_vencimento, '%Y-%m-%d') AS data,
              (cp.valor - COALESCE((SELECT SUM(pp.valor_pago) FROM contas_pagar_pagamentos pp WHERE pp.conta_pagar_id = cp.id), 0)) AS valor,
              cp.descricao, cp.conta_bancaria_id, cp.categoria_id, cd.nome AS categoria_nome, cp.centro_custo_id, cc.nome AS centro_custo_nome
       FROM contas_pagar cp
       LEFT JOIN categorias_despesa cd ON cd.id = cp.categoria_id
       LEFT JOIN centros_custo cc ON cc.id = cp.centro_custo_id
       ${where}
       HAVING valor > 0
       ORDER BY cp.data_vencimento, cp.id`,
      qparams
    );
    return (Array.isArray(rows) ? rows : []).map((r) => ({
      data: typeof r.data === 'string' ? r.data.slice(0, 10) : String(r.data).slice(0, 10),
      tipo: 'saida' as const,
      valor: Number(r.valor),
      descricao: r.descricao ?? undefined,
      conta_bancaria_id: r.conta_bancaria_id,
      categoria_id: r.categoria_id ?? null,
      categoria_nome: r.categoria_nome ?? undefined,
      centro_custo_id: r.centro_custo_id ?? null,
      centro_custo_nome: r.centro_custo_nome ?? undefined,
    }));
  }
}
