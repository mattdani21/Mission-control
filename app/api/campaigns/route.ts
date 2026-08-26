import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "../../../auth";
import { PgCampaignRepository } from "../../../lib/campaigns";
import { PgUsageRepository } from "../../../lib/usage";

// POST /api/campaigns — { title, brief?, channel? } → creates a campaign in
// the caller's workspace (status "draft").
// GET  /api/campaigns — lists the caller's workspace campaigns, newest first.

const createSchema = z.object({
  title: z.string().min(1, "Title is required.").max(200, "Title is too long (max 200 characters)."),
  brief: z.string().max(20_000, "Brief is too long (max 20,000 characters).").optional().default(""),
  channel: z
    .enum(["email", "ig", "tiktok", "pinterest", "meta", "whatsapp", "multi"])
    .optional()
    .default("multi"),
});

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input." }, { status: 400 });
  }

  const usageRepo = new PgUsageRepository();
  const workspaceId = await usageRepo.getWorkspaceIdForUser(session.user.id);
  if (!workspaceId) {
    return NextResponse.json({ error: "No workspace is attached to this account." }, { status: 403 });
  }

  const repo = new PgCampaignRepository();
  const campaign = await repo.create({
    workspaceId,
    title: parsed.data.title,
    brief: parsed.data.brief,
    channel: parsed.data.channel,
  });

  return NextResponse.json(campaign, { status: 201 });
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const usageRepo = new PgUsageRepository();
  const workspaceId = await usageRepo.getWorkspaceIdForUser(session.user.id);
  if (!workspaceId) {
    return NextResponse.json({ error: "No workspace is attached to this account." }, { status: 403 });
  }

  const repo = new PgCampaignRepository();
  const campaigns = await repo.listForWorkspace(workspaceId);
  return NextResponse.json({ campaigns });
}
