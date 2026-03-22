import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema.js';

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required environment variable: ${name}`);
  return v;
}

const connectionString = requireEnv('DATABASE_URL');

const client = postgres(connectionString, { max: 10 });

export const db = drizzle(client, { schema });
