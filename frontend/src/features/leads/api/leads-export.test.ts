import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { exportLeadsCsv, exportLeadsXlsx } from './leads-api.js';

const { apiRequestBlobMock, downloadResponseBlobMock } = vi.hoisted(() => ({
  apiRequestBlobMock: vi.fn(),
  downloadResponseBlobMock: vi.fn(),
}));

vi.mock('../../../lib/api-client.js', async (importOriginal) => {
  const original = await importOriginal<typeof import('../../../lib/api-client.js')>();

  return {
    ...original,
    apiRequestBlob: apiRequestBlobMock,
  };
});

vi.mock('../../../lib/download-blob.js', () => ({
  downloadResponseBlob: downloadResponseBlobMock,
}));

describe('exportLeadsCsv', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    downloadResponseBlobMock.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('requests the export endpoint without page or limit', async () => {
    apiRequestBlobMock.mockResolvedValue(
      new Response('id,name\n', {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
        },
      }),
    );

    await exportLeadsCsv({
      search: 'jane',
      searchBy: 'email',
      status: 'contacted',
      createdFrom: '2026-03-01',
      createdTo: '2026-03-31',
      sortBy: 'status',
      sortOrder: 'asc',
    });

    expect(apiRequestBlobMock).toHaveBeenCalledWith(
      '/leads/export.csv?search=jane&searchBy=email&sortBy=status&sortOrder=asc&status=contacted&createdFrom=2026-03-01&createdTo=2026-03-31',
    );
  });

  it('downloads the blob response on success', async () => {
    const response = new Response('csv', { status: 200 });
    apiRequestBlobMock.mockResolvedValue(response);

    await exportLeadsCsv();

    expect(downloadResponseBlobMock).toHaveBeenCalledWith(response);
  });

  it('throws when the export fails', async () => {
    apiRequestBlobMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          success: false,
          error: { message: 'Export failed' },
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } },
      ),
    );

    await expect(exportLeadsCsv()).rejects.toThrow('Export failed');
  });
});

describe('exportLeadsXlsx', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    downloadResponseBlobMock.mockResolvedValue(undefined);
  });

  it('requests the XLSX export endpoint without page or limit', async () => {
    apiRequestBlobMock.mockResolvedValue(
      new Response(new Uint8Array([1, 2, 3]), {
        status: 200,
        headers: {
          'Content-Type':
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        },
      }),
    );

    await exportLeadsXlsx({
      search: 'jane',
      sortBy: 'email',
      sortOrder: 'desc',
    });

    expect(apiRequestBlobMock).toHaveBeenCalledWith(
      '/leads/export.xlsx?search=jane&sortBy=email&sortOrder=desc',
    );
  });

  it('downloads the blob response on success', async () => {
    const response = new Response('xlsx', { status: 200 });
    apiRequestBlobMock.mockResolvedValue(response);

    await exportLeadsXlsx();

    expect(downloadResponseBlobMock).toHaveBeenCalledWith(response);
  });

  it('throws when the export fails', async () => {
    apiRequestBlobMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          success: false,
          error: { message: 'Excel export failed' },
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } },
      ),
    );

    await expect(exportLeadsXlsx()).rejects.toThrow('Excel export failed');
  });
});
