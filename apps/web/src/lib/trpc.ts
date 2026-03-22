import { httpBatchLink } from '@trpc/client';
import { createTRPCReact } from '@trpc/react-query';
import superjson from 'superjson';
import type { AppRouter } from '@searchland/api';

export const trpc = createTRPCReact<AppRouter>();

/** In dev, use same-origin `/trpc` via Vite proxy (avoids CORS when using LAN URLs or 127.0.0.1). */
function trpcUrl() {
  if (import.meta.env.DEV) {
    return '/trpc';
  }
  const base = import.meta.env.VITE_API_URL?.replace(/\/$/, '');
  if (base) return `${base}/trpc`;
  return 'http://localhost:3001/trpc';
}

const apiUrl = trpcUrl();

export function createTrpcClient() {
  return trpc.createClient({
    transformer: superjson,
    links: [
      httpBatchLink({
        url: apiUrl,
      }),
    ],
  });
}
