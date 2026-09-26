import pg from 'pg';
import { requireDatabaseUrl } from './env.js';

const { Pool } = pg;

function resolveSsl(
  connectionString: string,
): pg.ConnectionConfig['ssl'] | undefined {
  try {
    const url = new URL(connectionString);
    const sslmode = url.searchParams.get('sslmode');

    if (sslmode === 'disable') {
      return undefined;
    }

    const isLocalHost =
      url.hostname === 'localhost' || url.hostname === '127.0.0.1';

    if (isLocalHost && sslmode !== 'require' && sslmode !== 'verify-full') {
      return undefined;
    }
  } catch {
    // Use TLS for non-parseable connection strings (typical hosted providers).
  }

  return { rejectUnauthorized: true };
}

let poolInstance: pg.Pool | undefined;

function createPool(): pg.Pool {
  const databaseUrl = requireDatabaseUrl();

  return new Pool({
    connectionString: databaseUrl,
    ssl: resolveSsl(databaseUrl),
    max: 10,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
  });
}

function getPool(): pg.Pool {
  if (poolInstance === undefined) {
    poolInstance = createPool();
  }

  return poolInstance;
}

/**
 * Lazy pool access for scripts (`connect`, `end`, etc.). The pool is created on
 * first use, not at module import time.
 */
export const pool: pg.Pool = new Proxy({} as pg.Pool, {
  get(_target, prop, receiver) {
    const instance = getPool();
    const value = Reflect.get(instance, prop, receiver);

    if (typeof value === 'function') {
      return value.bind(instance);
    }

    return value;
  },
});

export async function query<T extends pg.QueryResultRow>(
  text: string,
  params?: unknown[],
): Promise<pg.QueryResult<T>> {
  return getPool().query<T>(text, params);
}

/** Verifies that the application can reach PostgreSQL. Safe for dev tooling. */
export async function checkDatabaseConnection(): Promise<void> {
  try {
    await getPool().query('SELECT 1 AS ok');
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unknown database error';
    throw new Error(`Database connection failed: ${message}`);
  }
}
