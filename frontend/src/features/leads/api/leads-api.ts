import { apiRequest, apiRequestBlob, apiRequestJson } from '../../../lib/api-client.js';
import { buildLeadsQueryString } from '../lib/build-leads-query.js';
import { downloadResponseBlob } from '../../../lib/download-blob.js';
import {
  ApiRequestError,
  getApiErrorMessage,
} from '../../../lib/api-errors.js';
import type { ApiSuccessResponse } from '../../../types/api.js';
import type {
  Lead,
  LeadListSortBy,
  LeadSearchBy,
  LeadSortOrder,
  LeadStatus,
} from '../../../types/lead.js';
import type { LeadsPagination } from '../../../types/pagination.js';
import type { FetchLeadsResult } from '../lib/leads-query-response.js';

export type CreateLeadPayload = {
  name: string;
  email: string;
  phone?: string;
  status?: LeadStatus;
};

export type FetchLeadsParams = {
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

type LeadsListApiResponse = ApiSuccessResponse<Lead[]> & {
  pagination: LeadsPagination;
};

function buildLeadsPath(params: FetchLeadsParams): string {
  const queryString = buildLeadsQueryString(params);
  return queryString === '' ? '/leads' : `/leads${queryString}`;
}

export type ExportLeadsParams = Omit<FetchLeadsParams, 'page' | 'limit'>;

export async function exportLeadsCsv(params: ExportLeadsParams = {}): Promise<void> {
  const queryString = buildLeadsQueryString(params, {
    includePagination: false,
  });
  const response = await apiRequestBlob(
    `/leads/export.csv${queryString === '' ? '' : queryString}`,
  );

  if (!response.ok) {
    const body: unknown = await response.json().catch(() => null);

    throw new ApiRequestError(
      getApiErrorMessage(body, 'Failed to export leads'),
      response.status,
      body,
    );
  }

  await downloadResponseBlob(response);
}

export async function exportLeadsXlsx(
  params: ExportLeadsParams = {},
): Promise<void> {
  const queryString = buildLeadsQueryString(params, {
    includePagination: false,
  });
  const response = await apiRequestBlob(
    `/leads/export.xlsx${queryString === '' ? '' : queryString}`,
  );

  if (!response.ok) {
    const body: unknown = await response.json().catch(() => null);

    throw new ApiRequestError(
      getApiErrorMessage(body, 'Failed to export leads'),
      response.status,
      body,
    );
  }

  await downloadResponseBlob(response);
}

export async function fetchLeads(
  params: FetchLeadsParams = {},
): Promise<FetchLeadsResult> {
  const response = await apiRequestJson<LeadsListApiResponse>(
    buildLeadsPath(params),
  );

  return {
    leads: response.data,
    pagination: response.pagination,
  };
}

export async function createLead(payload: CreateLeadPayload): Promise<Lead> {
  const response = await apiRequest('/leads', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: payload.name,
      email: payload.email,
      status: payload.status ?? 'new',
      ...(payload.phone !== undefined && payload.phone !== ''
        ? { phone: payload.phone }
        : {}),
    }),
  });

  const body: unknown = await response.json();

  if (!response.ok) {
    throw new ApiRequestError(
      getApiErrorMessage(body, 'Failed to create lead'),
      response.status,
      body,
    );
  }

  return (body as ApiSuccessResponse<Lead>).data;
}

export type UpdateLeadPayload = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  status?: LeadStatus;
};

export type UpdateLeadStatusPayload = {
  id: string;
  status: LeadStatus;
};

export async function updateLead(payload: UpdateLeadPayload): Promise<Lead> {
  const response = await apiRequest(`/leads/${payload.id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: payload.name,
      email: payload.email,
      ...(payload.status !== undefined ? { status: payload.status } : {}),
      ...(payload.phone !== undefined && payload.phone !== ''
        ? { phone: payload.phone }
        : {}),
    }),
  });

  const body: unknown = await response.json();

  if (!response.ok) {
    throw new ApiRequestError(
      getApiErrorMessage(body, 'Failed to update lead'),
      response.status,
      body,
    );
  }

  return (body as ApiSuccessResponse<Lead>).data;
}

export async function deleteLead(id: string): Promise<void> {
  const response = await apiRequest(`/leads/${id}`, {
    method: 'DELETE',
  });

  const body: unknown = await response.json();

  if (!response.ok) {
    throw new ApiRequestError(
      getApiErrorMessage(body, 'Failed to delete lead'),
      response.status,
      body,
    );
  }
}

export async function updateLeadStatus(
  payload: UpdateLeadStatusPayload,
): Promise<Lead> {
  const response = await apiRequest(`/leads/${payload.id}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ status: payload.status }),
  });

  const body: unknown = await response.json();

  if (!response.ok) {
    throw new ApiRequestError(
      getApiErrorMessage(body, 'Failed to update lead status'),
      response.status,
      body,
    );
  }

  return (body as ApiSuccessResponse<Lead>).data;
}
