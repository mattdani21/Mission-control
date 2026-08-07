import { randomUUID } from "crypto";
import { readFile } from "node:fs/promises";

import { newDb } from "pg-mem";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { PgUsageRepository, createWorkspaceForUser } from "../../../../lib/usage";
import { parseSseUsage, withUsageCapture, type AnthropicUsage } from "../../../../lib/anthropic";
import { POST } from "./route";

/**
 * HTTP-level integration tests for POST /api/ai/draft.
 *
 * The `pg` module is replaced with pg-mem, the Auth.js session is mocked, and
 * the Anthropic upstream is replaced with a canned SSE stream — so the real
 * route handler, real repository SQL, and real SSE forwarding/usage-tallying
 * code run end to end with no external services.
 */
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

const SSE_BODY = [
  'event: message_start',
  'data: {"type":"message_start","message":{"usage":{"input_tokens":25,"output_tokens":1,"cache_creation_input_tokens":0,"cache_read_input_tokens":7}}}',
  "",
  'event: content_block_delta',
  'data: {"type":"content_block_delta","delta":{"type":"text_delta","text":"Hello from the AI"}}',
  "",
  'event: message_delta',
  'data: {"type":"message_delta","usage":{"output_tokens":3}}',
  "",
  'event: message_stop',
  'data: {"type":"message_stop"}',
  "",
  "data: [DONE]",
  "",
].join("\n");

beforeAll(async () => {
  process.env.DATABASE_URL = "postgresql://mem:***@localhost/mission_control";
  process.env.ANTHROPIC_API_KEY = "test-anthropic-key";
  process.env.ANTHROPIC_MODEL = "claude-test-model";
  const { Pool } = memDb().adapters.createPg();
  pool = new Pool();
});

beforeEach(() => {
  fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);
});

