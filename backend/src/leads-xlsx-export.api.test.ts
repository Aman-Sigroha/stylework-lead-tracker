import ExcelJS from 'exceljs';
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
import {
  LEADS_XLSX_COLUMN_WIDTHS,
  LEADS_XLSX_HEADERS,
  LEADS_XLSX_SHEET_NAME,
} from './utils/xlsx.js';

const app = createApp();
const authCookie = createAuthCookieHeader();

function authedGet(path: string) {
  return request(app)
    .get(path)
    .set('Cookie', authCookie)
    .buffer(true)
    .parse((res, callback) => {
      const chunks: Buffer[] = [];
      res.on('data', (chunk: Buffer) => {
        chunks.push(chunk);
      });
      res.on('end', () => {
        callback(null, Buffer.concat(chunks));
      });
    });
}

async function loadWorkbookFromResponse(body: Buffer) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(body);
  return workbook;
}

beforeEach(() => {
  installDefaultQueryMock(queryMock);
});

describe('GET /api/leads/export.xlsx', () => {
  it('returns 401 when unauthenticated', async () => {
    const response = await request(app).get('/api/leads/export.xlsx');

    expect(response.status).toBe(401);
    expect(response.body.error.message).toBe('Authentication required');
  });

  it('returns 200 for authenticated export', async () => {
    const response = await authedGet('/api/leads/export.xlsx');

    expect(response.status).toBe(200);
  });

  it('sets the XLSX content type', async () => {
    const response = await authedGet('/api/leads/export.xlsx');

    expect(response.headers['content-type']).toBe(
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
  });

  it('sets a Content-Disposition attachment filename', async () => {
    const response = await authedGet('/api/leads/export.xlsx');

    expect(response.headers['content-disposition']).toMatch(
      /attachment; filename="leads-\d{4}-\d{2}-\d{2}\.xlsx"/,
    );
  });

  it('returns a workbook that can be parsed with the expected sheet and headers', async () => {
    const response = await authedGet('/api/leads/export.xlsx');
    const workbook = await loadWorkbookFromResponse(response.body);
    const worksheet = workbook.getWorksheet(LEADS_XLSX_SHEET_NAME);

    expect(worksheet).toBeDefined();
    expect(worksheet?.getRow(1).values).toEqual([
      undefined,
      ...LEADS_XLSX_HEADERS,
    ]);
  });

  it('exports lead rows with blank phone cells for null phone', async () => {
    queryMock.mockImplementation(async () => ({
      rows: [
        createMockLeadRow(),
        createMockLeadRow({ phone: null, name: 'No Phone' }),
      ],
      rowCount: 2,
    }));

    const response = await authedGet('/api/leads/export.xlsx');
    const worksheet = (await loadWorkbookFromResponse(response.body)).getWorksheet(
      LEADS_XLSX_SHEET_NAME,
    );

    expect(worksheet?.getRow(2).getCell(1).value).toBe(LEAD_ID);
    expect(worksheet?.getRow(2).getCell(2).value).toBe('Jane Doe');
    expect(worksheet?.getRow(3).getCell(4).value).toBe('');
  });

  it('sets column widths, freeze panes, and autofilter', async () => {
    const response = await authedGet('/api/leads/export.xlsx');
    const worksheet = (await loadWorkbookFromResponse(response.body)).getWorksheet(
      LEADS_XLSX_SHEET_NAME,
    );

    LEADS_XLSX_COLUMN_WIDTHS.forEach((width, index) => {
      expect(worksheet?.getColumn(index + 1).width).toBe(width);
    });
    expect(worksheet?.views?.[0]?.ySplit).toBe(1);
    expect(worksheet?.autoFilter).toBeDefined();
  });

  it('does not include LIMIT or OFFSET in the export query', async () => {
    await authedGet('/api/leads/export.xlsx');

    const exportQuery = queryMock.mock.calls.find(([text]) =>
      String(text).includes('FROM leads') &&
      !String(text).includes('COUNT(*)'),
    );

    expect(exportQuery).toBeDefined();
    expect(String(exportQuery?.[0])).not.toMatch(/LIMIT/i);
    expect(String(exportQuery?.[0])).not.toMatch(/OFFSET/i);
  });

  it('applies status filter', async () => {
    await authedGet('/api/leads/export.xlsx?status=qualified');

    expect(queryMock).toHaveBeenCalledWith(
      expect.stringMatching(/WHERE status = \$1/),
      ['qualified'],
    );
  });

  it('applies search, date filters, and sorting together', async () => {
    await authedGet(
      '/api/leads/export.xlsx?search=jane&searchBy=email&status=contacted&createdFrom=2026-03-01&createdTo=2026-03-31&sortBy=name&sortOrder=desc',
    );

    expect(queryMock).toHaveBeenCalledWith(
      expect.stringMatching(
        /email ILIKE \$1[\s\S]*status = \$2[\s\S]*ORDER BY name DESC, created_at DESC/,
      ),
      ['%jane%', 'contacted', '2026-03-01T00:00:00.000Z', '2026-03-31'],
    );
  });
});
