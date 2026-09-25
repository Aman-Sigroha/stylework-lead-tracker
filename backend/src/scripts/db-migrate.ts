import 'dotenv/config';
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { pool } from '../config/database.js';

const migrationsDir = join(
  dirname(fileURLToPath(import.meta.url)),
  '../../migrations',
);

async function runMigrations(direction: 'up' | 'down'): Promise<void> {
  const suffix = direction === 'up' ? '.up.sql' : '.down.sql';
  const files = readdirSync(migrationsDir)
    .filter((file) => file.endsWith(suffix))
    .sort();

  if (files.length === 0) {
    console.log(`No ${direction} migrations found.`);
    return;
  }

  const client = await pool.connect();

  try {
    for (const file of files) {
      const sql = readFileSync(join(migrationsDir, file), 'utf8');
      console.log(`Applying ${file}...`);
      await client.query('BEGIN');
      try {
        await client.query(sql);
        await client.query('COMMIT');
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      }
    }

    console.log(`Migration ${direction} completed successfully.`);
  } finally {
    client.release();
    await pool.end();
  }
}

const direction = process.argv[2] === 'down' ? 'down' : 'up';

runMigrations(direction).catch((error: unknown) => {
  const message =
    error instanceof Error ? error.message : 'Unknown migration error';
  console.error(`Migration failed: ${message}`);
  process.exit(1);
});
