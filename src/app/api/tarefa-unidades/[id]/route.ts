import { NextRequest, NextResponse } from 'next/server';
import { getSessionUserId } from '@/lib/auth';
import { query } from '@/lib/db';
import type { TarefaUnidade } from '@/types';


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
    const rows = await query<(TarefaUnidade & { created_at: string; updated_at: string })[]>(
      'SELECT id, nome, ordem, ativo, created_at, updated_at FROM tarefa_unidades WHERE id = ? LIMIT 1',
      [idNum]
    );
    const item = Array.isArray(rows) ? rows[0] : null;
    if (!item) {
      return NextResponse.json({ success: false, error: 'Tipo de unidade não encontrado' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: item });
  } catch (e) {
    console.error('API tarefa-unidades [id] GET:', e);
    return NextResponse.json(
      { success: false, error: 'Erro ao carregar tipo de unidade.' },
      { status: 500 }
    );
  }
}

function validar(body: unknown): { nome: string; ordem: number; ativo: number } | null {
  if (!body || typeof body !== 'object') return null;
  const b = body as Record<string, unknown>;
  const nome = typeof b.nome === 'string' ? b.nome.trim() : '';
  if (!nome) return null;
  const ordem = typeof b.ordem === 'number' ? b.ordem : parseInt(String(b.ordem ?? 0), 10);
  const ativo = b.ativo === false || b.ativo === 0 ? 0 : 1;
  return { nome, ordem: Number.isInteger(ordem) ? ordem : 0, ativo };
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
      return NextResponse.json({ success: false, error: 'Nome é obrigatório.' }, { status: 400 });
    }
    const existing = await query<{ id: number }[]>(
      'SELECT id FROM tarefa_unidades WHERE id = ? LIMIT 1',
      [idNum]
    );
    if (!Array.isArray(existing) || existing.length === 0) {
      return NextResponse.json({ success: false, error: 'Tipo de unidade não encontrado' }, { status: 404 });
    }
    await query(
      'UPDATE tarefa_unidades SET nome = ?, ordem = ?, ativo = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [data.nome, data.ordem, data.ativo, idNum]
    );
    return NextResponse.json({ success: true, data: { id: idNum } });
  } catch (e) {
    console.error('API tarefa-unidades [id] PUT:', e);
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes('Duplicate') || msg.includes('uk_tarefa_unidades_nome')) {
      return NextResponse.json({ success: false, error: 'Já existe um tipo com este nome.' }, { status: 400 });
    }
    return NextResponse.json(
      { success: false, error: 'Erro ao atualizar tipo de unidade.' },
      { status: 500 }
    );
  }
}

export async function DELETE(
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
    await query('DELETE FROM tarefa_unidades WHERE id = ?', [idNum]);
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('API tarefa-unidades [id] DELETE:', e);
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes('foreign key') || msg.includes('a foreign key constraint')) {
      return NextResponse.json(
        { success: false, error: 'Não é possível excluir: existem tarefas usando este tipo.' },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, error: 'Erro ao excluir tipo de unidade.' },
      { status: 500 }
    );
  }
}
