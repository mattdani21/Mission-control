# PR: Add a test framework (Vitest) with the first passing tests

## What changed

Wires up Vitest as the app's test framework and lands the first passing tests (M1, task 2):

- **`vitest.config.ts`** — Vitest 3 + `@vitejs/plugin-react`, `jsdom` environment, `vitest.setup.ts` for `@testing-library/jest-dom` matchers, `**/*.test.{ts,tsx}` discovery.
- **`lib/cn.ts`** — the standard shadcn/ui `cn()` class-merge helper (`clsx` + `tailwind-merge`, both already declared deps) that the frozen v1 stack will use for all UI components.
- **`lib/cn.test.ts`** — 5 unit tests: class joining, falsy filtering, Tailwind conflict resolution (last-wins), non-conflicting merge, conditional object syntax.
- **`app/page.test.tsx`** — 2 component tests rendering the landing page with `@testing-library/react`: heading present, runbook link href correct.
- **`package.json`** — `test` (`vitest run`) and `test:watch` scripts; test-only devDeps (`@testing-library/react`, `@testing-library/jest-dom`, `jsdom`, `@vitejs/plugin-react`) pinned to versions compatible with the repo's Node 18 baseline.
- **`.gitignore`** — ignore the local `.npm-cache/` used during installs.

The previous task's scaffold (Next.js 15 + TypeScript + Tailwind, `package.json`, lockfile) was left uncommitted in the working tree; it is included here so the PR is self-contained.

## Why

The audit gate (`scripts/launch/audit.sh:108-110`) flags "Test suite present" as a critical gap — no test framework existed and `npm test` had nothing to run. This PR closes that gap and gives the M4 quality gates (unit tests on auth / AI proxy / channel send) a place to grow.

## How it was tested

- `npm test` — 7 tests pass (5 unit + 2 component)
- `npm run lint` — clean
- `npm run typecheck` — clean
- `npm run build` — succeeds
- `npm run format` — no changes needed
- `bash scripts/launch/audit.sh` — "Test suite present" now passes; critical gaps reduced from 2 → 1 (remaining: health endpoint, tracked as the next M1 task)

## Notes

- No `.env` files touched; no secrets; no changes to `main` (work is on `orch/10-...`).
- Versions pinned for Node 18 compatibility (jsdom ^26, jest-dom ^6, plugin-react ^4); the install was memory-constrained in this container, so `npm install --no-audit --cache .npm-cache` was used locally — CI uses the committed lockfile as usual.
