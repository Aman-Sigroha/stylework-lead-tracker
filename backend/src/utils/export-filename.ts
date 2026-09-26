export function buildDatedLeadsExportFilename(
  extension: string,
  date: Date = new Date(),
): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');

  return `leads-${year}-${month}-${day}.${extension}`;
}
