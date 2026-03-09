import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import type { Pool, PoolConnection } from 'mysql2/promise';

const DB_SCHEMA_SYNC_ENABLED = process.env.DB_SCHEMA_SYNC !== 'false';
const DB_SCHEMA_SYNC_LOCK_NAME = process.env.DB_SCHEMA_SYNC_LOCK_NAME ?? 'appfinancas_schema_sync_v1';
const DB_SCHEMA_SYNC_LOCK_TIMEOUT_SEC = Number(process.env.DB_SCHEMA_SYNC_LOCK_TIMEOUT_SEC) || 30;
const DB_SCHEMA_ALLOW_CHANGED_MIGRATIONS = process.env.DB_SCHEMA_ALLOW_CHANGED_MIGRATIONS === 'true';

const BASE_SCHEMA_NAME = '000_base_schema.sql';
const BASE_SCHEMA_PATH = path.join(process.cwd(), 'database', 'schema.sql');
const MIGRATIONS_DIR = path.join(process.cwd(), 'database', 'migrations');
const MIGRATIONS_TABLE = 'schema_migrations';

type MigrationRow = {
  migration_name: string;
  checksum: string;
};

type SqlError = {
  code?: string;
  errno?: number;
  sqlMessage?: string;
  message?: string;
};

type ExecutionStats = {
  total: number;
  executed: number;
  ignored: number;
};

type ParsedForeignKey = {
  tableName: string;
  columnNames: string[];
  referencedTableName: string;
  referencedColumnNames: string[];
};

function schemaLog(level: 'log' | 'warn' | 'error', message: string, meta?: Record<string, unknown>) {
  const ts = new Date().toISOString();
  if (meta) {
    console[level](`[db-schema] ${ts} ${message}`, meta);
    return;
  }
  console[level](`[db-schema] ${ts} ${message}`);
}

function checksum(content: string): string {
  return createHash('sha256').update(content).digest('hex');
}

function sanitizeSql(sql: string): string {
  return sql.replace(/\s+/g, ' ').trim().slice(0, 220);
}

function readSqlFile(filePath: string): string {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Arquivo SQL não encontrado: ${filePath}`);
  }
  return fs.readFileSync(filePath, 'utf8').replace(/^\uFEFF/, '');
}

function splitSqlStatements(rawSql: string): string[] {
  const sql = rawSql.replace(/\r\n/g, '\n');
  const statements: string[] = [];
  let current = '';
  let inSingle = false;
  let inDouble = false;
  let inBacktick = false;
  let inLineComment = false;
  let inBlockComment = false;

  for (let i = 0; i < sql.length; i++) {
    const ch = sql[i];
    const next = sql[i + 1] ?? '';
    const next2 = sql[i + 2] ?? '';

    if (inLineComment) {
      if (ch === '\n') inLineComment = false;
      continue;
    }
    if (inBlockComment) {
      if (ch === '*' && next === '/') {
        inBlockComment = false;
        i++;
      }
      continue;
    }

    if (!inSingle && !inDouble && !inBacktick) {
      if (ch === '-' && next === '-' && /\s/.test(next2 || ' ')) {
        inLineComment = true;
        i++;
        continue;
      }
      if (ch === '#') {
        inLineComment = true;
        continue;
      }
      if (ch === '/' && next === '*') {
        inBlockComment = true;
        i++;
        continue;
      }
    }

    if (!inDouble && !inBacktick && ch === '\'') {
      if (inSingle) {
        if (next === '\'') {
          current += '\'\'';
          i++;
          continue;
        }
        inSingle = false;
      } else {
        inSingle = true;
      }
      current += ch;
      continue;
    }

    if (!inSingle && !inBacktick && ch === '"') {
      if (inDouble) {
        if (next === '"') {
          current += '""';
          i++;
          continue;
        }
        inDouble = false;
      } else {
        inDouble = true;
      }
      current += ch;
      continue;
    }

    if (!inSingle && !inDouble && ch === '`') {
      inBacktick = !inBacktick;
      current += ch;
      continue;
    }

    if (!inSingle && !inDouble && !inBacktick && ch === ';') {
      const statement = current.trim();
      if (statement) statements.push(statement);
      current = '';
      continue;
    }

    current += ch;
  }

  const tail = current.trim();
  if (tail) statements.push(tail);
  return statements;
}

