import { query } from '@/lib/db';
import type { LedgerEntryRow } from '../domain';

export class LedgerRepository {
  async insert(entry: {
    event_type: string;
    entity_type: string;
    entity_id: number;
    account_type: 'bank' | 'plano_contas';
    account_id: number;
    debit: number;
    credit: number;
    competence_date: string;
    occurred_at: string;
    metadata_json?: string | null;
  }): Promise<number> {
    await query(
      `INSERT INTO ledger_entries (event_type, entity_type, entity_id, account_type, account_id, debit, credit, competence_date, occurred_at, metadata_json)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        entry.event_type,
        entry.entity_type,
        entry.entity_id,
        entry.account_type,
        entry.account_id,
        entry.debit,
        entry.credit,
        entry.competence_date,
        entry.occurred_at,
        entry.metadata_json ?? null,
      ]
    );
    const rows = await query<{ id: number }[]>('SELECT LAST_INSERT_ID() AS id');
    return Array.isArray(rows) && rows[0] ? Number(rows[0].id) : 0;
  }

  async findByEntity(
    entityType: string,
    entityId: number
  ): Promise<LedgerEntryRow[]> {
    const rows = await query<LedgerEntryRow[]>(
      `SELECT id, event_type, entity_type, entity_id, account_type, account_id, debit, credit, competence_date, occurred_at, metadata_json, created_at
       FROM ledger_entries WHERE entity_type = ? AND entity_id = ? ORDER BY created_at`,
      [entityType, entityId]
    );
    return Array.isArray(rows) ? rows : [];
  }
}
