import { randomUUID } from "crypto";
import { readFile } from "node:fs/promises";

import { newDb } from "pg-mem";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { createWorkspaceForUser } from "../../../../lib/usage";
import { POST } from "./route";

type MemDb = ReturnType<typeof newDb>;

const { mockAuth } = vi.hoisted(() => ({ mockAuth: vi.fn() }));

vi.mock("../../../../auth", () => ({ auth: mockAuth }));

vi.mock("pg", async () => {
  const migrations = [
    await readFile(new URL("../../../../db/migrations/0001_init_auth.sql", import.meta.url), "utf8"),
    await readFile(new URL("../../../../db/migrations/0002_ai_usage.sql", import.meta.url), "utf8"),
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

function memDb(): MemDb {
  return (globalThis as unknown as { __pgMemDb: MemDb }).__pgMemDb;
}

let pool: { query: (sql: string, values?: unknown[]) => Promise<{ rows: unknown[] }> };
let fetchMock: ReturnType<typeof vi.fn>;

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

beforeAll(async () => {
  process.env.DATABASE_URL = "postgresql://mem:***@localhost/mission_control";
  const { Pool } = memDb().adapters.createPg();
  pool = new Pool();
});

beforeEach(() => {
  fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);
  // Gemini key present (only provider).
  process.env.GOOGLE_API_KEY = "test-google-key";
});

afterAll(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

async function postJson(body: unknown): Promise<Response> {
  return POST(
    new Request("http://localhost/api/ai/image", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
  );
}

async function createUserWithWorkspace(email: string): Promise<{ userId: string; workspaceId: string }> {
  const userId = randomUUID();
  await pool.query("INSERT INTO users (id, email, password_hash) VALUES ($1, $2, 'x')", [userId, email]);
  const workspaceId = await createWorkspaceForUser(userId, `${email} workspace`);
  return { userId, workspaceId };
}

function mockGeminiSuccess(): void {
  fetchMock.mockResolvedValueOnce(
    jsonResponse({
      candidates: [
        {
          content: {
            parts: [{ inlineData: { data: "QUJD", mimeType: "image/png" } }],
          },
        },
      ],
    }),
  );
}

describe("POST /api/ai/image", () => {
  it("rejects unauthenticated requests with 401", async () => {
    mockAuth.mockResolvedValue(null);
    const response = await postJson({ prompt: "Emerald corseted column" });
    expect(response.status).toBe(401);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects invalid bodies with 400", async () => {
    mockAuth.mockResolvedValue({ user: { id: "u1" } });
    expect((await postJson({})).status).toBe(400);
    expect((await postJson({ prompt: "" })).status).toBe(400);
    expect((await postJson({ prompt: "x".repeat(2_001) })).status).toBe(400);
  });

  it("returns 503 when no provider is configured", async () => {
    const { userId } = await createUserWithWorkspace("noimg@empyrean.com");
    mockAuth.mockResolvedValue({ user: { id: userId } });
    delete process.env.GOOGLE_API_KEY;
    const response = await postJson({ prompt: "A dress" });
    expect(response.status).toBe(503);
  });

  it("generates via Gemini and records usage for the caller's workspace", async () => {
    const { userId, workspaceId } = await createUserWithWorkspace("ada@empyrean.com");
    mockAuth.mockResolvedValue({ user: { id: userId } });
    mockGeminiSuccess();

    const response = await postJson({ prompt: "Emerald corseted column, studio light" });
    expect(response.status).toBe(200);
    const body = (await response.json()) as { image: string; provider: string; model: string };
    expect(body.provider).toBe("gemini");
    expect(body.model).toBe("gemini-2.5-flash-image");
    expect(body.image).toBe("data:image/png;base64,QUJD");

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("gemini-2.5-flash-image:generateContent");
    expect(JSON.parse(init.body as string).contents[0].parts[0].text).toBe(
      "Emerald corseted column, studio light",
    );

    const { rows } = await pool.query(
      "SELECT workspace_id AS \"workspaceId\", provider, model FROM ai_usage",
    );
    expect(rows).toHaveLength(1);
    const row = rows[0] as { workspaceId: string; provider: string; model: string };
    expect(row.workspaceId).toBe(workspaceId);
    expect(row.provider).toBe("gemini");
  });

  it("returns 502 when Gemini fails", async () => {
    const { userId } = await createUserWithWorkspace("gemfail@empyrean.com");
    mockAuth.mockResolvedValue({ user: { id: userId } });
    fetchMock.mockResolvedValueOnce(jsonResponse({ error: { message: "down" } }, 500));

    const response = await postJson({ prompt: "Burgundy cape moment" });
    expect(response.status).toBe(502);
  });
});
