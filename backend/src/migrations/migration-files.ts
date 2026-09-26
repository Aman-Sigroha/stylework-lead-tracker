import { join } from 'node:path';
import type { MigrationDefinition } from './migration-types.js';

const UP_FILE_PATTERN = /^(\d+)_(.+)\.up\.sql$/;

export class DuplicateMigrationVersionError extends Error {
  constructor(version: string) {
    super(`Duplicate migration version detected: ${version}`);
    this.name = 'DuplicateMigrationVersionError';
  }
}

export function parseMigrationUpFileName(
  fileName: string,
): { version: string; name: string } | null {
  const match = UP_FILE_PATTERN.exec(fileName);

  if (match === null) {
    return null;
  }

  const version = match[1];
  const name = match[2];

  if (version === undefined || name === undefined) {
    return null;
  }

  return {
    version,
    name,
  };
}

export function discoverMigrations(
  migrationsDir: string,
  fileNames: string[],
): MigrationDefinition[] {
  const migrations = new Map<string, MigrationDefinition>();

  for (const fileName of fileNames) {
    const parsed = parseMigrationUpFileName(fileName);

    if (parsed === null) {
      continue;
    }

    if (migrations.has(parsed.version)) {
      throw new DuplicateMigrationVersionError(parsed.version);
    }

    migrations.set(parsed.version, {
      version: parsed.version,
      name: parsed.name,
      upFileName: fileName,
      downFileName: `${parsed.version}_${parsed.name}.down.sql`,
    });
  }

  return [...migrations.values()].sort((left, right) =>
    left.version.localeCompare(right.version),
  );
}

export function listMigrationDefinitions(
  migrationsDir: string,
  listFiles: (directory: string) => string[],
): MigrationDefinition[] {
  const fileNames = listFiles(migrationsDir);
  return discoverMigrations(migrationsDir, fileNames);
}

export function resolveMigrationFilePath(
  migrationsDir: string,
  fileName: string,
): string {
  return join(migrationsDir, fileName);
}
