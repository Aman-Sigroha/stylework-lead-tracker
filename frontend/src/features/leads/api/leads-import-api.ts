import { apiRequest } from '../../../lib/api-client.js';
import {
  ApiRequestError,
  getApiErrorMessage,
} from '../../../lib/api-errors.js';
import type { ApiSuccessResponse } from '../../../types/api.js';
import type {
  LeadImportConfirmResult,
  LeadImportPreview,
  LeadImportPreviewLead,
} from '../../../types/lead-import.js';

export async function previewLeadImport(file: File): Promise<LeadImportPreview> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await apiRequest('/leads/import/preview', {
    method: 'POST',
    body: formData,
  });

  const body: unknown = await response.json();

  if (!response.ok) {
    throw new ApiRequestError(
      getApiErrorMessage(body, 'Failed to preview CSV import'),
      response.status,
      body,
    );
  }

  return (body as ApiSuccessResponse<LeadImportPreview>).data;
}

export async function confirmLeadImport(
  leads: LeadImportPreviewLead[],
): Promise<LeadImportConfirmResult> {
  const response = await apiRequest('/leads/import/confirm', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ leads }),
  });

  const body: unknown = await response.json();

  if (!response.ok) {
    throw new ApiRequestError(
      getApiErrorMessage(body, 'Failed to import leads'),
      response.status,
      body,
    );
  }

  return (body as ApiSuccessResponse<LeadImportConfirmResult>).data;
}
