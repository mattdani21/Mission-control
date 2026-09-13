import { createHmac } from "crypto";

import { describe, expect, it } from "vitest";

import {
  deliveryStatusFor,
  parseResendEvent,
  verifyResendSignature,
  WebhookVerificationError,
} from "./resend";

const SECRET_BYTES = Buffer.from("super-secret-webhook-key");
const SECRET = `whsec_${SECRET_BYTES.toString("base64")}`;
const NOW = 1_778_000_000;

function sign(rawBody: string, id = "msg_1", timestamp = String(NOW)): string {
  const digest = createHmac("sha256", SECRET_BYTES).update(`${id}.${timestamp}.${rawBody}`).digest("base64");
  return `v1,${digest}`;
}

describe("deliveryStatusFor", () => {
  it("maps the four delivery events and ignores the rest", () => {
    expect(deliveryStatusFor("email.delivered")).toBe("delivered");
    expect(deliveryStatusFor("email.bounced")).toBe("bounced");
    expect(deliveryStatusFor("email.complained")).toBe("complained");
    expect(deliveryStatusFor("email.delivery_delayed")).toBe("delayed");
    expect(deliveryStatusFor("email.sent")).toBeNull();
    expect(deliveryStatusFor("email.opened")).toBeNull();
  });
});

describe("parseResendEvent", () => {
  it("extracts type + email_id", () => {
    expect(
      parseResendEvent({ type: "email.delivered", data: { email_id: "re_123" } }),
    ).toEqual({ type: "email.delivered", emailId: "re_123" });
  });

  it("rejects incomplete payloads", () => {
    expect(parseResendEvent(null)).toBeNull();
    expect(parseResendEvent({ type: "email.delivered" })).toBeNull();
    expect(parseResendEvent({ data: { email_id: "re_123" } })).toBeNull();
  });
});

describe("verifyResendSignature", () => {
  const rawBody = JSON.stringify({ type: "email.delivered", data: { email_id: "re_123" } });

  it("accepts a valid v1 signature", () => {
    expect(() =>
      verifyResendSignature({
        rawBody,
        svixId: "msg_1",
        svixTimestamp: String(NOW),
        svixSignature: sign(rawBody),
        secret: SECRET,
        nowSeconds: NOW,
      }),
    ).not.toThrow();
  });

  it("accepts one valid signature among several", () => {
    expect(() =>
      verifyResendSignature({
        rawBody,
        svixId: "msg_1",
        svixTimestamp: String(NOW),
        svixSignature: `v1,aaaa ${sign(rawBody)}`,
        secret: SECRET,
        nowSeconds: NOW,
      }),
    ).not.toThrow();
  });

  it("rejects a missing header", () => {
    expect(() =>
      verifyResendSignature({
        rawBody,
        svixId: "msg_1",
        svixTimestamp: String(NOW),
        svixSignature: null,
        secret: SECRET,
        nowSeconds: NOW,
      }),
    ).toThrow(WebhookVerificationError);
  });

  it("rejects a bad signature", () => {
    expect(() =>
      verifyResendSignature({
        rawBody,
        svixId: "msg_1",
        svixTimestamp: String(NOW),
        svixSignature: "v1,not-the-signature",
        secret: SECRET,
        nowSeconds: NOW,
      }),
    ).toThrow(/Invalid Svix signature/);
  });

  it("rejects a stale timestamp", () => {
    const old = String(NOW - 10 * 60);
    expect(() =>
      verifyResendSignature({
        rawBody,
        svixId: "msg_1",
        svixTimestamp: old,
        svixSignature: sign(rawBody, "msg_1", old),
        secret: SECRET,
        nowSeconds: NOW,
      }),
    ).toThrow(/too old/);
  });
});
