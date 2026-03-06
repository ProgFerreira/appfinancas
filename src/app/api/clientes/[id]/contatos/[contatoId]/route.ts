import { NextRequest, NextResponse } from 'next/server';
import { getSessionUserId } from '@/lib/auth';
import { query } from '@/lib/db';


export const dynamic = 'force-dynamic';
export const dynamicParams = false;

export function generateStaticParams(): { id: string; contatoId: string }[] {
  return [{ id: '0', contatoId: '0' }];
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; contatoId: string }> }
) {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 });
    }
    const { id, contatoId } = await params;
    const clienteId = parseInt(id, 10);
    const idContato = parseInt(contatoId, 10);
    if (!Number.isInteger(clienteId) || clienteId < 1 || !Number.isInteger(idContato) || idContato < 1) {
      return NextResponse.json({ success: false, error: 'ID inválido' }, { status: 400 });
    }
    const body = await request.json();
    const tipo = typeof body.tipo === 'string' && ['financeiro', 'comercial', 'outros'].includes(body.tipo) ? body.tipo : 'comercial';
    const nome = typeof body.nome === 'string' ? body.nome.trim() : '';
    if (!nome) {
      return NextResponse.json({ success: false, error: 'Nome é obrigatório.' }, { status: 400 });
    }
    await query(
      `UPDATE cliente_contatos SET tipo = ?, nome = ?, telefone = ?, whatsapp = ?, email = ?, observacoes = ?, ativo = ? WHERE id = ? AND cliente_id = ?`,
      [
        tipo,
        nome,
        typeof body.telefone === 'string' ? body.telefone.trim() || null : null,
        typeof body.whatsapp === 'string' ? body.whatsapp.trim() || null : null,
        typeof body.email === 'string' ? body.email.trim() || null : null,
        typeof body.observacoes === 'string' ? body.observacoes.trim() || null : null,
        body.ativo === 0 ? 0 : 1,
        idContato,
        clienteId,
      ]
    );
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('API clientes contatos PUT:', e);
    return NextResponse.json({ success: false, error: 'Erro ao atualizar contato.' }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; contatoId: string }> }
) {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 });
    }
    const { id, contatoId } = await params;
    const clienteId = parseInt(id, 10);
    const idContato = parseInt(contatoId, 10);
    if (!Number.isInteger(clienteId) || clienteId < 1 || !Number.isInteger(idContato) || idContato < 1) {
      return NextResponse.json({ success: false, error: 'ID inválido' }, { status: 400 });
    }
    await query('DELETE FROM cliente_contatos WHERE id = ? AND cliente_id = ?', [idContato, clienteId]);
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('API clientes contatos DELETE:', e);
    return NextResponse.json({ success: false, error: 'Erro ao excluir contato.' }, { status: 500 });
  }
}
