import { query } from '@/lib/db';
import type { CotacaoPriceTable, CotacaoPriceTableRange } from '@/types';

const TABLE = 'cotacao_price_tables';
const RANGES_TABLE = 'cotacao_price_table_ranges';

export async function findAll(partnerId?: number, ativo?: 0 | 1): Promise<CotacaoPriceTable[]> {
  let sql = `SELECT pt.id, pt.partner_id, pt.nome, pt.origem_uf, pt.origem_cidade, pt.destino_uf, pt.destino_cidade, pt.ativo, pt.created_at, pt.updated_at, pt.deleted_at, p.nome AS partner_nome
    FROM ${TABLE} pt
    INNER JOIN cotacao_parceiros p ON p.id = pt.partner_id AND p.deleted_at IS NULL
    WHERE pt.deleted_at IS NULL`;
  const params: (number | string)[] = [];
  if (partnerId !== undefined) {
    sql += ' AND pt.partner_id = ?';
    params.push(partnerId);
  }
  if (ativo !== undefined) {
    sql += ' AND pt.ativo = ?';
    params.push(ativo);
  }
  sql += ' ORDER BY pt.nome';
  const rows = await query<CotacaoPriceTable[]>(sql, params);
  return Array.isArray(rows) ? rows : [];
}

export async function findById(id: number): Promise<CotacaoPriceTable | null> {
  const rows = await query<CotacaoPriceTable[]>(
    `SELECT pt.id, pt.partner_id, pt.nome, pt.origem_uf, pt.origem_cidade, pt.destino_uf, pt.destino_cidade, pt.ativo, pt.created_at, pt.updated_at, pt.deleted_at, p.nome AS partner_nome
     FROM ${TABLE} pt
     INNER JOIN cotacao_parceiros p ON p.id = pt.partner_id
     WHERE pt.id = ? AND pt.deleted_at IS NULL LIMIT 1`,
    [id]
  );
  return Array.isArray(rows) && rows[0] ? rows[0] : null;
}

