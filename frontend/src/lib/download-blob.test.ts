import { afterEach, describe, expect, it, vi } from 'vitest';
import { downloadBlob, downloadResponseBlob } from './download-blob.js';

describe('downloadBlob', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('triggers a browser download for the blob', () => {
    const click = vi.fn();
    const anchor = {
      href: '',
      download: '',
      rel: '',
      style: { display: '' },
      click,
      remove: vi.fn(),
    } as unknown as HTMLAnchorElement;

    vi.spyOn(document, 'createElement').mockReturnValue(anchor);
    vi.spyOn(document.body, 'appendChild').mockImplementation(() => anchor);
    const createObjectURL = vi.fn(() => 'blob:mock');
    const revokeObjectURL = vi.fn();
    vi.stubGlobal('URL', {
      createObjectURL,
      revokeObjectURL,
    });

    downloadBlob(new Blob(['csv']), 'leads.csv');

    expect(createObjectURL).toHaveBeenCalled();
    expect(anchor.download).toBe('leads.csv');
    expect(click).toHaveBeenCalled();
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:mock');
  });
});

describe('downloadResponseBlob', () => {
  it('uses the Content-Disposition filename when present', async () => {
    const click = vi.fn();
    const anchor = {
      href: '',
      download: '',
      rel: '',
      style: { display: '' },
      click,
      remove: vi.fn(),
    } as unknown as HTMLAnchorElement;

    vi.spyOn(document, 'createElement').mockReturnValue(anchor);
    vi.spyOn(document.body, 'appendChild').mockImplementation(() => anchor);
    vi.stubGlobal('URL', {
      createObjectURL: vi.fn(() => 'blob:mock'),
      revokeObjectURL: vi.fn(),
    });

    const response = new Response('csv', {
      headers: {
        'Content-Disposition': 'attachment; filename="leads-2026-03-26.csv"',
      },
    });

    await downloadResponseBlob(response);

    expect(anchor.download).toBe('leads-2026-03-26.csv');
  });
});
