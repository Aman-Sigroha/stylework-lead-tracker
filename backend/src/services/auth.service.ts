import bcrypt from 'bcrypt';
import jwt, { type SignOptions } from 'jsonwebtoken';
import { requireJwtSecret } from '../config/env.js';
import { env } from '../config/env.js';
import { query } from '../config/database.js';
import type { AuthUser } from '../types/auth.types.js';
import type { LoginInput } from '../schemas/login.schema.js';

type UserRow = {
  id: string;
  email: string;
  password_hash: string;
};

function toAuthUser(row: Pick<UserRow, 'id' | 'email'>): AuthUser {
  return {
    id: row.id,
    email: row.email,
  };
}

export async function findUserByEmail(
  email: string,
): Promise<UserRow | null> {
  const result = await query<UserRow>(
    `SELECT id, email, password_hash
     FROM users
     WHERE email = $1`,
    [email],
  );

  return result.rows[0] ?? null;
}

export async function loginUser(
  input: LoginInput,
): Promise<AuthUser | null> {
  const user = await findUserByEmail(input.email);

  if (user === null) {
    return null;
  }

  const passwordMatches = await bcrypt.compare(
    input.password,
    user.password_hash,
  );

  if (!passwordMatches) {
    return null;
  }

  return toAuthUser(user);
}

export function signAuthToken(user: AuthUser): string {
  const signOptions = {
    expiresIn: env.jwtExpiresIn,
  } as SignOptions;

  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
    },
    requireJwtSecret(),
    signOptions,
  );
}

export function verifyAuthToken(token: string): AuthUser | null {
  try {
    const payload = jwt.verify(token, requireJwtSecret());

    if (typeof payload !== 'object' || payload === null) {
      return null;
    }

    const subject = payload.sub;
    const email = payload.email;

    if (typeof subject !== 'string' || typeof email !== 'string') {
      return null;
    }

    return {
      id: subject,
      email,
    };
  } catch {
    return null;
  }
}
