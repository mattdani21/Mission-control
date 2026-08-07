import { afterEach, describe, expect, it, vi } from "vitest";

import { ResendClient, ResendError } from "./resend";

/**
 * Unit tests for the Resend HTTP client. `fetch` is stubbed globally, so no
 * network is touched; the API key never leaves the server (and never appears
 * in these assertions).
 */

function fetchMock(): ReturnType<typeof vi.fn> {
  const fn = vi.fn();
  vi.stubGlobal("fetch", fn);
  return fn;
}

const EMAIL = {
  from: "Mission Control <hello@empyrean.example>",
  to: "ops@empyrean.example",
  subject: "Launch week",
  html: "<p>Hello!</p>",
};

const RESEND_URL = "https://api.resend.com/emails";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("ResendClient", () => {
  it("posts to the Resend API and returns the message id", async () => {
    const fetch = fetchMock();
    fetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ id: "resend_abc123" }), { status: 200 }),
    );

    const client = new ResendClient("re_test_key", false);
    const result = await client.send(EMAIL);

    expect(result.id).toBe("resend_abc123");
    expect(fetch).toHaveBeenCalledTimes(1);
    const [url, init] = fetch.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(RESEND_URL);
    const headers = init.headers as Record<string, string>;
    expect(headers.Authorization).toBe("Bearer re_test_key");
    expect(JSON.parse(init.body as string)).toEqual({
      from: EMAIL.from,
      to: [EMAIL.to],
      subject: EMAIL.subject,
      html: EMAIL.html,
    });
  });

  it("throws a ResendError with status and code on a 4xx rejection", async () => {
    fetchMock().mockResolvedValueOnce(
      new Response(JSON.stringify({ name: "validation_error", message: "invalid recipient" }), {
        status: 422,
      }),
    );

    const client = new ResendClient("re_test_key", false);
    await expect(client.send(EMAIL)).rejects.toMatchObject({
      name: "ResendError",
      status: 422,
      code: "validation_error",
      message: expect.stringContaining("invalid recipient"),
    } satisfies Partial<ResendError>);
  });

  it("survives a non-JSON error body", async () => {
    fetchMock().mockResolvedValueOnce(new Response("rate limited", { status: 429 }));

    const client = new ResendClient("re_test_key", false);
    await expect(client.send(EMAIL)).rejects.toMatchObject({ status: 429 });
  });

  it("wraps network failures as ResendError with no status", async () => {
    fetchMock().mockRejectedValueOnce(new TypeError("fetch failed"));

    const client = new ResendClient("re_test_key", false);
    await expect(client.send(EMAIL)).rejects.toMatchObject({ status: null });
  });

  it("rejects an unexpected success response without an id", async () => {
    fetchMock().mockResolvedValueOnce(new Response(JSON.stringify({ ok: true }), { status: 200 }));

    const client = new ResendClient("re_test_key", false);
    await expect(client.send(EMAIL)).rejects.toThrow(/no message id/);
  });

  it("returns a synthetic id in dev mode without a key, never calling the network", async () => {
    const fetch = fetchMock();

    const client = new ResendClient(undefined, true);
    const result = await client.send(EMAIL);

    expect(result.id).toMatch(/^dev_/);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("refuses to send without a key when dev mode is off", async () => {
    fetchMock();

    const client = new ResendClient(undefined, false);
    await expect(client.send(EMAIL)).rejects.toThrow(/RESEND_API_KEY is not set/);
  });
});
