import { apiRequest, apiRequestJson } from '../../../lib/api-client.js';
import {
  ApiRequestError,
  getApiErrorMessage,
} from '../../../lib/api-errors.js';
import type { ApiSuccessResponse } from '../../../types/api.js';
import type { Lead, LeadSearchBy, LeadStatus } from '../../../types/lead.js';

export type CreateLeadPayload = {
  name: string;
  email: string;
  phone?: string;
  status?: LeadStatus;
};

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

export type UpdateLeadStatusPayload = {
  id: string;
  status: LeadStatus;
};

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
