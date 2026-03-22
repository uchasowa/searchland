/** API origin for non-dev (or empty in dev when using Vite proxy). */
export function apiOrigin(): string {
  if (import.meta.env.DEV) {
    return '';
  }
  return import.meta.env.VITE_API_URL?.replace(/\/$/, '') ?? 'http://localhost:3001';
}

/** Turn a stored path like `/uploads/…` into a full URL for `<img src>`. */
export function publicFileUrl(path: string): string {
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  return `${apiOrigin()}${path}`;
}

export async function uploadFeedbackImage(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch(`${apiOrigin()}/upload`, {
    method: 'POST',
    body: formData,
  });
  const text = await res.text();
  if (!res.ok) {
    let message = 'Upload failed';
    try {
      const j = JSON.parse(text) as { error?: string };
      if (j.error) message = j.error;
    } catch {
      if (text) message = text;
    }
    throw new Error(message);
  }
  const data = JSON.parse(text) as { url: string };
  if (!data.url?.startsWith('/uploads/')) {
    throw new Error('Invalid upload response');
  }
  return data.url;
}
