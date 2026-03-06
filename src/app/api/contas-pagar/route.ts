import { NextRequest, NextResponse } from 'next/server';
import { getSessionUserId } from '@/lib/auth';
import { query } from '@/lib/db';
import type { ContaPagar } from '@/types';


export const dynamic = 'force-static';

export async function GET(request: NextRequest) {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const situacao = searchParams.get('situacao') ?? '';
    const dataVencDe = (searchParams.get('data_vencimento_de') ?? '').trim();
    const dataVencAte = (searchParams.get('data_vencimento_ate') ?? '').trim();
    const contaBancariaId = searchParams.get('conta_bancaria_id');
    const categoriaId = searchParams.get('categoria_id');
    const q = (searchParams.get('q') ?? '').trim();
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
    const perPage = Math.min(50, Math.max(10, parseInt(searchParams.get('per_page') ?? '20', 10)));
    const offset = (page - 1) * perPage;

    let where = 'WHERE cp.ativo = 1';
    const params: (string | number)[] = [];
    if (situacao && ['em_aberto', 'pago', 'parcial'].includes(situacao)) {
      where += ' AND cp.situacao = ?';
      params.push(situacao);
    }
    if (dataVencDe && /^\d{4}-\d{2}-\d{2}$/.test(dataVencDe)) {
      where += ' AND cp.data_vencimento >= ?';
      params.push(dataVencDe);
    }
    if (dataVencAte && /^\d{4}-\d{2}-\d{2}$/.test(dataVencAte)) {
      where += ' AND cp.data_vencimento <= ?';
      params.push(dataVencAte);
    }
    if (contaBancariaId && /^\d+$/.test(contaBancariaId)) {
      where += ' AND cp.conta_bancaria_id = ?';
      params.push(parseInt(contaBancariaId, 10));
    }
    if (categoriaId && /^\d+$/.test(categoriaId)) {
      where += ' AND cp.categoria_id = ?';
      params.push(parseInt(categoriaId, 10));
    }
    if (q.length > 0) {
      where += ' AND (c.nome LIKE ? OR cp.descricao LIKE ?)';
      const term = `%${q.replace(/%/g, '\\%')}%`;
      params.push(term, term);
    }

    const countRows = await query<{ total: number }[]>(
      `SELECT COUNT(*) AS total FROM contas_pagar cp
       LEFT JOIN clientes c ON c.id = cp.fornecedor_id
       ${where}`,
      params
    );
    const total = (Array.isArray(countRows) ? countRows[0]?.total : 0) ?? 0;

    const limit = Math.min(50, Math.max(1, perPage)) | 0;
    const offsetSafe = Math.max(0, offset) | 0;
    const list = await query<(ContaPagar & { fornecedor_nome: string; plano_contas_nome?: string; categoria_nome?: string; centro_custo_nome?: string; conta_bancaria_descricao?: string })[]>(
      `SELECT cp.id, cp.fornecedor_id, cp.descricao, cp.categoria_id, cp.plano_contas_id, cp.centro_custo_id,
              cp.valor, cp.data_emissao, cp.data_vencimento, cp.data_competencia, cp.conta_bancaria_id, cp.forma_pagamento,
              cp.situacao, cp.tipo_custo, cp.origem, cp.cte_id, cp.observacoes, cp.ativo, cp.created_at, cp.updated_at,
              c.nome AS fornecedor_nome, pc.nome AS plano_contas_nome,
              cd.nome AS categoria_nome, cc.nome AS centro_custo_nome, cb.descricao AS conta_bancaria_descricao
       FROM contas_pagar cp
       LEFT JOIN clientes c ON c.id = cp.fornecedor_id
       LEFT JOIN plano_contas pc ON pc.id = cp.plano_contas_id
       LEFT JOIN categorias_despesa cd ON cd.id = cp.categoria_id
       LEFT JOIN centros_custo cc ON cc.id = cp.centro_custo_id
       LEFT JOIN contas_bancarias cb ON cb.id = cp.conta_bancaria_id
       ${where} ORDER BY cp.data_vencimento DESC, cp.id DESC LIMIT ${limit} OFFSET ${offsetSafe}`,
      params
    );
    const items = Array.isArray(list) ? list : [];

    return NextResponse.json({
      success: true,
      data: items,
      meta: { total, page, perPage, totalPages: Math.ceil(total / perPage) },
    });
  } catch (e) {
    console.error('API contas-pagar:', e);
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json(
      {
        success: false,
        error: 'Erro ao carregar dados. Verifique a conexão com o banco.',
        ...(process.env.NODE_ENV !== 'production' && { detail: message }),
      },
      { status: 500 }
    );
  }
}

