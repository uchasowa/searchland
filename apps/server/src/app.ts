import * as trpcExpress from '@trpc/server/adapters/express';
import cors from 'cors';
import express from 'express';
import { db } from './db/index.js';
import { createContext } from './trpc/context.js';
import { appRouter } from './trpc/root.js';
import { ensureUploadsDir, registerUploadRoutes, uploadsDir } from './upload.js';

const defaultOrigins = ['http://localhost:5173', 'http://127.0.0.1:5173'];
const extra = process.env.CORS_ORIGIN?.split(',').map((s) => s.trim()).filter(Boolean) ?? [];
const allowedOrigins = [...defaultOrigins, ...extra];

const isProd = process.env.NODE_ENV === 'production';

function originAllowed(origin: string | undefined): boolean {
  if (!origin) return true;
  if (allowedOrigins.includes(origin)) return true;
  if (!isProd) {
    try {
      const { hostname, protocol } = new URL(origin);
      if (protocol !== 'http:' && protocol !== 'https:') return false;
      if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]') return true;
      if (/^192\.168\.\d{1,3}\.\d{1,3}$/.test(hostname)) return true;
      if (/^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostname)) return true;
      if (/^172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}$/.test(hostname)) return true;
    } catch {
      return false;
    }
  }
  if (process.env.VERCEL) {
    try {
      const { hostname } = new URL(origin);
      if (hostname.endsWith('.vercel.app')) return true;
    } catch {
      return false;
    }
  }
  return false;
}

export function createApp() {
  const app = express();

  if (process.env.VERCEL) {
    app.use((req, _res, next) => {
      const u = req.url ?? '/';
      if (u === '/api' || u.startsWith('/api/')) {
        req.url = u.slice(4) || '/';
      }
      next();
    });
  }

  ensureUploadsDir();
  app.use('/uploads', express.static(uploadsDir));
  registerUploadRoutes(app);

  app.use(
    cors({
      origin: (origin, cb) => cb(null, originAllowed(origin)),
      credentials: true,
    })
  );

  app.get('/health', (_req, res) => {
    res.json({ ok: true });
  });

  app.use(
    '/trpc',
    trpcExpress.createExpressMiddleware({
      router: appRouter,
      createContext: () => createContext({ db }),
    })
  );

  return app;
}
