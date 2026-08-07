// Boot an embedded Postgres for local development — a Docker-free alternative
// to `docker compose up db` (handy on machines without Docker).
//
//   npm run db:local            # port 5433, data dir under /tmp, blocks
//   npm run db:local -- --reset # wipe the data dir first
//
// Then run the app against it:
//   DATABASE_URL=postgresql://mc:mc@localhost:5433/mission_control npm run db:migrate
//   DATABASE_URL=postgresql://mc:mc@localhost:5433/mission_control npm run dev
import { rm } from "node:fs/promises";
import os from "node:os";

import EmbeddedPostgres from "embedded-postgres";

// Some containers run as a uid that has no /etc/passwd entry (e.g. uid 501
// when the image declares another user). embedded-postgres calls
// os.userInfo() in its constructor and would crash; synthesize an entry.
try {
  os.userInfo();
} catch {
  os.userInfo = () => ({
    uid: process.getuid(),
    gid: process.getgid(),
    username: process.env.USER ?? "postgres",
    homedir: process.env.HOME ?? "/tmp",
    shell: "/bin/sh",
  });
}

const PORT = 5433; // avoid colliding with docker-compose's 5432
const USER = "mc";
const PASSWORD = "mc";
const DATABASE = "mission_control";
// Overridable: the default /tmp dir may be a small tmpfs (e.g. containers).
const DATA_DIR = process.env.PG_DATA_DIR ?? `/tmp/mission-control-pg-${PORT}`;

const reset = process.argv.includes("--reset");
if (reset) {
  await rm(DATA_DIR, { recursive: true, force: true });
}

const pg = new EmbeddedPostgres({
  databaseDir: DATA_DIR,
  user: USER,
  password: PASSWORD,
  port: PORT,
  persistent: true,
});

await pg.initialise();
await pg.start();
await pg.createDatabase(DATABASE);

console.log(`Embedded Postgres ready: postgresql://${USER}:***@localhost:${PORT}/${DATABASE}`);
console.log(`DATABASE_URL=postgresql://${USER}:${PASSWORD}@localhost:${PORT}/${DATABASE}`);
console.log("Press Ctrl+C to stop.");

// Keep the process alive until interrupted; the DB is stopped on exit.
const shutdown = async () => {
  await pg.stop();
  process.exit(0);
};
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
