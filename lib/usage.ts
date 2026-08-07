import { randomUUID } from "crypto";

import { getPool } from "./db";

/**
 * Per-workspace AI token usage (`ai_usage` table).
 *
 * One row per AI request, attributed to the workspace that paid for it. Like
 * the auth layer, the persistence boundary is a repository interface backed by
 * parameterized SQL over Postgres (`pg`), so the capture flow is unit-testable
 * against pg-mem without a real database.
 */

export interface UsageRecord {
  id: string;
  workspaceId: string;
  provider: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
  latencyMs: number | null;
  requestId: string | null;
  createdAt: Date;
}

export interface RecordUsageInput {
  workspaceId: string;
  provider: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens?: number;
  latencyMs?: number | null;
  requestId?: string | null;
}

export interface WorkspaceUsageSummary {
  workspaceId: string;
  totalRequests: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalCacheReadTokens: number;
  lastRequestAt: Date | null;
}

export interface WorkspaceRecord {
  id: string;
  name: string;
}

interface UsageRow {
  id: string;
  workspaceId: string;
  provider: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
  latencyMs: number | null;
  requestId: string | null;
  createdAt: Date;
}

interface AggregateRow {
  totalRequests: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalCacheReadTokens: number;
  lastRequestAt: Date | null;
}

const USAGE_COLUMNS = `id, workspace_id AS "workspaceId", provider, model,
  input_tokens AS "inputTokens", output_tokens AS "outputTokens",
  cache_read_tokens AS "cacheReadTokens", latency_ms AS "latencyMs",
  request_id AS "requestId", created_at AS "createdAt"`;

/** Postgres-backed implementation used by the app. */
export class PgUsageRepository implements UsageRepository {
  /** Persist one AI request's token usage. */
  async record(input: RecordUsageInput): Promise<UsageRecord> {
    const row: UsageRow = {
      id: randomUUID(),
      workspaceId: input.workspaceId,
      provider: input.provider,
      model: input.model,
      inputTokens: input.inputTokens,
      outputTokens: input.outputTokens,
      cacheReadTokens: input.cacheReadTokens ?? 0,
      latencyMs: input.latencyMs ?? null,
      requestId: input.requestId ?? null,
      createdAt: new Date(),
    };
    await getPool().query(
      `INSERT INTO ai_usage (id, workspace_id, provider, model, input_tokens,
         output_tokens, cache_read_tokens, latency_ms, request_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        row.id,
        row.workspaceId,
        row.provider,
        row.model,
        row.inputTokens,
        row.outputTokens,
        row.cacheReadTokens,
        row.latencyMs,
        row.requestId,
      ],
    );
    return row;
  }

  /** Aggregate usage for one workspace; never crosses workspace boundaries. */
  async getWorkspaceUsage(workspaceId: string, since?: Date): Promise<WorkspaceUsageSummary> {
    const { rows } = await getPool().query<AggregateRow>(
      `SELECT count(*)::int AS "totalRequests",
              coalesce(sum(input_tokens), 0)::int AS "totalInputTokens",
              coalesce(sum(output_tokens), 0)::int AS "totalOutputTokens",
              coalesce(sum(cache_read_tokens), 0)::int AS "totalCacheReadTokens",
              max(created_at) AS "lastRequestAt"
       FROM ai_usage
       WHERE workspace_id = $1${since ? " AND created_at >= $2" : ""}`,
      since ? [workspaceId, since] : [workspaceId],
    );
    const r = rows[0];
    return {
      workspaceId,
      totalRequests: r?.totalRequests ?? 0,
      totalInputTokens: r?.totalInputTokens ?? 0,
      totalOutputTokens: r?.totalOutputTokens ?? 0,
      totalCacheReadTokens: r?.totalCacheReadTokens ?? 0,
      lastRequestAt: r?.lastRequestAt ?? null,
    };
  }

  /** Most recent usage rows for a workspace, newest first. */
  async listRecent(workspaceId: string, limit = 50): Promise<UsageRecord[]> {
    const { rows } = await getPool().query<UsageRow>(
      `SELECT ${USAGE_COLUMNS} FROM ai_usage
       WHERE workspace_id = $1
       ORDER BY created_at DESC
       LIMIT $2`,
      [workspaceId, limit],
    );
    return rows;
  }

  /** Create a workspace. */
  async createWorkspace(name: string): Promise<WorkspaceRecord> {
    const id = randomUUID();
    await getPool().query(`INSERT INTO workspaces (id, name) VALUES ($1, $2)`, [id, name]);
    return { id, name };
  }

  /** Attach a user to a workspace (users.workspace_id). */
  async attachUserToWorkspace(userId: string, workspaceId: string): Promise<void> {
    await getPool().query(`UPDATE users SET workspace_id = $1 WHERE id = $2`, [workspaceId, userId]);
  }

  /** The workspace a user belongs to, or null if none is attached yet. */
  async getWorkspaceIdForUser(userId: string): Promise<string | null> {
    const { rows } = await getPool().query<{ workspaceId: string | null }>(
      `SELECT workspace_id AS "workspaceId" FROM users WHERE id = $1`,
      [userId],
    );
    return rows[0]?.workspaceId ?? null;
  }
}

export interface UsageRepository {
  record(input: RecordUsageInput): Promise<UsageRecord>;
  getWorkspaceUsage(workspaceId: string, since?: Date): Promise<WorkspaceUsageSummary>;
  listRecent(workspaceId: string, limit?: number): Promise<UsageRecord[]>;
  createWorkspace(name: string): Promise<WorkspaceRecord>;
  attachUserToWorkspace(userId: string, workspaceId: string): Promise<void>;
  getWorkspaceIdForUser(userId: string): Promise<string | null>;
}

/**
 * Create a personal workspace for a brand-new account and attach the user to
 * it, so AI usage is recorded per workspace from the very first request.
 */
export async function createWorkspaceForUser(userId: string, name: string): Promise<string> {
  const repo = new PgUsageRepository();
  const workspace = await repo.createWorkspace(name);
  await repo.attachUserToWorkspace(userId, workspace.id);
  return workspace.id;
}
