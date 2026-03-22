import { randomUUID } from 'node:crypto';
import { existsSync, mkdirSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Express, Request, Response } from 'express';
import multer from 'multer';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

/** Vercel serverless FS is read-only except /tmp; local dev uses apps/server/uploads */
export const uploadsDir = process.env.VERCEL
  ? join('/tmp', 'searchland-uploads')
  : join(__dirname, '..', 'uploads');

const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/gif', 'image/webp']);
const MAX_BYTES = 5 * 1024 * 1024;

export function ensureUploadsDir() {
  try {
    if (!existsSync(uploadsDir)) {
      mkdirSync(uploadsDir, { recursive: true });
    }
  } catch {
    /* ignore: e.g. read-only FS; uploads may still fail at runtime */
  }
}

/** Map `/uploads/<file>` to absolute path, or null if unsafe */
export function filePathForPublicUploadUrl(publicPath: string): string | null {
  if (!publicPath.startsWith('/uploads/')) return null;
  const name = publicPath.slice('/uploads/'.length);
  if (!/^[a-zA-Z0-9._-]+$/.test(name) || name.includes('..')) return null;
  return join(uploadsDir, name);
}

export function unlinkUploadPaths(paths: string[]) {
  for (const p of paths) {
    const abs = filePathForPublicUploadUrl(p);
    if (!abs) continue;
    try {
      unlinkSync(abs);
    } catch (e) {
      const err = e as NodeJS.ErrnoException;
      if (err.code !== 'ENOENT') throw e;
    }
  }
}

function extForMime(mimetype: string): string | null {
  switch (mimetype) {
    case 'image/jpeg':
      return '.jpg';
    case 'image/png':
      return '.png';
    case 'image/gif':
      return '.gif';
    case 'image/webp':
      return '.webp';
    default:
      return null;
  }
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    ensureUploadsDir();
    cb(null, uploadsDir);
  },
  filename: (_req, file, cb) => {
    const ext = extForMime(file.mimetype);
    cb(null, `${randomUUID()}${ext ?? '.png'}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: MAX_BYTES, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME.has(file.mimetype)) {
      cb(null, true);
      return;
    }
    cb(new Error('Only JPEG, PNG, GIF, or WebP images are allowed'));
  },
});

export function registerUploadRoutes(app: Express) {
  app.post('/upload', (req: Request, res: Response) => {
    upload.single('file')(req, res, (err: unknown) => {
      if (err) {
        const message = err instanceof Error ? err.message : 'Upload failed';
        res.status(400).json({ error: message });
        return;
      }
      const f = req.file;
      if (!f) {
        res.status(400).json({ error: 'No file' });
        return;
      }
      res.json({ url: `/uploads/${f.filename}` });
    });
  });
}
