import ExcelJS from 'exceljs';
import { describe, expect, it } from 'vitest';
import type { Lead } from '../types/lead.types.js';
import {
  formatLeadsXlsxBuffer,
  LEADS_XLSX_COLUMN_WIDTHS,
  LEADS_XLSX_HEADERS,
  LEADS_XLSX_SHEET_NAME,
} from './xlsx.js';

const sampleLead: Lead = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  name: 'Jane Doe',
  email: 'jane@example.com',
  phone: '+1 555 0100',
  status: 'new',
  createdAt: '2026-03-25T10:00:00.000Z',
  updatedAt: '2026-03-25T10:00:00.000Z',
};

async function loadWorkbook(buffer: Buffer) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);
  return workbook;
}

describe('formatLeadsXlsxBuffer', () => {
  it('creates a workbook with the Leads sheet and header row', async () => {
    const buffer = await formatLeadsXlsxBuffer([]);
    const workbook = await loadWorkbook(buffer);
    const worksheet = workbook.getWorksheet(LEADS_XLSX_SHEET_NAME);

    expect(worksheet).toBeDefined();
    expect(worksheet?.getRow(1).values).toEqual([
      undefined,
      ...LEADS_XLSX_HEADERS,
    ]);
  });

  it('sets explicit column widths', async () => {
    const buffer = await formatLeadsXlsxBuffer([]);
    const worksheet = (await loadWorkbook(buffer)).getWorksheet(
      LEADS_XLSX_SHEET_NAME,
    );

    LEADS_XLSX_COLUMN_WIDTHS.forEach((width, index) => {
      expect(worksheet?.getColumn(index + 1).width).toBe(width);
    });
  });

  it('freezes the header row and enables autofilter', async () => {
    const buffer = await formatLeadsXlsxBuffer([sampleLead]);
    const worksheet = (await loadWorkbook(buffer)).getWorksheet(
      LEADS_XLSX_SHEET_NAME,
    );

    expect(worksheet?.views?.[0]?.ySplit).toBe(1);
    expect(worksheet?.autoFilter).toBe('A1:G1');
    expect(worksheet?.getRow(1).font).toEqual({ bold: true });
  });

  it('writes lead rows and leaves null phone blank', async () => {
    const buffer = await formatLeadsXlsxBuffer([
      sampleLead,
      { ...sampleLead, phone: null, name: 'No Phone' },
    ]);
    const worksheet = (await loadWorkbook(buffer)).getWorksheet(
      LEADS_XLSX_SHEET_NAME,
    );

    expect(worksheet?.rowCount).toBe(3);
    expect(worksheet?.getRow(2).getCell(2).value).toBe('Jane Doe');
    expect(worksheet?.getRow(3).getCell(4).value).toBe('');
    expect(worksheet?.getRow(2).getCell(6).value).toEqual(
      new Date('2026-03-25T10:00:00.000Z'),
    );
  });
});
