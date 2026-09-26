import { useQuery } from '@tanstack/react-query';
import { fetchLeads } from '../api/leads-api.js';
import type {
  LeadListSortBy,
  LeadSearchBy,
  LeadSortField,
  LeadSortOrder,
} from '../../../types/lead.js';

export const LEADS_QUERY_KEY = ['leads'] as const;

export type UseLeadsQueryParams = {
  search: string;
  searchBy: LeadSearchBy;
  sortField: LeadSortField;
  sortOrder: LeadSortOrder;
};

export function useLeadsQuery({
  search,
  searchBy,
  sortField,
  sortOrder,
}: UseLeadsQueryParams) {
  const trimmedSearch = search.trim();
  const sortBy: LeadListSortBy | undefined =
    sortField === 'default' ? undefined : sortField;

  return useQuery({
    queryKey: [...LEADS_QUERY_KEY, trimmedSearch, searchBy, sortField, sortOrder],
    queryFn: () =>
      fetchLeads({
        search: trimmedSearch === '' ? undefined : trimmedSearch,
        searchBy,
        sortBy,
        sortOrder: sortBy === undefined ? undefined : sortOrder,
      }),
  });
}
