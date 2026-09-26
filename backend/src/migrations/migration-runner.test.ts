import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { PoolClient } from 'pg';
import {
  bootstrapAppliedMigrationsIfNeeded,
  getPendingMigrations,
  NoAppliedMigrationsError,
  runMigrationsDown,
  runMigrationsUp,
} from './migration-runner.js';
import type { MigrationDefinition } from './migration-types.js';

type SchemaMigrationRow = {
  version: string;
  name: string;
};

class MockMigrationClient {
  schemaMigrations: SchemaMigrationRow[] = [];
  tables = new Set<string>();
  files: Record<string, string> = {};
  failOnSqlContaining: string | null = null;
  transactionDepth = 0;
  rolledBackDuringFailure = false;

  asClient(): PoolClient {
    return {
      query: this.query.bind(this),
      release: vi.fn(),
    } as unknown as PoolClient;
  }

  async query<T extends Record<string, unknown>>(
    text: string,
    params?: unknown[],
  ): Promise<{ rows: T[]; rowCount: number }> {
    const sql = text.trim();

    if (sql === 'BEGIN') {
      this.transactionDepth += 1;
      return { rows: [], rowCount: 0 };
    }

    if (sql === 'COMMIT') {
      this.transactionDepth -= 1;
      return { rows: [], rowCount: 0 };
    }

    if (sql === 'ROLLBACK') {
      this.transactionDepth -= 1;
      this.rolledBackDuringFailure = true;
      return { rows: [], rowCount: 0 };
    }

    if (sql.includes('CREATE TABLE IF NOT EXISTS schema_migrations')) {
      return { rows: [], rowCount: 0 };
    }

    if (
      sql.includes('FROM schema_migrations') &&
      sql.includes('ORDER BY version ASC')
    ) {
      const rows = [...this.schemaMigrations].sort((left, right) =>
        left.version.localeCompare(right.version),
      );
      return { rows: rows as T[], rowCount: rows.length };
    }

    if (
      sql.includes('FROM schema_migrations') &&
      sql.includes('ORDER BY version DESC')
    ) {
      const latest = [...this.schemaMigrations].sort((left, right) =>
        right.version.localeCompare(left.version),
      )[0];
      return {
        rows: latest === undefined ? [] : [latest as T],
        rowCount: latest === undefined ? 0 : 1,
      };
    }

    if (sql.includes('information_schema.tables')) {
      const tableName = String(params?.[0]);
      return {
        rows: [{ exists: this.tables.has(tableName) } as T],
        rowCount: 1,
      };
    }

    if (sql.startsWith('INSERT INTO schema_migrations')) {
      this.schemaMigrations.push({
        version: String(params?.[0]),
        name: String(params?.[1]),
      });
      return { rows: [], rowCount: 1 };
    }

    if (sql.startsWith('DELETE FROM schema_migrations')) {
      const version = String(params?.[0]);
      this.schemaMigrations = this.schemaMigrations.filter(
        (row) => row.version !== version,
      );
      return { rows: [], rowCount: 1 };
    }

    if (
      this.failOnSqlContaining !== null &&
      sql.includes(this.failOnSqlContaining)
    ) {
      throw new Error(`Simulated migration failure: ${this.failOnSqlContaining}`);
    }

    if (sql.includes('CREATE TABLE leads')) {
      this.tables.add('leads');
    }

    if (sql.includes('CREATE TABLE users')) {
      this.tables.add('users');
    }

    if (sql.includes('DROP TABLE users')) {
      this.tables.delete('users');
    }

    if (sql.includes('DROP TABLE leads')) {
      this.tables.delete('leads');
    }

    return { rows: [], rowCount: 0 };
  }
}

const migrations: MigrationDefinition[] = [
  {
    version: '001',
    name: 'create_leads',
    upFileName: '001_create_leads.up.sql',
    downFileName: '001_create_leads.down.sql',
  },
  {
    version: '002',
    name: 'create_users',
    upFileName: '002_create_users.up.sql',
    downFileName: '002_create_users.down.sql',
  },
];

function createFileSystem(mock: MockMigrationClient) {
  return {
    listFiles: () => migrations.map((migration) => migration.upFileName),
    readFile: (filePath: string) => {
      const fileName = filePath.split(/[/\\]/).pop() ?? filePath;
      const sql = mock.files[fileName];

      if (sql === undefined) {
        throw new Error(`Missing file ${fileName}`);
      }

      return sql;
    },
  };
}

