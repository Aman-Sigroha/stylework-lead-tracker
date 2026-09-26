import { getApiBaseUrl } from './env.js';

function resolveUrl(path: string): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${getApiBaseUrl()}${normalizedPath}`;
}

export type ApiRequestOptions = Omit<RequestInit, 'headers'> & {
  headers?: HeadersInit;
};

/**
 * Shared HTTP entry point for backend API calls.
 * Lead-specific endpoints will be added in a later step.
 */
export async function apiRequest(
  path: string,
  options: ApiRequestOptions = {},
): Promise<Response> {
  const { headers, ...rest } = options;

  return fetch(resolveUrl(path), {
    ...rest,
    headers: {
      Accept: 'application/json',
      ...headers,
    },
  });
}

export async function apiRequestJson<T>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const response = await apiRequest(path, options);

  if (!response.ok) {
    throw new Error(`API request failed with status ${response.status}`);
  }

  return (await response.json()) as T;
}
