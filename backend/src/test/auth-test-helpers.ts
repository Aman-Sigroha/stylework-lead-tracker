import bcrypt from 'bcrypt';
import { AUTH_COOKIE_NAME } from '../config/auth-cookie.js';
import { signAuthToken } from '../services/auth.service.js';
import type { AuthUser } from '../types/auth.types.js';

export const TEST_USER_ID = '11111111-1111-1111-1111-111111111111';
export const TEST_USER_EMAIL = 'admin@example.com';
export const TEST_PASSWORD = 'correct-password';
export const TEST_PASSWORD_HASH = bcrypt.hashSync(TEST_PASSWORD, 4);

export const TEST_JWT_SECRET = 'test-jwt-secret-for-vitest';

export function createTestAuthUser(
  overrides: Partial<AuthUser> = {},
): AuthUser {
  return {
    id: TEST_USER_ID,
    email: TEST_USER_EMAIL,
    ...overrides,
  };
}

export function createAuthCookieHeader(user: AuthUser = createTestAuthUser()): string {
  const token = signAuthToken(user);
  return `${AUTH_COOKIE_NAME}=${token}`;
}
