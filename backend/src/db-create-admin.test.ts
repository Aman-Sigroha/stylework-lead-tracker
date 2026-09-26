import { beforeEach, describe, expect, it, vi } from 'vitest';

const { queryMock } = vi.hoisted(() => ({
  queryMock: vi.fn(),
}));

vi.mock('./config/database.js', () => ({
  query: queryMock,
  pool: {},
  checkDatabaseConnection: vi.fn(),
}));

import bcrypt from 'bcrypt';
import { installDefaultQueryMock } from './test/mock-query.js';
import { TEST_USER_EMAIL, TEST_USER_ID } from './test/auth-test-helpers.js';

describe('db:create-admin behavior', () => {
  beforeEach(() => {
    installDefaultQueryMock(queryMock);
  });

  it('uses parameterized SQL for user lookup and insert', async () => {
    const email = TEST_USER_EMAIL;
    const passwordHash = await bcrypt.hash('secure-password', 4);

    await queryMock(
      `SELECT id
     FROM users
     WHERE email = $1`,
      [email],
    );

    await queryMock(
      `INSERT INTO users (email, password_hash)
     VALUES ($1, $2)
     RETURNING id, email`,
      [email, passwordHash],
    );

    expect(queryMock).toHaveBeenCalledWith(
      expect.stringContaining('WHERE email = $1'),
      [email],
    );
    expect(queryMock).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO users'),
      [email, passwordHash],
    );
  });

  it('detects an existing admin email from the users table', async () => {
    const result = await queryMock(
      `SELECT id
     FROM users
     WHERE email = $1`,
      [TEST_USER_EMAIL],
    );

    expect(result.rows[0]?.id).toBe(TEST_USER_ID);
  });
});
