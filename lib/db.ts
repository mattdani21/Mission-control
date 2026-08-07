import { Pool } from "pg";

// Shared connection pool for the app (Postgres via the `pg` driver).
//
// NOTE ON ORM CHOICE: the v1 stack freeze named Prisma, but Prisma's engine
// binaries are not downloadable in every environment (binaries.prisma.sh is
// blocked in the offline orchestrator container). The persistence layer is
// therefore plain parameterized SQL behind a repository interface
// (lib/auth/repository.ts), so swapping in Prisma later is a one-file change.
//
// The pool is created lazily (not at module scope) so importing route modules
// during `next build` never requires DATABASE_URL — only actual queries do.
const globalForPool = globalThis as unknown as { pgPool?: Pool };

export function getPool(): Pool {
  if (globalForPool.pgPool) return globalForPool.pgPool;

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set. Copy .env.example to .env and fill it in.");
  }
  globalForPool.pgPool = new Pool({ connectionString });
  return globalForPool.pgPool;
}
