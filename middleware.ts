import { NextRequest, NextResponse } from "next/server";

/**
 * Edge middleware: security headers on every response, and a lightweight
 * per-IP rate limiter on the auth + AI proxy routes (brute-force and
 * runaway-cost protection for the pilot — an in-memory window per instance,
 * which is sufficient for a single Railway instance).
 *
 * Headers are always set; a strict-ish CSP is added only in production
 * because Next dev needs inline scripts/eval for HMR.
 */

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 60;

const hits = new Map<string, { count: number; resetAt: number }>();

const PROD_CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self'",
  "connect-src 'self'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join("; ");

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // ── Security headers ──
  response.headers.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  if (process.env.NODE_ENV === "production") {
    response.headers.set("Content-Security-Policy", PROD_CSP);
  }

  // ── Rate limiting: auth (brute force) + AI (cost) ──
  const { pathname } = request.nextUrl;
  if (pathname.startsWith("/api/auth/") || pathname.startsWith("/api/ai/")) {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    const key = `${ip}:${pathname}`;
    const now = Date.now();
    const entry = hits.get(key);
    if (!entry || entry.resetAt < now) {
      hits.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    } else {
      entry.count += 1;
      if (entry.count > RATE_LIMIT_MAX) {
        return NextResponse.json(
          { error: "Too many requests. Try again shortly." },
          { status: 429, headers: { "Retry-After": "60" } },
        );
      }
    }
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|assets/).*)"],
};
