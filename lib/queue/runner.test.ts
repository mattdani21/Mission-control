import { describe, expect, it, vi } from "vitest";

import { ResendError } from "../resend";
import { errorMessage, isRetryable, runTick } from "./runner";
import type { ClaimedSend, SendQueueRepository, SendSchedule } from "./send-queue";

/**
 * Unit tests for the tick logic (claim → send → settle) with fake queue and
 * sender, so error paths are exercised without any network or database.
 */

function claimed(id: string, overrides: Partial<ClaimedSend> = {}): ClaimedSend {
  return {
    id,
    workspaceId: null,
    recipientEmail: "ops@empyrean.example",
    subject: "Launch week",
    bodyHtml: "<p>Hello!</p>",
    fromEmail: null,
    scheduledFor: new Date("2026-08-07T11:00:00Z"),
    attempts: 1,
    ...overrides,
  };
}

function settled(status: SendSchedule["status"]): SendSchedule {
  return {
    id: "x",
    workspaceId: null,
    recipientEmail: "ops@empyrean.example",
    subject: "S",
    bodyHtml: "<p>h</p>",
    fromEmail: null,
    scheduledFor: new Date(),
    status,
    attempts: 1,
    maxAttempts: 3,
    nextAttemptAt: null,
    lastError: null,
    resendMessageId: null,
    deliveryStatus: null,
    sentAt: null,
    createdAt: new Date(),
  };
}

function fakeQueue(
  claims: ClaimedSend[],
): SendQueueRepository & { markSent: ReturnType<typeof vi.fn>; markFailed: ReturnType<typeof vi.fn> } {
  return {
    createSchedule: vi.fn(),
    claimDue: vi.fn().mockResolvedValue(claims),
    markSent: vi.fn().mockResolvedValue(settled("sent")),
    markFailed: vi.fn().mockResolvedValue(settled("failed")),
    get: vi.fn(),
    listForWorkspace: vi.fn(),
  };
}

function fakeSender(): { send: ReturnType<typeof vi.fn> } {
  return { send: vi.fn().mockResolvedValue({ id: "resend_1" }) };
}

describe("runTick", () => {
  it("claims due sends, delivers them, and records the Resend message id", async () => {
    const queue = fakeQueue([claimed("s1"), claimed("s2")]);
    const sender = fakeSender();

    const result = await runTick(queue, sender, { now: new Date("2026-08-07T12:00:00Z") });

    expect(queue.claimDue).toHaveBeenCalledWith(50, new Date("2026-08-07T12:00:00Z"));
    expect(sender.send).toHaveBeenCalledTimes(2);
    expect(sender.send).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "ops@empyrean.example",
        subject: "Launch week",
        html: "<p>Hello!</p>",
      }),
    );
    expect(queue.markSent).toHaveBeenCalledWith("s1", "resend_1");
    expect(queue.markSent).toHaveBeenCalledWith("s2", "resend_1");
    expect(result).toEqual({ claimed: 2, sent: 2, retrying: 0, failed: 0 });
  });

  it("uses the schedule's own from address when set", async () => {
    const queue = fakeQueue([claimed("s1", { fromEmail: "team@empyrean.example" })]);
    const sender = fakeSender();

    await runTick(queue, sender);

    expect(sender.send).toHaveBeenCalledWith(expect.objectContaining({ from: "team@empyrean.example" }));
  });

  it("re-queues on retryable failures", async () => {
    const queue = fakeQueue([claimed("s1")]);
    const sender = fakeSender();
    sender.send.mockRejectedValueOnce(new Error("ECONNRESET"));
    queue.markFailed.mockResolvedValueOnce(settled("pending"));

    const result = await runTick(queue, sender);

    expect(queue.markFailed).toHaveBeenCalledWith("s1", "ECONNRESET", { retryable: true });
    expect(result).toEqual({ claimed: 1, sent: 0, retrying: 1, failed: 0 });
  });

  it("fails permanently on non-retryable provider errors", async () => {
    const queue = fakeQueue([claimed("s1")]);
    const sender = fakeSender();
    sender.send.mockRejectedValueOnce(new ResendError("invalid recipient", 422, "validation_error"));

    const result = await runTick(queue, sender);

    expect(queue.markFailed).toHaveBeenCalledWith("s1", "invalid recipient", {
      retryable: false,
    });
    expect(result).toEqual({ claimed: 1, sent: 0, retrying: 0, failed: 1 });
  });

  it("counts a worker crash after claim as retrying", async () => {
    const queue = fakeQueue([claimed("s1")]);
    const sender = fakeSender();
    sender.send.mockRejectedValueOnce(new Error("boom"));
    queue.markFailed.mockResolvedValueOnce(settled("pending"));

    const result = await runTick(queue, sender);

    expect(queue.markFailed).toHaveBeenCalledWith("s1", "boom", { retryable: true });
    expect(result.retrying).toBe(1);
  });
});

describe("isRetryable", () => {
  it("retries network-level failures and 5xx/429, not 4xx", () => {
    expect(isRetryable(new ResendError("network", null))).toBe(true);
    expect(isRetryable(new ResendError("upstream", 500))).toBe(true);
    expect(isRetryable(new ResendError("rate limited", 429))).toBe(true);
    expect(isRetryable(new ResendError("bad request", 400))).toBe(false);
    expect(isRetryable(new ResendError("unauthorized", 401))).toBe(false);
    expect(isRetryable(new Error("random"))).toBe(true);
  });
});

describe("errorMessage", () => {
  it("extracts the message from errors and non-errors", () => {
    expect(errorMessage(new Error("kaput"))).toBe("kaput");
    expect(errorMessage("plain string")).toBe("plain string");
    expect(errorMessage(42)).toBe("42");
  });
});
