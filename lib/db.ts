import { Pool } from "pg";

// Single shared connection pool for the app (Postgres via the `pg` driver).
// Reused across hot-reloads in development to avoid exhausting connections.
//
// NOTE ON ORM CHOICE: the v1 stack freeze named Prisma, but Prisma's engine
// binaries are not downloadable in every environment (binaries.prisma.sh is
// blocked in the offline orchestrator container). The persistence layer is
// therefore plain parameterized SQL behind a repository interface
// (lib/auth/repository.ts), so swapping in Prisma later is a one-file change.
const globalForPool = globalThis as unknown as { pgPool?: Pool };

function createPool(): Pool {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set. Copy .env.example to .env and fill it in.");
  }
  return new Pool({ connectionString });
}

export const pool = globalForPool.pgPool ?? createPool();

if (process.env.NODE_ENV !== "production") {
  globalForPool.pgPool = pool;
}
