import { useQuery } from '@tanstack/react-query';
import { fetchLeads } from '../api/leads-api.js';
import type { LeadSearchBy } from '../../../types/lead.js';

export type UseLeadsQueryParams = {
  search: string;
  searchBy: LeadSearchBy;
};

export function useLeadsQuery({ search, searchBy }: UseLeadsQueryParams) {
  const trimmedSearch = search.trim();

  return useQuery({
    queryKey: ['leads', trimmedSearch, searchBy],
    queryFn: () =>
      fetchLeads({
        search: trimmedSearch === '' ? undefined : trimmedSearch,
        searchBy,
      }),
  });
}
