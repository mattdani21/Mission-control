import { randomUUID } from "crypto";

import { getPool } from "./db";

/**
 * Campaign persistence (campaigns table, migration 0004).
 *
 * Same repository pattern as auth/usage: parameterized SQL behind an
 * interface so the API routes are unit-testable against pg-mem without a
 * real database. A campaign is the unit of marketing work in Mission
 * Control: title + brief + channel + status as it moves through the
 * pipeline.
 */

export type CampaignStatus = "draft" | "in_progress" | "scheduled" | "sent" | "cancelled";

export interface Campaign {
  id: string;
  workspaceId: string;
  title: string;
  brief: string;
  channel: string;
  status: CampaignStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateCampaignInput {
  workspaceId: string;
  title: string;
  brief?: string;
  channel?: string;
  status?: CampaignStatus;
}

interface CampaignRow {
  id: string;
  workspaceId: string;
  title: string;
  brief: string;
  channel: string;
  status: CampaignStatus;
  createdAt: Date;
  updatedAt: Date;
}

const COLUMNS = `id, workspace_id AS "workspaceId", title, brief, channel, status,
  created_at AS "createdAt", updated_at AS "updatedAt"`;

export interface CampaignRepository {
  create(input: CreateCampaignInput): Promise<Campaign>;
  listForWorkspace(workspaceId: string, limit?: number): Promise<Campaign[]>;
  get(workspaceId: string, id: string): Promise<Campaign | null>;
  updateStatus(workspaceId: string, id: string, status: CampaignStatus): Promise<Campaign | null>;
}

export class PgCampaignRepository implements CampaignRepository {
  async create(input: CreateCampaignInput): Promise<Campaign> {
    const row: CampaignRow = {
      id: randomUUID(),
      workspaceId: input.workspaceId,
      title: input.title,
      brief: input.brief ?? "",
      channel: input.channel ?? "email",
      status: input.status ?? "draft",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    await getPool().query(
      `INSERT INTO campaigns (id, workspace_id, title, brief, channel, status)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [row.id, row.workspaceId, row.title, row.brief, row.channel, row.status],
    );
    return row;
  }

  async listForWorkspace(workspaceId: string, limit = 100): Promise<Campaign[]> {
    const { rows } = await getPool().query<CampaignRow>(
      `SELECT ${COLUMNS} FROM campaigns WHERE workspace_id = $1 ORDER BY created_at DESC LIMIT $2`,
      [workspaceId, limit],
    );
    return rows;
  }

  async get(workspaceId: string, id: string): Promise<Campaign | null> {
    const { rows } = await getPool().query<CampaignRow>(
      `SELECT ${COLUMNS} FROM campaigns WHERE workspace_id = $1 AND id = $2`,
      [workspaceId, id],
    );
    return rows[0] ?? null;
  }

  async updateStatus(workspaceId: string, id: string, status: CampaignStatus): Promise<Campaign | null> {
    const { rows } = await getPool().query<CampaignRow>(
      `UPDATE campaigns SET status = $1, updated_at = now()
       WHERE workspace_id = $2 AND id = $3
       RETURNING ${COLUMNS}`,
      [status, workspaceId, id],
    );
    return rows[0] ?? null;
  }
}
