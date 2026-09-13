import { NextResponse } from "next/server";
import { z } from "zod";

import { auth } from "../../../../auth";
import { PgCampaignRepository, type CampaignStatus } from "../../../../lib/campaigns";
import { PgUsageRepository } from "../../../../lib/usage";

// PATCH /api/campaigns/:id — persist a pipeline advance for a real campaign.
// Seed-slot cards stay client-only; only rows the workspace owns are updated.

const STATUSES = ["draft", "in_progress", "scheduled", "sent", "cancelled"] as const;

const patchSchema = z.object({
  status: z.enum(STATUSES),
});

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
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

  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input." }, { status: 400 });
  }

  const { id } = await context.params;
  if (!id) {
    return NextResponse.json({ error: "Campaign id is required." }, { status: 400 });
  }

  const campaign = await new PgCampaignRepository().updateStatus(
    workspaceId,
    id,
    parsed.data.status as CampaignStatus,
  );
  if (!campaign) {
    return NextResponse.json({ error: "Campaign not found." }, { status: 404 });
  }

  return NextResponse.json(campaign);
}
