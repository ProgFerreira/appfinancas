import { NextRequest, NextResponse } from 'next/server';
import { getSessionUserId } from '@/lib/auth';
import { query } from '@/lib/db';
import { canDo } from '@/lib/documentPermissions';
import type { DocumentoPermissao } from '@/types';


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
    const docId = parseInt(id, 10);
    if (!Number.isInteger(docId) || docId < 1) {
      return NextResponse.json({ success: false, error: 'ID inválido' }, { status: 400 });
    }

    const canEdit = await canDo(userId, docId, 'edit');
    if (!canEdit) {
      return NextResponse.json({ success: false, error: 'Sem permissão para gerenciar este documento.' }, { status: 403 });
    }

    const rows = await query<
      (DocumentoPermissao & { user_nome: string | null })[]
    >(
      `SELECT dp.id, dp.document_id, dp.user_id, dp.can_view, dp.can_download, dp.can_edit, dp.can_delete, dp.created_at,
              u.nome AS user_nome
       FROM document_permissions dp
       JOIN usuarios u ON u.id = dp.user_id
       WHERE dp.document_id = ?
       ORDER BY u.nome`,
      [docId]
    );
    const data = (Array.isArray(rows) ? rows : []).map((r) => ({
      ...r,
      user_nome: r.user_nome ?? null,
    }));
    return NextResponse.json({ success: true, data });
  } catch (e) {
    console.error('API documentos [id] permissoes GET:', e);
    return NextResponse.json({ success: false, error: 'Erro ao listar permissões.' }, { status: 500 });
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
    const docId = parseInt(id, 10);
    if (!Number.isInteger(docId) || docId < 1) {
      return NextResponse.json({ success: false, error: 'ID inválido' }, { status: 400 });
    }

    const canEdit = await canDo(userId, docId, 'edit');
    if (!canEdit) {
      return NextResponse.json({ success: false, error: 'Sem permissão para gerenciar este documento.' }, { status: 403 });
    }

    const body = await request.json();
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ success: false, error: 'Dados inválidos.' }, { status: 400 });
    }
    const b = body as Record<string, unknown>;
    const targetUserId = typeof b.user_id === 'number' ? b.user_id : parseInt(String(b.user_id ?? ''), 10);
    if (!Number.isInteger(targetUserId) || targetUserId < 1) {
      return NextResponse.json({ success: false, error: 'user_id inválido.' }, { status: 400 });
    }

    const canView = b.can_view === true || b.can_view === 1 ? 1 : 0;
    const canDownload = b.can_download === true || b.can_download === 1 ? 1 : 0;
    const canEditPerm = b.can_edit === true || b.can_edit === 1 ? 1 : 0;
    const canDelete = b.can_delete === true || b.can_delete === 1 ? 1 : 0;

    await query(
      `INSERT INTO document_permissions (document_id, user_id, can_view, can_download, can_edit, can_delete)
       VALUES (?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE can_view = VALUES(can_view), can_download = VALUES(can_download), can_edit = VALUES(can_edit), can_delete = VALUES(can_delete)`,
      [docId, targetUserId, canView, canDownload, canEditPerm, canDelete]
    );
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('API documentos [id] permissoes POST:', e);
    return NextResponse.json({ success: false, error: 'Erro ao salvar permissão.' }, { status: 500 });
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
    const docId = parseInt(id, 10);
    if (!Number.isInteger(docId) || docId < 1) {
      return NextResponse.json({ success: false, error: 'ID inválido' }, { status: 400 });
    }

    const canEdit = await canDo(userId, docId, 'edit');
    if (!canEdit) {
      return NextResponse.json({ success: false, error: 'Sem permissão para gerenciar este documento.' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const permId = searchParams.get('perm_id');
    const permIdNum = permId ? parseInt(permId, 10) : 0;
    if (!Number.isInteger(permIdNum) || permIdNum < 1) {
      return NextResponse.json({ success: false, error: 'perm_id inválido.' }, { status: 400 });
    }

    await query('DELETE FROM document_permissions WHERE id = ? AND document_id = ?', [permIdNum, docId]);
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('API documentos [id] permissoes DELETE:', e);
    return NextResponse.json({ success: false, error: 'Erro ao remover permissão.' }, { status: 500 });
  }
}
