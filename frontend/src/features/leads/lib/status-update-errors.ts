import { ApiRequestError, getApiErrorMessage } from '../../../lib/api-errors.js';

export function getStatusUpdateErrorMessage(error: unknown): string {
  if (error instanceof ApiRequestError) {
    if (error.status === 404) {
      return 'Lead not found. The list will refresh.';
    }

    if (error.status === 400) {
      return getApiErrorMessage(error.body, 'Invalid status update.');
    }

    return 'Unable to update status. Please try again.';
  }

  return 'Unable to update status. Please check your connection and try again.';
}
