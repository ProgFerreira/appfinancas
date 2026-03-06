import { NextRequest, NextResponse } from 'next/server';
import { getSessionUserId } from '@/lib/auth';
import { query } from '@/lib/db';
import type { Tarefa } from '@/types';

/** Garante que datas vindas do MySQL (Date ou string) sejam sempre string YYYY-MM-DD ou ISO para o JSON. */
function toDateString(val: unknown): string | null {
  if (val == null) return null;
  if (typeof val === 'string') {
    const trimmed = val.trim();
    if (!trimmed) return null;
    return trimmed.slice(0, 10); // YYYY-MM-DD se for datetime
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

export async function GET(request: NextRequest) {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 });
    }
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') ?? '';
    const prioridade = searchParams.get('prioridade') ?? '';
    const unidadeId = searchParams.get('unidade_id') ?? '';
    const responsavelId = searchParams.get('responsavel_id') ?? '';
    const q = searchParams.get('q') ?? '';
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
    const perPage = Math.min(500, Math.max(10, parseInt(searchParams.get('per_page') ?? '20', 10)));
    const offset = (page - 1) * perPage;

    let where = 'WHERE t.deleted_at IS NULL';
    const params: (string | number)[] = [];
    if (status && STATUS_VALIDOS.includes(status as (typeof STATUS_VALIDOS)[number])) {
      where += ' AND t.status = ?';
      params.push(status);
    }
    if (prioridade && PRIORIDADE_VALIDOS.includes(prioridade as (typeof PRIORIDADE_VALIDOS)[number])) {
      where += ' AND t.prioridade = ?';
      params.push(prioridade);
    }
    if (unidadeId) {
      const uid = parseInt(unidadeId, 10);
      if (Number.isInteger(uid) && uid > 0) {
        where += ' AND t.unidade_id = ?';
        params.push(uid);
      }
    }
    if (responsavelId) {
      const rid = parseInt(responsavelId, 10);
      if (Number.isInteger(rid) && rid > 0) {
        where += ' AND t.responsavel_id = ?';
        params.push(rid);
      }
    }
    if (q.trim()) {
      where += ' AND (t.titulo LIKE ? OR t.descricao LIKE ?)';
      const term = `%${q.trim()}%`;
      params.push(term, term);
    }

    const countRows = await query<{ total: number }[]>(
      `SELECT COUNT(*) AS total FROM tarefas t ${where}`,
      params
    );
    const total = (Array.isArray(countRows) ? countRows[0]?.total : 0) ?? 0;
    const limit = Math.min(500, Math.max(1, perPage)) | 0;

    const list = await query<
      (Tarefa & { responsavel_nome: string | null; unidade_nome: string | null })[]
    >(
      `SELECT t.id, t.titulo, t.descricao, t.status, t.prioridade, t.unidade_id, t.data_vencimento,
              t.responsavel_id, t.created_by, t.created_at, t.updated_at,
              u.nome AS responsavel_nome,
              tu.nome AS unidade_nome
       FROM tarefas t
       LEFT JOIN usuarios u ON u.id = t.responsavel_id
       LEFT JOIN tarefa_unidades tu ON tu.id = t.unidade_id
       ${where}
       ORDER BY t.data_vencimento IS NULL ASC, t.data_vencimento ASC, t.created_at DESC
       LIMIT ${limit} OFFSET ${Math.max(0, offset)}`,
      params
    );

    const data = (Array.isArray(list) ? list : []).map((row) => ({
      ...row,
      unidade_id: row.unidade_id != null ? Number(row.unidade_id) : null,
      data_vencimento: toDateString(row.data_vencimento),
      created_at: toDateTimeString(row.created_at) ?? row.created_at,
      updated_at: toDateTimeString(row.updated_at) ?? row.updated_at,
      responsavel_nome: row.responsavel_nome ?? null,
      unidade_nome: row.unidade_nome ?? null,
    }));

    return NextResponse.json({
      success: true,
      data,
      meta: { total, page, perPage, totalPages: Math.ceil(total / perPage) },
    });
  } catch (e) {
    console.error('API tarefas GET:', e);
    return NextResponse.json({ success: false, error: 'Erro ao carregar tarefas.' }, { status: 500 });
  }
}


export async function POST(request: NextRequest) {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 });
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
    await query(
      `INSERT INTO tarefas (titulo, descricao, status, prioridade, unidade_id, data_vencimento, responsavel_id, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.titulo,
        data.descricao,
        data.status,
        data.prioridade,
        data.unidade_id,
        data.data_vencimento,
        data.responsavel_id,
        userId,
      ]
    );
    const result = await query<{ id: number }[]>('SELECT LAST_INSERT_ID() AS id');
    const id = Array.isArray(result) && result[0] != null ? result[0].id : 0;
    return NextResponse.json({ success: true, data: { id } });
  } catch (e) {
    console.error('API tarefas POST:', e);
    return NextResponse.json({ success: false, error: 'Erro ao cadastrar tarefa.' }, { status: 500 });
  }
}
