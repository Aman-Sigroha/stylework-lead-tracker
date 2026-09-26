import type { LeadStatus } from '../constants/lead-status.js';
import {
  LIST_LEADS_DEFAULT_LIMIT,
  LIST_LEADS_DEFAULT_PAGE,
} from '../constants/list-leads-pagination.js';
import { query } from '../config/database.js';
import type { CreateLeadInput } from '../schemas/create-lead.schema.js';
import type { UpdateLeadInput } from '../schemas/update-lead.schema.js';
import {
  buildListOrderByClause,
  resolveListSort,
  type LeadListSortByParam,
  type LeadSortOrder,
} from '../constants/lead-list-sort.js';
import type { LeadSearchBy } from '../schemas/list-leads-query.schema.js';
import type { Lead } from '../types/lead.types.js';
import type { ListLeadsResult } from '../types/list-leads-result.types.js';

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

type ListFilterParams = {
  search?: string | undefined;
  searchBy?: LeadSearchBy | undefined;
  status?: LeadStatus | undefined;
  createdFrom?: string | undefined;
  createdTo?: string | undefined;
};

function nextParamIndex(params: unknown[]): number {
  return params.length + 1;
}

function appendSearchFilter(
  clauses: string[],
  params: unknown[],
  search: string,
  searchBy: LeadSearchBy,
): void {
  const placeholder = `$${nextParamIndex(params)}`;
  params.push(`%${search}%`);

  switch (searchBy) {
    case 'name':
      clauses.push(`name ILIKE ${placeholder}`);
      break;
    case 'email':
      clauses.push(`email ILIKE ${placeholder}`);
      break;
    case 'phone':
      clauses.push(`COALESCE(phone, '') ILIKE ${placeholder}`);
      break;
    case 'all':
      clauses.push(
        `(name ILIKE ${placeholder}
          OR email ILIKE ${placeholder}
          OR COALESCE(phone, '') ILIKE ${placeholder})`,
      );
      break;
  }
}

function buildListWhereClause(options: ListFilterParams): {
  whereSql: string;
  params: unknown[];
} {
  const clauses: string[] = [];
  const params: unknown[] = [];

  if (options.search !== undefined) {
    appendSearchFilter(
      clauses,
      params,
      options.search,
      options.searchBy ?? 'all',
    );
  }

  if (options.status !== undefined) {
    const placeholder = `$${nextParamIndex(params)}`;
    params.push(options.status);
    clauses.push(`status = ${placeholder}`);
  }

  if (options.createdFrom !== undefined) {
    const placeholder = `$${nextParamIndex(params)}`;
    params.push(`${options.createdFrom}T00:00:00.000Z`);
    clauses.push(`created_at >= ${placeholder}::timestamptz`);
  }

  if (options.createdTo !== undefined) {
    const placeholder = `$${nextParamIndex(params)}`;
    params.push(options.createdTo);
    clauses.push(
      `created_at < (${placeholder}::date + INTERVAL '1 day')`,
    );
  }

  const whereSql =
    clauses.length === 0 ? '' : `WHERE ${clauses.join(' AND ')}`;

  return { whereSql, params };
}

function buildPaginationMeta(
  page: number,
  limit: number,
  total: number,
): ListLeadsResult['pagination'] {
  const totalPages = total === 0 ? 0 : Math.ceil(total / limit);

  return {
    page,
    limit,
    total,
    totalPages,
  };
}

export async function listLeads(options: {
  search?: string | undefined;
  searchBy?: LeadSearchBy | undefined;
  sortBy?: LeadListSortByParam | undefined;
  sortOrder?: LeadSortOrder | undefined;
  page?: number | undefined;
  limit?: number | undefined;
  status?: LeadStatus | undefined;
  createdFrom?: string | undefined;
  createdTo?: string | undefined;
}): Promise<ListLeadsResult> {
  const page = options.page ?? LIST_LEADS_DEFAULT_PAGE;
  const limit = options.limit ?? LIST_LEADS_DEFAULT_LIMIT;
  const offset = (page - 1) * limit;

  const { sortBy, sortOrder } = resolveListSort(
    options.sortBy,
    options.sortOrder,
  );
  const orderByClause = buildListOrderByClause(sortBy, sortOrder);
  const { whereSql, params: filterParams } = buildListWhereClause(options);

  const countResult = await query<{ count: string }>(
    `SELECT COUNT(*)::text AS count
     FROM leads
     ${whereSql}`,
    filterParams,
  );

  const total = Number(countResult.rows[0]?.count ?? 0);

  const listParams = [...filterParams, limit, offset];
  const limitPlaceholder = `$${filterParams.length + 1}`;
  const offsetPlaceholder = `$${filterParams.length + 2}`;

  const result = await query<LeadRow>(
    `SELECT id, name, email, phone, status, created_at, updated_at
     FROM leads
     ${whereSql}
     ORDER BY ${orderByClause}
     LIMIT ${limitPlaceholder}
     OFFSET ${offsetPlaceholder}`,
    listParams,
  );

  return {
    leads: result.rows.map(toLead),
    pagination: buildPaginationMeta(page, limit, total),
  };
}

export type ExportLeadsOptions = {
  search?: string | undefined;
  searchBy?: LeadSearchBy | undefined;
  sortBy?: LeadListSortByParam | undefined;
  sortOrder?: LeadSortOrder | undefined;
  status?: LeadStatus | undefined;
  createdFrom?: string | undefined;
  createdTo?: string | undefined;
};

export async function exportLeads(
  options: ExportLeadsOptions,
): Promise<Lead[]> {
  const { sortBy, sortOrder } = resolveListSort(
    options.sortBy,
    options.sortOrder,
  );
  const orderByClause = buildListOrderByClause(sortBy, sortOrder);
  const { whereSql, params: filterParams } = buildListWhereClause(options);

  const result = await query<LeadRow>(
    `SELECT id, name, email, phone, status, created_at, updated_at
     FROM leads
     ${whereSql}
     ORDER BY ${orderByClause}`,
    filterParams,
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
