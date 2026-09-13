import { createHmac, timingSafeEqual } from "crypto";

/**
 * Resend delivers delivery/bounce events as Svix-signed webhooks.
 * https://resend.com/docs/webhooks/verify-webhooks
 *
 * The secret from the Resend dashboard is `whsec_<base64>`. The signed
 * content is `${svix-id}.${svix-timestamp}.${rawBody}`.
 */

export const RESEND_DELIVERY_EVENTS = {
  "email.delivered": "delivered",
  "email.bounced": "bounced",
  "email.complained": "complained",
  "email.delivery_delayed": "delayed",
} as const;

export type ResendDeliveryEvent = keyof typeof RESEND_DELIVERY_EVENTS;
export type DeliveryStatus = (typeof RESEND_DELIVERY_EVENTS)[ResendDeliveryEvent];

export interface ResendWebhookEvent {
  type: string;
  data?: {
    email_id?: string;
  };
}

const MAX_AGE_SECONDS = 5 * 60;

export class WebhookVerificationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "WebhookVerificationError";
  }
}

export function deliveryStatusFor(type: string): DeliveryStatus | null {
  if (type in RESEND_DELIVERY_EVENTS) {
    return RESEND_DELIVERY_EVENTS[type as ResendDeliveryEvent];
  }
  return null;
}

export function parseResendEvent(body: unknown): { emailId: string; type: string } | null {
  if (!body || typeof body !== "object") return null;
  const event = body as ResendWebhookEvent;
  if (typeof event.type !== "string") return null;
  const emailId = event.data?.email_id;
  if (typeof emailId !== "string" || emailId.length === 0) return null;
  return { emailId, type: event.type };
}

/**
 * Verify a Resend/Svix signature. `rawBody` must be the exact bytes Resend
 * signed (the request text), not a re-serialized JSON object.
 */
export function verifyResendSignature(opts: {
  rawBody: string;
  svixId: string | null;
  svixTimestamp: string | null;
  svixSignature: string | null;
  secret: string;
  nowSeconds?: number;
}): void {
  const { rawBody, svixId, svixTimestamp, svixSignature, secret } = opts;
  if (!svixId || !svixTimestamp || !svixSignature) {
    throw new WebhookVerificationError("Missing Svix signature headers.");
  }

  const timestamp = Number(svixTimestamp);
  if (!Number.isFinite(timestamp)) {
    throw new WebhookVerificationError("Invalid Svix timestamp.");
  }
  const now = opts.nowSeconds ?? Math.floor(Date.now() / 1000);
  if (Math.abs(now - timestamp) > MAX_AGE_SECONDS) {
    throw new WebhookVerificationError("Svix timestamp is too old.");
  }

  const secretBytes = decodeWebhookSecret(secret);
  const signedContent = `${svixId}.${svixTimestamp}.${rawBody}`;
  const expected = createHmac("sha256", secretBytes).update(signedContent).digest("base64");

  const candidates = svixSignature
    .split(" ")
    .map((part) => {
      const [, sig] = part.split(",", 2);
      return sig;
    })
    .filter((sig): sig is string => Boolean(sig));

  if (!candidates.some((sig) => safeEqual(sig, expected))) {
    throw new WebhookVerificationError("Invalid Svix signature.");
  }
}

function decodeWebhookSecret(secret: string): Buffer {
  const payload = secret.startsWith("whsec_") ? secret.slice("whsec_".length) : secret;
  const bytes = Buffer.from(payload, "base64");
  if (bytes.length === 0) {
    throw new WebhookVerificationError("Webhook secret is not valid base64.");
  }
  return bytes;
}

function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}
