import 'dotenv/config';
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { pool } from '../config/database.js';
import {
  NoAppliedMigrationsError,
  runMigrationsDown,
  runMigrationsUp,
} from '../migrations/migration-runner.js';

const migrationsDir = join(
  dirname(fileURLToPath(import.meta.url)),
  '../../migrations',
);

const fileSystem = {
  listFiles: (directory: string) => readdirSync(directory),
  readFile: (filePath: string) => readFileSync(filePath, 'utf8'),
};

async function main(): Promise<void> {
  const direction = process.argv[2] === 'down' ? 'down' : 'up';
  const client = await pool.connect();

  try {
    if (direction === 'down') {
      const result = await runMigrationsDown(client, migrationsDir, fileSystem);
      console.log(
        `Rolled back migration ${result.rolledBack.version}_${result.rolledBack.name}`,
      );
      console.log('Migration down completed successfully.');
      return;
    }

    const result = await runMigrationsUp(client, migrationsDir, fileSystem);

    if (result.applied.length === 0) {
      console.log('No pending migrations found.');
    } else {
      for (const migration of result.applied) {
        console.log(`Applied ${migration.version}_${migration.name}...`);
      }
    }

    console.log('Migration up completed successfully.');
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((error: unknown) => {
  if (error instanceof NoAppliedMigrationsError) {
    console.error(error.message);
    process.exit(1);
    return;
  }

  const message =
    error instanceof Error ? error.message : 'Unknown migration error';
  console.error(`Migration failed: ${message}`);
  process.exit(1);
});
