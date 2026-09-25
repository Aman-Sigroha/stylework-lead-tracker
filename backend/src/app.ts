import cors from 'cors';
import express from 'express';
import { env } from './config/env.js';
import { healthRouter } from './routes/health.routes.js';

export function createApp() {
  const app = express();

  app.use(
    cors(
      env.corsOrigin !== undefined ? { origin: env.corsOrigin } : undefined,
    ),
  );
  app.use(express.json());

  app.use('/api', healthRouter);

  return app;
}
