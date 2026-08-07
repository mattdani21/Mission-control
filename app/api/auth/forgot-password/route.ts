import { NextResponse } from "next/server";

import { requestPasswordReset } from "../../../../lib/auth/service";
import { PgAuthRepository } from "../../../../lib/auth/repository";
import { forgotPasswordSchema } from "../../../../lib/auth/validation";
import { deliverPasswordResetEmail } from "../../../../lib/auth/reset-mailer";

const repo = new PgAuthRepository();

const APP_URL = process.env.APP_URL ?? "http://localhost:3000";

// POST /api/auth/forgot-password — issue a one-time reset token. Responds
// identically for unknown and known emails (no account enumeration).
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = forgotPasswordSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input." }, { status: 400 });
  }

  const result = await requestPasswordReset(repo, parsed.data.email, (rawToken) => {
    return `${APP_URL}/reset-password?token=${encodeURIComponent(rawToken)}`;
  });

  if (result) {
    deliverPasswordResetEmail({ to: result.user.email, resetUrl: result.resetUrl });
  }

  return NextResponse.json(
    {
      message: "If an account exists for that email, a password reset link has been sent.",
      // Local-development convenience: surface the link in the API response
      // (never in production) so the flow works without an email provider.
      devResetUrl: process.env.NODE_ENV !== "production" ? (result?.resetUrl ?? null) : undefined,
    },
    { status: 200 },
  );
}
