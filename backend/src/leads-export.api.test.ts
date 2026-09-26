import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.hoisted(() => {
  process.env.JWT_SECRET = 'test-jwt-secret-for-vitest';
});

const { queryMock } = vi.hoisted(() => ({
  queryMock: vi.fn(),
}));

vi.mock('./config/database.js', () => ({
  query: queryMock,
  pool: {},
  checkDatabaseConnection: vi.fn(),
}));

import request from 'supertest';
import { createApp } from './app.js';
import {
  createMockLeadRow,
  installDefaultQueryMock,
  LEAD_ID,
} from './test/mock-query.js';
import { createAuthCookieHeader } from './test/auth-test-helpers.js';

const app = createApp();
const authCookie = createAuthCookieHeader();

function authedGet(path: string) {
  return request(app).get(path).set('Cookie', authCookie);
}

beforeEach(() => {
  installDefaultQueryMock(queryMock);
});

describe('GET /api/leads/export.csv', () => {
  it('returns 401 when unauthenticated', async () => {
    const response = await request(app).get('/api/leads/export.csv');

    expect(response.status).toBe(401);
    expect(response.body.error.message).toBe('Authentication required');
  });

  it('returns CSV for authenticated requests', async () => {
    const response = await authedGet('/api/leads/export.csv');

    expect(response.status).toBe(200);
    expect(response.text).toContain('id,name,email,phone,status,createdAt,updatedAt');
  });

  it('sets the CSV Content-Type', async () => {
    const response = await authedGet('/api/leads/export.csv');

    expect(response.headers['content-type']).toContain('text/csv');
    expect(response.headers['content-type']).toContain('charset=utf-8');
  });

  it('sets a Content-Disposition attachment filename', async () => {
    const response = await authedGet('/api/leads/export.csv');

    expect(response.headers['content-disposition']).toMatch(
      /attachment; filename="leads-\d{4}-\d{2}-\d{2}\.csv"/,
    );
  });

  it('exports one lead row', async () => {
    queryMock.mockImplementation(async (text: string) => {
      if (text.includes('COUNT(*)')) {
        return { rows: [{ count: '1' }], rowCount: 1 };
      }

      return {
        rows: [createMockLeadRow()],
        rowCount: 1,
      };
    });

    const response = await authedGet('/api/leads/export.csv');

    expect(response.text).toContain('Jane Doe');
    expect(response.text).toContain('jane@example.com');
  });

  it('exports multiple lead rows', async () => {
    queryMock.mockImplementation(async (text: string) => {
      if (text.includes('LIMIT')) {
        throw new Error('export should not paginate');
      }

      return {
        rows: [
          createMockLeadRow(),
          createMockLeadRow({
            id: '660e8400-e29b-41d4-a716-446655440001',
            name: 'John Smith',
            email: 'john@example.com',
          }),
        ],
        rowCount: 2,
      };
    });

    const response = await authedGet('/api/leads/export.csv');
    const lines = response.text.trim().split('\n');

    expect(lines).toHaveLength(3);
    expect(response.text).toContain('John Smith');
  });

  it('does not include LIMIT or OFFSET in the export query', async () => {
    await authedGet('/api/leads/export.csv');

    const exportQuery = queryMock.mock.calls.find(([text]) =>
      String(text).includes('FROM leads') &&
      !String(text).includes('COUNT(*)'),
    );

    expect(exportQuery).toBeDefined();
    expect(String(exportQuery?.[0])).not.toMatch(/LIMIT/i);
    expect(String(exportQuery?.[0])).not.toMatch(/OFFSET/i);
  });

  it('applies search and searchBy filters', async () => {
    await authedGet('/api/leads/export.csv?search=jane&searchBy=name');

    expect(queryMock).toHaveBeenCalledWith(
      expect.stringContaining('WHERE name ILIKE $1'),
      ['%jane%'],
    );
  });

  it('applies status filter', async () => {
    await authedGet('/api/leads/export.csv?status=qualified');

    expect(queryMock).toHaveBeenCalledWith(
      expect.stringMatching(/WHERE status = \$1/),
      ['qualified'],
    );
  });

  it('applies date filters', async () => {
    await authedGet(
      '/api/leads/export.csv?createdFrom=2026-03-01&createdTo=2026-03-31',
    );

    expect(queryMock).toHaveBeenCalledWith(
      expect.stringMatching(
        /created_at >= \$1::timestamptz[\s\S]*created_at < \(\$2::date \+ INTERVAL '1 day'\)/,
      ),
      ['2026-03-01T00:00:00.000Z', '2026-03-31'],
    );
  });

  it('applies sorting', async () => {
    await authedGet('/api/leads/export.csv?sortBy=email&sortOrder=asc');

    expect(queryMock).toHaveBeenCalledWith(
      expect.stringMatching(/ORDER BY email ASC, created_at DESC/),
      [],
    );
  });

  it('applies status workflow sorting', async () => {
    await authedGet('/api/leads/export.csv?sortBy=status&sortOrder=asc');

    expect(queryMock).toHaveBeenCalledWith(
      expect.stringMatching(
        /ORDER BY CASE status[\s\S]*WHEN 'new' THEN 1[\s\S]*END ASC, created_at DESC/,
      ),
      [],
    );
  });

  it('combines all filters and sorting', async () => {
    await authedGet(
      '/api/leads/export.csv?search=jane&searchBy=email&status=contacted&createdFrom=2026-03-01&createdTo=2026-03-31&sortBy=name&sortOrder=desc',
    );

    expect(queryMock).toHaveBeenCalledWith(
      expect.stringMatching(
        /email ILIKE \$1[\s\S]*status = \$2[\s\S]*ORDER BY name DESC, created_at DESC/,
      ),
      ['%jane%', 'contacted', '2026-03-01T00:00:00.000Z', '2026-03-31'],
    );
  });

  it('escapes commas and quotes in CSV output', async () => {
    queryMock.mockImplementation(async () => ({
      rows: [
        createMockLeadRow({
          name: 'Acme, Inc.',
          email: 'say"hello"@example.com',
        }),
      ],
      rowCount: 1,
    }));

    const response = await authedGet('/api/leads/export.csv');

    expect(response.text).toContain('"Acme, Inc."');
    expect(response.text).toContain('"say""hello""@example.com"');
  });

  it('handles null phone values in CSV output', async () => {
    queryMock.mockImplementation(async () => ({
      rows: [createMockLeadRow({ phone: null })],
      rowCount: 1,
    }));

    const response = await authedGet('/api/leads/export.csv');

    expect(response.text).toContain(
      `${LEAD_ID},Jane Doe,jane@example.com,,new,`,
    );
  });
});
