import type { AppDb } from '../db/index.js';
import type { Context } from './trpc.js';

export function createContext(opts: { db: AppDb }): Context {
  return { db: opts.db };
}
