import 'dotenv/config';
import bcrypt from 'bcrypt';
import { z } from 'zod';
import { query } from '../config/database.js';

const adminEnvSchema = z.object({
  ADMIN_EMAIL: z
    .string()
    .trim()
    .min(1, 'ADMIN_EMAIL is required')
    .pipe(z.email({ error: 'ADMIN_EMAIL must be a valid email address' })),
  ADMIN_PASSWORD: z
    .string()
    .min(8, 'ADMIN_PASSWORD must be at least 8 characters'),
});

async function main(): Promise<void> {
  const parsed = adminEnvSchema.safeParse({
    ADMIN_EMAIL: process.env.ADMIN_EMAIL,
    ADMIN_PASSWORD: process.env.ADMIN_PASSWORD,
  });

  if (!parsed.success) {
    const message = parsed.error.issues.map((issue) => issue.message).join('; ');
    console.error(`Invalid admin configuration: ${message}`);
    process.exit(1);
  }

  const { ADMIN_EMAIL: email, ADMIN_PASSWORD: password } = parsed.data;

  const existing = await query<{ id: string }>(
    `SELECT id
     FROM users
     WHERE email = $1`,
    [email],
  );

  if (existing.rows[0] !== undefined) {
    console.error(`Admin user already exists for email: ${email}`);
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const inserted = await query<{ id: string; email: string }>(
    `INSERT INTO users (email, password_hash)
     VALUES ($1, $2)
     RETURNING id, email`,
    [email, passwordHash],
  );

  const user = inserted.rows[0];

  if (user === undefined) {
    console.error('Failed to create admin user.');
    process.exit(1);
  }

  console.log(`Admin user created: ${user.email} (${user.id})`);
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : 'Unknown error';
  console.error(`Failed to create admin user: ${message}`);
  process.exit(1);
});
