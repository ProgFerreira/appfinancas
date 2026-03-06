import { NextRequest, NextResponse } from 'next/server';
import { getSessionUserId } from '@/lib/auth';
import { query } from '@/lib/db';
import type { TarefaUnidade } from '@/types';


export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 });
    }
    const { searchParams } = new URL(request.url);
    const ativo = searchParams.get('ativo'); // 1 = só ativos, 0 = só inativos, omitido = todos

    let where = 'WHERE 1=1';
    const params: number[] = [];
    if (ativo === '1') {
      where += ' AND ativo = 1';
    } else if (ativo === '0') {
      where += ' AND ativo = 0';
    }

    const list = await query<(TarefaUnidade & { created_at?: string; updated_at?: string })[]>(
      `SELECT id, nome, ordem, ativo, created_at, updated_at
       FROM tarefa_unidades
       ${where}
       ORDER BY ordem ASC, nome ASC`,
      params
    );
    const data = Array.isArray(list) ? list : [];

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (e) {
    console.error('API tarefa-unidades GET:', e);
    return NextResponse.json(
      { success: false, error: 'Erro ao carregar tipos de unidade.' },
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


export async function POST(request: NextRequest) {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 });
    }
    const body = await request.json();
    const data = validar(body);
    if (!data) {
      return NextResponse.json({ success: false, error: 'Nome é obrigatório.' }, { status: 400 });
    }
    await query(
      `INSERT INTO tarefa_unidades (nome, ordem, ativo) VALUES (?, ?, ?)`,
      [data.nome, data.ordem, data.ativo]
    );
    const result = await query<{ id: number }[]>('SELECT LAST_INSERT_ID() AS id');
    const id = Array.isArray(result) && result[0] != null ? result[0].id : 0;
    return NextResponse.json({ success: true, data: { id } });
  } catch (e) {
    console.error('API tarefa-unidades POST:', e);
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes('Duplicate') || msg.includes('uk_tarefa_unidades_nome')) {
      return NextResponse.json({ success: false, error: 'Já existe um tipo com este nome.' }, { status: 400 });
    }
    return NextResponse.json(
      { success: false, error: 'Erro ao cadastrar tipo de unidade.' },
      { status: 500 }
    );
  }
}
