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

describe('GET /api/leads pagination and filters', () => {
  it('uses default page 1 and limit 20 when pagination params are omitted', async () => {
    const response = await authedGet('/api/leads');

    expect(response.status).toBe(200);
    expect(response.body.pagination).toEqual({
      page: 1,
      limit: 20,
      total: 2,
      totalPages: 1,
    });
    expect(queryMock).toHaveBeenCalledWith(
      expect.stringContaining('LIMIT $1'),
      [20, 0],
    );
  });

  it('supports custom page and limit', async () => {
    const response = await authedGet('/api/leads?page=2&limit=1');

    expect(response.status).toBe(200);
    expect(response.body.pagination).toEqual({
      page: 2,
      limit: 1,
      total: 2,
      totalPages: 2,
    });
    expect(response.body.data).toHaveLength(1);
    expect(queryMock).toHaveBeenCalledWith(
      expect.stringContaining('OFFSET $2'),
      [1, 1],
    );
  });

  it('returns 400 when limit exceeds the maximum', async () => {
    const response = await authedGet('/api/leads?limit=101');

    expect(response.status).toBe(400);
    expect(response.body.error.message).toBe('Validation failed');
  });

  it('returns 400 for invalid page values', async () => {
    const response = await authedGet('/api/leads?page=0');

    expect(response.status).toBe(400);
    expect(response.body.error.message).toBe('Validation failed');
  });

  it('returns an empty page when page is beyond total pages', async () => {
    const response = await authedGet('/api/leads?page=99&limit=20');

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual([]);
    expect(response.body.pagination).toEqual({
      page: 99,
      limit: 20,
      total: 2,
      totalPages: 1,
    });
  });

  it('returns total count from COUNT(*) with the same filters', async () => {
    queryMock.mockImplementation(async (text: string, params?: unknown[]) => {
      if (text.includes('COUNT(*)')) {
        expect(text).toContain("status = $1");
        expect(params).toEqual(['qualified']);
        return { rows: [{ count: '5' }], rowCount: 1 };
      }

      return {
        rows: [createMockLeadRow({ status: 'qualified' })],
        rowCount: 1,
      };
    });

    const response = await authedGet('/api/leads?status=qualified');

    expect(response.status).toBe(200);
    expect(response.body.pagination.total).toBe(5);
    expect(response.body.pagination.totalPages).toBe(1);
  });

  it('filters by status', async () => {
    await authedGet('/api/leads?status=contacted');

    expect(queryMock).toHaveBeenCalledWith(
      expect.stringMatching(/WHERE status = \$1[\s\S]*LIMIT \$2/),
      ['contacted', 20, 0],
    );
  });

  it('filters by createdFrom', async () => {
    await authedGet('/api/leads?createdFrom=2026-03-01');

    expect(queryMock).toHaveBeenCalledWith(
      expect.stringContaining('created_at >= $1::timestamptz'),
      ['2026-03-01T00:00:00.000Z', 20, 0],
    );
  });

  it('filters by createdTo inclusively', async () => {
    await authedGet('/api/leads?createdTo=2026-03-31');

    expect(queryMock).toHaveBeenCalledWith(
      expect.stringContaining(
        "created_at < ($1::date + INTERVAL '1 day')",
      ),
      ['2026-03-31', 20, 0],
    );
  });

  it('filters by createdFrom and createdTo together', async () => {
    await authedGet(
      '/api/leads?createdFrom=2026-03-01&createdTo=2026-03-31',
    );

    expect(queryMock).toHaveBeenCalledWith(
      expect.stringMatching(
        /created_at >= \$1::timestamptz[\s\S]*created_at < \(\$2::date \+ INTERVAL '1 day'\)/,
      ),
      ['2026-03-01T00:00:00.000Z', '2026-03-31', 20, 0],
    );
  });

  it('returns 400 for invalid date values', async () => {
    const response = await authedGet('/api/leads?createdFrom=03-01-2026');

    expect(response.status).toBe(400);
    expect(response.body.error.message).toBe('Validation failed');
  });

  it('returns 400 when createdFrom is after createdTo', async () => {
    const response = await authedGet(
      '/api/leads?createdFrom=2026-03-31&createdTo=2026-03-01',
    );

    expect(response.status).toBe(400);
    expect(response.body.error.message).toBe('Validation failed');
  });

  it('combines search with filters', async () => {
    await authedGet(
      '/api/leads?search=jane&searchBy=name&status=new',
    );

    expect(queryMock).toHaveBeenCalledWith(
      expect.stringMatching(
        /WHERE name ILIKE \$1 AND status = \$2[\s\S]*LIMIT \$3/,
      ),
      ['%jane%', 'new', 20, 0],
    );
  });

  it('combines filters with sorting', async () => {
    await authedGet(
      '/api/leads?status=qualified&sortBy=email&sortOrder=asc',
    );

    expect(queryMock).toHaveBeenCalledWith(
      expect.stringMatching(
        /WHERE status = \$1[\s\S]*ORDER BY email ASC, created_at DESC[\s\S]*LIMIT \$2/,
      ),
      ['qualified', 20, 0],
    );
  });

  it('combines pagination with sorting', async () => {
    await authedGet(
      '/api/leads?page=2&limit=10&sortBy=status&sortOrder=desc',
    );

    expect(queryMock).toHaveBeenCalledWith(
      expect.stringMatching(
        /ORDER BY CASE status[\s\S]*LIMIT \$1[\s\S]*OFFSET \$2/,
      ),
      [10, 10],
    );
  });

  it('combines pagination with search', async () => {
    await authedGet('/api/leads?search=555&searchBy=phone&page=3&limit=5');

    expect(queryMock).toHaveBeenCalledWith(
      expect.stringMatching(
        /COALESCE\(phone, ''\) ILIKE \$1[\s\S]*LIMIT \$2[\s\S]*OFFSET \$3/,
      ),
      ['%555%', 5, 10],
    );
  });

  it('combines search, filters, sorting, and pagination', async () => {
    await authedGet(
      '/api/leads?search=jane&searchBy=email&status=contacted&createdFrom=2026-03-01&createdTo=2026-03-31&sortBy=name&sortOrder=asc&page=2&limit=15',
    );

    expect(queryMock).toHaveBeenCalledWith(
      expect.stringMatching(
        /email ILIKE \$1[\s\S]*status = \$2[\s\S]*created_at >= \$3::timestamptz[\s\S]*created_at < \(\$4::date \+ INTERVAL '1 day'\)[\s\S]*ORDER BY name ASC, created_at DESC[\s\S]*LIMIT \$5[\s\S]*OFFSET \$6/,
      ),
      [
        '%jane%',
        'contacted',
        '2026-03-01T00:00:00.000Z',
        '2026-03-31',
        15,
        15,
      ],
    );
  });
});
