import { afterEach, describe, expect, it, vi } from 'vitest';
import { apiRequestBlob } from './api-client.js';

describe('apiRequestBlob', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('includes credentials with the request', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response('ok'));
    vi.stubGlobal('fetch', fetchMock);

    await apiRequestBlob('/leads/export.csv');

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/leads/export.csv'),
      expect.objectContaining({ credentials: 'include' }),
    );
  });
});
