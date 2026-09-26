import { beforeEach, describe, expect, it, vi } from 'vitest';

const { queryMock, connectMock, clientQueryMock } = vi.hoisted(() => ({
  queryMock: vi.fn(),
  connectMock: vi.fn(),
  clientQueryMock: vi.fn(),
}));

vi.mock('../config/database.js', () => ({
  query: queryMock,
  pool: {
    connect: connectMock,
  },
}));

import {
  confirmLeadImport,
  previewLeadImportFromCsv,
} from './lead-import.service.js';

const header = 'name,email,phone,status\n';

beforeEach(() => {
  vi.clearAllMocks();
  queryMock.mockResolvedValue({ rows: [], rowCount: 0 });
});

describe('previewLeadImportFromCsv duplicate detection', () => {
  it('flags duplicate emails within the same CSV', async () => {
    const csv = `${header}John,john@example.com,,new\nJane,JOHN@example.com,,new`;
    const preview = await previewLeadImportFromCsv(Buffer.from(csv));

    expect(preview.validRows).toBe(1);
    expect(preview.duplicateRows).toBe(1);
    expect(preview.errors).toContainEqual({
      row: 3,
      field: 'email',
      type: 'duplicate',
      message: 'Email already exists in this import',
      email: 'JOHN@example.com',
    });
  });

  it('flags duplicates against existing database emails case-insensitively', async () => {
    queryMock.mockResolvedValue({
      rows: [{ normalized_email: 'john@example.com' }],
      rowCount: 1,
    });

    const preview = await previewLeadImportFromCsv(
      Buffer.from(`${header}John,  JOHN@Example.com  ,,new`),
    );

    expect(preview.validRows).toBe(0);
    expect(preview.duplicateRows).toBe(1);
    expect(preview.errors[0]).toMatchObject({
      row: 2,
      type: 'duplicate',
      message: 'Email already exists',
    });
    expect(queryMock).toHaveBeenCalledWith(
      expect.stringContaining('lower(trim(email))'),
      [['john@example.com']],
    );
  });

  it('separates valid, duplicate, and invalid row counts', async () => {
    queryMock.mockResolvedValue({
      rows: [{ normalized_email: 'exists@example.com' }],
      rowCount: 1,
    });

    const csv = `${header}Good,good@example.com,,new\nDup,good@example.com,,new\nExists,exists@example.com,,new\n,bad-email,,new`;
    const preview = await previewLeadImportFromCsv(Buffer.from(csv));

    expect(preview.totalRows).toBe(4);
    expect(preview.validRows).toBe(1);
    expect(preview.duplicateRows).toBe(2);
    expect(preview.invalidRows).toBe(1);
  });
});

describe('confirmLeadImport duplicate re-check', () => {
  it('skips leads that became duplicates before insert', async () => {
    connectMock.mockResolvedValue({
      query: clientQueryMock,
      release: vi.fn(),
    });

    clientQueryMock.mockImplementation(async (text: string) => {
      if (text === 'BEGIN' || text === 'COMMIT') {
        return { rows: [], rowCount: 0 };
      }

      if (text.includes('lower(trim(email))')) {
        return {
          rows: [{ normalized_email: 'john@example.com' }],
          rowCount: 1,
        };
      }

      if (text.includes('INSERT INTO leads')) {
        return {
          rows: [
            {
              id: '1',
              name: 'Bob',
              email: 'bob@example.com',
              phone: null,
              status: 'new',
              created_at: new Date(),
              updated_at: new Date(),
            },
          ],
          rowCount: 1,
        };
      }

      return { rows: [], rowCount: 0 };
    });

    const result = await confirmLeadImport([
      { name: 'John', email: 'john@example.com', status: 'new' },
      { name: 'Bob', email: 'bob@example.com', status: 'new' },
    ]);

    expect(result.importedCount).toBe(1);
    expect(
      clientQueryMock.mock.calls.filter(([text]) =>
        String(text).includes('INSERT INTO leads'),
      ),
    ).toHaveLength(1);
  });
});
