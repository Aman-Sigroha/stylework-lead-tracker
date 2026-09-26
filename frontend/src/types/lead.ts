export const LEAD_STATUSES = [
  'new',
  'contacted',
  'qualified',
  'converted',
  'lost',
] as const;

export type LeadStatus = (typeof LEAD_STATUSES)[number];

export type Lead = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  status: LeadStatus;
  createdAt: string;
  updatedAt: string;
};

export type LeadSearchBy = 'all' | 'name' | 'email' | 'phone';

export type LeadListSortBy = 'name' | 'email' | 'status';

export type LeadSortField = 'default' | LeadListSortBy;

export type LeadSortOrder = 'asc' | 'desc';

export type LeadStatusFilter = 'all' | LeadStatus;

export const LEAD_PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const;

export type LeadPageSize = (typeof LEAD_PAGE_SIZE_OPTIONS)[number];
