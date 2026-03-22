import { drizzle, type PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema.js';

export type AppDb = PostgresJsDatabase<typeof schema>;

let _db: AppDb | undefined;

function missingDbMessage() {
  return (
    'DATABASE_URL is not set. In Vercel: open this project → Settings → Environment Variables → add DATABASE_URL for Production (and Preview if needed), then redeploy. ' +
    'Use your Postgres connection string (e.g. Supabase session pooler URI).'
  );
}

/** Lazily connects so the process can boot (e.g. /health) before env is configured. */
export function getDb(): AppDb {
  if (_db) return _db;

  const connectionString = process.env.DATABASE_URL?.trim();
  if (!connectionString) {
    throw new Error(missingDbMessage());
  }

  const isLocal =
    /localhost|127\.0\.0\.1/.test(connectionString) && !connectionString.includes('pooler');
  const max = process.env.VERCEL ? 1 : 10;

  const client = postgres(connectionString, {
    max,
    ...(isLocal ? {} : { ssl: 'require' as const }),
  });

  _db = drizzle(client, { schema });
  return _db;
}

export function isDatabaseConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL?.trim());
}
