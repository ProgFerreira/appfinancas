import { NextRequest, NextResponse } from 'next/server';
import { getSessionUserId } from '@/lib/auth';
import { query } from '@/lib/db';
import { canDo } from '@/lib/documentPermissions';
import { deleteFile, fileExists } from '@/lib/documentStorage';
import type { Documento } from '@/types';

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

    const allowed = await canDo(userId, idNum, 'view');
    if (!allowed) {
      return NextResponse.json({ success: false, error: 'Sem permissão para visualizar este documento.' }, { status: 403 });
    }

    const rows = await query<
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
       WHERE d.id = ? AND d.deleted_at IS NULL LIMIT 1`,
      [userId, userId, userId, userId, userId, idNum]
    );
    const row = Array.isArray(rows) ? rows[0] : null;
    if (!row) {
      return NextResponse.json({ success: false, error: 'Documento não encontrado.' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: {
        ...row,
        tipo_documento_id: row.tipo_documento_id != null ? Number(row.tipo_documento_id) : null,
        data_vencimento: toDateString(row.data_vencimento),
        created_by_nome: row.created_by_nome ?? null,
        tipo_documento_nome: row.tipo_documento_nome ?? null,
      },
    });
  } catch (e) {
    console.error('API documentos [id] GET:', e);
    return NextResponse.json({ success: false, error: 'Erro ao carregar documento.' }, { status: 500 });
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

    const allowed = await canDo(userId, idNum, 'edit');
    if (!allowed) {
      return NextResponse.json({ success: false, error: 'Sem permissão para editar este documento.' }, { status: 403 });
    }

    const body = await request.json();
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ success: false, error: 'Dados inválidos.' }, { status: 400 });
    }
    const b = body as Record<string, unknown>;
    const nome = typeof b.nome === 'string' ? b.nome.trim() : '';
    const descricao = typeof b.descricao === 'string' ? b.descricao.trim() || null : null;
    let tipoDocumentoId: number | null = null;
    if (b.tipo_documento_id != null && b.tipo_documento_id !== '') {
      const n = parseInt(String(b.tipo_documento_id), 10);
      if (Number.isInteger(n) && n > 0) tipoDocumentoId = n;
    }
    let dataVencimento: string | null = null;
    if (b.data_vencimento != null && b.data_vencimento !== '') {
      const d = String(b.data_vencimento).trim().slice(0, 10);
      if (d && /^\d{4}-\d{2}-\d{2}$/.test(d)) dataVencimento = d;
    }
    if (!nome) {
      return NextResponse.json({ success: false, error: 'Nome é obrigatório.' }, { status: 400 });
    }

    await query(
      'UPDATE documentos SET nome = ?, descricao = ?, tipo_documento_id = ?, data_vencimento = ? WHERE id = ? AND deleted_at IS NULL',
      [nome, descricao, tipoDocumentoId, dataVencimento, idNum]
    );
    return NextResponse.json({ success: true, data: { id: idNum } });
  } catch (e) {
    console.error('API documentos [id] PUT:', e);
    return NextResponse.json({ success: false, error: 'Erro ao atualizar documento.' }, { status: 500 });
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

    const allowed = await canDo(userId, idNum, 'delete');
    if (!allowed) {
      return NextResponse.json({ success: false, error: 'Sem permissão para excluir este documento.' }, { status: 403 });
    }

    const rows = await query<{ caminho: string }[]>(
      'SELECT caminho FROM documentos WHERE id = ? AND deleted_at IS NULL LIMIT 1',
      [idNum]
    );
    const doc = Array.isArray(rows) ? rows[0] : null;
    if (doc?.caminho) {
      const exists = await fileExists(doc.caminho);
      if (exists) await deleteFile(doc.caminho).catch(() => {});
    }

    await query('UPDATE documentos SET deleted_at = CURRENT_TIMESTAMP WHERE id = ?', [idNum]);
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('API documentos [id] DELETE:', e);
    return NextResponse.json({ success: false, error: 'Erro ao excluir documento.' }, { status: 500 });
  }
}
