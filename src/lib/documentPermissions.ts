import { query } from '@/lib/db';

export type DocAction = 'view' | 'download' | 'edit' | 'delete';

/**
 * Verifica se o usuário tem permissão para a ação no documento.
 * Dono (created_by) tem todas as permissões; senão consulta document_permissions.
 */
export async function canDo(
  userId: number,
  documentId: number,
  action: DocAction
): Promise<boolean> {
  const rows = await query<
    { created_by: number | null; can_view: number; can_download: number; can_edit: number; can_delete: number }[]
  >(
    `SELECT d.created_by,
            COALESCE(dp.can_view, 0) AS can_view,
            COALESCE(dp.can_download, 0) AS can_download,
            COALESCE(dp.can_edit, 0) AS can_edit,
            COALESCE(dp.can_delete, 0) AS can_delete
     FROM documentos d
     LEFT JOIN document_permissions dp ON dp.document_id = d.id AND dp.user_id = ?
     WHERE d.id = ? AND d.deleted_at IS NULL
     LIMIT 1`,
    [userId, documentId]
  );
  const row = Array.isArray(rows) ? rows[0] : null;
  if (!row) return false;
  if (row.created_by === userId) return true;
  const col = action === 'view' ? row.can_view : action === 'download' ? row.can_download : action === 'edit' ? row.can_edit : row.can_delete;
  return col === 1;
}

/**
 * Lista IDs de documentos que o usuário pode pelo menos visualizar (dono ou can_view=1).
 */
export async function listViewableDocumentIds(userId: number): Promise<number[]> {
  const rows = await query<{ id: number }[]>(
    `SELECT d.id FROM documentos d
     WHERE d.deleted_at IS NULL
       AND (d.created_by = ? OR EXISTS (SELECT 1 FROM document_permissions dp WHERE dp.document_id = d.id AND dp.user_id = ? AND dp.can_view = 1))`,
    [userId, userId]
  );
  return (Array.isArray(rows) ? rows : []).map((r) => r.id);
}
