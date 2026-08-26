import { NextResponse } from "next/server";

// GET /api/healthz — liveness probe for load balancers, Docker HEALTHCHECK
// and Railway's healthcheckPath. Dependency-free on purpose: a dead process
// is what this detects, not a dead database (see /api/readyz for that).
export function GET() {
  return NextResponse.json({ status: "ok" });
}
