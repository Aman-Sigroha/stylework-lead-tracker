import type { Request, Response } from 'express';
import {
  AUTH_COOKIE_NAME,
  getAuthCookieOptions,
} from '../config/auth-cookie.js';
import { loginSchema } from '../schemas/login.schema.js';
import { loginUser, signAuthToken } from '../services/auth.service.js';

function formatValidationErrors(
  issues: { path: PropertyKey[]; message: string }[],
) {
  return issues.map((issue) => ({
    field: issue.path.map(String).join('.') || 'body',
    message: issue.message,
  }));
}

export async function loginHandler(
  req: Request,
  res: Response,
): Promise<void> {
  const parsed = loginSchema.safeParse(req.body);

  if (!parsed.success) {
    res.status(400).json({
      success: false,
      error: {
        message: 'Validation failed',
        details: formatValidationErrors(parsed.error.issues),
      },
    });
    return;
  }

  try {
    const user = await loginUser(parsed.data);

    if (user === null) {
      res.status(401).json({
        success: false,
        error: {
          message: 'Invalid email or password',
        },
      });
      return;
    }

    const token = signAuthToken(user);
    res.cookie(AUTH_COOKIE_NAME, token, getAuthCookieOptions());

    res.status(200).json({
      success: true,
      data: {
        user,
      },
    });
  } catch (error) {
    console.error('Login failed:', error);
    res.status(500).json({
      success: false,
      error: {
        message: 'Failed to log in',
      },
    });
  }
}

export function logoutHandler(_req: Request, res: Response): void {
  res.clearCookie(AUTH_COOKIE_NAME, getAuthCookieOptions());
  res.status(200).json({
    success: true,
    message: 'Logged out successfully',
  });
}

export function meHandler(req: Request, res: Response): void {
  const user = req.authUser;

  if (user === undefined) {
    res.status(401).json({
      success: false,
      error: {
        message: 'Authentication required',
      },
    });
    return;
  }

  res.status(200).json({
    success: true,
    data: {
      user,
    },
  });
}
