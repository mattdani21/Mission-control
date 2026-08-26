import { redirect } from "next/navigation";

import { auth } from "../../auth";
import { PgCampaignRepository } from "../../lib/campaigns";
import { PgUsageRepository } from "../../lib/usage";
import MissionControl from "../../components/mission-control/mission-control";

export const dynamic = "force-dynamic";

// Protected page: requires a valid Auth.js session. Unauthenticated visitors
// are bounced to /login before any dashboard content renders. Campaigns are
// loaded server-side so the pipeline opens with the workspace's real work.
export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  let campaigns: Awaited<ReturnType<PgCampaignRepository["listForWorkspace"]>> = [];
  try {
    const workspaceId = await new PgUsageRepository().getWorkspaceIdForUser(session.user.id);
    if (workspaceId) {
      campaigns = await new PgCampaignRepository().listForWorkspace(workspaceId);
    }
  } catch (err) {
    console.warn("dashboard: campaigns unavailable, showing sample pipeline", err);
  }

  return (
    <MissionControl
      userName={session.user.name ?? null}
      userEmail={session.user.email ?? null}
      initialCampaigns={campaigns.map((c) => ({
        id: c.id,
        title: c.title,
        brief: c.brief,
        channel: c.channel,
        status: c.status,
      }))}
    />
  );
}
