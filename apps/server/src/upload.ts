import { randomUUID } from 'node:crypto';
import { existsSync, mkdirSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Express, Request, Response } from 'express';
import multer from 'multer';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

/** Local dev: repo folder. Vercel + disk mode (not recommended): /tmp — still ephemeral across instances. */
export const uploadsDir = process.env.VERCEL
  ? join('/tmp', 'searchland-uploads')
  : join(__dirname, '..', 'uploads');

const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/gif', 'image/webp']);
const MAX_BYTES = 5 * 1024 * 1024;

export function objectStorageConfigured(): boolean {
  return Boolean(
    process.env.SUPABASE_URL?.trim() &&
      process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() &&
      process.env.SUPABASE_STORAGE_BUCKET?.trim()
  );
}

let _supabase: SupabaseClient | undefined;

function getSupabase(): SupabaseClient {
  if (!_supabase) {
    const url = process.env.SUPABASE_URL!.trim();
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY!.trim();
    _supabase = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return _supabase;
}

/** Object key inside the bucket from a public object URL. */
export function supabaseObjectPathFromPublicUrl(publicUrl: string, bucket: string): string | null {
  try {
    const u = new URL(publicUrl);
    const prefix = `/storage/v1/object/public/${bucket}/`;
    if (!u.pathname.startsWith(prefix)) return null;
    return decodeURIComponent(u.pathname.slice(prefix.length));
  } catch {
    return null;
  }
}

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
  const bucket = process.env.SUPABASE_STORAGE_BUCKET?.trim();
  for (const p of paths) {
    if (p.startsWith('https://') && objectStorageConfigured() && bucket) {
      const key = supabaseObjectPathFromPublicUrl(p, bucket);
      if (key) {
        void getSupabase()
          .storage.from(bucket)
          .remove([key])
          .then(({ error }) => {
            if (error) console.error('[upload] Supabase remove failed:', error.message);
          });
      }
      continue;
    }
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

const diskStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    ensureUploadsDir();
    cb(null, uploadsDir);
  },
  filename: (_req, file, cb) => {
    const ext = extForMime(file.mimetype);
    cb(null, `${randomUUID()}${ext ?? '.png'}`);
  },
});

const diskUpload = multer({
  storage: diskStorage,
  limits: { fileSize: MAX_BYTES, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME.has(file.mimetype)) {
      cb(null, true);
      return;
    }
    cb(new Error('Only JPEG, PNG, GIF, or WebP images are allowed'));
  },
});

const memoryUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_BYTES, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME.has(file.mimetype)) {
      cb(null, true);
      return;
    }
    cb(new Error('Only JPEG, PNG, GIF, or WebP images are allowed'));
  },
});

async function uploadBufferToSupabase(buffer: Buffer, mimetype: string): Promise<string> {
  const bucket = process.env.SUPABASE_STORAGE_BUCKET!.trim();
  const ext = extForMime(mimetype) ?? '.png';
  const objectPath = `feedback/${randomUUID()}${ext}`;
  const supabase = getSupabase();
  const { error } = await supabase.storage.from(bucket).upload(objectPath, buffer, {
    contentType: mimetype,
    upsert: false,
  });
  if (error) throw new Error(error.message);
  const { data } = supabase.storage.from(bucket).getPublicUrl(objectPath);
  return data.publicUrl;
}

function handleUploadResult(req: Request, res: Response, err: unknown): void {
  void (async () => {
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
    if (objectStorageConfigured()) {
      try {
        const buf = (f as Express.Multer.File & { buffer?: Buffer }).buffer;
        if (!buf) {
          res.status(500).json({ error: 'Missing file buffer' });
          return;
        }
        const url = await uploadBufferToSupabase(buf, f.mimetype);
        res.json({ url });
      } catch (e) {
        const message = e instanceof Error ? e.message : 'Upload failed';
        res.status(500).json({ error: message });
      }
      return;
    }
    res.json({ url: `/uploads/${f.filename}` });
  })();
}

export function registerUploadRoutes(app: Express) {
  app.post('/upload', (req: Request, res: Response) => {
    if (process.env.VERCEL && !objectStorageConfigured()) {
      res.status(503).json({
        error:
          'Uploads on Vercel need Supabase Storage. Set SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, and SUPABASE_STORAGE_BUCKET (public bucket).',
      });
      return;
    }

    const uploader = objectStorageConfigured() ? memoryUpload : diskUpload;
    uploader.single('file')(req, res, (err) => handleUploadResult(req, res, err));
  });
}
