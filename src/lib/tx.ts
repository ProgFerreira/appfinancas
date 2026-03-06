import { getConnection } from '@/lib/db';
import type { Connection } from 'mysql2/promise';

/**
 * Executa um callback dentro de uma transação.
 * Faz commit em sucesso e rollback em erro.
 */
export async function withTransaction<T>(
  fn: (conn: Connection) => Promise<T>
): Promise<T> {
  const conn = await getConnection();
  try {
    await conn.beginTransaction();
    const result = await fn(conn);
    await conn.commit();
    return result;
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
}
