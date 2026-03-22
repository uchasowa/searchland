import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema.js';

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required environment variable: ${name}`);
  return v;
}

const connectionString = requireEnv('DATABASE_URL');

const isLocal =
  /localhost|127\.0\.0\.1/.test(connectionString) && !connectionString.includes('pooler');
const max = process.env.VERCEL ? 1 : 10;

const client = postgres(connectionString, {
  max,
  ...(isLocal ? {} : { ssl: 'require' as const }),
});

export const db = drizzle(client, { schema });
