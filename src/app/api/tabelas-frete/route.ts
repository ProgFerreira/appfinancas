import { NextRequest, NextResponse } from 'next/server';
import { getSessionUserId } from '@/lib/auth';
import { query } from '@/lib/db';


export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 });
    }
    const { searchParams } = new URL(request.url);
    const ativo = searchParams.get('ativo') ?? '1';
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
    const perPage = Math.min(50, Math.max(10, parseInt(searchParams.get('per_page') ?? '20', 10)));
    const offset = (page - 1) * perPage;
    let where = 'WHERE 1=1';
    const params: (string | number)[] = [];
    if (ativo === '1') where += ' AND tf.ativo = 1';
    else if (ativo === '0') where += ' AND tf.ativo = 0';
    const countRows = await query<{ total: number }[]>(`SELECT COUNT(*) AS total FROM tabelas_frete tf ${where}`, params);
    const total = (Array.isArray(countRows) ? countRows[0]?.total : 0) ?? 0;
    const limit = Math.min(50, Math.max(1, perPage)) | 0;
    const list = await query<
      { id: number; cliente_id: number; descricao: string; origem: string; destino: string; valor_venda: number; valor_custo: number; ativo: number; cliente_nome: string }[]
    >(
      `SELECT tf.id, tf.cliente_id, tf.descricao, tf.origem, tf.destino, tf.valor_venda, tf.valor_custo, tf.ativo, c.nome AS cliente_nome
       FROM tabelas_frete tf
       INNER JOIN clientes c ON c.id = tf.cliente_id
       ${where} ORDER BY tf.descricao LIMIT ${limit} OFFSET ${Math.max(0, offset)}`,
      params
    );
    return NextResponse.json({
      success: true,
      data: Array.isArray(list) ? list : [],
      meta: { total, page, perPage, totalPages: Math.ceil(total / perPage) },
    });
  } catch (e) {
    console.error('API tabelas-frete GET:', e);
    return NextResponse.json({ success: false, error: 'Erro ao carregar tabelas de frete.' }, { status: 500 });
  }
}

function validar(body: unknown): Record<string, unknown> | null {
  if (!body || typeof body !== 'object') return null;
  const b = body as Record<string, unknown>;
  const descricao = typeof b.descricao === 'string' ? b.descricao.trim() : '';
  const origem = typeof b.origem === 'string' ? b.origem.trim() : '';
  const destino = typeof b.destino === 'string' ? b.destino.trim() : '';
  if (!descricao || !origem || !destino) return null;
  const clienteId = parseInt(String(b.cliente_id ?? 0), 10);
  if (!Number.isInteger(clienteId) || clienteId < 1) return null;
  const valorVenda = Number(b.valor_venda);
  const valorCusto = Number(b.valor_custo);
  if (Number.isNaN(valorVenda) || valorVenda < 0 || Number.isNaN(valorCusto) || valorCusto < 0) return null;
  return {
    cliente_id: clienteId,
    descricao,
    origem,
    destino,
    valor_venda: valorVenda,
    valor_custo: valorCusto,
    observacoes: typeof b.observacoes === 'string' ? b.observacoes.trim() || null : null,
    ativo: b.ativo === false || b.ativo === 0 ? 0 : 1,
  };
}


export async function POST(request: NextRequest) {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 });
    }
    const body = await request.json();
    const data = validar(body);
    if (!data) {
      return NextResponse.json({ success: false, error: 'Cliente, descrição, origem, destino e valores são obrigatórios.' }, { status: 400 });
    }
    await query(
      `INSERT INTO tabelas_frete (cliente_id, descricao, origem, destino, valor_venda, valor_custo, observacoes, ativo)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.cliente_id as number,
        data.descricao as string,
        data.origem as string,
        data.destino as string,
        data.valor_venda as number,
        data.valor_custo as number,
        data.observacoes as string | null,
        data.ativo as number,
      ]
    );
    const result = await query<{ id: number }[]>('SELECT LAST_INSERT_ID() AS id');
    const id = Array.isArray(result) && result[0] != null ? result[0].id : 0;
    return NextResponse.json({ success: true, data: { id } });
  } catch (e) {
    console.error('API tabelas-frete POST:', e);
    return NextResponse.json({ success: false, error: 'Erro ao cadastrar tabela de frete.' }, { status: 500 });
  }
}
