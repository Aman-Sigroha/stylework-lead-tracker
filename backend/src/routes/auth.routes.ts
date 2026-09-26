import { Router } from 'express';
import {
  loginHandler,
  logoutHandler,
  meHandler,
} from '../controllers/auth.controller.js';
import { requireAuth } from '../middleware/require-auth.js';

export const authRouter = Router();

authRouter.post('/auth/login', loginHandler);
authRouter.post('/auth/logout', logoutHandler);
authRouter.get('/auth/me', requireAuth, meHandler);
