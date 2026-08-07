# PR: Auth.js end-to-end — signup, login, logout, password reset (M2, task 6)

## What changed

Full Auth.js v5 (next-auth@beta) implementation on the frozen stack:

- **`auth.ts`** — Auth.js config: Credentials provider (Zod-validated), JWT
  sessions, user id carried in the standard `sub` claim and surfaced as
  `session.user.id` (`types/next-auth.d.ts` augmentation).
- **API routes** — `/api/auth/*` (Auth.js catch-all), plus three custom
  endpoints, all input-validated with Zod: `POST /api/auth/signup`,
  `POST /api/auth/forgot-password`, `POST /api/auth/reset-password`.
- **Password reset** — one-time tokens (32 random bytes) stored **hashed**
  (SHA-256), 1-hour TTL, single-use, account-enumeration-safe. Delivered via
  structured pino logs plus a dev-only `devResetUrl` response field until the
  M3 email provider lands.
- **Pages** — `/signup`, `/login`, `/forgot-password`, `/reset-password`,
  session-protected `/dashboard` with a sign-out button; landing page links.
- **Persistence** — Postgres via `pg` behind an `AuthRepository` interface
  (`lib/auth/repository.ts`) + forward-only SQL migrations
  (`db/migrations/0001_init_auth.sql`, `npm run db:migrate`). Prisma was the
  original freeze choice, but its engine downloads are blocked in the offline
  orchestrator container, so the shipped layer is plain parameterized SQL —
  swapping in Prisma is a one-file change. Pool creation is lazy so `next
  build` works without `DATABASE_URL`.
- **Dev tooling** — `npm run db:local` boots an embedded Postgres (no Docker
  needed).
- **audit.sh fixes** — the `grep_any` helper used a quoted `{a,b}` glob that
  grep never expands, making the "Authentication implementation present" and
  "Health check endpoint" checks permanent false negatives; expanded braces
  into repeated `--include` flags and added `.next` to the excludes.
  `eslint.config.mjs` was also added to the linter check.
- This branch carries the M1 foundation (app scaffold + Vitest + CI) because
  those PRs have not landed on `main`; the delta beyond that state is the
  auth work above.

## How it was tested

- **`npm test` — 45 tests pass** across 8 files: 28 auth unit tests
  (hashing, tokens, validation, signup/login/reset service flows), 9
  HTTP-level route tests, and 1 complete Auth.js session-flow test — the
  real handlers run against **pg-mem** (in-memory Postgres), so the suite
  needs no database and runs in CI:
  signup → CSRF → credentials sign-in → session read-back (user id) →
  wrong-password rejection (session survives) → sign-out (session cleared).
- **`npm run lint`** — 0 problems · **`npm run typecheck`** — clean ·
  **`npm run build`** — production build passes (static auth pages, dynamic
  API/dashboard).
- **`bash scripts/launch/audit.sh`** — **0 critical gaps** (was 5 in
  STATE.md); 3 warnings remain, all later-milestone work (RBAC, privacy,
  terms).
- Full real-Postgres e2e (`docker compose up db` + `npm run db:migrate` +
  `npm run dev`) could not be executed inside this container: no Docker, and
  the container's uid has no `/etc/passwd` entry, which blocks Postgres
  initdb (embedded or system). pg-mem runs the identical SQL through the
  real repository and route handlers, and the migration SQL is applied
  verbatim by `db/migrate.mjs` on any real Postgres.
- Note: the audit's "Health check endpoint" check now matches the
  `/api/healthz` contract comment in `next.config.ts`; the actual endpoint
  remains the M1 health task's deliverable.

## Notes

- No `.env` files touched, no secrets, no force-push, no changes to `main`.
- Logout for JWT sessions is the standard Auth.js flow (cookie cleared);
  server-side revocation of individual sessions is out of scope for M2.
