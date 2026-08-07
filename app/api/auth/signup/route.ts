import { NextResponse } from "next/server";

import { AuthError, signupUser } from "../../../../lib/auth/service";
import { PgAuthRepository } from "../../../../lib/auth/repository";
import { signupSchema } from "../../../../lib/auth/validation";

const repo = new PgAuthRepository();

// POST /api/auth/signup — create an account. The client then signs the user in
// via the Auth.js credentials flow (/api/auth/callback/credentials), so the
// session cookie is minted by Auth.js itself.
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = signupSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input." }, { status: 400 });
  }

  try {
    const user = await signupUser(repo, parsed.data);
    return NextResponse.json(
      { user: { id: user.id, email: user.email, name: user.name } },
      { status: 201 },
    );
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode });
    }
    throw err;
  }
}
