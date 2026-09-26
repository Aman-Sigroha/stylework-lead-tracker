export const LEAD_LIST_SORT_BY_VALUES = ['name', 'email', 'status'] as const;

export type LeadListSortByParam = (typeof LEAD_LIST_SORT_BY_VALUES)[number];

export const LEAD_SORT_ORDER_VALUES = ['asc', 'desc'] as const;

export type LeadSortOrder = (typeof LEAD_SORT_ORDER_VALUES)[number];

export type LeadListSortColumn = LeadListSortByParam | 'created_at';

const STATUS_ORDER_CASE = `CASE status
  WHEN 'new' THEN 1
  WHEN 'contacted' THEN 2
  WHEN 'qualified' THEN 3
  WHEN 'converted' THEN 4
  WHEN 'lost' THEN 5
  END`;

/** Safe ORDER BY fragment (whitelist only; no user input). */
export function buildListOrderByClause(
  sortBy: LeadListSortColumn,
  sortOrder: LeadSortOrder,
): string {
  const direction = sortOrder === 'asc' ? 'ASC' : 'DESC';

  switch (sortBy) {
    case 'name':
      return `name ${direction}, created_at DESC`;
    case 'email':
      return `email ${direction}, created_at DESC`;
    case 'status':
      return `${STATUS_ORDER_CASE} ${direction}, created_at DESC`;
    case 'created_at':
      return `created_at ${direction}`;
  }
}

export function resolveListSort(
  sortBy?: LeadListSortByParam | undefined,
  sortOrder?: LeadSortOrder | undefined,
): { sortBy: LeadListSortColumn; sortOrder: LeadSortOrder } {
  if (sortBy === undefined) {
    return { sortBy: 'created_at', sortOrder: 'desc' };
  }

  return {
    sortBy,
    sortOrder: sortOrder ?? 'desc',
  };
}