describe('migration runner', () => {
  let mock: MockMigrationClient;

  beforeEach(() => {
    mock = new MockMigrationClient();
    mock.files = {
      '001_create_leads.up.sql': 'CREATE TABLE leads (id UUID PRIMARY KEY);',
      '001_create_leads.down.sql': 'DROP TABLE leads;',
      '002_create_users.up.sql': 'CREATE TABLE users (id UUID PRIMARY KEY);',
      '002_create_users.down.sql': 'DROP TABLE users;',
    };
  });

  it('creates schema_migrations and applies pending migrations in order', async () => {
    const result = await runMigrationsUp(
      mock.asClient(),
      '/migrations',
      createFileSystem(mock),
    );

    expect(result.applied).toEqual([
      { version: '001', name: 'create_leads' },
      { version: '002', name: 'create_users' },
    ]);
    expect(mock.schemaMigrations).toEqual([
      { version: '001', name: 'create_leads' },
      { version: '002', name: 'create_users' },
    ]);
    expect(mock.tables.has('leads')).toBe(true);
    expect(mock.tables.has('users')).toBe(true);
  });

  it('skips already applied migrations on subsequent runs', async () => {
    const client = mock.asClient();
    const fileSystem = createFileSystem(mock);

    await runMigrationsUp(client, '/migrations', fileSystem);
    const secondRun = await runMigrationsUp(client, '/migrations', fileSystem);

    expect(secondRun.applied).toEqual([]);
    expect(mock.schemaMigrations).toHaveLength(2);
  });

  it('does not record failed migrations and rolls back the transaction', async () => {
    mock.failOnSqlContaining = 'CREATE TABLE users';

    await expect(
      runMigrationsUp(mock.asClient(), '/migrations', createFileSystem(mock)),
    ).rejects.toThrow('Simulated migration failure');

    expect(mock.schemaMigrations).toEqual([
      { version: '001', name: 'create_leads' },
    ]);
    expect(mock.rolledBackDuringFailure).toBe(true);
    expect(mock.tables.has('users')).toBe(false);
  });

  it('bootstraps history for an existing leads/users schema', async () => {
    mock.tables.add('leads');
    mock.tables.add('users');

    await bootstrapAppliedMigrationsIfNeeded(mock.asClient(), migrations);

    expect(mock.schemaMigrations).toEqual([
      { version: '001', name: 'create_leads' },
      { version: '002', name: 'create_users' },
    ]);
    expect(mock.tables.has('leads')).toBe(true);
    expect(mock.tables.has('users')).toBe(true);
  });

  it('bootstraps only migration 001 when users table is missing', async () => {
    mock.tables.add('leads');

    await bootstrapAppliedMigrationsIfNeeded(mock.asClient(), migrations);

    expect(mock.schemaMigrations).toEqual([
      { version: '001', name: 'create_leads' },
    ]);
  });

  it('detects pending migrations after bootstrap', async () => {
    mock.tables.add('leads');
    await bootstrapAppliedMigrationsIfNeeded(mock.asClient(), migrations);

    const pending = getPendingMigrations(
      migrations,
      mock.schemaMigrations,
    );

    expect(pending).toEqual([
      {
        version: '002',
        name: 'create_users',
        upFileName: '002_create_users.up.sql',
        downFileName: '002_create_users.down.sql',
      },
    ]);
  });

  it('rolls back only the latest applied migration and updates history', async () => {
    const client = mock.asClient();
    const fileSystem = createFileSystem(mock);

    await runMigrationsUp(client, '/migrations', fileSystem);

    const result = await runMigrationsDown(client, '/migrations', fileSystem);

    expect(result.rolledBack).toEqual({
      version: '002',
      name: 'create_users',
    });
    expect(mock.schemaMigrations).toEqual([
      { version: '001', name: 'create_leads' },
    ]);
    expect(mock.tables.has('users')).toBe(false);
    expect(mock.tables.has('leads')).toBe(true);
  });

  it('refuses migrate down when no migrations are applied', async () => {
    await expect(
      runMigrationsDown(mock.asClient(), '/migrations', createFileSystem(mock)),
    ).rejects.toBeInstanceOf(NoAppliedMigrationsError);
  });

  it('reports no pending migrations when history is fully bootstrapped', async () => {
    mock.tables.add('leads');
    mock.tables.add('users');

    const result = await runMigrationsUp(
      mock.asClient(),
      '/migrations',
      createFileSystem(mock),
    );

    expect(result.applied).toEqual([]);
    expect(mock.schemaMigrations).toHaveLength(2);
  });
});
