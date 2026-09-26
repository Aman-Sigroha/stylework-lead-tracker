import 'dotenv/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createApp } from './app.js';
import { env } from './config/env.js';

const app = createApp();

export default app;

const isDirectExecution =
  process.argv[1] !== undefined &&
  path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));

if (isDirectExecution && process.env.VERCEL !== '1') {
  app.listen(env.port, () => {
    console.log(`Server listening on port ${env.port}`);
  });
}
