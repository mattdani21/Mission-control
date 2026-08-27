// Boot an embedded Postgres for E2E tests and apply all migrations.
// Persistent mode keeps the server alive after this process exits, so the
// Playwright webServer can start Next.js against it afterwards.
//
//   node scripts/e2e/test-db.mjs
//
// Idempotent: if Postgres is already listening on :5433 it skips the start
// and just (re-)applies migrations. The dev database on :5432 is untouched.

import { readFile, readdir, rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import pg from "pg";

const PORT = 5433;
const USER = "mc";
const PASSWORD = "mc";
const DATABASE = "mission_control";
const DATA_DIR = process.env.PG_DATA_DIR ?? "/tmp/mission-control-e2e-pg";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = path.join(__dirname, "..", "..", "db", "migrations");

async function isUp() {
  const client = new pg.Client({ host: "127.0.0.1", port: PORT, user: USER, password: PASSWORD, database: "postgres" });
  try {
    await client.connect();
    return true;
  } catch {
    return false;
  } finally {
    await client.end().catch(() => undefined);
  }
}

async function runMigrations() {
  const files = (await readdir(MIGRATIONS_DIR)).filter((f) => f.endsWith(".sql")).sort();
  const client = new pg.Client({ host: "127.0.0.1", port: PORT, user: USER, password: PASSWORD, database: DATABASE });
  await client.connect();
  try {
    for (const file of files) {
      const sql = await readFile(path.join(MIGRATIONS_DIR, file), "utf8");
      for (const statement of sql.split(";")) {
        const trimmed = statement.trim();
        if (trimmed) await client.query(trimmed);
      }
    }
    console.log(`migrations applied (${files.length} files)`);
  } finally {
    await client.end();
  }
}

if (await isUp()) {
  console.log(`embedded postgres already up on :${PORT}`);
} else {
  // Nothing is listening — a leftover data dir is partial/corrupt; rebuild it.
  await rm(DATA_DIR, { recursive: true, force: true });
  const { default: EmbeddedPostgres } = await import("embedded-postgres");
  const pgServer = new EmbeddedPostgres({
    databaseDir: DATA_DIR,
    user: USER,
    password: PASSWORD,
    port: PORT,
    persistent: true,
  });
  await pgServer.initialise();
  await pgServer.start();
  await pgServer.createDatabase(DATABASE).catch(() => undefined);
  console.log(`embedded postgres started on :${PORT}`);
}

// Deterministic state: CI provides a fresh Postgres service; the local
// embedded PG persists across runs (/tmp/mission-control-e2e-pg), so wipe
// the schema before migrations — otherwise leftover due sends from previous
// runs make the cron-tick assertion (sent === 1) fail with stale rows.
{
  const reset = new pg.Client({ host: "127.0.0.1", port: PORT, user: USER, password: PASSWORD, database: DATABASE });
  await reset.connect();
  await reset.query("DROP SCHEMA public CASCADE; CREATE SCHEMA public;");
  await reset.end();
  console.log("e2e schema wiped");
}

await runMigrations();
console.log(`DATABASE_URL=postgresql://${USER}:${PASSWORD}@127.0.0.1:${PORT}/${DATABASE}`);
