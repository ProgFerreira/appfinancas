import { query } from '@/lib/db';

export interface AuditLogParams {
  userId: number | null;
  action: string;
  entityType: string;
  entityId?: number | null;
  oldValues?: Record<string, unknown> | null;
  newValues?: Record<string, unknown> | null;
  ip?: string | null;
  userAgent?: string | null;
}

export class AuditService {
  async log(params: AuditLogParams): Promise<void> {
    const oldJson = params.oldValues ? JSON.stringify(params.oldValues) : null;
    const newJson = params.newValues ? JSON.stringify(params.newValues) : null;
    await query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, old_values_json, new_values_json, ip, user_agent)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        params.userId ?? null,
        params.action,
        params.entityType,
        params.entityId ?? null,
        oldJson,
        newJson,
        params.ip ?? null,
        params.userAgent ?? null,
      ]
    );
  }
}
