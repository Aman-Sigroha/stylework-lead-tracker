import type {
  LeadListSortBy,
  LeadSearchBy,
  LeadSortOrder,
  LeadStatus,
} from '../../../types/lead.js';

export type LeadsQueryParams = {
  search?: string;
  searchBy?: LeadSearchBy;
  sortBy?: LeadListSortBy;
  sortOrder?: LeadSortOrder;
  page?: number;
  limit?: number;
  status?: LeadStatus;
  createdFrom?: string;
  createdTo?: string;
};

export function buildLeadsQueryString(
  params: LeadsQueryParams,
  options: { includePagination?: boolean } = {},
): string {
  const includePagination = options.includePagination ?? true;
  const query = new URLSearchParams();
  const trimmedSearch = params.search?.trim();

  if (trimmedSearch !== undefined && trimmedSearch !== '') {
    query.set('search', trimmedSearch);

    if (params.searchBy !== undefined && params.searchBy !== 'all') {
      query.set('searchBy', params.searchBy);
    }
  }

  if (params.sortBy !== undefined) {
    query.set('sortBy', params.sortBy);

    if (params.sortOrder !== undefined) {
      query.set('sortOrder', params.sortOrder);
    }
  }

  if (includePagination) {
    if (params.page !== undefined) {
      query.set('page', String(params.page));
    }

    if (params.limit !== undefined) {
      query.set('limit', String(params.limit));
    }
  }

  if (params.status !== undefined) {
    query.set('status', params.status);
  }

  if (params.createdFrom !== undefined && params.createdFrom !== '') {
    query.set('createdFrom', params.createdFrom);
  }

  if (params.createdTo !== undefined && params.createdTo !== '') {
    query.set('createdTo', params.createdTo);
  }

  const queryString = query.toString();
  return queryString === '' ? '' : `?${queryString}`;
}
