import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { confirmLeadImport, previewLeadImport } from './leads-import-api.js';

const { apiRequestMock } = vi.hoisted(() => ({
  apiRequestMock: vi.fn(),
}));

vi.mock('../../../lib/api-client.js', () => ({
  apiRequest: apiRequestMock,
}));

describe('leads-import-api', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('uploads a CSV file for preview', async () => {
    apiRequestMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          success: true,
          data: {
            totalRows: 1,
            validRows: 1,
            invalidRows: 0,
            duplicateRows: 0,
            errors: [],
            validLeads: [
              { name: 'Jane', email: 'jane@example.com', status: 'new' },
            ],
          },
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      ),
    );

    const file = new File(['name,email,phone,status\nJane,jane@example.com,,new'], 'leads.csv', {
      type: 'text/csv',
    });

    const preview = await previewLeadImport(file);

    expect(preview.validRows).toBe(1);
    expect(apiRequestMock).toHaveBeenCalledWith(
      '/leads/import/preview',
      expect.objectContaining({
        method: 'POST',
        body: expect.any(FormData),
      }),
    );
  });

  it('confirms a validated import payload', async () => {
    apiRequestMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          success: true,
          data: { importedCount: 1, leads: [] },
        }),
        { status: 201, headers: { 'Content-Type': 'application/json' } },
      ),
    );

    const result = await confirmLeadImport([
      { name: 'Jane', email: 'jane@example.com', status: 'new' },
    ]);

    expect(result.importedCount).toBe(1);
    expect(apiRequestMock).toHaveBeenCalledWith(
      '/leads/import/confirm',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          leads: [{ name: 'Jane', email: 'jane@example.com', status: 'new' }],
        }),
      }),
    );
  });
});
