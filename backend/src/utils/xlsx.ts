import ExcelJS from 'exceljs';
import type { Lead } from '../types/lead.types.js';
import { buildDatedLeadsExportFilename } from './export-filename.js';

export const LEADS_XLSX_SHEET_NAME = 'Leads';

export const LEADS_XLSX_HEADERS = [
  'ID',
  'Name',
  'Email',
  'Phone',
  'Status',
  'Created At',
  'Updated At',
] as const;

export const LEADS_XLSX_COLUMN_WIDTHS = [38, 28, 36, 20, 16, 24, 24] as const;

const ISO_DATE_TIME_NUM_FMT = 'yyyy-mm-dd"T"hh:mm:ss.000"Z"';

export function buildLeadsXlsxExportFilename(date: Date = new Date()): string {
  return buildDatedLeadsExportFilename('xlsx', date);
}

export async function formatLeadsXlsxBuffer(leads: Lead[]): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(LEADS_XLSX_SHEET_NAME);

  LEADS_XLSX_COLUMN_WIDTHS.forEach((width, index) => {
    worksheet.getColumn(index + 1).width = width;
  });

  const headerRow = worksheet.addRow([...LEADS_XLSX_HEADERS]);
  headerRow.font = { bold: true };

  for (const lead of leads) {
    worksheet.addRow([
      lead.id,
      lead.name,
      lead.email,
      lead.phone ?? '',
      lead.status,
      new Date(lead.createdAt),
      new Date(lead.updatedAt),
    ]);
  }

  worksheet.getColumn(6).numFmt = ISO_DATE_TIME_NUM_FMT;
  worksheet.getColumn(7).numFmt = ISO_DATE_TIME_NUM_FMT;

  worksheet.views = [{ state: 'frozen', ySplit: 1, activeCell: 'A2' }];

  worksheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: 1, column: LEADS_XLSX_HEADERS.length },
  };

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
