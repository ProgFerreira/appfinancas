import { NextRequest, NextResponse } from 'next/server';
import { getSessionUserId } from '@/lib/auth';
import { query } from '@/lib/db';

/** Normaliza período: padrão início do mês e hoje. Garante início <= fim. */
function normalizarPeriodo(dataInicio: string | null, dataFim: string | null): [string, string] {
  const hoje = new Date();
  const primeiroDia = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
  const ymd = (d: Date) => d.toISOString().slice(0, 10);

  let inicio = dataInicio?.trim() || ymd(primeiroDia);
  let fim = dataFim?.trim() || ymd(hoje);

  const dInicio = new Date(inicio);
  const dFim = new Date(fim);
  if (Number.isNaN(dInicio.getTime())) inicio = ymd(primeiroDia);
  if (Number.isNaN(dFim.getTime())) fim = ymd(hoje);
  if (inicio > fim) [inicio, fim] = [fim, inicio];

  return [inicio, fim];
}

/** Número de meses no período (para custos fixos mensais). */
function mesesNoPeriodo(inicio: string, fim: string): number {
  const dInicio = new Date(inicio);
  const dFim = new Date(fim);
  const mesInicio = new Date(dInicio.getFullYear(), dInicio.getMonth(), 1);
  const mesFim = new Date(dFim.getFullYear(), dFim.getMonth(), 1);
  const diff = (mesFim.getFullYear() - mesInicio.getFullYear()) * 12 + (mesFim.getMonth() - mesInicio.getMonth());
  return Math.max(1, diff + 1);
}


