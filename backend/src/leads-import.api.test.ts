import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.hoisted(() => {
  process.env.JWT_SECRET = 'test-jwt-secret-for-vitest';
});

const { queryMock, connectMock, clientQueryMock } = vi.hoisted(() => ({
  queryMock: vi.fn(),
  connectMock: vi.fn(),
  clientQueryMock: vi.fn(),
}));

vi.mock('./config/database.js', () => ({
  query: queryMock,
  pool: {
    connect: connectMock,
  },
  checkDatabaseConnection: vi.fn(),
}));

import request from 'supertest';
import { createApp } from './app.js';
import { LEAD_IMPORT_MAX_FILE_SIZE_BYTES } from './constants/lead-import.js';
import {
  createMockLeadRow,
  installDefaultQueryMock,
} from './test/mock-query.js';
import { createAuthCookieHeader } from './test/auth-test-helpers.js';

const app = createApp();
const authCookie = createAuthCookieHeader();

const validCsvHeader = 'name,email,phone,status\n';

function authedPost(path: string) {
  return request(app).post(path).set('Cookie', authCookie);
}

beforeEach(() => {
  vi.clearAllMocks();
  installDefaultQueryMock(queryMock);
  connectMock.mockResolvedValue({
    query: clientQueryMock,
    release: vi.fn(),
  });
  clientQueryMock.mockImplementation(async (text: string) => {
    if (text === 'BEGIN' || text === 'COMMIT' || text === 'ROLLBACK') {
      return { rows: [], rowCount: 0 };
    }

    if (text.includes('INSERT INTO leads')) {
      return {
        rows: [createMockLeadRow()],
        rowCount: 1,
      };
    }

    return { rows: [], rowCount: 0 };
  });
});

describe('POST /api/leads/import/preview', () => {
  it('returns 401 when unauthenticated', async () => {
    const response = await request(app)
      .post('/api/leads/import/preview')
      .attach('file', Buffer.from(`${validCsvHeader}Jane,jane@example.com,,new`), 'leads.csv');

    expect(response.status).toBe(401);
    expect(response.body.error.message).toBe('Authentication required');
  });

  it('returns 400 when the file is missing', async () => {
    const response = await authedPost('/api/leads/import/preview');

    expect(response.status).toBe(400);
    expect(response.body.error.message).toBe('CSV file is required');
  });

  it('rejects unsupported file types', async () => {
    const response = await authedPost('/api/leads/import/preview').attach(
      'file',
      Buffer.from('not csv'),
      'notes.txt',
    );

    expect(response.status).toBe(400);
    expect(response.body.error.message).toContain('Unsupported file type');
  });

  it('rejects files that exceed the size limit', async () => {
    const oversized = Buffer.alloc(LEAD_IMPORT_MAX_FILE_SIZE_BYTES + 1, 'a');
    const response = await authedPost('/api/leads/import/preview').attach(
      'file',
      oversized,
      'leads.csv',
    );

    expect(response.status).toBe(400);
    expect(response.body.error.message).toBe('CSV file is too large');
  });

  it('returns 400 for malformed CSV', async () => {
    const response = await authedPost('/api/leads/import/preview').attach(
      'file',
      Buffer.from('"unclosed'),
      'leads.csv',
    );

    expect(response.status).toBe(400);
    expect(response.body.error.message).toBe('Malformed CSV file');
  });

  it('returns 400 when required columns are missing', async () => {
    const response = await authedPost('/api/leads/import/preview').attach(
      'file',
      Buffer.from('name,email\nJane,jane@example.com'),
      'leads.csv',
    );

    expect(response.status).toBe(400);
    expect(response.body.error.message).toContain('Missing required column');
  });

  it('reports row-level validation errors and valid leads', async () => {
    const csv = `${validCsvHeader}Jane Doe,jane@example.com,,new\n,bad-email,,new\nBob,bob@example.com,,qualified`;
    const response = await authedPost('/api/leads/import/preview').attach(
      'file',
      Buffer.from(csv),
      'leads.csv',
    );

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.totalRows).toBe(3);
    expect(response.body.data.validRows).toBe(2);
    expect(response.body.data.invalidRows).toBe(1);
    expect(response.body.data.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          row: 3,
          field: 'name',
          message: 'Name is required',
        }),
      ]),
    );
    expect(response.body.data.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          row: 3,
          field: 'email',
          message: 'Invalid email address',
        }),
      ]),
    );
    expect(response.body.data.validLeads).toHaveLength(2);
    expect(response.body.data.validLeads[0]).toEqual({
      name: 'Jane Doe',
      email: 'jane@example.com',
      status: 'new',
    });
  });

  it('treats blank phone as null and defaults status to new', async () => {
    const response = await authedPost('/api/leads/import/preview').attach(
      'file',
      Buffer.from(`${validCsvHeader}Jane,jane@example.com,,`),
      'leads.csv',
    );

    expect(response.status).toBe(200);
    expect(response.body.data.validLeads[0]).toEqual({
      name: 'Jane',
      email: 'jane@example.com',
      status: 'new',
    });
    expect(response.body.data.validLeads[0].phone).toBeUndefined();
  });

  it('rejects invalid status values', async () => {
    const response = await authedPost('/api/leads/import/preview').attach(
      'file',
      Buffer.from(`${validCsvHeader}Jane,jane@example.com,,archived`),
      'leads.csv',
    );

    expect(response.status).toBe(200);
    expect(response.body.data.validRows).toBe(0);
    expect(response.body.data.errors[0]).toMatchObject({
      row: 2,
      field: 'status',
    });
  });
});

