function parsePort(value: string | undefined): number {
  if (value === undefined || value === '') {
    return 3000;
  }

  const port = Number(value);
  if (!Number.isInteger(port) || port < 0 || port > 65535) {
    throw new Error(`Invalid PORT: ${value}`);
  }

  return port;
}

function parseCorsOrigin(
  value: string | undefined,
): string | string[] | undefined {
  if (value === undefined || value === '') {
    return undefined;
  }

  const origins = value
    .split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);

  if (origins.length === 0) {
    return undefined;
  }

  return origins.length === 1 ? origins[0] : origins;
}

export const env = {
  port: parsePort(process.env.PORT),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  corsOrigin: parseCorsOrigin(process.env.CORS_ORIGIN),
  databaseUrl: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET ?? '',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
};

export function requireJwtSecret(): string {
  const secret = env.jwtSecret.trim();

  if (secret === '') {
    throw new Error('JWT_SECRET environment variable is required');
  }

  return secret;
}

export function requireDatabaseUrl(): string {
  const databaseUrl = env.databaseUrl;

  if (databaseUrl === undefined || databaseUrl === '') {
    throw new Error('DATABASE_URL environment variable is required');
  }

  return databaseUrl;
}
