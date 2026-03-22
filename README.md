# Feedback

React (Vite) + Tailwind frontend, Node + Express + tRPC + Drizzle backend, Postgres. Set `DATABASE_URL` in `apps/server/.env` (Supabase session pooler works well).

## Stack

- Monorepo: `apps/web`, `apps/server`; `pnpm dev` starts both
- Feedback CRUD backed by Postgres
- Routes: `/`, `/new`, `/feedback/:id`, `/edit/:id`
- API: tRPC + Zod; DB: Drizzle + SQL migrations in `apps/server/drizzle/`

## Prerequisites

- Node 20+
- pnpm 9 (`npx pnpm@9.15.0 …` is fine if pnpm isn’t global)
- Postgres (Supabase is fine)

## Setup

Supabase: use the session pooler URI from the dashboard (Connect → session pooler). The default `db.*.supabase.co` host often hits `ENOTFOUND` on IPv4-only networks; the pooler string usually fixes it.

1. Copy env and set the database URL:

   ```bash
   cp .env.example apps/server/.env
   ```

   Put your Postgres URI in `DATABASE_URL` inside `apps/server/.env`.

2. Install and migrate:

   ```bash
   pnpm install
   pnpm db:migrate
   ```

   That applies every file in `apps/server/drizzle/` (schema, optional fields, seed data, `image_urls` for uploads).

3. Run:

   ```bash
   pnpm dev
   ```

   - Web: http://localhost:5173  
   - API: http://localhost:3001 (tRPC at `/trpc`)

In dev the Vite app proxies `/trpc`, `/upload`, and `/uploads` to the API so you don’t need CORS tweaks. For a production build with the API on another host, set `VITE_API_URL` in `apps/web/.env`.

## Scripts

| Command | Purpose |
| --- | --- |
| `pnpm dev` | API + Vite |
| `pnpm build` | Production build |
| `pnpm lint` | ESLint |
| `pnpm format` | Prettier |
| `pnpm db:generate` | New Drizzle migration |
| `pnpm db:migrate` | Apply migrations |
| `pnpm db:studio` | Drizzle Studio |

## Vercel

**Frontend + API in one project:** set **Root Directory** to **`apps/web`**. See `apps/web/vercel.json`; install/build use `cd ../.. && pnpm …` from the monorepo root.

**API-only project** (e.g. `searchland-server`): set **Root Directory** to **`apps/server`**. `apps/server/vercel.json` builds with `pnpm run build` and serves all routes through `api/index.mjs` (default export is the serverless handler). Do **not** point Vercel’s entry at `src/app.ts` / `src/app.js` — use the `api/` route instead.

Set **`DATABASE_URL`** in Vercel → **Environment Variables** for **each** project that runs the API. If the frontend and API are separate Vercel projects, you must add `DATABASE_URL` to **both** (or only to the server project if the UI calls that URL). Values are not copied between projects.

Clear any **Output Directory** override in the dashboard (use `dist` from config) when using the `apps/web` deploy described above.

