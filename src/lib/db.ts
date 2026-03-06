import mysql from 'mysql2/promise';

declare global {
  // eslint-disable-next-line no-var
  var __dbPool: mysql.Pool | undefined;
}

/**
 * Pool singleton para evitar "Too many connections" no Next.js:
 * em dev (hot reload) cada reload criava um novo pool sem fechar o anterior.
 */
function getPool(): mysql.Pool {
  if (global.__dbPool) return global.__dbPool;
  const pool = mysql.createPool({
    host: process.env.DB_HOST ?? '127.0.0.1',
    port: Number(process.env.DB_PORT) || 3306,
    database: process.env.DB_DATABASE ?? 'transportadora_financeiro',
    user: process.env.DB_USERNAME ?? 'root',
    password: process.env.DB_PASSWORD !== undefined ? String(process.env.DB_PASSWORD) : '',
    charset: 'utf8mb4',
    waitForConnections: true,
    connectionLimit: 5,
    queueLimit: 0,
    connectTimeout: 10000,
  });
  global.__dbPool = pool;
  return pool;
}

const pool = getPool();

export async function query<T = unknown>(
  sql: string,
  params?: (string | number | null)[]
): Promise<T> {
  const [rows] = await pool.execute(sql, params);
  return rows as T;
}

export async function getConnection() {
  return pool.getConnection();
}

export default pool;
