import { readFile } from "node:fs/promises";

import { newDb } from "pg-mem";
import { beforeAll, describe, expect, it, vi } from "vitest";

import { POST as signupPOST } from "../../app/api/auth/signup/route";
import { authenticateUser } from "./service";

/**
 * Full Auth.js session-flow integration test: signup → credentials sign-in →
 * session read-back → signout. Runs the real Auth.js handlers
 * (/api/auth/callback/credentials, /api/auth/session, /api/auth/signout)
 * against pg-mem, exactly like the app does in production.
 */
type MemDb = ReturnType<typeof newDb>;

vi.mock("pg", async () => {
  const migrations = [
    await readFile(new URL("../../db/migrations/0001_init_auth.sql", import.meta.url), "utf8"),
    await readFile(new URL("../../db/migrations/0002_ai_usage.sql", import.meta.url), "utf8"),
  ];
  const db = newDb();
  for (const sql of migrations) {
    for (const statement of sql.split(";")) {
      const trimmed = statement.trim();
      if (trimmed) await db.public.none(trimmed);
    }
  }
  (globalThis as unknown as { __pgMemDb: MemDb }).__pgMemDb = db;
  return db.adapters.createPg();
});

// The Auth.js catch-all route handlers (framework-agnostic Request/Response).
import { GET as authGet, POST as authPost } from "../../app/api/auth/[...nextauth]/route";

function cookieJar(): { store: Map<string, string>; get: () => string; setFrom: (response: Response) => void } {
  const store = new Map<string, string>();
  return {
    store,
    get: () =>
      Array.from(store.entries())
        .map(([name, value]) => `${name}=${value}`)
        .join("; "),
    setFrom(response) {
      // Node 18 lacks headers.getSetCookie(); fall back to splitting the
      // combined header (safe here: Auth.js cookie values contain no commas).
      const cookies: string[] =
        typeof response.headers.getSetCookie === "function"
          ? response.headers.getSetCookie()
          : (response.headers.get("set-cookie") ?? "").split(", ").filter(Boolean);
      for (const raw of cookies) {
        const [pair] = raw.split(";");
        const eq = pair.indexOf("=");
        if (eq > 0) store.set(pair.slice(0, eq), pair.slice(eq + 1));
      }
    },
  };
}

async function request(
  method: string,
  path: string,
  cookies: string,
  body?: URLSearchParams,
): Promise<Response> {
  const handler = (method === "GET" ? authGet : authPost) as unknown as (
    req: Request,
  ) => Promise<Response>;
  return handler(
    new Request(`http://localhost${path}`, {
      method,
      headers: {
        "content-type": "application/x-www-form-urlencoded",
        cookie: cookies,
      },
      body: body ? body.toString() : undefined,
    }),
  );
}

beforeAll(() => {
  process.env.AUTH_SECRET = "test-secret-that-is-long-enough-for-authjs-hs256-signing-0123456789";
  process.env.DATABASE_URL = "postgresql://mem:mem@localhost/mission_control";
});

describe("Auth.js session flow (signup → sign-in → session → signout)", () => {
  it("signs the user in, exposes the session, and signs them out", async () => {
    // Signup via our API (the same call the signup page makes).
    const signup = await signupPOST(
      new Request("http://localhost/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "session@empyrean.com", password: "hunter2-s3cret", name: "Session" }),
      }),
    );
    expect(signup.status).toBe(201);

    const jar = cookieJar();

    // 1. Fetch a CSRF token.
    const csrf = await request("GET", "/api/auth/csrf", jar.get());
    jar.setFrom(csrf);
    const { csrfToken } = (await csrf.json()) as { csrfToken: string };
    expect(csrfToken).toBeTruthy();

    // 2. Credentials sign-in (what next-auth/react's signIn() does).
    const signin = await request(
      "POST",
      "/api/auth/callback/credentials",
      jar.get(),
      new URLSearchParams({ csrfToken, email: "session@empyrean.com", password: "hunter2-s3cret" }),
    );
    expect([200, 302]).toContain(signin.status);
    jar.setFrom(signin);

    // 3. The session endpoint reports the signed-in user (with id + email).
    const session = await request("GET", "/api/auth/session", jar.get());
    const sessionBody = (await session.json()) as { user?: { id?: string; email?: string } };
    expect(sessionBody.user?.email).toBe("session@empyrean.com");
    expect(sessionBody.user?.id).toBeTruthy();
    const userId = sessionBody.user!.id!;

    // 4. A wrong password is rejected: redirect to the error page and the
    //    existing valid session is untouched.
    const badCsrfRes = await request("GET", "/api/auth/csrf", jar.get());
    jar.setFrom(badCsrfRes);
    const { csrfToken: badCsrf } = (await badCsrfRes.json()) as { csrfToken: string };
    const rejected = await request(
      "POST",
      "/api/auth/callback/credentials",
      jar.get(),
      new URLSearchParams({ csrfToken: badCsrf, email: "session@empyrean.com", password: "wrong-pass-1" }),
    );
    expect(rejected.status).toBe(302);
    expect(rejected.headers.get("location")).toContain("error=CredentialsSignin");

    const afterFailedLogin = await request("GET", "/api/auth/session", jar.get());
    const afterFailedLoginBody = (await afterFailedLogin.json()) as { user?: { email?: string } };
    expect(afterFailedLoginBody.user?.email).toBe("session@empyrean.com");

    // 5. Sign-out clears the session.
    const signoutCsrf = await request("GET", "/api/auth/csrf", jar.get());
    jar.setFrom(signoutCsrf);
    const { csrfToken: signoutToken } = (await signoutCsrf.json()) as { csrfToken: string };
    const signout = await request(
      "POST",
      "/api/auth/signout",
      jar.get(),
      new URLSearchParams({ csrfToken: signoutToken }),
    );
    jar.setFrom(signout);

    const after = await request("GET", "/api/auth/session", jar.get());
    const afterBody = (await after.json()) as { user?: unknown } | null;
    expect(afterBody?.user).toBeUndefined();

    // 6. Credentials still validate after signout (the user persists).
    await expect(authenticateUser(new (await import("./repository")).PgAuthRepository(), "session@empyrean.com", "hunter2-s3cret")).resolves.toMatchObject({
      id: userId,
    });
  });
});
