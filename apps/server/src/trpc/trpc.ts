import { initTRPC } from '@trpc/server';
import superjson from 'superjson';
import type { AppDb } from '../db/index.js';

export type Context = {
  db: AppDb;
};

const t = initTRPC.context<Context>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;
