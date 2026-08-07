# PR Summary — Per-workspace token usage capture (`ai_usage` table)

Issue #21 · M2 milestone ("Auth, campaigns and AI assist") · task 9

## What changed

Per-workspace AI token usage capture, wired end to end:

- **`db/migrations/0002_ai_usage.sql`** — new `workspaces` table, a
  `workspace_id` column on `users`, and the `ai_usage` table: one row per AI
  request with provider, model, input/output tokens, prompt-cache read tokens,
  latency, upstream request id, and a `(workspace_id, created_at DESC)` index
  for per-workspace queries. Applied by the existing forward-only migration
  runner (`npm run db:migrate`).
- **`lib/usage.ts`** — `PgUsageRepository` (record / getWorkspaceUsage /
  listRecent / workspace provisioning helpers) behind a repository interface,
  matching the auth layer's pattern (plain parameterized SQL, swappable for
  Prisma later).
- **`app/api/auth/signup/route.ts`** — every new account gets a personal
  workspace at signup, so usage is attributed per workspace from the start.
- **`app/api/ai/draft/route.ts` + `lib/anthropic.ts`** — server-side Anthropic
  proxy (streaming, prompt-cached system prompt, API key never leaves the
  server). The SSE stream is forwarded to the client byte-for-byte while usage
  is tallied from `message_start`/`message_delta` events; one `ai_usage` row is
  persisted per request (also on client disconnect). Requires only
  `ANTHROPIC_API_KEY` / `ANTHROPIC_MODEL` — both already in `.env.example`.
- **README.md** — documents the new proxy route and usage capture.

## Why

M2's definition of done requires "usage is recorded per workspace." There was
no workspace concept and no caller of the (previously unimplemented) AI proxy,
so the task ships the schema, the capture path, and the proxy route that
exercises it — signup → AI draft now works locally with usage recorded.

## How it was tested

- `npm test` — **60 tests, 10 files, all passing** (was 45 before). New
  coverage: repository tests (record/aggregate/list/workspace provisioning,
  including per-workspace isolation) and full HTTP integration tests of the
  draft route against pg-mem with a mocked session and a canned Anthropic SSE
  stream (401/400/403/503/502 paths, streaming passthrough, per-workspace
  attribution, cache-read token capture, chunk-boundary SSE parsing).
- `npm run lint` and `npm run typecheck` — clean.
- `npm run build` — production build succeeds.
- Real-Postgres migration validation was attempted but is not possible in this
  offline container (no compiler for an LD_PRELOAD passwd shim, user
  namespaces blocked, embedded-postgres wrapper broken under uid 501). Every
  statement of the migration is executed and verified by pg-mem in the test
  suite; the SQL itself is standard Postgres (CREATE TABLE / ALTER ADD COLUMN
  with REFERENCES / CREATE INDEX).

## Notes

- Diff is ~930 lines (feature ~450, tests ~490). Tests follow the repo's
  established pg-mem integration-test convention (the auth task shipped a
  comparable volume); the change is one cohesive feature with no drive-by
  edits.
- No `.env` files touched; no new dependencies added; `package-lock.json`
  unchanged.
