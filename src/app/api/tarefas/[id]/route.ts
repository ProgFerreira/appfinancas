import { NextRequest, NextResponse } from 'next/server';
import { getSessionUserId } from '@/lib/auth';
import { query } from '@/lib/db';
import type { Tarefa } from '@/types';

function toDateString(val: unknown): string | null {
  if (val == null) return null;
  if (typeof val === 'string') {
    const trimmed = val.trim();
    return trimmed ? trimmed.slice(0, 10) : null;
  }
  if (val instanceof Date && !Number.isNaN(val.getTime())) {
    return val.toISOString().slice(0, 10);
  }
  return null;
}

function toDateTimeString(val: unknown): string | null {
  if (val == null) return null;
  if (typeof val === 'string') return val.trim() || null;
  if (val instanceof Date && !Number.isNaN(val.getTime())) return val.toISOString();
  return null;
}

const STATUS_VALIDOS = ['pendente', 'em_andamento', 'concluido', 'cancelado'] as const;
const PRIORIDADE_VALIDOS = ['baixa', 'media', 'alta'] as const;

type ValidatedTarefa = {
  titulo: string;
  descricao: string | null;
  status: (typeof STATUS_VALIDOS)[number];
  prioridade: (typeof PRIORIDADE_VALIDOS)[number];
  unidade_id: number | null;
  data_vencimento: string | null;
  responsavel_id: number | null;
};

function validarTarefa(body: unknown): ValidatedTarefa | null {
  if (!body || typeof body !== 'object') return null;
  const b = body as Record<string, unknown>;
  const titulo = typeof b.titulo === 'string' ? b.titulo.trim() : '';
  if (!titulo) return null;
  const status =
    typeof b.status === 'string' && STATUS_VALIDOS.includes(b.status as (typeof STATUS_VALIDOS)[number])
      ? (b.status as (typeof STATUS_VALIDOS)[number])
      : 'pendente';
  const prioridade =
    typeof b.prioridade === 'string' && PRIORIDADE_VALIDOS.includes(b.prioridade as (typeof PRIORIDADE_VALIDOS)[number])
      ? (b.prioridade as (typeof PRIORIDADE_VALIDOS)[number])
      : 'media';
  let data_vencimento: string | null = null;
  if (b.data_vencimento != null && b.data_vencimento !== '') {
    const d = String(b.data_vencimento).trim().slice(0, 10);
    if (d && /^\d{4}-\d{2}-\d{2}$/.test(d)) data_vencimento = d;
  }
  let unidade_id: number | null = null;
  if (b.unidade_id != null && b.unidade_id !== '') {
    const n = parseInt(String(b.unidade_id), 10);
    if (Number.isInteger(n) && n > 0) unidade_id = n;
  }
  let responsavel_id: number | null = null;
  if (b.responsavel_id != null && b.responsavel_id !== '') {
    const n = parseInt(String(b.responsavel_id), 10);
    if (Number.isInteger(n) && n > 0) responsavel_id = n;
  }
  const descricao = typeof b.descricao === 'string' ? b.descricao.trim() || null : null;
  return { titulo, descricao, status, prioridade, unidade_id, data_vencimento, responsavel_id };
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
      (Tarefa & { responsavel_nome: string | null; unidade_nome: string | null })[]
    >(
      `SELECT t.id, t.titulo, t.descricao, t.status, t.prioridade, t.unidade_id, t.data_vencimento,
              t.responsavel_id, t.created_by, t.created_at, t.updated_at,
              u.nome AS responsavel_nome,
              tu.nome AS unidade_nome
       FROM tarefas t
       LEFT JOIN usuarios u ON u.id = t.responsavel_id
       LEFT JOIN tarefa_unidades tu ON tu.id = t.unidade_id
       WHERE t.id = ? AND t.deleted_at IS NULL
       LIMIT 1`,
      [idNum]
    );
    const item = Array.isArray(rows) ? rows[0] : null;
    if (!item) {
      return NextResponse.json({ success: false, error: 'Tarefa não encontrada' }, { status: 404 });
    }
    return NextResponse.json({
      success: true,
      data: {
        ...item,
        data_vencimento: toDateString(item.data_vencimento),
        created_at: toDateTimeString(item.created_at) ?? item.created_at,
        updated_at: toDateTimeString(item.updated_at) ?? item.updated_at,
        responsavel_nome: item.responsavel_nome ?? null,
        unidade_nome: item.unidade_nome ?? null,
      },
    });
  } catch (e) {
    console.error('API tarefas [id] GET:', e);
    return NextResponse.json({ success: false, error: 'Erro ao carregar tarefa.' }, { status: 500 });
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
    const data = validarTarefa(body);
    if (!data) {
      return NextResponse.json({ success: false, error: 'Título é obrigatório.' }, { status: 400 });
    }
    if (!data.unidade_id) {
      return NextResponse.json({ success: false, error: 'Unidade é obrigatória.' }, { status: 400 });
    }
    if (!data.responsavel_id) {
      return NextResponse.json({ success: false, error: 'Responsável é obrigatório.' }, { status: 400 });
    }
    const existing = await query<{ id: number; unidade_id: number | null }[]>(
      'SELECT id, unidade_id FROM tarefas WHERE id = ? AND deleted_at IS NULL LIMIT 1',
      [idNum]
    );
    if (!Array.isArray(existing) || existing.length === 0) {
      return NextResponse.json({ success: false, error: 'Tarefa não encontrada' }, { status: 404 });
    }
    // Preservar unidade_id se o body não enviar (ex.: Kanban antigo ou PATCH implícito)
    const bodyObj = body && typeof body === 'object' ? (body as Record<string, unknown>) : {};
    const unidadeId =
      'unidade_id' in bodyObj
        ? data.unidade_id
        : (existing[0].unidade_id != null ? existing[0].unidade_id : null);
    await query(
      `UPDATE tarefas SET titulo = ?, descricao = ?, status = ?, prioridade = ?, unidade_id = ?, data_vencimento = ?, responsavel_id = ? WHERE id = ?`,
      [
        data.titulo,
        data.descricao,
        data.status,
        data.prioridade,
        unidadeId,
        data.data_vencimento,
        data.responsavel_id,
        idNum,
      ]
    );
    return NextResponse.json({ success: true, data: { id: idNum } });
  } catch (e) {
    console.error('API tarefas [id] PUT:', e);
    return NextResponse.json({ success: false, error: 'Erro ao atualizar tarefa.' }, { status: 500 });
  }
}

