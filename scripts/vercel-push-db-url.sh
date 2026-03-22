#!/usr/bin/env bash
# Push DATABASE_URL from apps/server/.env to a linked Vercel project (Production + Preview).
# Prereqs: `npx vercel@latest login` and `cd apps/web` (or apps/server) && `npx vercel@latest link`
set -euo pipefail

REPO="$(cd "$(dirname "$0")/.." && pwd)"
TARGET="${1:-web}"

if [[ "$TARGET" != "web" && "$TARGET" != "server" ]]; then
  echo "Usage: $0 [web|server]"
  echo "  web    — project whose Root Directory is apps/web (combined UI + api/)"
  echo "  server — project whose Root Directory is apps/server (API-only)"
  exit 1
fi

CWD="$REPO/apps/$TARGET"
if [[ ! -f "$CWD/.vercel/project.json" ]]; then
  echo "No Vercel link in $CWD"
  echo "Run once:"
  echo "  cd $CWD && npx vercel@latest link"
  exit 1
fi

if [[ ! -f "$REPO/apps/server/.env" ]]; then
  echo "Put your connection string in: $REPO/apps/server/.env"
  echo "  DATABASE_URL=postgresql://..."
  exit 1
fi

push_env() {
  local env_name="$1"
  node "$REPO/scripts/read-database-url.cjs" | npx vercel@latest env add DATABASE_URL "$env_name" \
    --yes --sensitive --non-interactive --force --cwd "$CWD"
}

echo "Uploading DATABASE_URL to Vercel ($TARGET) → Production…"
push_env production
echo "Uploading DATABASE_URL → Preview…"
push_env preview || {
  echo "Preview upload failed (CLI preview/branch quirks are common). Add Preview in the dashboard or run:"
  echo "  cd $CWD && npx vercel@latest env add DATABASE_URL preview"
  exit 1
}

echo "Done. Redeploy in Vercel (Deployments → … → Redeploy) so new env applies."
