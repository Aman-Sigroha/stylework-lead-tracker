import { describe, expect, it } from 'vitest';
import {
  discoverMigrations,
  DuplicateMigrationVersionError,
  parseMigrationUpFileName,
} from './migration-files.js';

describe('parseMigrationUpFileName', () => {
  it('parses version and name from an up migration filename', () => {
    expect(parseMigrationUpFileName('001_create_leads.up.sql')).toEqual({
      version: '001',
      name: 'create_leads',
    });
  });
});

describe('discoverMigrations', () => {
  it('sorts migrations by version', () => {
    const migrations = discoverMigrations('/migrations', [
      '002_create_users.up.sql',
      '001_create_leads.up.sql',
    ]);

    expect(migrations.map((migration) => migration.version)).toEqual([
      '001',
      '002',
    ]);
  });

  it('detects duplicate migration versions', () => {
    expect(() =>
      discoverMigrations('/migrations', [
        '001_create_leads.up.sql',
        '001_other_leads.up.sql',
      ]),
    ).toThrow(DuplicateMigrationVersionError);
  });
});
