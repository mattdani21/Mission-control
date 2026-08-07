# PR: Add a test framework (Vitest) with the first passing tests

## What changed

Wires up Vitest as the app's test framework and lands the first passing tests (M1, task 2):

- **`vitest.config.ts`** — Vitest 3 config: `node` environment, `**/*.test.{ts,tsx}` discovery, and esbuild's automatic JSX runtime so `.tsx` tests compile without a React plugin.
- **`lib/cn.ts`** — the standard shadcn/ui `cn()` class-merge helper (`clsx` + `tailwind-merge`, both already declared deps) that the frozen v1 stack will use for UI components.
- **`lib/cn.test.ts`** — 5 unit tests: class joining, falsy filtering, Tailwind conflict resolution (last-wins), non-conflicting merge, conditional object syntax.
- **`app/page.test.tsx`** — 2 component tests for the landing page rendered via `react-dom/server` (`renderToStaticMarkup`): heading and runbook link. No DOM emulation needed, so the suite runs with zero new dependencies.
- **`package.json`** — `test` (`vitest run`) and `test:watch` scripts (vitest was already declared in the manifest); the manifest is unchanged otherwise, so `package-lock.json` stays in sync and `npm ci` keeps working.
- **`.gitignore`** — ignore the local `.npm-cache/` / `npm-global/` directories used for installs in this container.
- **`app/page.tsx`** — one-line Prettier reformat so `npm run format` is clean.

The previous task's scaffold (Next.js 15 + TypeScript + Tailwind, `package.json`, lockfile) was left uncommitted in the working tree; it is included here so the PR is self-contained.

## Why

The audit gate (`scripts/launch/audit.sh:108-110`) flags "Test suite present" as a critical gap — no test framework existed and `npm test` had nothing to run. This PR closes that gap and gives the M4 quality gates (unit tests on auth / AI proxy / channel send) a place to grow.

## How it was tested

- `npm test` — **7 tests pass** (5 unit + 2 component)
- `eslint .` (project config) on the new/changed files — clean
- `tsc --noEmit` with the project's compiler options on the new files — clean
- `prettier --check` — clean (after the `app/page.tsx` reformat)
- `bash scripts/launch/audit.sh` — "Test suite present" now passes; critical gaps reduced from 2 → 1 (remaining: health endpoint, tracked as the next M1 task)

## Environment notes

- This container has a 1.5 GB memory cgroup and a blocked `nodejs.org`; full `npm install` of the dependency tree is OOM-killed by the host, so local verification used `npm 10` (installed locally via `npm i -g npm@10 --prefix npm-global`) and a minimal `--no-save` install of just the test/tooling packages. The committed `package.json` + `package-lock.json` are unchanged and consistent, so `npm ci` on CI (where memory is not constrained) installs the full tree as usual.
- No `.env` files touched; no secrets; no changes to `main` (work is on `orch/10-...`).
