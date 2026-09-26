import type { PoolClient } from 'pg';
import {
  listMigrationDefinitions,
  resolveMigrationFilePath,
} from './migration-files.js';
import type {
  AppliedMigration,
  MigrationDefinition,
  MigrationRunnerFileSystem,
} from './migration-types.js';

export const SCHEMA_MIGRATIONS_TABLE = 'schema_migrations';

const CREATE_SCHEMA_MIGRATIONS_SQL = `
CREATE TABLE IF NOT EXISTS schema_migrations (
  version VARCHAR(32) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
`;

const BOOTSTRAP_TABLE_CHECKS: Record<string, string> = {
  '001': 'leads',
  '002': 'users',
};

export class NoAppliedMigrationsError extends Error {
  constructor() {
    super('No applied migrations to roll back');
    this.name = 'NoAppliedMigrationsError';
  }
}

export class MissingMigrationFileError extends Error {
  constructor(fileName: string) {
    super(`Missing migration file: ${fileName}`);
    this.name = 'MissingMigrationFileError';
  }
}

async function runInTransaction(
  client: PoolClient,
  action: () => Promise<void>,
): Promise<void> {
  await client.query('BEGIN');

  try {
    await action();
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  }
}

async function ensureSchemaMigrationsTable(client: PoolClient): Promise<void> {
  await client.query(CREATE_SCHEMA_MIGRATIONS_SQL);
}

async function getAppliedMigrations(
  client: PoolClient,
): Promise<AppliedMigration[]> {
  const result = await client.query<AppliedMigration>(
    `SELECT version, name
     FROM schema_migrations
     ORDER BY version ASC`,
  );

  return result.rows;
}

async function tableExists(
  client: PoolClient,
  tableName: string,
): Promise<boolean> {
  const result = await client.query<{ exists: boolean }>(
    `SELECT EXISTS (
       SELECT 1
       FROM information_schema.tables
       WHERE table_schema = 'public'
         AND table_name = $1
     ) AS exists`,
    [tableName],
  );

  return result.rows[0]?.exists === true;
}

/**
 * When schema_migrations has no rows but legacy databases already contain
 * objects from earlier manual migrations, record only migrations whose
 * expected public tables are present.
 */
export async function bootstrapAppliedMigrationsIfNeeded(
  client: PoolClient,
  migrations: MigrationDefinition[],
): Promise<void> {
  const applied = await getAppliedMigrations(client);

  if (applied.length > 0) {
    return;
  }

  const bootstrapped: AppliedMigration[] = [];

  for (const migration of migrations) {
    const tableName = BOOTSTRAP_TABLE_CHECKS[migration.version];

    if (tableName === undefined) {
      continue;
    }

    if (await tableExists(client, tableName)) {
      bootstrapped.push({
        version: migration.version,
        name: migration.name,
      });
    }
  }

  if (bootstrapped.length === 0) {
    return;
  }

  await runInTransaction(client, async () => {
    for (const migration of bootstrapped) {
      await client.query(
        `INSERT INTO schema_migrations (version, name)
         VALUES ($1, $2)`,
        [migration.version, migration.name],
      );
    }
  });
}

export function getPendingMigrations(
  migrations: MigrationDefinition[],
  applied: AppliedMigration[],
): MigrationDefinition[] {
  const appliedVersions = new Set(applied.map((migration) => migration.version));

  return migrations.filter(
    (migration) => !appliedVersions.has(migration.version),
  );
}

export type RunMigrationsUpResult = {
  applied: AppliedMigration[];
  skipped: AppliedMigration[];
};

export async function runMigrationsUp(
  client: PoolClient,
  migrationsDir: string,
  fileSystem: MigrationRunnerFileSystem,
): Promise<RunMigrationsUpResult> {
  await ensureSchemaMigrationsTable(client);

  const migrations = listMigrationDefinitions(
    migrationsDir,
    fileSystem.listFiles,
  );
  await bootstrapAppliedMigrationsIfNeeded(client, migrations);
  const appliedBefore = await getAppliedMigrations(client);
  const pending = getPendingMigrations(migrations, appliedBefore);
  const appliedNow: AppliedMigration[] = [];

  for (const migration of pending) {
    const sql = fileSystem.readFile(
      resolveMigrationFilePath(migrationsDir, migration.upFileName),
    );

    await runInTransaction(client, async () => {
      await client.query(sql);
      await client.query(
        `INSERT INTO schema_migrations (version, name)
         VALUES ($1, $2)`,
        [migration.version, migration.name],
      );
    });

    appliedNow.push({
      version: migration.version,
      name: migration.name,
    });
  }

  return {
    applied: appliedNow,
    skipped: appliedBefore,
  };
}

export type RunMigrationsDownResult = {
  rolledBack: AppliedMigration;
};

export async function runMigrationsDown(
  client: PoolClient,
  migrationsDir: string,
  fileSystem: MigrationRunnerFileSystem,
): Promise<RunMigrationsDownResult> {
  await ensureSchemaMigrationsTable(client);

  const latestResult = await client.query<AppliedMigration>(
    `SELECT version, name
     FROM schema_migrations
     ORDER BY version DESC
     LIMIT 1`,
  );

  const latest = latestResult.rows[0];

  if (latest === undefined) {
    throw new NoAppliedMigrationsError();
  }

  const migrations = listMigrationDefinitions(
    migrationsDir,
    fileSystem.listFiles,
  );
  const migration = migrations.find(
    (candidate) => candidate.version === latest.version,
  );

  if (migration === undefined) {
    throw new MissingMigrationFileError(
      `${latest.version}_${latest.name}.down.sql`,
    );
  }

  const sql = fileSystem.readFile(
    resolveMigrationFilePath(migrationsDir, migration.downFileName),
  );

  await runInTransaction(client, async () => {
    await client.query(sql);
    await client.query(`DELETE FROM schema_migrations WHERE version = $1`, [
      latest.version,
    ]);
  });

  return {
    rolledBack: latest,
  };
}
