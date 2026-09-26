export type ApiValidationDetail = {
  field: string;
  message: string;
};

type ApiErrorBody = {
  success?: false;
  error?: {
    message?: string;
    details?: ApiValidationDetail[];
  };
};

export class ApiRequestError extends Error {
  readonly status: number;
  readonly body: unknown;

  constructor(message: string, status: number, body: unknown) {
    super(message);
    this.name = 'ApiRequestError';
    this.status = status;
    this.body = body;
  }
}

export function getApiErrorMessage(body: unknown, fallback: string): string {
  if (typeof body !== 'object' || body === null) {
    return fallback;
  }

  const error = (body as ApiErrorBody).error;
  return error?.message ?? fallback;
}

export function getApiValidationDetails(
  body: unknown,
): ApiValidationDetail[] | undefined {
  if (typeof body !== 'object' || body === null) {
    return undefined;
  }

  const details = (body as ApiErrorBody).error?.details;
  return Array.isArray(details) ? details : undefined;
}