export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const dataInicio = searchParams.get('data_inicio');
    const dataFim = searchParams.get('data_fim');
    const [inicio, fim] = normalizarPeriodo(dataInicio, dataFim);
    const meses = mesesNoPeriodo(inicio, fim);

    // Resumo (sempre): contas em aberto e total clientes
    const [cpRows, crRows, clientesRows] = await Promise.all([
      query<{ total: number; soma: number }[]>(
        `SELECT COUNT(*) AS total, COALESCE(SUM(valor), 0) AS soma 
         FROM contas_pagar WHERE ativo = 1 AND situacao IN ('em_aberto', 'parcial')`
      ),
      query<{ total: number; soma: number }[]>(
        `SELECT COUNT(*) AS total, COALESCE(SUM(valor), 0) AS soma 
         FROM contas_receber WHERE ativo = 1 AND situacao IN ('em_aberto', 'parcial')`
      ),
      query<{ total: number }[]>(
        'SELECT COUNT(*) AS total FROM clientes WHERE ativo = 1'
      ),
    ]);

    // Tarefas pendentes do usuário (se tabela tarefas existir)
    let tarefasPendentes = 0;
    try {
      const tarefasPendentesRows = await query<{ total: number }[]>(
        `SELECT COUNT(*) AS total FROM tarefas 
         WHERE deleted_at IS NULL AND responsavel_id = ? AND status IN ('pendente', 'em_andamento')`,
        [userId]
      );
      tarefasPendentes = (Array.isArray(tarefasPendentesRows) ? tarefasPendentesRows[0]?.total : 0) ?? 0;
    } catch {
      // Tabela tarefas pode não existir em alguns ambientes
    }

    // Visão geral do período (igual ao PHP)
    const [faturamentoRows, custosVarRows, custosFixosMensalRows] = await Promise.all([
      query<{ total: number }[]>(
        `SELECT COALESCE(SUM(valor), 0) AS total FROM contas_receber 
         WHERE ativo = 1 AND data_emissao BETWEEN ? AND ?`,
        [inicio, fim]
      ),
      query<{ total: number }[]>(
        `SELECT COALESCE(SUM(valor), 0) AS total FROM contas_pagar 
         WHERE ativo = 1 AND (tipo_custo = 'variavel' OR tipo_custo IS NULL) AND data_emissao BETWEEN ? AND ?`,
        [inicio, fim]
      ),
      query<{ total: number }[]>(
        `SELECT COALESCE(SUM(valor_previsto), 0) AS total FROM despesas_fixas WHERE ativo = 1`
      ),
    ]);

    const faturamento = Number((Array.isArray(faturamentoRows) ? faturamentoRows[0]?.total : 0) ?? 0);
    const custosVariaveis = Number((Array.isArray(custosVarRows) ? custosVarRows[0]?.total : 0) ?? 0);
    const custosFixosMensal = Number((Array.isArray(custosFixosMensalRows) ? custosFixosMensalRows[0]?.total : 0) ?? 0);
    const custosFixos = custosFixosMensal * meses;
    const resultado = faturamento - custosVariaveis - custosFixos;
    const percentualFixos = faturamento > 0 ? (custosFixos / faturamento) * 100 : 0;
    const percentualVariaveis = faturamento > 0 ? (custosVariaveis / faturamento) * 100 : 0;

    // Alertas: contas vencidas (em_aberto e data_vencimento < hoje)
    const [alertaPagarRows, alertaReceberRows] = await Promise.all([
      query<{ qtd: number }[]>(
        `SELECT COUNT(*) AS qtd FROM contas_pagar 
         WHERE ativo = 1 AND situacao = 'em_aberto' AND data_vencimento < CURDATE()`
      ),
      query<{ qtd: number }[]>(
        `SELECT COUNT(*) AS qtd FROM contas_receber 
         WHERE ativo = 1 AND situacao = 'em_aberto' AND data_vencimento < CURDATE()`
      ),
    ]);

    const contasPagarVencidas = Number((Array.isArray(alertaPagarRows) ? alertaPagarRows[0]?.qtd : 0) ?? 0);
    const contasReceberVencidas = Number((Array.isArray(alertaReceberRows) ? alertaReceberRows[0]?.qtd : 0) ?? 0);

    // Fluxo de caixa previsto: entradas e saídas por data_vencimento (em_aberto ou parcial) no período
    const [entradasRows, saidasRows] = await Promise.all([
      query<{ data: string; total: number }[]>(
        `SELECT data_vencimento AS data, SUM(valor) AS total FROM contas_receber 
         WHERE ativo = 1 AND situacao IN ('em_aberto', 'parcial') AND data_vencimento BETWEEN ? AND ?
         GROUP BY data_vencimento ORDER BY data_vencimento`,
        [inicio, fim]
      ),
      query<{ data: string; total: number }[]>(
        `SELECT data_vencimento AS data, SUM(valor) AS total FROM contas_pagar 
         WHERE ativo = 1 AND situacao IN ('em_aberto', 'parcial') AND data_vencimento BETWEEN ? AND ?
         GROUP BY data_vencimento ORDER BY data_vencimento`,
        [inicio, fim]
      ),
    ]);

    // Margem por CT-e e ranking de clientes (opcionais: se tabela/coluna não existir, retorna [])
    let margemPorCte: Array<{
      id: number;
      numero: string;
      cliente_id: number | null;
      cliente_nome: string | null;
      valor_frete: number;
      custo: number;
      margem: number;
      data_emissao: string | null;
    }> = [];
    let rankingClientes: Array<{ cliente_id: number; nome: string; total: number }> = [];

    try {
      const margemCteRows = await query<{
        id: number;
        numero: string;
        cliente_id: number | null;
        cliente_nome: string | null;
        valor_frete: number;
        data_emissao: string | null;
        custo: number;
      }[]>(
        `SELECT c.id, c.numero, c.cliente_id, cl.nome AS cliente_nome, 
                COALESCE(c.valor_frete, 0) AS valor_frete, c.data_emissao,
                (SELECT COALESCE(SUM(d.valor), 0) FROM despesas_viagem d WHERE d.cte_id = c.id AND d.ativo = 1) AS custo
         FROM ctes c
         LEFT JOIN clientes cl ON cl.id = c.cliente_id
         WHERE c.ativo = 1 AND c.data_emissao BETWEEN ? AND ?
         ORDER BY c.data_emissao DESC, c.id
         LIMIT 50`,
        [inicio, fim]
      );
      margemPorCte = (Array.isArray(margemCteRows) ? margemCteRows : []).map((r) => ({
        id: r.id,
        numero: r.numero ?? '',
        cliente_id: r.cliente_id ?? null,
        cliente_nome: r.cliente_nome ?? null,
        valor_frete: Number(r.valor_frete ?? 0),
        custo: Number(r.custo ?? 0),
        margem: Number(r.valor_frete ?? 0) - Number(r.custo ?? 0),
        data_emissao: r.data_emissao ?? null,
      }));
    } catch (errMargem) {
      console.warn('Dashboard: margem por CT-e não disponível (verifique tabela despesas_viagem e coluna valor):', errMargem);
    }

    try {
      const rankingRows = await query<{ cliente_id: number; nome: string; total: number }[]>(
        `SELECT cr.cliente_id, cl.nome, COALESCE(SUM(cr.valor), 0) AS total
         FROM contas_receber cr
         INNER JOIN clientes cl ON cl.id = cr.cliente_id
         WHERE cr.ativo = 1 AND cr.data_emissao BETWEEN ? AND ?
         GROUP BY cr.cliente_id, cl.nome
         ORDER BY total DESC
         LIMIT 15`,
        [inicio, fim]
      );
      rankingClientes = Array.isArray(rankingRows) ? rankingRows.map((r) => ({
        cliente_id: r.cliente_id,
        nome: r.nome ?? '',
        total: Number(r.total ?? 0),
      })) : [];
    } catch (errRanking) {
      console.warn('Dashboard: ranking de clientes não disponível:', errRanking);
    }

    const contasPagar = (Array.isArray(cpRows) ? cpRows[0] : null) ?? { total: 0, soma: 0 };
    const contasReceber = (Array.isArray(crRows) ? crRows[0] : null) ?? { total: 0, soma: 0 };
    const totalClientes = (Array.isArray(clientesRows) ? clientesRows[0]?.total : 0) ?? 0;

    return NextResponse.json({
      success: true,
      data: {
        resumo: {
          contasPagar: { total: contasPagar.total ?? 0, soma: Number(contasPagar.soma ?? 0) },
          contasReceber: { total: contasReceber.total ?? 0, soma: Number(contasReceber.soma ?? 0) },
          totalClientes,
          tarefasPendentes,
        },
        periodo: { dataInicio: inicio, dataFim: fim },
        visaoGeral: {
          faturamento,
          custos_variaveis: custosVariaveis,
          custos_fixos: custosFixos,
          resultado,
          percentual_fixos: Math.round(percentualFixos * 10) / 10,
          percentual_variaveis: Math.round(percentualVariaveis * 10) / 10,
        },
        alertas: {
          contas_pagar_vencidas: contasPagarVencidas,
          contas_receber_vencidas: contasReceberVencidas,
        },
        fluxo: {
          entradas: Array.isArray(entradasRows) ? entradasRows : [],
          saidas: Array.isArray(saidasRows) ? saidasRows : [],
        },
        margemPorCte,
        rankingClientes,
      },
    });
  } catch (e) {
    console.error('API dashboard:', e);
    const detail = e instanceof Error ? e.message : String(e);
    return NextResponse.json(
      {
        success: false,
        error: 'Erro ao carregar dados. Verifique a conexão com o banco.',
        detail: process.env.NODE_ENV === 'development' ? detail : undefined,
      },
      { status: 500 }
    );
  }
}
