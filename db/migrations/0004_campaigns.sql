-- 0004_campaigns - the campaign object (M2 roadmap item, wired to the pilot UI)
-- Applied by npm run db:migrate in filename order.
--
-- A campaign is a piece of marketing work: a title, a brief, the channel it
-- targets, and a status as it moves through the pipeline (draft → in progress
-- → scheduled → sent/cancelled). Campaigns belong to a workspace, matching
-- the ai_usage attribution model.

CREATE TABLE IF NOT EXISTS campaigns (
  id           text PRIMARY KEY,
  workspace_id text NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  title        text NOT NULL,
  brief        text NOT NULL DEFAULT '',
  channel      text NOT NULL DEFAULT 'email',
  status       text NOT NULL DEFAULT 'draft'
                 CHECK (status IN ('draft', 'in_progress', 'scheduled', 'sent', 'cancelled')),
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS campaigns_workspace_id_idx ON campaigns (workspace_id);