describe('POST /api/leads/import/confirm', () => {
  it('returns 401 when unauthenticated', async () => {
    const response = await request(app)
      .post('/api/leads/import/confirm')
      .send({
        leads: [{ name: 'Jane', email: 'jane@example.com', status: 'new' }],
      });

    expect(response.status).toBe(401);
  });

  it('imports valid leads inside a transaction', async () => {
    const response = await authedPost('/api/leads/import/confirm')
      .send({
        leads: [
          { name: 'Jane', email: 'jane@example.com', status: 'new' },
          { name: 'Bob', email: 'bob@example.com', status: 'contacted' },
        ],
      });

    expect(response.status).toBe(201);
    expect(response.body.data.importedCount).toBe(2);
    expect(clientQueryMock).toHaveBeenCalledWith('BEGIN');
    expect(clientQueryMock).toHaveBeenCalledWith('COMMIT');
    expect(clientQueryMock.mock.calls.filter(([text]) =>
      String(text).includes('INSERT INTO leads'),
    )).toHaveLength(2);
  });

  it('rolls back when a database insert fails', async () => {
    let insertCount = 0;
    clientQueryMock.mockImplementation(async (text: string) => {
      if (text === 'BEGIN' || text === 'ROLLBACK') {
        return { rows: [], rowCount: 0 };
      }

      if (text === 'COMMIT') {
        return { rows: [], rowCount: 0 };
      }

      if (text.includes('INSERT INTO leads')) {
        insertCount += 1;
        if (insertCount === 2) {
          throw new Error('Simulated database failure');
        }

        return {
          rows: [createMockLeadRow()],
          rowCount: 1,
        };
      }

      return { rows: [], rowCount: 0 };
    });

    const response = await authedPost('/api/leads/import/confirm').send({
      leads: [
        { name: 'Jane', email: 'jane@example.com', status: 'new' },
        { name: 'Bob', email: 'bob@example.com', status: 'new' },
      ],
    });

    expect(response.status).toBe(500);
    expect(clientQueryMock).toHaveBeenCalledWith('ROLLBACK');
    expect(clientQueryMock).not.toHaveBeenCalledWith('COMMIT');
  });
});
