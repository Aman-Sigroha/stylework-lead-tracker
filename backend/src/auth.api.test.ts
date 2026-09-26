import jwt from 'jsonwebtoken';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.hoisted(() => {
  process.env.JWT_SECRET = 'test-jwt-secret-for-vitest';
  process.env.JWT_EXPIRES_IN = '1h';
});

const { queryMock } = vi.hoisted(() => ({
  queryMock: vi.fn(),
}));

vi.mock('./config/database.js', () => ({
  query: queryMock,
  pool: {},
  checkDatabaseConnection: vi.fn(),
}));

import request from 'supertest';
import { createApp } from './app.js';
import { AUTH_COOKIE_NAME } from './config/auth-cookie.js';
import { installDefaultQueryMock } from './test/mock-query.js';
import {
  TEST_PASSWORD,
  TEST_USER_EMAIL,
  TEST_USER_ID,
  createAuthCookieHeader,
} from './test/auth-test-helpers.js';

const app = createApp();

beforeEach(() => {
  installDefaultQueryMock(queryMock);
});

describe('POST /api/auth/login', () => {
  it('returns 200 and sets the auth cookie for valid credentials', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: TEST_USER_EMAIL,
        password: TEST_PASSWORD,
      });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      success: true,
      data: {
        user: {
          id: TEST_USER_ID,
          email: TEST_USER_EMAIL,
        },
      },
    });
    expect(response.body.data.user).not.toHaveProperty('password_hash');
    expect(response.headers['set-cookie']?.[0]).toContain(`${AUTH_COOKIE_NAME}=`);
    expect(response.headers['set-cookie']?.[0]).toContain('HttpOnly');
  });

  it('returns 401 for an unknown email', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'missing@example.com',
        password: TEST_PASSWORD,
      });

    expect(response.status).toBe(401);
    expect(response.body.error.message).toBe('Invalid email or password');
  });

  it('returns 401 for an invalid password', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: TEST_USER_EMAIL,
        password: 'wrong-password',
      });

    expect(response.status).toBe(401);
    expect(response.body.error.message).toBe('Invalid email or password');
  });

  it('returns 400 for malformed login body', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'not-an-email', password: '' });

    expect(response.status).toBe(400);
    expect(response.body.error.message).toBe('Validation failed');
  });
});

describe('GET /api/auth/me', () => {
  it('returns the authenticated user', async () => {
    const response = await request(app)
      .get('/api/auth/me')
      .set('Cookie', createAuthCookieHeader());

    expect(response.status).toBe(200);
    expect(response.body.data.user).toEqual({
      id: TEST_USER_ID,
      email: TEST_USER_EMAIL,
    });
    expect(response.body.data.user).not.toHaveProperty('password_hash');
  });

  it('returns 401 when unauthenticated', async () => {
    const response = await request(app).get('/api/auth/me');

    expect(response.status).toBe(401);
    expect(response.body.error.message).toBe('Authentication required');
  });

  it('returns 401 for an invalid JWT', async () => {
    const response = await request(app)
      .get('/api/auth/me')
      .set('Cookie', `${AUTH_COOKIE_NAME}=not-a-valid-token`);

    expect(response.status).toBe(401);
    expect(response.body.error.message).toBe('Authentication required');
  });

  it('returns 401 for an expired JWT', async () => {
    const expiredToken = jwt.sign(
      { sub: TEST_USER_ID, email: TEST_USER_EMAIL },
      process.env.JWT_SECRET!,
      { expiresIn: '-1s' },
    );

    const response = await request(app)
      .get('/api/auth/me')
      .set('Cookie', `${AUTH_COOKIE_NAME}=${expiredToken}`);

    expect(response.status).toBe(401);
    expect(response.body.error.message).toBe('Authentication required');
  });
});

describe('POST /api/auth/logout', () => {
  it('clears the auth cookie', async () => {
    const response = await request(app)
      .post('/api/auth/logout')
      .set('Cookie', createAuthCookieHeader());

    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Logged out successfully');
    expect(response.headers['set-cookie']?.[0]).toMatch(/auth_token=;/);
  });
});

describe('GET /api/health', () => {
  it('remains public without authentication', async () => {
    const response = await request(app).get('/api/health');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });
});
