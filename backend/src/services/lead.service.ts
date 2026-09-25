import type { LeadStatus } from '../constants/lead-status.js';
import { query } from '../config/database.js';
import type { CreateLeadInput } from '../schemas/create-lead.schema.js';
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
