import { NextResponse } from "next/server";

import { getPool } from "../../../lib/db";

// GET /api/readyz — readiness probe: the app is ready when the database is
// reachable. Returns 200 when `SELECT 1` succeeds, 503 otherwise. Kept out
// of the Docker HEALTHCHECK (which uses /api/healthz) so a brief DB blip
// doesn't kill the container — Railway and orchestrators use this one.
export async function GET() {
  try {
    if (!process.env.DATABASE_URL) {
      return NextResponse.json({ status: "not_ready", reason: "DATABASE_URL not set" }, { status: 503 });
    }
    await getPool().query("SELECT 1");
    return NextResponse.json({ status: "ready" });
  } catch {
    return NextResponse.json({ status: "not_ready", reason: "database unreachable" }, { status: 503 });
  }
}
