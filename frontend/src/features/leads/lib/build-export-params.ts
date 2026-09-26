import type { ExportLeadsParams } from '../api/leads-api.js';
import type {
  LeadListSortBy,
  LeadSearchBy,
  LeadSortField,
  LeadSortOrder,
  LeadStatusFilter,
} from '../../../types/lead.js';

type BuildExportLeadsParamsInput = {
  search: string;
  searchBy: LeadSearchBy;
  sortField: LeadSortField;
  sortOrder: LeadSortOrder;
  statusFilter: LeadStatusFilter;
  createdFrom: string;
  createdTo: string;
};

export function buildExportLeadsParams({
  search,
  searchBy,
  sortField,
  sortOrder,
  statusFilter,
  createdFrom,
  createdTo,
}: BuildExportLeadsParamsInput): ExportLeadsParams {
  const trimmedSearch = search.trim();
  const sortBy: LeadListSortBy | undefined =
    sortField === 'default' ? undefined : sortField;
  const trimmedCreatedFrom = createdFrom.trim();
  const trimmedCreatedTo = createdTo.trim();

  return {
    search: trimmedSearch === '' ? undefined : trimmedSearch,
    searchBy,
    sortBy,
    sortOrder: sortBy === undefined ? undefined : sortOrder,
    status: statusFilter === 'all' ? undefined : statusFilter,
    createdFrom:
      trimmedCreatedFrom === '' ? undefined : trimmedCreatedFrom,
    createdTo: trimmedCreatedTo === '' ? undefined : trimmedCreatedTo,
  };
}
