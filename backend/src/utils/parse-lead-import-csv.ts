import { parse } from 'csv-parse/sync';
import {
  LEAD_IMPORT_MAX_ROWS,
  LEAD_IMPORT_REQUIRED_COLUMNS,
} from '../constants/lead-import.js';

export type ParsedLeadImportRow = Record<
  (typeof LEAD_IMPORT_REQUIRED_COLUMNS)[number],
  string
>;

export class LeadImportCsvParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'LeadImportCsvParseError';
  }
}

function normalizeHeader(header: string): string {
  return header.trim().toLowerCase();
}

export function parseLeadImportCsvFile(
  fileContents: Buffer,
): ParsedLeadImportRow[] {
  let records: Record<string, string>[];

  try {
    records = parse(fileContents, {
      columns: (headers: string[]) =>
        headers.map((header) => normalizeHeader(header)),
      skip_empty_lines: true,
      trim: true,
      relax_quotes: true,
    }) as Record<string, string>[];
  } catch {
    throw new LeadImportCsvParseError('Malformed CSV file');
  }

  if (records.length === 0) {
    throw new LeadImportCsvParseError('CSV file contains no data rows');
  }

  const headerKeys = Object.keys(records[0] ?? {});
  const missingColumns = LEAD_IMPORT_REQUIRED_COLUMNS.filter(
    (column) => !headerKeys.includes(column),
  );

  if (missingColumns.length > 0) {
    throw new LeadImportCsvParseError(
      `Missing required column${missingColumns.length > 1 ? 's' : ''}: ${missingColumns.join(', ')}`,
    );
  }

  if (records.length > LEAD_IMPORT_MAX_ROWS) {
    throw new LeadImportCsvParseError(
      `CSV file exceeds the maximum of ${LEAD_IMPORT_MAX_ROWS} data rows`,
    );
  }

  return records.map((record) => ({
    name: record.name ?? '',
    email: record.email ?? '',
    phone: record.phone ?? '',
    status: record.status ?? '',
  }));
}
