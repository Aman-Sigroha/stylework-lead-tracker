import type { Lead } from '../../../types/lead.js';
import type { LeadsPagination } from '../../../types/pagination.js';

export type FetchLeadsResult = {
  leads: Lead[];
  pagination: LeadsPagination;
};

export function createFetchLeadsResult(
  leads: Lead[],
  pagination?: Partial<LeadsPagination>,
): FetchLeadsResult {
  const total = pagination?.total ?? leads.length;
  const limit = pagination?.limit ?? 20;
  const page = pagination?.page ?? 1;
  const totalPages =
    pagination?.totalPages ??
    (total === 0 ? 0 : Math.ceil(total / limit));

  return {
    leads,
    pagination: {
      page,
      limit,
      total,
      totalPages,
    },
  };
}
