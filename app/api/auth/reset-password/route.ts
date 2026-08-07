import { NextResponse } from "next/server";

import { AuthError, resetPasswordWithToken } from "../../../../lib/auth/service";
import { PgAuthRepository } from "../../../../lib/auth/repository";
import { resetPasswordSchema } from "../../../../lib/auth/validation";

const repo = new PgAuthRepository();

// POST /api/auth/reset-password — redeem a one-time reset token and set a new
// password. The token is single-use and expires after 1 hour.
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = resetPasswordSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input." }, { status: 400 });
  }

  try {
    await resetPasswordWithToken(repo, parsed.data.token, parsed.data.password);
    return NextResponse.json({ message: "Password updated. You can now sign in." }, { status: 200 });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    }
    throw err;
  }
}
