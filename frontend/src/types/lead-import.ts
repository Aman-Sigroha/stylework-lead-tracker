import type { LeadStatus } from './lead.js';

export type LeadImportRowErrorType = 'validation' | 'duplicate';

export type LeadImportRowError = {
  row: number;
  field: string;
  type: LeadImportRowErrorType;
  message: string;
  email?: string;
};

export type LeadImportPreviewLead = {
  name: string;
  email: string;
  phone?: string;
  status: LeadStatus;
};

export type LeadImportPreview = {
  totalRows: number;
  validRows: number;
  invalidRows: number;
  duplicateRows: number;
  errors: LeadImportRowError[];
  validLeads: LeadImportPreviewLead[];
};

export type LeadImportConfirmResult = {
  importedCount: number;
  leads: Array<{
    id: string;
    name: string;
    email: string;
    phone: string | null;
    status: LeadStatus;
    createdAt: string;
    updatedAt: string;
  }>;
};
