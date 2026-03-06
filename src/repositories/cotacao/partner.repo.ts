import { query } from '@/lib/db';
import type { CotacaoParceiro } from '@/types';

const TABLE = 'cotacao_parceiros';

export async function findAll(ativo?: 0 | 1): Promise<CotacaoParceiro[]> {
  let sql = `SELECT id, nome, tipo, cnpj, contato, email, telefone, ativo, observacoes, created_at, updated_at, deleted_at FROM ${TABLE} WHERE deleted_at IS NULL`;
  const params: (number | string)[] = [];
  if (ativo !== undefined) {
    sql += ' AND ativo = ?';
    params.push(ativo);
  }
  sql += ' ORDER BY nome';
  const rows = await query<CotacaoParceiro[]>(sql, params);
  return Array.isArray(rows) ? rows : [];
}

export async function findById(id: number): Promise<CotacaoParceiro | null> {
  const rows = await query<CotacaoParceiro[]>(
    `SELECT id, nome, tipo, cnpj, contato, email, telefone, ativo, observacoes, created_at, updated_at, deleted_at FROM ${TABLE} WHERE id = ? AND deleted_at IS NULL LIMIT 1`,
    [id]
  );
  return Array.isArray(rows) && rows[0] ? rows[0] : null;
}

export async function create(data: {
  nome: string;
  tipo: string;
  cnpj: string | null;
  contato: string | null;
  email: string | null;
  telefone: string | null;
  ativo: number;
  observacoes: string | null;
}): Promise<number> {
  const result = await query<{ insertId: number }>(
    `INSERT INTO ${TABLE} (nome, tipo, cnpj, contato, email, telefone, ativo, observacoes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.nome,
      data.tipo,
      data.cnpj ?? null,
      data.contato ?? null,
      data.email ?? null,
      data.telefone ?? null,
      data.ativo,
      data.observacoes ?? null,
    ]
  );
  const r = result as unknown as { insertId?: number };
  return r?.insertId ?? 0;
}

export async function update(
  id: number,
  data: {
    nome: string;
    tipo: string;
    cnpj: string | null;
    contato: string | null;
    email: string | null;
    telefone: string | null;
    ativo: number;
    observacoes: string | null;
  }
): Promise<boolean> {
  const result = await query<{ affectedRows: number }>(
    `UPDATE ${TABLE} SET nome = ?, tipo = ?, cnpj = ?, contato = ?, email = ?, telefone = ?, ativo = ?, observacoes = ? WHERE id = ? AND deleted_at IS NULL`,
    [
      data.nome,
      data.tipo,
      data.cnpj ?? null,
      data.contato ?? null,
      data.email ?? null,
      data.telefone ?? null,
      data.ativo,
      data.observacoes ?? null,
      id,
    ]
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
