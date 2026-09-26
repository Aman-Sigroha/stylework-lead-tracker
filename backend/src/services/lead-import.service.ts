import type { PoolClient } from 'pg';
import { pool } from '../config/database.js';
import type { CreateLeadInput } from '../schemas/create-lead.schema.js';
import { createLeadSchema } from '../schemas/create-lead.schema.js';
import type { Lead } from '../types/lead.types.js';
import {
  parseLeadImportCsvFile,
  type ParsedLeadImportRow,
} from '../utils/parse-lead-import-csv.js';

export type LeadImportRowError = {
  row: number;
  field: string;
  message: string;
};

export type LeadImportPreviewResult = {
  totalRows: number;
  validRows: number;
  invalidRows: number;
  errors: LeadImportRowError[];
  validLeads: CreateLeadInput[];
};

type LeadRow = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  status: string;
  created_at: Date;
  updated_at: Date;
};

function toLead(row: LeadRow): Lead {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    status: row.status as Lead['status'],
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}

function rowNumberForDataIndex(dataIndex: number): number {
  return dataIndex + 2;
}

function normalizeRowForValidation(row: ParsedLeadImportRow): Record<string, unknown> {
  const status = row.status.trim();

  return {
    name: row.name,
    email: row.email,
    phone: row.phone,
    ...(status === '' ? {} : { status }),
  };
}

function mapZodIssuesToRowErrors(
  row: number,
  issues: { path: PropertyKey[]; message: string }[],
): LeadImportRowError[] {
  return issues.map((issue) => ({
    row,
    field: issue.path.map(String).join('.') || 'row',
    message: issue.message,
  }));
}

export function previewLeadImportFromCsv(
  fileContents: Buffer,
): LeadImportPreviewResult {
  const rows = parseLeadImportCsvFile(fileContents);
  const errors: LeadImportRowError[] = [];
  const validLeads: CreateLeadInput[] = [];

  rows.forEach((row, index) => {
    const rowNumber = rowNumberForDataIndex(index);
    const parsed = createLeadSchema.safeParse(normalizeRowForValidation(row));

    if (!parsed.success) {
      errors.push(...mapZodIssuesToRowErrors(rowNumber, parsed.error.issues));
      return;
    }

    validLeads.push(parsed.data);
  });

  return {
    totalRows: rows.length,
    validRows: validLeads.length,
    invalidRows: rows.length - validLeads.length,
    errors,
    validLeads,
  };
}

async function insertLeadWithClient(
  client: PoolClient,
  input: CreateLeadInput,
): Promise<Lead> {
  const result = await client.query<LeadRow>(
    `INSERT INTO leads (name, email, phone, status)
     VALUES ($1, $2, $3, $4)
     RETURNING id, name, email, phone, status, created_at, updated_at`,
    [input.name, input.email, input.phone ?? null, input.status],
  );

  const row = result.rows[0];
  if (row === undefined) {
    throw new Error('Lead was not created');
  }

  return toLead(row);
}

export async function confirmLeadImport(
  leads: CreateLeadInput[],
): Promise<{ importedCount: number; leads: Lead[] }> {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const imported: Lead[] = [];
    for (const lead of leads) {
      const parsed = createLeadSchema.safeParse(lead);
      if (!parsed.success) {
        throw new Error('Invalid lead payload');
      }

      imported.push(await insertLeadWithClient(client, parsed.data));
    }

    await client.query('COMMIT');

    return {
      importedCount: imported.length,
      leads: imported,
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
