import { ApiRequestError, getApiErrorMessage } from '../../../lib/api-errors.js';

export function getDeleteLeadErrorMessage(error: unknown): string {
  if (error instanceof ApiRequestError) {
    if (error.status === 404) {
      return 'Lead not found. It may have already been deleted.';
    }

    return getApiErrorMessage(error.body, 'Unable to delete lead. Please try again.');
  }

  return 'Unable to delete lead. Please check your connection and try again.';
}
