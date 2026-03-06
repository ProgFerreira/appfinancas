import mysql from 'mysql2/promise';

declare global {
  // eslint-disable-next-line no-var
  var __dbPool: mysql.Pool | undefined;
}

const DB_DEBUG = process.env.DB_DEBUG === 'true';

function dbLog(
  level: 'log' | 'warn' | 'error',
  message: string,
  meta?: Record<string, unknown>
) {
  const ts = new Date().toISOString();
  if (meta) {
    console[level](`[db] ${ts} ${message}`, meta);
    return;
  }
  console[level](`[db] ${ts} ${message}`);
}

function maskDbConfig() {
  return {
    host: process.env.DB_HOST ?? '127.0.0.1',
    port: Number(process.env.DB_PORT) || 3306,
    database: process.env.DB_DATABASE ?? 'transportadora_financeiro',
    user: process.env.DB_USERNAME ?? 'root',
    passwordConfigured: process.env.DB_PASSWORD !== undefined,
    nodeEnv: process.env.NODE_ENV ?? 'development',
  };
}

function sanitizeSql(sql: string) {
  return sql.replace(/\s+/g, ' ').trim().slice(0, 220);
}

/**
 * Pool singleton para evitar "Too many connections" no Next.js:
 * em dev (hot reload) cada reload criava um novo pool sem fechar o anterior.
 */
function getPool(): mysql.Pool {
  if (global.__dbPool) return global.__dbPool;
  dbLog('log', 'Inicializando pool MySQL', maskDbConfig());
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

  const driverPool = (pool as unknown as { pool?: { on?: (event: string, cb: (...args: unknown[]) => void) => void } }).pool;
  if (driverPool && typeof driverPool.on === 'function') {
    driverPool.on('connection', (conn: unknown) => {
      const threadId = (conn as { threadId?: number }).threadId;
      dbLog('log', 'Nova conexão MySQL estabelecida', { threadId: threadId ?? 'desconhecido' });
    });
    driverPool.on('acquire', (conn: unknown) => {
      if (!DB_DEBUG) return;
      const threadId = (conn as { threadId?: number }).threadId;
      dbLog('log', 'Conexão MySQL adquirida do pool', { threadId: threadId ?? 'desconhecido' });
    });
    driverPool.on('release', (conn: unknown) => {
      if (!DB_DEBUG) return;
      const threadId = (conn as { threadId?: number }).threadId;
      dbLog('log', 'Conexão MySQL devolvida ao pool', { threadId: threadId ?? 'desconhecido' });
    });
    driverPool.on('enqueue', () => {
      dbLog('warn', 'Fila de conexões MySQL: aguardando conexão livre');
    });
  }

  global.__dbPool = pool;
  return pool;
}

const pool = getPool();

export async function query<T = unknown>(
  sql: string,
  params?: (string | number | null)[]
): Promise<T> {
  try {
    const [rows] = await pool.execute(sql, params);
    if (DB_DEBUG) {
      dbLog('log', 'Query executada com sucesso', {
        sql: sanitizeSql(sql),
        paramsCount: params?.length ?? 0,
        rowsType: Array.isArray(rows) ? 'array' : typeof rows,
      });
    }
    return rows as T;
  } catch (error) {
    const err = error as { code?: string; errno?: number; sqlMessage?: string; message?: string };
    dbLog('error', 'Falha ao executar query MySQL', {
      sql: sanitizeSql(sql),
      paramsCount: params?.length ?? 0,
      code: err.code ?? null,
      errno: err.errno ?? null,
      sqlMessage: err.sqlMessage ?? null,
      message: err.message ?? String(error),
    });
    throw error;
  }
}

export async function getConnection() {
  try {
    const conn = await pool.getConnection();
    if (DB_DEBUG) {
      const threadId = (conn as unknown as { threadId?: number }).threadId;
      dbLog('log', 'Conexão manual obtida via getConnection', { threadId: threadId ?? 'desconhecido' });
    }
    return conn;
  } catch (error) {
    const err = error as { message?: string; code?: string };
    dbLog('error', 'Falha ao obter conexão manual do pool', {
      code: err.code ?? null,
      message: err.message ?? String(error),
    });
    throw error;
  }
}

export default pool;
