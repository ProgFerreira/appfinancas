import { NextRequest, NextResponse } from 'next/server';
import { getSessionUserId } from '@/lib/auth';
import { query } from '@/lib/db';


export const dynamic = 'force-dynamic';
export const dynamicParams = false;

export function generateStaticParams(): { id: string; dbId: string }[] {
  return [{ id: '0', dbId: '0' }];
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; dbId: string }> }
) {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 });
    }
    const { id, dbId } = await params;
    const clienteId = parseInt(id, 10);
    const idDb = parseInt(dbId, 10);
    if (!Number.isInteger(clienteId) || clienteId < 1 || !Number.isInteger(idDb) || idDb < 1) {
      return NextResponse.json({ success: false, error: 'ID inválido' }, { status: 400 });
    }
    const body = await request.json();
    const favorecido = typeof body.favorecido === 'string' ? body.favorecido.trim() : '';
    const banco = typeof body.banco === 'string' ? body.banco.trim() : '';
    if (!favorecido || !banco) {
      return NextResponse.json({ success: false, error: 'Favorecido e banco são obrigatórios.' }, { status: 400 });
    }
    await query(
      `UPDATE cliente_dados_bancarios SET favorecido = ?, cnpj_cpf = ?, banco = ?, agencia = ?, conta = ?, operacao = ?, pix = ?, observacoes = ?, ativo = ? WHERE id = ? AND cliente_id = ?`,
      [
        favorecido,
        typeof body.cnpj_cpf === 'string' ? body.cnpj_cpf.trim() || null : null,
        banco,
        typeof body.agencia === 'string' ? body.agencia.trim() || null : null,
        typeof body.conta === 'string' ? body.conta.trim() || null : null,
        typeof body.operacao === 'string' ? body.operacao.trim() || null : null,
        typeof body.pix === 'string' ? body.pix.trim() || null : null,
        typeof body.observacoes === 'string' ? body.observacoes.trim() || null : null,
        body.ativo === 0 ? 0 : 1,
        idDb,
        clienteId,
      ]
    );
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('API clientes dados-bancarios PUT:', e);
    return NextResponse.json({ success: false, error: 'Erro ao atualizar.' }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; dbId: string }> }
) {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 });
    }
    const { id, dbId } = await params;
    const clienteId = parseInt(id, 10);
    const idDb = parseInt(dbId, 10);
    if (!Number.isInteger(clienteId) || clienteId < 1 || !Number.isInteger(idDb) || idDb < 1) {
      return NextResponse.json({ success: false, error: 'ID inválido' }, { status: 400 });
    }
    await query('DELETE FROM cliente_dados_bancarios WHERE id = ? AND cliente_id = ?', [idDb, clienteId]);
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('API clientes dados-bancarios DELETE:', e);
    return NextResponse.json({ success: false, error: 'Erro ao excluir.' }, { status: 500 });
  }
}
