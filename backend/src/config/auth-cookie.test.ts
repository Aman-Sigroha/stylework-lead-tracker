import { afterEach, describe, expect, it, vi } from 'vitest';

const envMock = vi.hoisted(() => ({
  nodeEnv: 'development',
  jwtExpiresIn: '7d',
}));

vi.mock('./env.js', () => ({
  env: envMock,
}));

describe('getAuthCookieOptions', () => {
  afterEach(() => {
    envMock.nodeEnv = 'development';
    envMock.jwtExpiresIn = '7d';
    vi.resetModules();
  });

  async function getOptions() {
    const { getAuthCookieOptions } = await import('./auth-cookie.js');
    return getAuthCookieOptions();
  }

  it('sets maxAge to 3600000 when JWT_EXPIRES_IN is 1h', async () => {
    envMock.jwtExpiresIn = '1h';
    vi.resetModules();

    expect((await getOptions()).maxAge).toBe(3_600_000);
  });

  it('sets maxAge to 604800000 when JWT_EXPIRES_IN is 7d', async () => {
    envMock.jwtExpiresIn = '7d';
    vi.resetModules();

    expect((await getOptions()).maxAge).toBe(604_800_000);
  });

  it('sets maxAge to 900000 when JWT_EXPIRES_IN is 15m', async () => {
    envMock.jwtExpiresIn = '15m';
    vi.resetModules();

    expect((await getOptions()).maxAge).toBe(900_000);
  });

  it('keeps HttpOnly and path unchanged', async () => {
    const options = await getOptions();

    expect(options.httpOnly).toBe(true);
    expect(options.path).toBe('/');
  });

  it('uses secure=false and sameSite=lax in development', async () => {
    envMock.nodeEnv = 'development';
    vi.resetModules();

    const options = await getOptions();

    expect(options.secure).toBe(false);
    expect(options.sameSite).toBe('lax');
  });

  it('uses secure=true and sameSite=none in production', async () => {
    envMock.nodeEnv = 'production';
    vi.resetModules();

    const options = await getOptions();

    expect(options.secure).toBe(true);
    expect(options.sameSite).toBe('none');
  });
});
