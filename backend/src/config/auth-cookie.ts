import { env } from './env.js';

function parseJwtExpiresInToMs(expiresIn: string): number {
  const match = /^(\d+)([smhd])$/.exec(expiresIn.trim());

  if (match === null) {
    throw new Error(`Invalid JWT_EXPIRES_IN: ${expiresIn}`);
  }

  const amount = Number(match[1]);
  const unit = match[2];

  switch (unit) {
    case 's':
      return amount * 1000;
    case 'm':
      return amount * 60 * 1000;
    case 'h':
      return amount * 60 * 60 * 1000;
    case 'd':
      return amount * 24 * 60 * 60 * 1000;
    default:
      throw new Error(`Invalid JWT_EXPIRES_IN: ${expiresIn}`);
  }
}

export const AUTH_COOKIE_NAME = 'auth_token';

export function getAuthCookieOptions(): {
  httpOnly: boolean;
  secure: boolean;
  sameSite: 'lax' | 'none' | 'strict';
  path: string;
  maxAge: number;
} {
  const secure = env.nodeEnv === 'production';
  const maxAge = parseJwtExpiresInToMs(env.jwtExpiresIn);

  return {
    httpOnly: true,
    secure,
    sameSite: secure ? 'none' : 'lax',
    path: '/',
    maxAge: Math.floor(maxAge / 1000),
  };
}
