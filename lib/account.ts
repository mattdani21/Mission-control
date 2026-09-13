import { getPool } from "./db";

/**
 * Permanently delete a user and their personal workspace data:
 * scheduled sends, campaigns, AI usage, reset tokens, then the workspace.
 * If another user still belongs to the workspace (not a v1 case), the
 * workspace is left in place.
 */
export async function deleteAccountForUser(userId: string): Promise<void> {
  const client = await getPool().connect();
  try {
    await client.query("BEGIN");
    const { rows } = await client.query<{ workspaceId: string | null }>(
      `SELECT workspace_id AS "workspaceId" FROM users WHERE id = $1`,
      [userId],
    );
    if (!rows[0]) {
      await client.query("ROLLBACK");
      return;
    }
    const workspaceId = rows[0].workspaceId;

    if (workspaceId) {
      await client.query(`DELETE FROM send_schedules WHERE workspace_id = $1`, [workspaceId]);
      await client.query(`UPDATE users SET workspace_id = NULL WHERE id = $1`, [userId]);
    }

    await client.query(`DELETE FROM users WHERE id = $1`, [userId]);

    if (workspaceId) {
      const { rows: remaining } = await client.query<{ n: string }>(
        `SELECT count(*)::text AS n FROM users WHERE workspace_id = $1`,
        [workspaceId],
      );
      if ((remaining[0]?.n ?? "0") === "0") {
        await client.query(`DELETE FROM workspaces WHERE id = $1`, [workspaceId]);
      }
    }

    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}
