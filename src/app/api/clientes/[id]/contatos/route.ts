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
    const clienteId = parseInt(id, 10);
    if (!Number.isInteger(clienteId) || clienteId < 1) {
      return NextResponse.json({ success: false, error: 'ID inválido' }, { status: 400 });
    }
    const rows = await query<{ id: number; cliente_id: number; tipo: string; nome: string; telefone: string | null; whatsapp: string | null; email: string | null; observacoes: string | null; ativo: number }[]>(
      'SELECT id, cliente_id, tipo, nome, telefone, whatsapp, email, observacoes, ativo FROM cliente_contatos WHERE cliente_id = ? ORDER BY nome',
      [clienteId]
    );
    return NextResponse.json({ success: true, data: Array.isArray(rows) ? rows : [] });
  } catch (e) {
    console.error('API clientes contatos GET:', e);
    return NextResponse.json({ success: false, error: 'Erro ao listar contatos.' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 });
    }
    const { id } = await params;
    const clienteId = parseInt(id, 10);
    if (!Number.isInteger(clienteId) || clienteId < 1) {
      return NextResponse.json({ success: false, error: 'ID inválido' }, { status: 400 });
    }
    const body = await request.json();
    const tipo = typeof body.tipo === 'string' && ['financeiro', 'comercial', 'outros'].includes(body.tipo) ? body.tipo : 'comercial';
    const nome = typeof body.nome === 'string' ? body.nome.trim() : '';
    if (!nome) {
      return NextResponse.json({ success: false, error: 'Nome é obrigatório.' }, { status: 400 });
    }
    await query(
      `INSERT INTO cliente_contatos (cliente_id, tipo, nome, telefone, whatsapp, email, observacoes, ativo)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        clienteId,
        tipo,
        nome,
        typeof body.telefone === 'string' ? body.telefone.trim() || null : null,
        typeof body.whatsapp === 'string' ? body.whatsapp.trim() || null : null,
        typeof body.email === 'string' ? body.email.trim() || null : null,
        typeof body.observacoes === 'string' ? body.observacoes.trim() || null : null,
        body.ativo === 0 ? 0 : 1,
      ]
    );
    const result = await query<{ id: number }[]>('SELECT LAST_INSERT_ID() AS id');
    const newId = Array.isArray(result) && result[0] ? result[0].id : 0;
    return NextResponse.json({ success: true, data: { id: newId } });
  } catch (e) {
    console.error('API clientes contatos POST:', e);
    return NextResponse.json({ success: false, error: 'Erro ao cadastrar contato.' }, { status: 500 });
  }
}
