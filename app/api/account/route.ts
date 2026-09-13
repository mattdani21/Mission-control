import { NextResponse } from "next/server";

import { auth } from "../../../auth";
import { deleteAccountForUser } from "../../../lib/account";

// DELETE /api/account — erase the signed-in user and their workspace data.
export async function DELETE() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    await deleteAccountForUser(session.user.id);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: `Could not delete the account (${message}).` }, { status: 500 });
  }

  return NextResponse.json({ deleted: true });
}
