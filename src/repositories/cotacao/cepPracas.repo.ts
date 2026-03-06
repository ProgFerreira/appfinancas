import { query } from '@/lib/db';
import type { CepPraca } from '@/types';

const TABLE = 'cep_pracas';

/**
 * Encontra a praça (UF/cidade) para um CEP.
 * CEP deve ser passado apenas com dígitos (8 caracteres).
 */
export async function findByCep(cep: string): Promise<CepPraca | null> {
  const digits = cep.replace(/\D/g, '').padStart(8, '0').slice(0, 8);
  const rows = await query<CepPraca[]>(
    `SELECT id, cep_inicio, cep_fim, uf, cidade FROM ${TABLE} WHERE ? BETWEEN cep_inicio AND cep_fim LIMIT 1`,
    [digits]
  );
  return Array.isArray(rows) && rows[0] ? rows[0] : null;
}

export async function listAll(): Promise<CepPraca[]> {
  const rows = await query<CepPraca[]>(`SELECT id, cep_inicio, cep_fim, uf, cidade FROM ${TABLE} ORDER BY uf, cidade`);
  return Array.isArray(rows) ? rows : [];
}

/** Lista praças distintas (UF + cidade) para uso em dropdowns na cotação. */
export async function listPracas(): Promise<{ uf: string; cidade: string }[]> {
  const rows = await query<{ uf: string; cidade: string }[]>(
    `SELECT DISTINCT uf, cidade FROM ${TABLE} ORDER BY uf, cidade`
  );
  return Array.isArray(rows) ? rows : [];
}
