import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';

declare global {
  // eslint-disable-next-line no-var
  var __dbPool: mysql.Pool | undefined;
}

const DB_DEBUG = process.env.DB_DEBUG === 'true';
const SEED_TEST_USER_ON_STARTUP = (process.env.SEED_TEST_USER_ON_STARTUP ?? 'true').toLowerCase() !== 'false';
const TEST_USER_NAME = process.env.TEST_USER_NAME?.trim() || 'Usuario de Teste';
const TEST_USER_EMAIL = (process.env.TEST_USER_EMAIL?.trim().toLowerCase() || 'teste@transportadora.com');
const TEST_USER_PASSWORD = process.env.TEST_USER_PASSWORD || 'Teste@123';
const TEST_USER_PROFILE = (process.env.TEST_USER_PROFILE?.trim().toLowerCase() || 'administrador');

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

async function ensureStartupTestUser(pool: mysql.Pool) {
  if (!SEED_TEST_USER_ON_STARTUP) return;

  try {
    const senhaHash = await bcrypt.hash(TEST_USER_PASSWORD, 10);
    await pool.execute(
      `INSERT INTO usuarios (nome, email, senha_hash, perfil, status, ativo)
       VALUES (?, ?, ?, ?, 'ativo', 1)
       ON DUPLICATE KEY UPDATE id = id`,
      [TEST_USER_NAME, TEST_USER_EMAIL, senhaHash, TEST_USER_PROFILE]
    );
    dbLog('log', 'Usuario de teste garantido no startup', {
      email: TEST_USER_EMAIL,
      perfil: TEST_USER_PROFILE,
    });
  } catch (error) {
    const err = error as { code?: string; errno?: number; sqlMessage?: string; message?: string };
    dbLog('error', 'Falha ao criar/garantir usuario de teste no startup', {
      code: err.code ?? null,
      errno: err.errno ?? null,
      sqlMessage: err.sqlMessage ?? null,
      message: err.message ?? String(error),
      email: TEST_USER_EMAIL,
    });
  }
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
  void ensureStartupTestUser(pool);
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
