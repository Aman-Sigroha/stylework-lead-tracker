import type { Lead } from '../types/lead.types.js';
import { buildDatedLeadsExportFilename } from './export-filename.js';

const CSV_HEADER = 'id,name,email,phone,status,createdAt,updatedAt';

export function escapeCsvField(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }

  return value;
}

export function formatLeadsCsv(leads: Lead[]): string {
  const lines = [
    CSV_HEADER,
    ...leads.map((lead) =>
      [
        lead.id,
        lead.name,
        lead.email,
        lead.phone ?? '',
        lead.status,
        lead.createdAt,
        lead.updatedAt,
      ]
        .map((value) => escapeCsvField(value))
        .join(','),
    ),
  ];

  return `${lines.join('\n')}\n`;
}

export function buildLeadsExportFilename(date: Date = new Date()): string {
  return buildDatedLeadsExportFilename('csv', date);
}
