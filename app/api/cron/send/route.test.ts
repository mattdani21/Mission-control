import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { GET } from "./route";

/**
 * HTTP-level tests for GET /api/cron/send (the cron trigger for the
 * scheduled-send runner). runTick is mocked so no database or network is
 * touched; the CRON_SECRET guard is exercised against the real handler.
 */

const { mockRunTick } = vi.hoisted(() => ({ mockRunTick: vi.fn() }));

vi.mock("../../../../lib/queue/runner", () => ({
  runTick: mockRunTick,
  defaultSender: () => ({ send: vi.fn() }),
}));

const CRON_SECRET = "test-cron-secret-value";

beforeEach(() => {
  process.env.CRON_SECRET = CRON_SECRET;
  mockRunTick.mockReset();
  mockRunTick.mockResolvedValue({ claimed: 0, sent: 0, retrying: 0, failed: 0 });
});

afterEach(() => {
  delete process.env.CRON_SECRET;
});

function cronRequest(secret: string | null): Request {
  const headers = new Headers();
  if (secret !== null) headers.set("x-cron-secret", secret);
  return new Request("http://localhost/api/cron/send", { headers });
}

describe("GET /api/cron/send", () => {
  it("returns 503 when CRON_SECRET is not configured", async () => {
    delete process.env.CRON_SECRET;

    const response = await GET(cronRequest("anything"));

    expect(response.status).toBe(503);
    expect(mockRunTick).not.toHaveBeenCalled();
  });

  it("returns 401 for a missing or wrong secret", async () => {
    const missing = await GET(cronRequest(null));
    expect(missing.status).toBe(401);

    const wrong = await GET(cronRequest("wrong-secret"));
    expect(wrong.status).toBe(401);
    expect(mockRunTick).not.toHaveBeenCalled();
  });

  it("runs a tick and reports the counts with a valid secret", async () => {
    mockRunTick.mockResolvedValueOnce({ claimed: 3, sent: 2, retrying: 1, failed: 0 });

    const response = await GET(cronRequest(CRON_SECRET));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ claimed: 3, sent: 2, retrying: 1, failed: 0 });
    expect(mockRunTick).toHaveBeenCalledTimes(1);
  });

  it("returns 500 when the tick fails", async () => {
    mockRunTick.mockRejectedValueOnce(new Error("db down"));

    const response = await GET(cronRequest(CRON_SECRET));

    expect(response.status).toBe(500);
  });
});
