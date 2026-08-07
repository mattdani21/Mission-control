-- 0002_ai_usage - workspaces plus per-workspace AI token usage
-- Applied by npm run db:migrate in filename order

-- A workspace is a team's shared space inside Mission Control. Every account
-- gets a personal workspace at signup and workspaces can later be shared
-- between users. All AI usage is attributed to a workspace, never to a user
-- directly.

CREATE TABLE IF NOT EXISTS workspaces (
  id         text PRIMARY KEY,
  name       text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE users ADD COLUMN IF NOT EXISTS workspace_id text
  REFERENCES workspaces(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS users_workspace_id_idx ON users (workspace_id);

-- One row per AI request, attributed to the workspace that paid for it.
-- cache_read_tokens tracks tokens served from the Anthropic prompt cache
-- which are billed at a fraction of fresh input tokens.

CREATE TABLE IF NOT EXISTS ai_usage (
  id                text PRIMARY KEY,
  workspace_id      text NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  provider          text NOT NULL,
  model             text NOT NULL,
  input_tokens      integer NOT NULL,
  output_tokens     integer NOT NULL,
  cache_read_tokens integer NOT NULL DEFAULT 0,
  latency_ms        integer,
  request_id        text,
  created_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ai_usage_workspace_id_created_at_idx
  ON ai_usage (workspace_id, created_at DESC);
