import { apiRequestJson } from '../../../lib/api-client.js';
import type { ApiSuccessResponse } from '../../../types/api.js';
import type { Lead, LeadSearchBy } from '../../../types/lead.js';

export type FetchLeadsParams = {
  search?: string;
  searchBy?: LeadSearchBy;
};

function buildLeadsPath(params: FetchLeadsParams): string {
  const trimmedSearch = params.search?.trim();

  if (trimmedSearch === undefined || trimmedSearch === '') {
    return '/leads';
  }

  const query = new URLSearchParams({ search: trimmedSearch });

  if (params.searchBy !== undefined && params.searchBy !== 'all') {
    query.set('searchBy', params.searchBy);
  }

  return `/leads?${query.toString()}`;
}

export async function fetchLeads(params: FetchLeadsParams = {}): Promise<Lead[]> {
  const response = await apiRequestJson<ApiSuccessResponse<Lead[]>>(
    buildLeadsPath(params),
  );

  return response.data;
}