function shouldSkipStatement(statement: string): boolean {
  return (
    /^USE\s+/i.test(statement) ||
    /^CREATE\s+DATABASE\s+/i.test(statement) ||
    /^DROP\s+DATABASE\s+/i.test(statement) ||
    /^DELIMITER\s+/i.test(statement)
  );
}

function parseIdentifierList(raw: string): string[] {
  return raw
    .split(',')
    .map((value) => value.trim().replace(/[`"]/g, '').toLowerCase())
    .filter(Boolean);
}

function parseAddForeignKeyStatement(statement: string): ParsedForeignKey | null {
  const match = statement.match(
    /^\s*ALTER\s+TABLE\s+`?([A-Za-z0-9_]+)`?\s+ADD\s+(?:CONSTRAINT\s+`?[A-Za-z0-9_]+`?\s+)?FOREIGN\s+KEY\s*\(([^)]+)\)\s+REFERENCES\s+`?([A-Za-z0-9_]+)`?\s*\(([^)]+)\)/is
  );
  if (!match) return null;

  const [, rawTableName, rawColumnNames, rawReferencedTableName, rawReferencedColumnNames] = match;
  const columnNames = parseIdentifierList(rawColumnNames);
  const referencedColumnNames = parseIdentifierList(rawReferencedColumnNames);
  if (!columnNames.length || !referencedColumnNames.length || columnNames.length !== referencedColumnNames.length) {
    return null;
  }

  return {
    tableName: rawTableName.replace(/[`"]/g, '').toLowerCase(),
    columnNames,
    referencedTableName: rawReferencedTableName.replace(/[`"]/g, '').toLowerCase(),
    referencedColumnNames,
  };
}

function isDuplicateForeignKeyError(error: SqlError, statement: string): boolean {
  if (!parseAddForeignKeyStatement(statement)) return false;
  if (error.errno === 1826 || error.code === 'ER_FK_DUP_NAME') return true;

  const message = `${error.sqlMessage ?? ''} ${error.message ?? ''}`.toLowerCase();
  return (
    message.includes('duplicate foreign key constraint name') ||
    message.includes('errno: 121') ||
    message.includes('duplicate key on write or update')
  );
}

function isIgnorableSqlError(error: SqlError, statement: string): boolean {
  const normalizedStmt = statement.trim().toUpperCase();
  const isInsertLike = /^INSERT\b|^REPLACE\b|^UPDATE\b/.test(normalizedStmt);
  const ignorableErrnos = new Set([1050, 1060, 1061, 1068, 1091, 1826]);
  const ignorableCodes = new Set([
    'ER_TABLE_EXISTS_ERROR',
    'ER_DUP_FIELDNAME',
    'ER_DUP_KEYNAME',
    'ER_MULTIPLE_PRI_KEY',
    'ER_CANT_DROP_FIELD_OR_KEY',
    'ER_FK_DUP_NAME',
  ]);

  if ((error.errno === 1062 || error.code === 'ER_DUP_ENTRY') && isInsertLike) return true;
  if (error.errno && ignorableErrnos.has(error.errno)) return true;
  if (error.code && ignorableCodes.has(error.code)) return true;

  const message = `${error.sqlMessage ?? ''} ${error.message ?? ''}`.toLowerCase();
  if (isInsertLike && message.includes('duplicate entry')) return true;
  if (isDuplicateForeignKeyError(error, statement)) return true;
  return (
    message.includes('duplicate column name') ||
    message.includes('duplicate key name') ||
    message.includes('duplicate foreign key constraint name') ||
    message.includes('already exists') ||
    message.includes('multiple primary key')
  );
}

async function hasEquivalentForeignKey(connection: PoolConnection, statement: string): Promise<boolean> {
  const parsed = parseAddForeignKeyStatement(statement);
  if (!parsed) return false;

  const [rows] = await connection.query(
    `SELECT
       GROUP_CONCAT(k.COLUMN_NAME ORDER BY k.ORDINAL_POSITION SEPARATOR ',') AS child_columns,
       GROUP_CONCAT(k.REFERENCED_COLUMN_NAME ORDER BY k.ORDINAL_POSITION SEPARATOR ',') AS parent_columns,
       MAX(k.REFERENCED_TABLE_NAME) AS referenced_table
     FROM information_schema.KEY_COLUMN_USAGE k
     JOIN information_schema.TABLE_CONSTRAINTS tc
       ON tc.CONSTRAINT_SCHEMA = k.CONSTRAINT_SCHEMA
      AND tc.TABLE_NAME = k.TABLE_NAME
      AND tc.CONSTRAINT_NAME = k.CONSTRAINT_NAME
     WHERE k.CONSTRAINT_SCHEMA = DATABASE()
       AND k.TABLE_NAME = ?
       AND tc.CONSTRAINT_TYPE = 'FOREIGN KEY'
     GROUP BY k.CONSTRAINT_NAME`,
    [parsed.tableName]
  );

  const expectedChild = parsed.columnNames.join(',');
  const expectedParent = parsed.referencedColumnNames.join(',');

  for (const row of (Array.isArray(rows) ? rows : []) as Array<{
    child_columns?: string | null;
    parent_columns?: string | null;
    referenced_table?: string | null;
  }>) {
    const childColumns = String(row.child_columns ?? '')
      .split(',')
      .map((col) => col.trim().toLowerCase())
      .filter(Boolean)
      .join(',');
    const parentColumns = String(row.parent_columns ?? '')
      .split(',')
      .map((col) => col.trim().toLowerCase())
      .filter(Boolean)
      .join(',');
    const referencedTable = String(row.referenced_table ?? '').trim().toLowerCase();

    if (
      childColumns === expectedChild &&
      parentColumns === expectedParent &&
      referencedTable === parsed.referencedTableName
    ) {
      return true;
    }
  }

  return false;
}

async function ensureMigrationsTable(connection: PoolConnection) {
  await connection.query(`
    CREATE TABLE IF NOT EXISTS ${MIGRATIONS_TABLE} (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
      migration_name VARCHAR(255) NOT NULL,
      checksum CHAR(64) NOT NULL,
      statements_total INT UNSIGNED NOT NULL DEFAULT 0,
      statements_executed INT UNSIGNED NOT NULL DEFAULT 0,
      statements_ignored INT UNSIGNED NOT NULL DEFAULT 0,
      execution_ms INT UNSIGNED NOT NULL DEFAULT 0,
      applied_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY uq_schema_migration_name (migration_name)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
}

async function getAppliedMigrations(connection: PoolConnection): Promise<Map<string, MigrationRow>> {
  const [rows] = await connection.query(`SELECT migration_name, checksum FROM ${MIGRATIONS_TABLE}`);
  const map = new Map<string, MigrationRow>();
  for (const row of (Array.isArray(rows) ? rows : []) as MigrationRow[]) {
    map.set(row.migration_name, row);
  }
  return map;
}

function listMigrationFiles(): { name: string; path: string; sql: string; checksum: string }[] {
  if (!fs.existsSync(MIGRATIONS_DIR)) {
    throw new Error(`Diretório de migrations não encontrado: ${MIGRATIONS_DIR}`);
  }
  const names = fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((name) => /^\d+_.*\.sql$/i.test(name))
    .sort((a, b) => a.localeCompare(b, 'en'));

  return names.map((name) => {
    const fullPath = path.join(MIGRATIONS_DIR, name);
    const sql = readSqlFile(fullPath);
    return { name, path: fullPath, sql, checksum: checksum(sql) };
  });
}

async function persistMigrationRecord(
  connection: PoolConnection,
  migrationName: string,
  migrationChecksum: string,
  stats: ExecutionStats,
  executionMs: number
) {
  await connection.query(
    `INSERT INTO ${MIGRATIONS_TABLE} (migration_name, checksum, statements_total, statements_executed, statements_ignored, execution_ms)
     VALUES (?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       checksum = VALUES(checksum),
       statements_total = VALUES(statements_total),
       statements_executed = VALUES(statements_executed),
       statements_ignored = VALUES(statements_ignored),
       execution_ms = VALUES(execution_ms),
       updated_at = CURRENT_TIMESTAMP`,
    [
      migrationName,
      migrationChecksum,
      stats.total,
      stats.executed,
      stats.ignored,
      Math.max(0, Math.round(executionMs)),
    ]
  );
}

async function executeStatements(
  connection: PoolConnection,
  migrationName: string,
  statements: string[],
  options?: { tolerateDuplicateErrors?: boolean }
): Promise<ExecutionStats> {
  const stats: ExecutionStats = { total: 0, executed: 0, ignored: 0 };

  for (const statement of statements) {
    if (!statement.trim()) continue;
    if (shouldSkipStatement(statement)) continue;

    stats.total += 1;
    try {
      await connection.query(statement);
      stats.executed += 1;
    } catch (error) {
      const sqlError = error as SqlError;
      if (options?.tolerateDuplicateErrors && isIgnorableSqlError(sqlError, statement)) {
        if (isDuplicateForeignKeyError(sqlError, statement)) {
          const equivalentExists = await hasEquivalentForeignKey(connection, statement);
          if (!equivalentExists) {
            throw new Error(
              `Falha em migration ${migrationName}: ${sqlError.sqlMessage ?? sqlError.message ?? 'erro desconhecido'} | SQL: ${sanitizeSql(statement)}`
            );
          }
        }
        stats.ignored += 1;
        schemaLog('warn', 'Comando SQL ignorado por já existir (idempotência)', {
          migration: migrationName,
          code: sqlError.code ?? null,
          errno: sqlError.errno ?? null,
          statement: sanitizeSql(statement),
        });
        continue;
      }
      throw new Error(
        `Falha em migration ${migrationName}: ${sqlError.sqlMessage ?? sqlError.message ?? 'erro desconhecido'} | SQL: ${sanitizeSql(statement)}`
      );
    }
  }

  return stats;
}

async function applyBaseSchemaIfNeeded(connection: PoolConnection, appliedMigrations: Map<string, MigrationRow>) {
  const baseSql = readSqlFile(BASE_SCHEMA_PATH);
  const baseChecksum = checksum(baseSql);
  const current = appliedMigrations.get(BASE_SCHEMA_NAME);
  const changed = current && current.checksum !== baseChecksum;

  if (!current || changed) {
    const reason = !current ? 'primeira execução' : 'checksum alterado';
    schemaLog('log', 'Aplicando schema base', { reason, file: BASE_SCHEMA_PATH });

    const startedAt = Date.now();
    const statements = splitSqlStatements(baseSql);
    const stats = await executeStatements(connection, BASE_SCHEMA_NAME, statements, {
      tolerateDuplicateErrors: true,
    });
    const elapsedMs = Date.now() - startedAt;

    await persistMigrationRecord(connection, BASE_SCHEMA_NAME, baseChecksum, stats, elapsedMs);
    appliedMigrations.set(BASE_SCHEMA_NAME, {
      migration_name: BASE_SCHEMA_NAME,
      checksum: baseChecksum,
    });
    schemaLog('log', 'Schema base aplicado', {
      statements: stats.total,
      executed: stats.executed,
      ignored: stats.ignored,
      elapsedMs,
    });
    return;
  }

  schemaLog('log', 'Schema base já está sincronizado');
}

async function applyVersionedMigrations(connection: PoolConnection, appliedMigrations: Map<string, MigrationRow>) {
  const migrationFiles = listMigrationFiles();
  for (const migration of migrationFiles) {
    const current = appliedMigrations.get(migration.name);
    const hasChanged = !!current && current.checksum !== migration.checksum;

    if (current && !hasChanged) continue;

    if (hasChanged && !DB_SCHEMA_ALLOW_CHANGED_MIGRATIONS) {
      throw new Error(
        `Migration alterada após aplicação: ${migration.name}. Crie uma nova migration ou use DB_SCHEMA_ALLOW_CHANGED_MIGRATIONS=true conscientemente.`
      );
    }

    schemaLog('log', 'Aplicando migration', {
      migration: migration.name,
      mode: current ? 'reaplicar (checksum alterado)' : 'nova',
    });

    const startedAt = Date.now();
    const statements = splitSqlStatements(migration.sql);
    const stats = await executeStatements(connection, migration.name, statements, {
      tolerateDuplicateErrors: true,
    });
    const elapsedMs = Date.now() - startedAt;

    await persistMigrationRecord(connection, migration.name, migration.checksum, stats, elapsedMs);
    appliedMigrations.set(migration.name, {
      migration_name: migration.name,
      checksum: migration.checksum,
    });

    schemaLog('log', 'Migration aplicada', {
      migration: migration.name,
      statements: stats.total,
      executed: stats.executed,
      ignored: stats.ignored,
      elapsedMs,
    });
  }
}

async function acquireSchemaLock(connection: PoolConnection): Promise<boolean> {
  const [rows] = await connection.query(
    'SELECT GET_LOCK(?, ?) AS acquired',
    [DB_SCHEMA_SYNC_LOCK_NAME, DB_SCHEMA_SYNC_LOCK_TIMEOUT_SEC]
  );
  const lockRows = (Array.isArray(rows) ? rows : []) as { acquired: number }[];
  const acquired = lockRows[0] ? Number(lockRows[0].acquired) : 0;
  return acquired === 1;
}

async function releaseSchemaLock(connection: PoolConnection) {
  try {
    await connection.query('SELECT RELEASE_LOCK(?)', [DB_SCHEMA_SYNC_LOCK_NAME]);
  } catch (error) {
    const err = error as SqlError;
    schemaLog('warn', 'Não foi possível liberar lock de schema', {
      code: err.code ?? null,
      errno: err.errno ?? null,
      message: err.message ?? null,
    });
  }
}

export async function ensureDatabaseSchema(pool: Pool): Promise<void> {
  if (!DB_SCHEMA_SYNC_ENABLED) {
    schemaLog('warn', 'Sincronização automática de schema desativada por DB_SCHEMA_SYNC=false');
    return;
  }

  const startedAt = Date.now();
  const connection = await pool.getConnection();
  let lockAcquired = false;

  try {
    lockAcquired = await acquireSchemaLock(connection);
    if (!lockAcquired) {
      throw new Error(
        `Não foi possível obter lock de migração em ${DB_SCHEMA_SYNC_LOCK_TIMEOUT_SEC}s (${DB_SCHEMA_SYNC_LOCK_NAME}).`
      );
    }

    await ensureMigrationsTable(connection);
    const applied = await getAppliedMigrations(connection);

    await applyBaseSchemaIfNeeded(connection, applied);
    await applyVersionedMigrations(connection, applied);

    schemaLog('log', 'Sincronização de schema concluída', {
      elapsedMs: Date.now() - startedAt,
      appliedMigrations: applied.size,
    });
  } finally {
    if (lockAcquired) {
      await releaseSchemaLock(connection);
    }
    connection.release();
  }
}
