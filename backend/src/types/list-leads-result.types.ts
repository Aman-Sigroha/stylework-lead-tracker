import type { Lead } from './lead.types.js';

export type ListLeadsPagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type ListLeadsResult = {
  leads: Lead[];
  pagination: ListLeadsPagination;
};
