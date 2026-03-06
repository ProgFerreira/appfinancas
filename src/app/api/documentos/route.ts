import { NextRequest, NextResponse } from 'next/server';
import { getSessionUserId } from '@/lib/auth';
import { query } from '@/lib/db';
import {
  saveFile,
  validateFile,
} from '@/lib/documentStorage';
import type { Documento } from '@/types';

/** Garante que data_vencimento (DATE do MySQL) seja sempre string YYYY-MM-DD na resposta JSON. */
function toDateString(val: unknown): string | null {
  if (val == null) return null;
  if (typeof val === 'string') {
    const t = val.trim();
    return t ? t.slice(0, 10) : null;
  }
  if (val instanceof Date && !Number.isNaN(val.getTime())) {
    return val.toISOString().slice(0, 10);
  }
  return null;
}


export const dynamic = 'force-static';

export async function GET(request: NextRequest) {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
    const perPage = Math.min(100, Math.max(10, parseInt(searchParams.get('per_page') ?? '20', 10)));
    const offset = (page - 1) * perPage;
    const q = searchParams.get('q') ?? '';
    const tipoId = searchParams.get('tipo_documento_id') ?? '';

    const baseWhere = `WHERE d.deleted_at IS NULL
      AND (d.created_by = ? OR EXISTS (SELECT 1 FROM document_permissions dp WHERE dp.document_id = d.id AND dp.user_id = ? AND dp.can_view = 1))`;
    const params: (string | number)[] = [userId, userId];
    let where = baseWhere;
    if (tipoId) {
      const tid = parseInt(tipoId, 10);
      if (Number.isInteger(tid) && tid > 0) {
        where += ' AND d.tipo_documento_id = ?';
        params.push(tid);
      }
    }
    if (q.trim()) {
      where += ' AND (d.nome LIKE ? OR d.nome_arquivo LIKE ? OR d.descricao LIKE ?)';
      const term = `%${q.trim()}%`;
      params.push(term, term, term);
    }

    const countRows = await query<{ total: number }[]>(
      `SELECT COUNT(*) AS total FROM documentos d ${where}`,
      params
    );
    const total = (Array.isArray(countRows) ? countRows[0]?.total : 0) ?? 0;
    const limit = Math.min(100, Math.max(1, perPage)) | 0;
    const off = Math.max(0, offset);
    const listParams: (string | number)[] = [userId, userId, userId, userId, userId, ...params];
    const listResult = await query<
      (Documento & { created_by_nome: string | null; tipo_documento_nome: string | null; can_view: number; can_download: number; can_edit: number; can_delete: number })[]
    >(
      `SELECT d.id, d.nome, d.nome_arquivo, d.caminho, d.mime_type, d.tamanho, d.descricao, d.tipo_documento_id, d.data_vencimento,
              d.created_by, d.created_at, d.updated_at,
              u.nome AS created_by_nome,
              dt.nome AS tipo_documento_nome,
              CASE WHEN d.created_by = ? THEN 1 ELSE COALESCE(dp.can_view, 0) END AS can_view,
              CASE WHEN d.created_by = ? THEN 1 ELSE COALESCE(dp.can_download, 0) END AS can_download,
              CASE WHEN d.created_by = ? THEN 1 ELSE COALESCE(dp.can_edit, 0) END AS can_edit,
              CASE WHEN d.created_by = ? THEN 1 ELSE COALESCE(dp.can_delete, 0) END AS can_delete
       FROM documentos d
       LEFT JOIN usuarios u ON u.id = d.created_by
       LEFT JOIN documento_tipos dt ON dt.id = d.tipo_documento_id
       LEFT JOIN document_permissions dp ON dp.document_id = d.id AND dp.user_id = ?
       ${where}
       ORDER BY d.updated_at DESC
       LIMIT ${limit} OFFSET ${off}`,
      listParams
    );

    const data = (Array.isArray(listResult) ? listResult : []).map((row) => ({
      ...row,
      tipo_documento_id: row.tipo_documento_id != null ? Number(row.tipo_documento_id) : null,
      data_vencimento: toDateString(row.data_vencimento),
      created_by_nome: row.created_by_nome ?? null,
      tipo_documento_nome: row.tipo_documento_nome ?? null,
    }));

    return NextResponse.json({
      success: true,
      data,
      meta: { total, page, perPage, totalPages: Math.ceil(total / perPage) },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error('API documentos GET:', e);
    return NextResponse.json(
      {
        success: false,
        error: 'Erro ao listar documentos.',
        detail: message,
      },
      { status: 500 }
    );
  }
}


export async function POST(request: NextRequest) {
  try {
    const userId = await getSessionUserId();
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Não autenticado' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const nome = (formData.get('nome') as string)?.trim() || '';
    const descricao = (formData.get('descricao') as string)?.trim() || null;
    const tipoDocumentoIdRaw = (formData.get('tipo_documento_id') as string)?.trim() || '';
    let tipoDocumentoId: number | null = null;
    if (tipoDocumentoIdRaw) {
      const n = parseInt(tipoDocumentoIdRaw, 10);
      if (Number.isInteger(n) && n > 0) tipoDocumentoId = n;
    }
    const dataVencimentoRaw = (formData.get('data_vencimento') as string)?.trim() || null;
    let dataVencimento: string | null = null;
    if (dataVencimentoRaw) {
      const d = dataVencimentoRaw.slice(0, 10);
      if (/^\d{4}-\d{2}-\d{2}$/.test(d)) dataVencimento = d;
    }

    if (!file || file.size === 0) {
      return NextResponse.json({ success: false, error: 'Nenhum arquivo enviado.' }, { status: 400 });
    }

    const err = validateFile(file.type, file.size, file.name);
    if (err) {
      return NextResponse.json({ success: false, error: err }, { status: 400 });
    }

    const nomeExibicao = nome || file.name;
    const buffer = Buffer.from(await file.arrayBuffer());

    await query(
      `INSERT INTO documentos (nome, nome_arquivo, caminho, mime_type, tamanho, descricao, tipo_documento_id, data_vencimento, created_by)
       VALUES (?, ?, '', ?, ?, ?, ?, ?, ?)`,
      [nomeExibicao, file.name, file.type || null, file.size, descricao, tipoDocumentoId, dataVencimento, userId]
    );
    const idResult = await query<{ id: number }[]>('SELECT LAST_INSERT_ID() AS id');
    const docId = Array.isArray(idResult) && idResult[0] ? idResult[0].id : 0;
    if (docId === 0) {
      return NextResponse.json({ success: false, error: 'Erro ao criar registro.' }, { status: 500 });
    }

    const caminho = await saveFile(docId, file.name, buffer);
    await query('UPDATE documentos SET caminho = ? WHERE id = ?', [caminho, docId]);

    await query(
      `INSERT INTO document_permissions (document_id, user_id, can_view, can_download, can_edit, can_delete)
       VALUES (?, ?, 1, 1, 1, 1)`,
      [docId, userId]
    );

    return NextResponse.json({ success: true, data: { id: docId } });
  } catch (e) {
    console.error('API documentos POST:', e);
    return NextResponse.json({ success: false, error: 'Erro ao enviar documento.' }, { status: 500 });
  }
}
