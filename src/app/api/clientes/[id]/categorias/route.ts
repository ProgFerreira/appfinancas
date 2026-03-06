import { NextRequest, NextResponse } from 'next/server';
import { getSessionUserId } from '@/lib/auth';
import { query } from '@/lib/db';

const CATEGORIAS = ['cliente', 'fornecedor', 'funcionario', 'parceiro', 'empresa', 'outros'] as const;


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
    const clienteId = parseInt(id, 10);
    if (!Number.isInteger(clienteId) || clienteId < 1) {
      return NextResponse.json({ success: false, error: 'ID inválido' }, { status: 400 });
    }
    const rows = await query<{ id: number; cliente_id: number; categoria: string }[]>(
      'SELECT id, cliente_id, categoria FROM cliente_categorias WHERE cliente_id = ? ORDER BY categoria',
      [clienteId]
    );
    return NextResponse.json({ success: true, data: Array.isArray(rows) ? rows : [] });
  } catch (e) {
    console.error('API clientes categorias GET:', e);
    return NextResponse.json({ success: false, error: 'Erro ao listar categorias.' }, { status: 500 });
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
    const categoria = typeof body.categoria === 'string' && CATEGORIAS.includes(body.categoria as (typeof CATEGORIAS)[number]) ? body.categoria : null;
    if (!categoria) {
      return NextResponse.json({ success: false, error: 'Categoria inválida.' }, { status: 400 });
    }
    await query(
      'INSERT INTO cliente_categorias (cliente_id, categoria) VALUES (?, ?)',
      [clienteId, categoria]
    );
    const result = await query<{ id: number }[]>('SELECT LAST_INSERT_ID() AS id');
    const newId = Array.isArray(result) && result[0] ? result[0].id : 0;
    return NextResponse.json({ success: true, data: { id: newId } });
  } catch (e) {
    console.error('API clientes categorias POST:', e);
    const message = e instanceof Error ? e.message : String(e);
    if (message.includes('Duplicate') || message.includes('unq_cliente_categoria')) {
      return NextResponse.json({ success: false, error: 'Este cliente já possui esta categoria.' }, { status: 409 });
    }
    return NextResponse.json({ success: false, error: 'Erro ao adicionar categoria.' }, { status: 500 });
  }
}

export async function DELETE(
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
    const { searchParams } = new URL(request.url);
    const catId = searchParams.get('categoria_id');
    const idCat = catId ? parseInt(catId, 10) : 0;
    if (!Number.isInteger(idCat) || idCat < 1) {
      return NextResponse.json({ success: false, error: 'categoria_id inválido.' }, { status: 400 });
    }
    await query('DELETE FROM cliente_categorias WHERE id = ? AND cliente_id = ?', [idCat, clienteId]);
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('API clientes categorias DELETE:', e);
    return NextResponse.json({ success: false, error: 'Erro ao remover categoria.' }, { status: 500 });
  }
}
