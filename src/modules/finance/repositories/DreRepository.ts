import { query } from '@/lib/db';

export interface DreLine {
  tipo: string;
  categoria_id?: number | null;
  categoria_nome?: string | null;
  centro_custo_id?: number | null;
  centro_custo_nome?: string | null;
  valor: number;
  competence_date: string;
}

export interface DreParams {
  dataInicio: string;
  dataFim: string;
  centroCustoId?: number | null;
  grupo?: 'receita' | 'custo' | 'despesa' | 'imposto' | null;
}

export class DreRepository {
  /**
   * Receitas por competência (contas_receber.data_competencia).
   */
  async getReceitas(params: DreParams): Promise<DreLine[]> {
    const { dataInicio, dataFim } = params;
    const where = 'WHERE cr.ativo = 1 AND cr.data_competencia BETWEEN ? AND ?';
    const qparams: (string | number)[] = [dataInicio, dataFim];
    const rows = await query<
      { tipo: string; valor: number; competence_date: string; categoria_id: number | null; categoria_nome: string | null }[]
    >(
      `SELECT 'receita' AS tipo, cr.valor, cr.data_competencia AS competence_date,
              cr.categoria_receita_id AS categoria_id, cat.nome AS categoria_nome
       FROM contas_receber cr
       LEFT JOIN categorias_receita cat ON cat.id = cr.categoria_receita_id
       ${where}
       ORDER BY cr.data_competencia, cr.id`,
      qparams
    );
    return (Array.isArray(rows) ? rows : []).map((r) => ({
      tipo: r.tipo,
      valor: Number(r.valor),
      competence_date: r.competence_date,
      categoria_id: r.categoria_id,
      categoria_nome: r.categoria_nome,
      centro_custo_id: null,
      centro_custo_nome: null,
    }));
  }

  /**
   * Custos/Despesas por competência (contas_pagar.data_competencia).
   */
  async getCustosDespesas(params: DreParams): Promise<DreLine[]> {
    const { dataInicio, dataFim, centroCustoId, grupo } = params;
    let where = 'WHERE cp.ativo = 1 AND cp.data_competencia BETWEEN ? AND ?';
    const qparams: (string | number)[] = [dataInicio, dataFim];
    if (centroCustoId != null && centroCustoId > 0) {
      where += ' AND cp.centro_custo_id = ?';
      qparams.push(centroCustoId);
    }
    if (grupo === 'custo') {
      where += ' AND (cp.tipo_custo = \'variavel\' OR cp.tipo_custo IS NULL)';
    } else if (grupo === 'despesa') {
      where += ' AND cp.tipo_custo = \'fixo\'';
    }
    const rows = await query<
      { tipo: string; valor: number; competence_date: string; categoria_id: number; categoria_nome: string | null; centro_custo_id: number | null; centro_custo_nome: string | null }[]
    >(
      `SELECT IF(cp.tipo_custo = 'fixo', 'despesa', 'custo') AS tipo, cp.valor, cp.data_competencia AS competence_date,
              cp.categoria_id, cd.nome AS categoria_nome, cp.centro_custo_id, cc.nome AS centro_custo_nome
       FROM contas_pagar cp
       LEFT JOIN categorias_despesa cd ON cd.id = cp.categoria_id
       LEFT JOIN centros_custo cc ON cc.id = cp.centro_custo_id
       ${where}
       ORDER BY cp.data_competencia, cp.id`,
      qparams
    );
    return (Array.isArray(rows) ? rows : []).map((r) => ({
      tipo: r.tipo,
      valor: Number(r.valor),
      competence_date: r.competence_date,
      categoria_id: r.categoria_id,
      categoria_nome: r.categoria_nome,
      centro_custo_id: r.centro_custo_id,
      centro_custo_nome: r.centro_custo_nome,
    }));
  }
}
