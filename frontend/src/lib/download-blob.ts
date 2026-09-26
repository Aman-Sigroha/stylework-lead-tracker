export function parseContentDispositionFilename(
  header: string | null,
): string | null {
  if (header === null) {
    return null;
  }

  const filenameStarMatch = /filename\*=UTF-8''([^;]+)/i.exec(header);

  if (filenameStarMatch?.[1] !== undefined) {
    return decodeURIComponent(filenameStarMatch[1].trim());
  }

  const filenameMatch = /filename="([^"]+)"/i.exec(header);

  if (filenameMatch?.[1] !== undefined) {
    return filenameMatch[1];
  }

  const unquotedMatch = /filename=([^;]+)/i.exec(header);

  if (unquotedMatch?.[1] !== undefined) {
    return unquotedMatch[1].trim();
  }

  return null;
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.rel = 'noopener';
  anchor.style.display = 'none';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export async function downloadResponseBlob(response: Response): Promise<void> {
  const blob = await response.blob();
  const filename =
    parseContentDispositionFilename(
      response.headers.get('Content-Disposition'),
    ) ?? 'leads.csv';

  downloadBlob(blob, filename);
}