afterAll(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

async function postJson(body: unknown): Promise<Response> {
  return POST(
    new Request("http://localhost/api/ai/draft", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
  );
}

async function readStreamText(stream: ReadableStream<Uint8Array>): Promise<string> {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let text = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    text += decoder.decode(value, { stream: true });
  }
  return text;
}

async function createUserWithWorkspace(email: string): Promise<{ userId: string; workspaceId: string }> {
  const userId = randomUUID();
  await pool.query("INSERT INTO users (id, email, password_hash) VALUES ($1, $2, 'x')", [userId, email]);
  const workspaceId = await createWorkspaceForUser(userId, `${email} workspace`);
  return { userId, workspaceId };
}

function mockUpstream(response: { status?: number; body?: string; requestId?: string }): void {
  fetchMock.mockImplementation(() =>
    Promise.resolve(
      new Response(response.body ?? SSE_BODY, {
        status: response.status ?? 200,
        headers: response.requestId ? { "request-id": response.requestId } : undefined,
      }),
    ),
  );
}

describe("POST /api/ai/draft", () => {
  it("rejects unauthenticated requests with 401 and never calls the provider", async () => {
    mockAuth.mockResolvedValue(null);
    const response = await postJson({ prompt: "Write a subject line" });
    expect(response.status).toBe(401);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects invalid bodies with 400", async () => {
    mockAuth.mockResolvedValue({ user: { id: "u1" } });
    expect((await postJson({})).status).toBe(400);
    expect((await postJson({ prompt: "" })).status).toBe(400);
    expect((await postJson({ prompt: "x".repeat(20_001) })).status).toBe(400);
    expect(
      await POST(
        new Request("http://localhost/api/ai/draft", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: "not json",
        }),
      ).then((r) => r.status),
    ).toBe(400);
  });

  it("rejects 403 when the account has no workspace", async () => {
    const userId = randomUUID();
    await pool.query("INSERT INTO users (id, email, password_hash) VALUES ($1, $2, 'x')", [userId, "orphan@empyrean.com"]);
    mockAuth.mockResolvedValue({ user: { id: userId } });
    const response = await postJson({ prompt: "Hi" });
    expect(response.status).toBe(403);
  });

  it("returns 503 when ANTHROPIC_API_KEY is not configured", async () => {
    const { userId } = await createUserWithWorkspace("grace@empyrean.com");
    mockAuth.mockResolvedValue({ user: { id: userId } });
    const key = process.env.ANTHROPIC_API_KEY;
    delete process.env.ANTHROPIC_API_KEY;
    try {
      const response = await postJson({ prompt: "Hi" });
      expect(response.status).toBe(503);
    } finally {
      process.env.ANTHROPIC_API_KEY = key;
    }
  });

  it("returns 502 when the upstream provider fails", async () => {
    const { userId } = await createUserWithWorkspace("linus@empyrean.com");
    mockAuth.mockResolvedValue({ user: { id: userId } });
    mockUpstream({ status: 500, body: '{"type":"error","error":{"message":"boom"}}' });
    const response = await postJson({ prompt: "Hi" });
    expect(response.status).toBe(502);
  });

  it("streams the draft through and records usage for the caller's workspace", async () => {
    const { userId, workspaceId } = await createUserWithWorkspace("ada@empyrean.com");
    mockAuth.mockResolvedValue({ user: { id: userId } });
    mockUpstream({ requestId: "req_abc123" });

    const response = await postJson({ prompt: "Draft an email" });
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("text/event-stream");
    expect(await readStreamText(response.body!)).toBe(SSE_BODY);

    // Usage was persisted with the workspace attribution and upstream request id.
    const { rows } = await pool.query(
      "SELECT workspace_id AS \"workspaceId\", provider, model, input_tokens AS \"inputTokens\", output_tokens AS \"outputTokens\", cache_read_tokens AS \"cacheReadTokens\", request_id AS \"requestId\", latency_ms AS \"latencyMs\" FROM ai_usage",
    );
    expect(rows).toHaveLength(1);
    const row = rows[0] as {
      workspaceId: string;
      provider: string;
      model: string;
      inputTokens: number;
      outputTokens: number;
      cacheReadTokens: number;
      requestId: string;
      latencyMs: number;
    };
    expect(row.workspaceId).toBe(workspaceId);
    expect(row.provider).toBe("anthropic");
    expect(row.model).toBe("claude-test-model");
    expect(row.inputTokens).toBe(25);
    expect(row.outputTokens).toBe(3);
    expect(row.cacheReadTokens).toBe(7);
    expect(row.requestId).toBe("req_abc123");
    expect(row.latencyMs).toBeGreaterThanOrEqual(0);
  });

  it("keeps each workspace's usage isolated", async () => {
    const a = await createUserWithWorkspace("team-a@empyrean.com");
    const b = await createUserWithWorkspace("team-b@empyrean.com");

    const repo = new PgUsageRepository();

    mockAuth.mockResolvedValue({ user: { id: a.userId } });
    mockUpstream({});
    await postJson({ prompt: "Draft for team A" });
    await postJson({ prompt: "Another for team A" });

    mockAuth.mockResolvedValue({ user: { id: b.userId } });
    await postJson({ prompt: "Draft for team B" });

    const usageA = await repo.getWorkspaceUsage(a.workspaceId);
    expect(usageA.totalRequests).toBe(2);
    const usageB = await repo.getWorkspaceUsage(b.workspaceId);
    expect(usageB.totalRequests).toBe(1);

    // The upstream request always carries the session user's prompt.
    const prompts = fetchMock.mock.calls.map((call) => JSON.parse(call[1].body as string).messages[0].content);
    expect(prompts).toEqual(["Draft for team A", "Another for team A", "Draft for team B"]);
  });
});

describe("SSE usage tallying", () => {
  it("parses input/output/cache-read tokens from Anthropic events", () => {
    const usage: AnthropicUsage = { inputTokens: 0, outputTokens: 0, cacheReadTokens: 0 };
    parseSseUsage(
      '{"type":"message_start","message":{"usage":{"input_tokens":100,"output_tokens":1,"cache_read_input_tokens":40}}}',
      usage,
    );
    parseSseUsage('{"type":"message_delta","usage":{"output_tokens":12}}', usage);
    expect(usage.inputTokens).toBe(100);
    expect(usage.outputTokens).toBe(12);
    expect(usage.cacheReadTokens).toBe(40);
  });

  it("forwards the stream byte-for-byte even when events span chunk boundaries", async () => {
    const encoder = new TextEncoder();
    const pieces = [SSE_BODY.slice(0, 40), SSE_BODY.slice(40, 91), SSE_BODY.slice(91, 152), SSE_BODY.slice(152)];

    const source = new ReadableStream<Uint8Array>({
      start(controller) {
        for (const piece of pieces) controller.enqueue(encoder.encode(piece));
        controller.close();
      },
    });

    const tallied: AnthropicUsage[] = [];
    const stream = withUsageCapture(source, (usage) => tallied.push({ ...usage }));

    expect(await readStreamText(stream)).toBe(SSE_BODY);
    expect(tallied).toHaveLength(1);
    expect(tallied[0]!.inputTokens).toBe(25);
    expect(tallied[0]!.outputTokens).toBe(3);
    expect(tallied[0]!.cacheReadTokens).toBe(7);
  });
});