function validarContaPagar(body: unknown): Record<string, unknown> | null {
  if (!body || typeof body !== 'object') return null;
  const b = body as Record<string, unknown>;
  const valor = Number(b.valor);
  if (Number.isNaN(valor) || valor <= 0) return null;
  const dataEmissao = typeof b.data_emissao === 'string' ? b.data_emissao.trim() : '';
  const dataVencimento = typeof b.data_vencimento === 'string' ? b.data_vencimento.trim() : '';
  const categoriaId = typeof b.categoria_id === 'number' ? b.categoria_id : parseInt(String(b.categoria_id), 10);
  if (!dataEmissao || !dataVencimento || !Number.isInteger(categoriaId) || categoriaId < 1) return null;
  const tipoCusto = typeof b.tipo_custo === 'string' && ['fixo', 'variavel'].includes(b.tipo_custo as string) ? b.tipo_custo : 'variavel';
  return {
    fornecedor_id: b.fornecedor_id != null && b.fornecedor_id !== '' ? parseInt(String(b.fornecedor_id), 10) : null,
    descricao: typeof b.descricao === 'string' ? b.descricao.trim() || null : null,
    categoria_id: categoriaId,
    plano_contas_id: b.plano_contas_id != null && b.plano_contas_id !== '' ? parseInt(String(b.plano_contas_id), 10) : null,
    centro_custo_id: b.centro_custo_id != null && b.centro_custo_id !== '' ? parseInt(String(b.centro_custo_id), 10) : null,
    valor,
    data_emissao: dataEmissao,
    data_vencimento: dataVencimento,
    conta_bancaria_id: b.conta_bancaria_id != null && b.conta_bancaria_id !== '' ? parseInt(String(b.conta_bancaria_id), 10) : null,
    forma_pagamento: typeof b.forma_pagamento === 'string' ? b.forma_pagamento.trim() || null : null,
    tipo_custo: tipoCusto,
    origem: typeof b.origem === 'string' ? b.origem.trim() || null : null,
    cte_id: b.cte_id != null && b.cte_id !== '' ? parseInt(String(b.cte_id), 10) : null,
    observacoes: typeof b.observacoes === 'string' ? b.observacoes.trim() || null : null,
    data_competencia: typeof b.data_competencia === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(b.data_competencia as string)
      ? (b.data_competencia as string)
      : (dataEmissao ? `${dataEmissao.slice(0, 7)}-01` : null),
  };
}


export async function POST(request: NextRequest) {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 });
    }
    const body = await request.json();
    const data = validarContaPagar(body);
    if (!data) {
      return NextResponse.json({ success: false, error: 'Dados inválidos. Valor, datas e categoria são obrigatórios.' }, { status: 400 });
    }
    await query(
      `INSERT INTO contas_pagar (fornecedor_id, descricao, categoria_id, plano_contas_id, centro_custo_id, valor, data_emissao, data_vencimento, data_competencia, conta_bancaria_id, forma_pagamento, tipo_custo, origem, cte_id, situacao, ativo)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'em_aberto', 1)`,
      [
        data.fornecedor_id as number | null,
        data.descricao as string | null,
        data.categoria_id as number,
        data.plano_contas_id as number | null,
        data.centro_custo_id as number | null,
        data.valor as number,
        data.data_emissao as string,
        data.data_vencimento as string,
        (data as Record<string, unknown>).data_competencia as string | null,
        data.conta_bancaria_id as number | null,
        data.forma_pagamento as string | null,
        data.tipo_custo as string,
        data.origem as string | null,
        data.cte_id as number | null,
      ]
    );
    const result = await query<{ id: number }[]>(
      'SELECT LAST_INSERT_ID() AS id'
    );
    const id = Array.isArray(result) && result[0] != null ? result[0].id : null;
    return NextResponse.json({ success: true, data: { id: id ?? 0 } });
  } catch (e) {
    console.error('API contas-pagar POST:', e);
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json(
      {
        success: false,
        error: 'Erro ao cadastrar conta a pagar.',
        ...(process.env.NODE_ENV !== 'production' && { detail: message }),
      },
      { status: 500 }
    );
  }
}
