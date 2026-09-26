import { apiRequest, apiRequestJson } from '../../../lib/api-client.js';
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

  if (params.page !== undefined) {
    query.set('page', String(params.page));
  }

  if (params.limit !== undefined) {
    query.set('limit', String(params.limit));
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
  return queryString === '' ? '/leads' : `/leads?${queryString}`;
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
