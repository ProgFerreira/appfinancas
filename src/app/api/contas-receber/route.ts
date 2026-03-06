import { NextRequest, NextResponse } from 'next/server';
import { getSessionUserId } from '@/lib/auth';
import { query } from '@/lib/db';
import type { ContaReceber } from '@/types';


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

    let where = 'WHERE cr.ativo = 1';
    const params: (string | number)[] = [];
    if (situacao && ['em_aberto', 'recebido', 'parcial'].includes(situacao)) {
      where += ' AND cr.situacao = ?';
      params.push(situacao);
    }
    if (dataVencDe && /^\d{4}-\d{2}-\d{2}$/.test(dataVencDe)) {
      where += ' AND cr.data_vencimento >= ?';
      params.push(dataVencDe);
    }
    if (dataVencAte && /^\d{4}-\d{2}-\d{2}$/.test(dataVencAte)) {
      where += ' AND cr.data_vencimento <= ?';
      params.push(dataVencAte);
    }
    if (contaBancariaId && /^\d+$/.test(contaBancariaId)) {
      where += ' AND cr.conta_bancaria_id = ?';
      params.push(parseInt(contaBancariaId, 10));
    }
    if (categoriaId && /^\d+$/.test(categoriaId)) {
      where += ' AND cr.categoria_receita_id = ?';
      params.push(parseInt(categoriaId, 10));
    }
    if (q.length > 0) {
      where += ' AND (c.nome LIKE ? OR cr.descricao LIKE ?)';
      const term = `%${q.replace(/%/g, '\\%')}%`;
      params.push(term, term);
    }

    const countRows = await query<{ total: number }[]>(
      `SELECT COUNT(*) AS total FROM contas_receber cr
       INNER JOIN clientes c ON c.id = cr.cliente_id
       ${where}`,
      params
    );
    const total = (Array.isArray(countRows) ? countRows[0]?.total : 0) ?? 0;

    const limit = Math.min(50, Math.max(1, perPage)) | 0;
    const offsetSafe = Math.max(0, offset) | 0;
    const list = await query<(ContaReceber & { cliente_nome: string; categoria_receita_nome?: string; plano_contas_nome?: string; conta_bancaria_descricao?: string })[]>(
      `SELECT cr.id, cr.cliente_id, cr.categoria_receita_id, cr.plano_contas_id, cr.descricao, cr.valor,
              cr.data_emissao, cr.data_vencimento, cr.data_competencia, cr.conta_bancaria_id, cr.situacao, cr.cte_id, cr.observacoes,
              cr.ativo, cr.created_at, cr.updated_at, c.nome AS cliente_nome,
              cat.nome AS categoria_receita_nome, pc.nome AS plano_contas_nome, cb.descricao AS conta_bancaria_descricao
       FROM contas_receber cr
       INNER JOIN clientes c ON c.id = cr.cliente_id
       LEFT JOIN categorias_receita cat ON cat.id = cr.categoria_receita_id
       LEFT JOIN plano_contas pc ON pc.id = cr.plano_contas_id
       LEFT JOIN contas_bancarias cb ON cb.id = cr.conta_bancaria_id
       ${where} ORDER BY cr.data_vencimento DESC, cr.id DESC LIMIT ${limit} OFFSET ${offsetSafe}`,
      params
    );
    const items = Array.isArray(list) ? list : [];

    return NextResponse.json({
      success: true,
      data: items,
      meta: { total, page, perPage, totalPages: Math.ceil(total / perPage) },
    });
  } catch (e) {
    console.error('API contas-receber:', e);
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

function validarContaReceber(body: unknown): Record<string, unknown> | null {
  if (!body || typeof body !== 'object') return null;
  const b = body as Record<string, unknown>;
  const valor = Number(b.valor);
  if (Number.isNaN(valor) || valor <= 0) return null;
  const clienteId = typeof b.cliente_id === 'number' ? b.cliente_id : parseInt(String(b.cliente_id), 10);
  if (!Number.isInteger(clienteId) || clienteId < 1) return null;
  const dataEmissao = typeof b.data_emissao === 'string' ? b.data_emissao.trim() : '';
  const dataVencimento = typeof b.data_vencimento === 'string' ? b.data_vencimento.trim() : '';
  if (!dataEmissao || !dataVencimento) return null;
  return {
    cliente_id: clienteId,
    categoria_receita_id: b.categoria_receita_id != null && b.categoria_receita_id !== '' ? parseInt(String(b.categoria_receita_id), 10) : null,
    plano_contas_id: b.plano_contas_id != null && b.plano_contas_id !== '' ? parseInt(String(b.plano_contas_id), 10) : null,
    descricao: typeof b.descricao === 'string' ? b.descricao.trim() || null : null,
    valor,
    data_emissao: dataEmissao,
    data_vencimento: dataVencimento,
    conta_bancaria_id: b.conta_bancaria_id != null && b.conta_bancaria_id !== '' ? parseInt(String(b.conta_bancaria_id), 10) : null,
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
    const data = validarContaReceber(body);
    if (!data) {
      return NextResponse.json({ success: false, error: 'Dados inválidos. Cliente, valor e datas são obrigatórios.' }, { status: 400 });
    }
    await query(
      `INSERT INTO contas_receber (cliente_id, categoria_receita_id, plano_contas_id, descricao, valor, data_emissao, data_vencimento, data_competencia, conta_bancaria_id, cte_id, situacao, observacoes, ativo)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'em_aberto', ?, 1)`,
      [
        data.cliente_id as number,
        data.categoria_receita_id as number | null,
        data.plano_contas_id as number | null,
        data.descricao as string | null,
        data.valor as number,
        data.data_emissao as string,
        data.data_vencimento as string,
        (data as Record<string, unknown>).data_competencia as string | null,
        data.conta_bancaria_id as number | null,
        data.cte_id as number | null,
        data.observacoes as string | null,
      ]
    );
    const result = await query<{ id: number }[]>(
      'SELECT LAST_INSERT_ID() AS id'
    );
    const id = Array.isArray(result) && result[0] != null ? result[0].id : null;
    return NextResponse.json({ success: true, data: { id: id ?? 0 } });
  } catch (e) {
    console.error('API contas-receber POST:', e);
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json(
      {
        success: false,
        error: 'Erro ao cadastrar conta a receber.',
        ...(process.env.NODE_ENV !== 'production' && { detail: message }),
      },
      { status: 500 }
    );
  }
}
