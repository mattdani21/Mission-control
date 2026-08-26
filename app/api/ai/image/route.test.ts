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

const PNG_BYTES = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 13]);

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
  // Default: DeepInfra + Gemini keys present.
  process.env.DEEPINFRA_API_KEY = "test-deepinfra-key";
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

function mockDeepInfraSuccess(): void {
  fetchMock
    .mockResolvedValueOnce(jsonResponse({ images: [{ url: "https://cdn.deepinfra.com/img-1.png" }] }))
    .mockResolvedValueOnce(
      new Response(PNG_BYTES as unknown as BodyInit, {
        status: 200,
        headers: { "Content-Type": "image/png" },
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
    delete process.env.DEEPINFRA_API_KEY;
    delete process.env.GOOGLE_API_KEY;
    const response = await postJson({ prompt: "A dress" });
    expect(response.status).toBe(503);
  });

  it("generates via DeepInfra and records usage for the caller's workspace", async () => {
    const { userId, workspaceId } = await createUserWithWorkspace("ada@empyrean.com");
    mockAuth.mockResolvedValue({ user: { id: userId } });
    mockDeepInfraSuccess();

    const response = await postJson({ prompt: "Emerald corseted column, studio light" });
    expect(response.status).toBe(200);
    const body = (await response.json()) as { image: string; provider: string; model: string };
    expect(body.provider).toBe("deepinfra");
    expect(body.model).toBe("black-forest-labs/FLUX.1-dev");
    expect(body.image.startsWith("data:image/png;base64,")).toBe(true);

    // First fetch hit DeepInfra with the prompt; second downloaded the image.
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://api.deepinfra.com/v1/images/generations");
    expect(JSON.parse(init.body as string)).toMatchObject({
      model: "black-forest-labs/FLUX.1-dev",
      prompt: "Emerald corseted column, studio light",
    });

    const { rows } = await pool.query(
      "SELECT workspace_id AS \"workspaceId\", provider, model FROM ai_usage",
    );
    expect(rows).toHaveLength(1);
    const row = rows[0] as { workspaceId: string; provider: string; model: string };
    expect(row.workspaceId).toBe(workspaceId);
    expect(row.provider).toBe("deepinfra");
  });

  it("falls back to Gemini when DeepInfra fails", async () => {
    const { userId } = await createUserWithWorkspace("gemini@empyrean.com");
    mockAuth.mockResolvedValue({ user: { id: userId } });
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ error: { message: "upstream down" } }, 500))
      .mockResolvedValueOnce(
        jsonResponse({
          candidates: [
            {
              content: {
                parts: [{ inlineData: { data: "QUJD", mimeType: "image/jpeg" } }],
              },
            },
          ],
        }),
      );

    const response = await postJson({ prompt: "Burgundy cape moment" });
    expect(response.status).toBe(200);
    const body = (await response.json()) as { image: string; provider: string; model: string };
    expect(body.provider).toBe("gemini");
    expect(body.model).toBe("gemini-2.5-flash-image");
    expect(body.image).toBe("data:image/jpeg;base64,QUJD");
  });

  it("returns 502 when every provider fails", async () => {
    const { userId } = await createUserWithWorkspace("bothfail@empyrean.com");
    mockAuth.mockResolvedValue({ user: { id: userId } });
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ error: { message: "down" } }, 500))
      .mockResolvedValueOnce(jsonResponse({ error: { message: "down too" } }, 500));

    const response = await postJson({ prompt: "A gown" });
    expect(response.status).toBe(502);
  });
});
