#!/usr/bin/env bash
# Playwright webServer entrypoint: boot the E2E Postgres, apply migrations,
# then run the Next.js dev server in fully-offline dev mode (no real LLM,
# Resend, or image-provider calls). The smoke test exercises the real HTTP
# routes end-to-end; LLM_DEV_MODE / RESEND_DEV_MODE stand in for providers.
set -euo pipefail
cd "$(dirname "$0")/../.."

export PORT="${PORT:-3100}"
export PG_DATA_DIR="${PG_DATA_DIR:-/tmp/mission-control-e2e-pg}"
export DATABASE_URL="postgresql://mc:mc@127.0.0.1:5433/mission_control"
export AUTH_SECRET="e2e-secret-do-not-use-in-prod"
export AUTH_TRUST_HOST="true"
export RESEND_DEV_MODE="1"
export LLM_DEV_MODE="1"
export APP_URL="http://localhost:${PORT}"

node scripts/e2e/test-db.mjs

# Boot the production artifact (same path as the Docker image) instead of
# `next dev`: cold Turbopack compiles + embedded-Postgres binary downloads
# routinely exceed runner timeouts, and the standalone server starts in
# seconds. test-db.mjs above skips embedded Postgres when :5433 is already
# up (CI provides it as a service container), so this stays fully offline.
npm run build
cp -r .next/static .next/standalone/.next/
cp -r public .next/standalone/public
export HOSTNAME="0.0.0.0"

exec node .next/standalone/server.js
