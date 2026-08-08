import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "../../../../auth";
import { PgSendQueueRepository } from "../../../../lib/queue/send-queue";
import { PgUsageRepository } from "../../../../lib/usage";

// POST /api/sends/schedule — enqueue a scheduled email send. The row sits in
// the `send_schedules` queue until its scheduled_for arrives, then the
// background job runner (scripts/worker.ts or GET /api/cron/send) claims and
// delivers it through Resend.

const scheduleSchema = z.object({
  to: z.string().email("A valid recipient email is required."),
  subject: z.string().min(1, "Subject is required.").max(200, "Subject is too long (max 200 characters)."),
  html: z.string().min(1, "Email body is required.").max(100_000, "Email body is too long (max 100,000 characters)."),
  scheduledFor: z
    .string()
    .refine((value) => !Number.isNaN(Date.parse(value)), "scheduledFor must be a valid ISO date-time."),
  fromEmail: z.string().email("A valid sender email is required.").optional(),
});

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const workspaceId = await new PgUsageRepository().getWorkspaceIdForUser(session.user.id);
  if (!workspaceId) {
    return NextResponse.json({ error: "No workspace is attached to this account." }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = scheduleSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input." }, { status: 400 });
  }

  const { to, subject, html, scheduledFor, fromEmail } = parsed.data;
  const schedule = await new PgSendQueueRepository().createSchedule({
    workspaceId,
    recipientEmail: to,
    subject,
    bodyHtml: html,
    fromEmail: fromEmail ?? null,
    scheduledFor: new Date(scheduledFor),
  });

  return NextResponse.json(
    { id: schedule.id, status: schedule.status, scheduledFor: schedule.scheduledFor.toISOString() },
    { status: 201 },
  );
}
