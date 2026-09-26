import { apiRequest } from '../../../lib/api-client.js';
import {
  ApiRequestError,
  getApiErrorMessage,
} from '../../../lib/api-errors.js';
import type { ApiSuccessResponse } from '../../../types/api.js';
import type { AuthUser } from '../../../types/auth.js';

export type LoginPayload = {
  email: string;
  password: string;
};

type MeResponse = ApiSuccessResponse<{
  user: AuthUser;
}>;

export async function fetchCurrentUser(): Promise<AuthUser | null> {
  const response = await apiRequest('/auth/me');

  if (response.status === 401) {
    return null;
  }

  const body: unknown = await response.json();

  if (!response.ok) {
    throw new ApiRequestError(
      getApiErrorMessage(body, 'Failed to load current user'),
      response.status,
      body,
    );
  }

  return (body as MeResponse).data.user;
}

export async function login(payload: LoginPayload): Promise<AuthUser> {
  const response = await apiRequest('/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const body: unknown = await response.json();

  if (!response.ok) {
    throw new ApiRequestError(
      getApiErrorMessage(body, 'Failed to log in'),
      response.status,
      body,
    );
  }

  return (body as MeResponse).data.user;
}

export async function logout(): Promise<void> {
  const response = await apiRequest('/auth/logout', {
    method: 'POST',
  });

  const body: unknown = await response.json();

  if (!response.ok) {
    throw new ApiRequestError(
      getApiErrorMessage(body, 'Failed to log out'),
      response.status,
      body,
    );
  }
}
