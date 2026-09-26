import { afterEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';

const originalDatabaseUrl = process.env.DATABASE_URL;

afterEach(() => {
  if (originalDatabaseUrl === undefined) {
    delete process.env.DATABASE_URL;
  } else {
    process.env.DATABASE_URL = originalDatabaseUrl;
  }
  vi.resetModules();
});

describe('database lazy initialization', () => {
  it('does not require DATABASE_URL when the database module is imported', async () => {
    delete process.env.DATABASE_URL;
    vi.resetModules();

    await expect(import('./database.js')).resolves.toBeDefined();
  });

  it('requires DATABASE_URL only when query is invoked', async () => {
    delete process.env.DATABASE_URL;
    vi.resetModules();

    const { query } = await import('./database.js');

    await expect(query('SELECT 1')).rejects.toThrow(
      'DATABASE_URL environment variable is required',
    );
  });

  it('does not create a pool until query is invoked', async () => {
    delete process.env.DATABASE_URL;
    vi.resetModules();

    const pg = await import('pg');
    const poolSpy = vi.spyOn(pg.default, 'Pool');

    await import('./database.js');

    expect(poolSpy).not.toHaveBeenCalled();

    poolSpy.mockRestore();
  });
});

describe('GET /api/health without DATABASE_URL', () => {
  it('returns 200 without establishing a database connection', async () => {
    delete process.env.DATABASE_URL;
    vi.resetModules();

    const pg = await import('pg');
    const poolSpy = vi.spyOn(pg.default, 'Pool');

    const { createApp } = await import('../app.js');
    const app = createApp();

    const response = await request(app).get('/api/health');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      success: true,
      message: 'API is healthy',
    });
    expect(poolSpy).not.toHaveBeenCalled();

    poolSpy.mockRestore();
  });
});
