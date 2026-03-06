import { query } from '@/lib/db';
import type { CotacaoParceiroCoverage } from '@/types';

const TABLE = 'cotacao_parceiro_coverages';

export async function findByPartnerId(partnerId: number): Promise<CotacaoParceiroCoverage[]> {
  const rows = await query<CotacaoParceiroCoverage[]>(
    `SELECT id, partner_id, uf, cidade, cep_inicio, cep_fim, created_at FROM ${TABLE} WHERE partner_id = ? ORDER BY uf, cidade`,
    [partnerId]
  );
  return Array.isArray(rows) ? rows : [];
}

export async function create(data: {
  partner_id: number;
  uf: string;
  cidade: string;
  cep_inicio: string | null;
  cep_fim: string | null;
}): Promise<number> {
  const result = await query<{ insertId: number }>(
    `INSERT INTO ${TABLE} (partner_id, uf, cidade, cep_inicio, cep_fim) VALUES (?, ?, ?, ?, ?)`,
    [data.partner_id, data.uf, data.cidade, data.cep_inicio ?? null, data.cep_fim ?? null]
  );
  const r = result as unknown as { insertId?: number };
  return r?.insertId ?? 0;
}

export async function remove(id: number): Promise<boolean> {
  const result = await query<{ affectedRows: number }>(`DELETE FROM ${TABLE} WHERE id = ?`, [id]);
  const r = result as unknown as { affectedRows?: number };
  return (r?.affectedRows ?? 0) > 0;
}

export async function removeByPartnerId(partnerId: number): Promise<number> {
  const result = await query<{ affectedRows: number }>(`DELETE FROM ${TABLE} WHERE partner_id = ?`, [partnerId]);
  const r = result as unknown as { affectedRows?: number };
  return r?.affectedRows ?? 0;
}

/** Retorna IDs dos parceiros que atendem o destino (UF/cidade). Se cepDestino informado, filtra por faixa de CEP quando existir. */
export async function findPartnerIdsByDestino(destinoUf: string, destinoCidade: string, cepDestino?: string): Promise<number[]> {
  let sql = `SELECT DISTINCT partner_id FROM ${TABLE} WHERE uf = ? AND cidade = ?`;
  const params: (string | number)[] = [destinoUf, destinoCidade];
  if (cepDestino) {
    const cep = cepDestino.replace(/\D/g, '').padStart(8, '0').slice(0, 8);
    sql += ' AND ( (cep_inicio IS NULL AND cep_fim IS NULL) OR (? BETWEEN cep_inicio AND cep_fim) )';
    params.push(cep);
  }
  const rows = await query<{ partner_id: number }[]>(sql, params);
  return Array.isArray(rows) ? rows.map((r) => r.partner_id) : [];
}
