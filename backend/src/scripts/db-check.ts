import 'dotenv/config';
import { checkDatabaseConnection, pool } from '../config/database.js';

checkDatabaseConnection()
  .then(() => {
    console.log('Database connection successful.');
  })
  .catch((error: unknown) => {
    const message =
      error instanceof Error ? error.message : 'Unknown database error';
    console.error(message);
    process.exit(1);
  })
  .finally(async () => {
    await pool.end();
  });
