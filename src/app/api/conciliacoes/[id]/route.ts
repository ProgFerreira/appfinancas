import { NextRequest, NextResponse } from 'next/server';
import { getSessionUserId } from '@/lib/auth';
import { query } from '@/lib/db';


export const dynamic = 'force-dynamic';
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
      { id: number; conta_bancaria_id: number; data_movimentacao: string; valor: number; tipo: string; descricao: string; memo: string | null; status: string }[]
    >(
      `SELECT id, conta_bancaria_id, data_movimentacao, valor, tipo, descricao, memo, status FROM conciliacoes_bancarias WHERE id = ? LIMIT 1`,
      [idNum]
    );
    const item = Array.isArray(rows) ? rows[0] : null;
    if (!item) {
      return NextResponse.json({ success: false, error: 'Conciliação não encontrada' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: item });
  } catch (e) {
    console.error('API conciliacoes [id] GET:', e);
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
    const contaBancariaId = parseInt(String(body.conta_bancaria_id ?? 0), 10);
    const dataMov = typeof body.data_movimentacao === 'string' ? body.data_movimentacao.trim() : '';
    const valor = Number(body.valor);
    const tipo = typeof body.tipo === 'string' && ['entrada', 'saida'].includes(body.tipo) ? body.tipo : 'entrada';
    const descricao = typeof body.descricao === 'string' ? body.descricao.trim() : '';
    if (!Number.isInteger(contaBancariaId) || contaBancariaId < 1 || !dataMov || Number.isNaN(valor) || !descricao) {
      return NextResponse.json({ success: false, error: 'Conta bancária, data, valor e descrição são obrigatórios.' }, { status: 400 });
    }
    const status = typeof body.status === 'string' && ['pendente', 'autorizado', 'ignorado'].includes(body.status) ? body.status : 'pendente';
    const memo = typeof body.memo === 'string' ? body.memo.trim() || null : null;
    await query(
      `UPDATE conciliacoes_bancarias SET conta_bancaria_id = ?, data_movimentacao = ?, valor = ?, tipo = ?, descricao = ?, memo = ?, status = ?, updated_at = NOW() WHERE id = ?`,
      [contaBancariaId, dataMov, valor, tipo, descricao, memo, status, idNum]
    );
    return NextResponse.json({ success: true, data: { id: idNum } });
  } catch (e) {
    console.error('API conciliacoes [id] PUT:', e);
    return NextResponse.json({ success: false, error: 'Erro ao atualizar.' }, { status: 500 });
  }
}

/** Soft delete: marca como ignorado (status = 'ignorado'). */
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
    await query('UPDATE conciliacoes_bancarias SET status = ? WHERE id = ?', ['ignorado', idNum]);
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('API conciliacoes [id] DELETE:', e);
    return NextResponse.json({ success: false, error: 'Erro ao excluir.' }, { status: 500 });
  }
}
