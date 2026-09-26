import { describe, expect, it } from 'vitest';
import {
  LeadImportCsvParseError,
  parseLeadImportCsvFile,
} from './parse-lead-import-csv.js';

const header = 'name,email,phone,status\n';

describe('parseLeadImportCsvFile', () => {
  it('parses rows with normalized headers', () => {
    const rows = parseLeadImportCsvFile(
      Buffer.from(`${header}Jane,jane@example.com,,new`),
    );

    expect(rows).toEqual([
      {
        name: 'Jane',
        email: 'jane@example.com',
        phone: '',
        status: 'new',
      },
    ]);
  });

  it('throws when required columns are missing', () => {
    expect(() =>
      parseLeadImportCsvFile(Buffer.from('name,email\nJane,jane@example.com')),
    ).toThrow(LeadImportCsvParseError);
  });
});
