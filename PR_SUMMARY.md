# PR: Add package.json + lockfile and scaffold the app so `npm run dev` boots on :3000

## What changed

Scaffolds the v1 application (M1, task 1) on the frozen stack — Next.js 15 + TypeScript + Tailwind:

- **`app/`** — App Router entry points: `layout.tsx` (metadata + root layout), `page.tsx` (minimal landing page), `globals.css` (Tailwind directives).
- **Config** — `tsconfig.json` (strict, Next defaults), `next.config.ts`, `tailwind.config.ts` + `postcss.config.mjs` (Tailwind v3), `eslint.config.mjs` (ESLint 9 flat config via `next/core-web-vitals` + `next/typescript`), `.prettierrc`, `next-env.d.ts`.
- **`package.json`** (was untracked) with `dev`/`build`/`start`/`lint`/`typecheck`/`format`/`test` scripts and the frozen-stack deps (next 15.5, react 19.2, tailwind 3.4, typescript 5.9, vitest, zod, pino, pg, …).
- **`package-lock.json`** — generated with `npm install` (lockfileVersion 3), including all 8 `@next/swc-*` platform entries so `npm ci` / `next build` work on both this arm64 container and the x64 GitHub runners.

## Why

The repo had launch infrastructure but zero application code — the audit flagged missing dependency manifest, lockfile, and app source as critical gaps, and the Dockerfile `CMD ["node", "server.js"]` had nothing to serve. This PR is M1's first step: a real app that boots locally, which the subsequent M1 tasks (Vitest suite, `/api/healthz` + `/api/readyz`, real Dockerfile build, CI) build on.

## How it was tested

- `npm run lint` — clean
- `npm run typecheck` — clean
- `npm run build` — succeeds (static `/` route, 103 kB first load)
- `npm run dev` — boots on http://localhost:3000; `GET /` returns 200 with `<title>Mission Control</title>`; clean startup (no lockfile/SWC warnings)
- `npm ci --dry-run` — lockfile consistent with `package.json` (814 packages; validates the CI install path)
- `bash scripts/launch/audit.sh` — critical gaps reduced from 5 → 2 (remaining: test suite and health endpoint, tracked as the next two M1 tasks); `harden.sh` — no new failures

## Environment note (memory-limited sandbox)

This container's cgroup is capped at 1.5 GB, and full `npm install` of this tree repeatedly OOM-kills (11 kills observed across npm/pnpm/yarn attempts). Verification above was performed while a working `node_modules` was present (same app code, same runtime dep versions: next 15.5.23, react 19.2.8, tailwind 3.4.19, typescript 5.9.3); the only manifest changes since then are test-framework devDependency version ranges, which do not affect the verified paths. CI installs fresh with `npm ci` and has no such constraint.

## Coordination note

A parallel worker for M1 task 2 (Vitest framework, branch `orch/10-…`) ran in this same workspace and folded this task's uncommitted scaffold into its own PR commit ("Includes the M1 task 1 scaffold … so the PR is self-contained", `4799ab6`). This PR restates the task-1 scope on the correct branch (`orch/9-…`). If `orch/10`'s PR merges first, this one can be closed as already-covered; if this merges first, `orch/10` rebases cleanly (its files are pure additions).

## Scope guard

No `.env` files touched, no secrets, no force-push, no changes to `main`. The remaining audit critical gaps (test suite, `/api/healthz` + `/api/readyz`) belong to the next two M1 tasks and are intentionally not implemented here.