/** Atualiza apenas o status da tarefa (concluido | cancelado). */
export async function PATCH(
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
    const status = typeof body?.status === 'string' ? body.status.trim() : '';
    if (status !== 'concluido' && status !== 'cancelado') {
      return NextResponse.json(
        { success: false, error: 'Status inválido. Use "concluido" ou "cancelado".' },
        { status: 400 }
      );
    }
    const existing = await query<{ id: number }[]>(
      'SELECT id FROM tarefas WHERE id = ? AND deleted_at IS NULL LIMIT 1',
      [idNum]
    );
    if (!Array.isArray(existing) || existing.length === 0) {
      return NextResponse.json({ success: false, error: 'Tarefa não encontrada' }, { status: 404 });
    }
    await query('UPDATE tarefas SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [
      status,
      idNum,
    ]);
    return NextResponse.json({ success: true, data: { id: idNum, status } });
  } catch (e) {
    console.error('API tarefas [id] PATCH:', e);
    return NextResponse.json({ success: false, error: 'Erro ao atualizar status.' }, { status: 500 });
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
    await query('UPDATE tarefas SET deleted_at = CURRENT_TIMESTAMP WHERE id = ? AND deleted_at IS NULL', [idNum]);
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('API tarefas [id] DELETE:', e);
    return NextResponse.json({ success: false, error: 'Erro ao excluir tarefa.' }, { status: 500 });
  }
}
