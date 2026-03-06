import { NextRequest, NextResponse } from 'next/server';
import { getSessionUserId } from '@/lib/auth';
import { query } from '@/lib/db';

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


export const dynamic = 'force-static';
export const dynamicParams = false;

export function generateStaticParams() {
  return [{ id: '0' }];
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 });
    }
    const { id } = await params;
    const idNum = parseInt(id, 10);
    if (!Number.isInteger(idNum) || idNum < 1) {
      return NextResponse.json({ success: false, error: 'ID inválido' }, { status: 400 });
    }
    const rows = await query<
      { id: number; cliente_id: number; descricao: string; origem: string; destino: string; valor_venda: number; valor_custo: number; observacoes: string | null; ativo: number }[]
    >(
      'SELECT id, cliente_id, descricao, origem, destino, valor_venda, valor_custo, observacoes, ativo FROM tabelas_frete WHERE id = ? LIMIT 1',
      [idNum]
    );
    const item = Array.isArray(rows) ? rows[0] : null;
    if (!item) {
      return NextResponse.json({ success: false, error: 'Tabela de frete não encontrada' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: item });
  } catch (e) {
    console.error('API tabelas-frete [id] GET:', e);
    return NextResponse.json({ success: false, error: 'Erro ao carregar.' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 });
    }
    const { id } = await params;
    const idNum = parseInt(id, 10);
    if (!Number.isInteger(idNum) || idNum < 1) {
      return NextResponse.json({ success: false, error: 'ID inválido' }, { status: 400 });
    }
    const body = await request.json();
    const data = validar(body);
    if (!data) {
      return NextResponse.json({ success: false, error: 'Dados inválidos.' }, { status: 400 });
    }
    await query(
      `UPDATE tabelas_frete SET cliente_id = ?, descricao = ?, origem = ?, destino = ?, valor_venda = ?, valor_custo = ?, observacoes = ?, ativo = ? WHERE id = ?`,
      [
        data.cliente_id as number,
        data.descricao as string,
        data.origem as string,
        data.destino as string,
        data.valor_venda as number,
        data.valor_custo as number,
        data.observacoes as string | null,
        data.ativo as number,
        idNum,
      ]
    );
    return NextResponse.json({ success: true, data: { id: idNum } });
  } catch (e) {
    console.error('API tabelas-frete [id] PUT:', e);
    return NextResponse.json({ success: false, error: 'Erro ao atualizar.' }, { status: 500 });
  }
}

/** Soft delete: define ativo = 0. */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getSessionUserId();
    if (!userId) return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 });
    const { id } = await params;
    const idNum = parseInt(id, 10);
    if (!Number.isInteger(idNum) || idNum < 1) return NextResponse.json({ success: false, error: 'ID inválido' }, { status: 400 });
    await query('UPDATE tabelas_frete SET ativo = 0 WHERE id = ?', [idNum]);
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('API tabelas-frete [id] DELETE:', e);
    return NextResponse.json({ success: false, error: 'Erro ao excluir.' }, { status: 500 });
  }
}
