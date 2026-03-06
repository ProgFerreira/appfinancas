import { query } from '@/lib/db';
import type { CotacaoPartnerTE } from '@/types';

const TABLE = 'cotacao_partner_te';

export async function findByPartnerId(partnerId: number): Promise<CotacaoPartnerTE[]> {
  const rows = await query<CotacaoPartnerTE[]>(
    `SELECT id, partner_id, codigo, minima, peso_franquia_kg, tarifa, soma_ao_frete_peso, created_at, updated_at FROM ${TABLE} WHERE partner_id = ? ORDER BY id`,
    [partnerId]
  );
  return Array.isArray(rows) ? rows : [];
}

export async function saveList(partnerId: number, rows: { codigo?: string | null; minima: number; peso_franquia_kg: number; tarifa: number; soma_ao_frete_peso: number }[]): Promise<void> {
  await query(`DELETE FROM ${TABLE} WHERE partner_id = ?`, [partnerId]);
  for (const r of rows) {
    await query(
      `INSERT INTO ${TABLE} (partner_id, codigo, minima, peso_franquia_kg, tarifa, soma_ao_frete_peso) VALUES (?, ?, ?, ?, ?, ?)`,
      [partnerId, r.codigo ?? null, Number(r.minima) || 0, Number(r.peso_franquia_kg) || 0, Number(r.tarifa) || 0, r.soma_ao_frete_peso ? 1 : 0]
    );
  }
}
