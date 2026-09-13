import { afterEach, describe, expect, it, vi } from "vitest";

import { deliverPasswordResetEmail } from "./reset-mailer";

function fetchMock(): ReturnType<typeof vi.fn> {
  const fn = vi.fn();
  vi.stubGlobal("fetch", fn);
  return fn;
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  delete process.env.RESEND_API_KEY;
  delete process.env.RESEND_DEV_MODE;
  delete process.env.EMAIL_FROM;
});

describe("deliverPasswordResetEmail", () => {
  it("sends through Resend with EMAIL_FROM and never throws on success", async () => {
    const fetch = fetchMock();
    fetch.mockResolvedValueOnce(new Response(JSON.stringify({ id: "re_reset_1" }), { status: 200 }));
    process.env.RESEND_API_KEY = "re_test_key";
    process.env.EMAIL_FROM = "Mission Control <hello@empyrean.example>";

    await expect(
      deliverPasswordResetEmail({
        to: "ada@empyrean.example",
        resetUrl: "http://localhost:3000/reset-password?token=abc",
      }),
    ).resolves.toBeUndefined();

    expect(fetch).toHaveBeenCalledTimes(1);
    const [, init] = fetch.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(init.body as string) as { from: string; to: string[]; subject: string; html: string };
    expect(body.from).toBe("Mission Control <hello@empyrean.example>");
    expect(body.to).toEqual(["ada@empyrean.example"]);
    expect(body.subject).toMatch(/reset/i);
    expect(body.html).toContain("http://localhost:3000/reset-password?token=abc");
  });

  it("uses a synthetic send in RESEND_DEV_MODE without calling the network", async () => {
    const fetch = fetchMock();
    process.env.RESEND_DEV_MODE = "1";
    delete process.env.RESEND_API_KEY;

    await deliverPasswordResetEmail({
      to: "dev@empyrean.example",
      resetUrl: "http://localhost:3000/reset-password?token=dev",
    });

    expect(fetch).not.toHaveBeenCalled();
  });

  it("swallows Resend errors so the forgot-password route cannot enumerate accounts", async () => {
    fetchMock().mockResolvedValueOnce(
      new Response(JSON.stringify({ message: "invalid" }), { status: 422 }),
    );
    process.env.RESEND_API_KEY = "re_test_key";

    await expect(
      deliverPasswordResetEmail({
        to: "ada@empyrean.example",
        resetUrl: "http://localhost:3000/reset-password?token=abc",
      }),
    ).resolves.toBeUndefined();
  });
});
