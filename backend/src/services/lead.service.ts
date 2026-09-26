import type { LeadStatus } from '../constants/lead-status.js';
import { query } from '../config/database.js';
import type { CreateLeadInput } from '../schemas/create-lead.schema.js';
import type { UpdateLeadInput } from '../schemas/update-lead.schema.js';
import type { LeadSearchBy } from '../schemas/list-leads-query.schema.js';
import type { Lead } from '../types/lead.types.js';

type LeadRow = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  status: LeadStatus;
  created_at: Date;
  updated_at: Date;
};

function toLead(row: LeadRow): Lead {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    status: row.status,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}

export async function createLead(input: CreateLeadInput): Promise<Lead> {
  const result = await query<LeadRow>(
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

/** Caps list/search results to avoid unbounded reads on large tables. */
const LIST_LEADS_MAX_RESULTS = 100;

function searchWhereClause(searchBy: LeadSearchBy): string {
  switch (searchBy) {
    case 'name':
      return 'name ILIKE $1';
    case 'email':
      return 'email ILIKE $1';
    case 'phone':
      return "COALESCE(phone, '') ILIKE $1";
    case 'all':
      return `name ILIKE $1
        OR email ILIKE $1
        OR COALESCE(phone, '') ILIKE $1`;
  }
}

export async function listLeads(options: {
  search?: string | undefined;
  searchBy?: LeadSearchBy | undefined;
}): Promise<Lead[]> {
  if (options.search === undefined) {
    const result = await query<LeadRow>(
      `SELECT id, name, email, phone, status, created_at, updated_at
       FROM leads
       ORDER BY created_at DESC
       LIMIT $1`,
      [LIST_LEADS_MAX_RESULTS],
    );

    return result.rows.map(toLead);
  }

  const searchBy = options.searchBy ?? 'all';
  const pattern = `%${options.search}%`;
  const whereClause = searchWhereClause(searchBy);

  const result = await query<LeadRow>(
    `SELECT id, name, email, phone, status, created_at, updated_at
     FROM leads
     WHERE ${whereClause}
     ORDER BY created_at DESC
     LIMIT $2`,
    [pattern, LIST_LEADS_MAX_RESULTS],
  );

  return result.rows.map(toLead);
}

export async function updateLeadStatus(
  id: string,
  status: LeadStatus,
): Promise<Lead | null> {
  const result = await query<LeadRow>(
    `UPDATE leads
     SET status = $2
     WHERE id = $1
     RETURNING id, name, email, phone, status, created_at, updated_at`,
    [id, status],
  );

  const row = result.rows[0];
  if (row === undefined) {
    return null;
  }

  return toLead(row);
}

export async function updateLead(
  id: string,
  input: UpdateLeadInput,
): Promise<Lead | null> {
  const phone = input.phone ?? null;

  const result =
    input.status === undefined
      ? await query<LeadRow>(
          `UPDATE leads
     SET name = $2,
         email = $3,
         phone = $4
     WHERE id = $1
     RETURNING id, name, email, phone, status, created_at, updated_at`,
          [id, input.name, input.email, phone],
        )
      : await query<LeadRow>(
          `UPDATE leads
     SET name = $2,
         email = $3,
         phone = $4,
         status = $5
     WHERE id = $1
     RETURNING id, name, email, phone, status, created_at, updated_at`,
          [id, input.name, input.email, phone, input.status],
        );

  const row = result.rows[0];
  if (row === undefined) {
    return null;
  }

  return toLead(row);
}

export async function deleteLead(id: string): Promise<boolean> {
  const result = await query<{ id: string }>(
    `DELETE FROM leads
     WHERE id = $1
     RETURNING id`,
    [id],
  );

  return result.rows[0] !== undefined;
}