export async function create(data: {
  partner_id: number;
  nome: string;
  origem_uf: string;
  origem_cidade: string;
  destino_uf: string;
  destino_cidade: string;
  ativo: number;
}): Promise<number> {
  const result = await query<{ insertId: number }>(
    `INSERT INTO ${TABLE} (partner_id, nome, origem_uf, origem_cidade, destino_uf, destino_cidade, ativo) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [data.partner_id, data.nome, data.origem_uf, data.origem_cidade, data.destino_uf, data.destino_cidade, data.ativo]
  );
  const r = result as unknown as { insertId?: number };
  return r?.insertId ?? 0;
}

export async function update(
  id: number,
  data: {
    nome: string;
    origem_uf: string;
    origem_cidade: string;
    destino_uf: string;
    destino_cidade: string;
    ativo: number;
  }
): Promise<boolean> {
  const result = await query<{ affectedRows: number }>(
    `UPDATE ${TABLE} SET nome = ?, origem_uf = ?, origem_cidade = ?, destino_uf = ?, destino_cidade = ?, ativo = ? WHERE id = ? AND deleted_at IS NULL`,
    [data.nome, data.origem_uf, data.origem_cidade, data.destino_uf, data.destino_cidade, data.ativo, id]
  );
  const r = result as unknown as { affectedRows?: number };
  return (r?.affectedRows ?? 0) > 0;
}

export async function softDelete(id: number): Promise<boolean> {
  const result = await query<{ affectedRows: number }>(
    `UPDATE ${TABLE} SET deleted_at = CURRENT_TIMESTAMP WHERE id = ? AND deleted_at IS NULL`,
    [id]
  );
  const r = result as unknown as { affectedRows?: number };
  return (r?.affectedRows ?? 0) > 0;
}

// --- Ranges ---
export async function findRangesByPriceTableId(priceTableId: number): Promise<CotacaoPriceTableRange[]> {
  const rows = await query<CotacaoPriceTableRange[]>(
    `SELECT id, price_table_id, peso_inicial_kg, peso_final_kg, valor_base, valor_excedente_por_kg, prazo_dias, created_at, updated_at FROM ${RANGES_TABLE} WHERE price_table_id = ? ORDER BY peso_inicial_kg`,
    [priceTableId]
  );
  return Array.isArray(rows) ? rows : [];
}

export async function createRange(data: {
  price_table_id: number;
  peso_inicial_kg: number;
  peso_final_kg: number;
  valor_base: number;
  valor_excedente_por_kg: number | null;
  prazo_dias: number;
}): Promise<number> {
  const result = await query<{ insertId: number }>(
    `INSERT INTO ${RANGES_TABLE} (price_table_id, peso_inicial_kg, peso_final_kg, valor_base, valor_excedente_por_kg, prazo_dias) VALUES (?, ?, ?, ?, ?, ?)`,
    [
      data.price_table_id,
      data.peso_inicial_kg,
      data.peso_final_kg,
      data.valor_base,
      data.valor_excedente_por_kg ?? null,
      data.prazo_dias,
    ]
  );
  const r = result as unknown as { insertId?: number };
  return r?.insertId ?? 0;
}

export async function updateRange(
  id: number,
  data: {
    peso_inicial_kg: number;
    peso_final_kg: number;
    valor_base: number;
    valor_excedente_por_kg: number | null;
    prazo_dias: number;
  }
): Promise<boolean> {
  const result = await query<{ affectedRows: number }>(
    `UPDATE ${RANGES_TABLE} SET peso_inicial_kg = ?, peso_final_kg = ?, valor_base = ?, valor_excedente_por_kg = ?, prazo_dias = ? WHERE id = ?`,
    [data.peso_inicial_kg, data.peso_final_kg, data.valor_base, data.valor_excedente_por_kg ?? null, data.prazo_dias, id]
  );
  const r = result as unknown as { affectedRows?: number };
  return (r?.affectedRows ?? 0) > 0;
}

export async function deleteRange(id: number): Promise<boolean> {
  const result = await query<{ affectedRows: number }>(`DELETE FROM ${RANGES_TABLE} WHERE id = ?`, [id]);
  const r = result as unknown as { affectedRows?: number };
  return (r?.affectedRows ?? 0) > 0;
}

/** Busca tabelas de preço para o trecho origem -> destino (ativo, sem soft delete). */
export async function findByRoute(origemUf: string, origemCidade: string, destinoUf: string, destinoCidade: string): Promise<CotacaoPriceTable[]> {
  const rows = await query<CotacaoPriceTable[]>(
    `SELECT pt.id, pt.partner_id, pt.nome, pt.origem_uf, pt.origem_cidade, pt.destino_uf, pt.destino_cidade, pt.ativo, pt.created_at, pt.updated_at, pt.deleted_at, p.nome AS partner_nome
     FROM ${TABLE} pt
     INNER JOIN cotacao_parceiros p ON p.id = pt.partner_id AND p.deleted_at IS NULL AND p.ativo = 1
     WHERE pt.deleted_at IS NULL AND pt.ativo = 1
       AND pt.origem_uf = ? AND pt.origem_cidade = ? AND pt.destino_uf = ? AND pt.destino_cidade = ?`,
    [origemUf, origemCidade, destinoUf, destinoCidade]
  );
  return Array.isArray(rows) ? rows : [];
}

/** Faixa aplicável: peso_inicial_kg <= peso <= peso_final_kg. Retorna a faixa com maior peso_final_kg que ainda contém o peso. */
export async function findApplicableRange(priceTableId: number, pesoKg: number): Promise<CotacaoPriceTableRange | null> {
  const rows = await query<CotacaoPriceTableRange[]>(
    `SELECT id, price_table_id, peso_inicial_kg, peso_final_kg, valor_base, valor_excedente_por_kg, prazo_dias, created_at, updated_at
     FROM ${RANGES_TABLE} WHERE price_table_id = ? AND ? >= peso_inicial_kg AND ? <= peso_final_kg ORDER BY peso_final_kg ASC LIMIT 1`,
    [priceTableId, pesoKg, pesoKg]
  );
  return Array.isArray(rows) && rows[0] ? rows[0] : null;
}
