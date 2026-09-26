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
