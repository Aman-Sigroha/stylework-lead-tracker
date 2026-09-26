import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, { type NextFunction, type Request, type Response } from 'express';
import { env } from './config/env.js';
import { authRouter } from './routes/auth.routes.js';
import { healthRouter } from './routes/health.routes.js';
import { leadRouter } from './routes/lead.routes.js';

function buildCorsOptions() {
  if (env.corsOrigin !== undefined) {
    return {
      origin: env.corsOrigin,
      credentials: true,
    };
  }

  return {
    origin: true,
    credentials: true,
  };
}

export function createApp() {
  const app = express();

  app.use(cors(buildCorsOptions()));
  app.use(cookieParser());
  app.use(express.json());

  app.use('/api', healthRouter);
  app.use('/api', authRouter);
  app.use('/api', leadRouter);

  app.use(
    (
      error: unknown,
      _req: Request,
      res: Response,
      next: NextFunction,
    ): void => {
      if (error instanceof SyntaxError && 'body' in error) {
        res.status(400).json({
          success: false,
          error: { message: 'Invalid JSON body' },
        });
        return;
      }

      next(error);
    },
  );

  return app;
}

const app = createApp();

export default app;
