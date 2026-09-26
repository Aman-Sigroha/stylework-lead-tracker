import type { NextFunction, Request, Response } from 'express';
import { AUTH_COOKIE_NAME } from '../config/auth-cookie.js';
import { verifyAuthToken } from '../services/auth.service.js';

export function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const token = req.cookies?.[AUTH_COOKIE_NAME];

  if (typeof token !== 'string' || token === '') {
    res.status(401).json({
      success: false,
      error: {
        message: 'Authentication required',
      },
    });
    return;
  }

  const user = verifyAuthToken(token);

  if (user === null) {
    res.status(401).json({
      success: false,
      error: {
        message: 'Authentication required',
      },
    });
    return;
  }

  req.authUser = user;
  next();
}
