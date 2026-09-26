import type { PoolClient } from 'pg';
import { pool, query } from '../config/database.js';
import type { CreateLeadInput } from '../schemas/create-lead.schema.js';
import { createLeadSchema } from '../schemas/create-lead.schema.js';
import type { Lead } from '../types/lead.types.js';
import { normalizeImportEmail } from '../utils/lead-import-email.js';
import {
  parseLeadImportCsvFile,
  type ParsedLeadImportRow,
} from '../utils/parse-lead-import-csv.js';

export type LeadImportRowErrorType = 'validation' | 'duplicate';

export type LeadImportRowError = {
  row: number;
  field: string;
  type: LeadImportRowErrorType;
  message: string;
  email?: string;
};

export type LeadImportPreviewResult = {
  totalRows: number;
  validRows: number;
  invalidRows: number;
  duplicateRows: number;
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

type ValidatedImportRow = {
  row: number;
  lead: CreateLeadInput;
  normalizedEmail: string;
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
    type: 'validation',
    message: issue.message,
  }));
}

async function findExistingNormalizedEmails(
  normalizedEmails: string[],
  client?: PoolClient,
): Promise<Set<string>> {
  if (normalizedEmails.length === 0) {
    return new Set();
  }

  const runQuery = client?.query.bind(client) ?? query;
  const result = await runQuery<{ normalized_email: string }>(
    `SELECT lower(trim(email)) AS normalized_email
     FROM leads
     WHERE lower(trim(email)) = ANY($1::text[])`,
    [normalizedEmails],
  );

  return new Set(result.rows.map((row) => row.normalized_email));
}

function filterImportableLeads(
  leads: CreateLeadInput[],
  existingEmails: Set<string>,
): CreateLeadInput[] {
  const seenInBatch = new Set<string>();
  const importable: CreateLeadInput[] = [];

  for (const lead of leads) {
    const normalizedEmail = normalizeImportEmail(lead.email);

    if (seenInBatch.has(normalizedEmail) || existingEmails.has(normalizedEmail)) {
      continue;
    }

    seenInBatch.add(normalizedEmail);
    importable.push(lead);
  }

  return importable;
}

export async function previewLeadImportFromCsv(
  fileContents: Buffer,
): Promise<LeadImportPreviewResult> {
  const rows = parseLeadImportCsvFile(fileContents);
  const errors: LeadImportRowError[] = [];
  const validatedRows: ValidatedImportRow[] = [];
  let invalidRows = 0;

  rows.forEach((row, index) => {
    const rowNumber = rowNumberForDataIndex(index);
    const parsed = createLeadSchema.safeParse(normalizeRowForValidation(row));

    if (!parsed.success) {
      invalidRows += 1;
      errors.push(...mapZodIssuesToRowErrors(rowNumber, parsed.error.issues));
      return;
    }

    validatedRows.push({
      row: rowNumber,
      lead: parsed.data,
      normalizedEmail: normalizeImportEmail(parsed.data.email),
    });
  });

  const uniqueNormalizedEmails = [
    ...new Set(validatedRows.map((row) => row.normalizedEmail)),
  ];
  const existingEmails = await findExistingNormalizedEmails(
    uniqueNormalizedEmails,
  );

  const seenInCsv = new Set<string>();
  const validLeads: CreateLeadInput[] = [];
  let duplicateRows = 0;

  for (const validatedRow of validatedRows) {
    const { row, lead, normalizedEmail } = validatedRow;

    if (seenInCsv.has(normalizedEmail)) {
      duplicateRows += 1;
      errors.push({
        row,
        field: 'email',
        type: 'duplicate',
        message: 'Email already exists in this import',
        email: lead.email,
      });
      continue;
    }

    seenInCsv.add(normalizedEmail);

    if (existingEmails.has(normalizedEmail)) {
      duplicateRows += 1;
      errors.push({
        row,
        field: 'email',
        type: 'duplicate',
        message: 'Email already exists',
        email: lead.email,
      });
      continue;
    }

    validLeads.push(lead);
  }

  return {
    totalRows: rows.length,
    validRows: validLeads.length,
    invalidRows,
    duplicateRows,
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
  const validatedLeads: CreateLeadInput[] = [];

  for (const lead of leads) {
    const parsed = createLeadSchema.safeParse(lead);
    if (!parsed.success) {
      throw new Error('Invalid lead payload');
    }

    validatedLeads.push(parsed.data);
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const normalizedEmails = [
      ...new Set(
        validatedLeads.map((lead) => normalizeImportEmail(lead.email)),
      ),
    ];
    const existingEmails = await findExistingNormalizedEmails(
      normalizedEmails,
      client,
    );
    const leadsToImport = filterImportableLeads(validatedLeads, existingEmails);

    const imported: Lead[] = [];
    for (const lead of leadsToImport) {
      imported.push(await insertLeadWithClient(client, lead));
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
