import { NextResponse } from "next/server";
import pino from "pino";

import { PgSendQueueRepository } from "../../../../lib/queue/send-queue";
import {
  deliveryStatusFor,
  parseResendEvent,
  verifyResendSignature,
  WebhookVerificationError,
} from "../../../../lib/webhooks/resend";

const logger = pino({ level: process.env.LOG_LEVEL ?? "info" });

// POST /api/webhooks/resend — Resend (Svix) delivery events. Updates
// send_schedules.delivery_status by resend_message_id. Unrecognised event
// types are acknowledged so Resend does not retry them.

export async function POST(request: Request) {
  const secret = process.env.RESEND_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Webhook endpoint is not configured." }, { status: 503 });
  }

  const rawBody = await request.text();
  try {
    verifyResendSignature({
      rawBody,
      svixId: request.headers.get("svix-id"),
      svixTimestamp: request.headers.get("svix-timestamp"),
      svixSignature: request.headers.get("svix-signature"),
      secret,
    });
  } catch (err) {
    const message = err instanceof WebhookVerificationError ? err.message : "Invalid signature.";
    return NextResponse.json({ error: message }, { status: 401 });
  }

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(rawBody) as unknown;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const event = parseResendEvent(parsedJson);
  if (!event) {
    return NextResponse.json({ error: "Unrecognised webhook payload." }, { status: 400 });
  }

  const deliveryStatus = deliveryStatusFor(event.type);
  if (!deliveryStatus) {
    return NextResponse.json({ ignored: true, type: event.type });
  }

  const updated = await new PgSendQueueRepository().updateDeliveryStatus(event.emailId, deliveryStatus);
  if (!updated) {
    logger.info({ emailId: event.emailId, type: event.type }, "resend-webhook-unknown-message");
    return NextResponse.json({ ignored: true, reason: "unknown_message" });
  }

  logger.info(
    { emailId: event.emailId, type: event.type, scheduleId: updated.id, deliveryStatus },
    "resend-webhook",
  );
  return NextResponse.json({ id: updated.id, deliveryStatus });
}
