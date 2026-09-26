import { describe, expect, it } from 'vitest';
import { escapeCsvField, formatLeadsCsv } from './csv.js';
import type { Lead } from '../types/lead.types.js';

const sampleLead: Lead = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  name: 'Jane Doe',
  email: 'jane@example.com',
  phone: '+1 555 0100',
  status: 'new',
  createdAt: '2026-03-25T10:00:00.000Z',
  updatedAt: '2026-03-25T10:00:00.000Z',
};

describe('escapeCsvField', () => {
  it('quotes fields containing commas', () => {
    expect(escapeCsvField('Acme, Inc.')).toBe('"Acme, Inc."');
  });

  it('escapes double quotes by doubling them', () => {
    expect(escapeCsvField('Say "hello"')).toBe('"Say ""hello"""');
  });
});

describe('formatLeadsCsv', () => {
  it('includes the header row', () => {
    expect(formatLeadsCsv([])).toContain(
      'id,name,email,phone,status,createdAt,updatedAt',
    );
  });

  it('formats null phone as an empty field', () => {
    const csv = formatLeadsCsv([
      {
        ...sampleLead,
        phone: null,
      },
    ]);

    expect(csv).toContain(
      '550e8400-e29b-41d4-a716-446655440000,Jane Doe,jane@example.com,,new,',
    );
  });
});
