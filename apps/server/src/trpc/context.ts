import type { db } from '../db/index.js';
import type { Context } from './trpc.js';

export function createContext(opts: { db: typeof db }): Context {
  return { db: opts.db };
}
