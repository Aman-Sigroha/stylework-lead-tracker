import { useQuery } from '@tanstack/react-query';
import { fetchLeads } from '../api/leads-api.js';
import type {
  LeadListSortBy,
  LeadPageSize,
  LeadSearchBy,
  LeadSortField,
  LeadSortOrder,
  LeadStatusFilter,
} from '../../../types/lead.js';

export const LEADS_QUERY_KEY = ['leads'] as const;

export type UseLeadsQueryParams = {
  search: string;
  searchBy: LeadSearchBy;
  sortField: LeadSortField;
  sortOrder: LeadSortOrder;
  page: number;
  pageSize: LeadPageSize;
  statusFilter: LeadStatusFilter;
  createdFrom: string;
  createdTo: string;
};

export function useLeadsQuery({
  search,
  searchBy,
  sortField,
  sortOrder,
  page,
  pageSize,
  statusFilter,
  createdFrom,
  createdTo,
}: UseLeadsQueryParams) {
  const trimmedSearch = search.trim();
  const sortBy: LeadListSortBy | undefined =
    sortField === 'default' ? undefined : sortField;
  const trimmedCreatedFrom = createdFrom.trim();
  const trimmedCreatedTo = createdTo.trim();

  return useQuery({
    queryKey: [
      ...LEADS_QUERY_KEY,
      trimmedSearch,
      searchBy,
      sortField,
      sortOrder,
      page,
      pageSize,
      statusFilter,
      trimmedCreatedFrom,
      trimmedCreatedTo,
    ],
    queryFn: () =>
      fetchLeads({
        search: trimmedSearch === '' ? undefined : trimmedSearch,
        searchBy,
        sortBy,
        sortOrder: sortBy === undefined ? undefined : sortOrder,
        page,
        limit: pageSize,
        status: statusFilter === 'all' ? undefined : statusFilter,
        createdFrom:
          trimmedCreatedFrom === '' ? undefined : trimmedCreatedFrom,
        createdTo: trimmedCreatedTo === '' ? undefined : trimmedCreatedTo,
      }),
  });
}
