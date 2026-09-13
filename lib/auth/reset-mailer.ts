import pino from "pino";

import { ResendClient } from "../resend";

const logger = pino({ level: process.env.LOG_LEVEL ?? "info" });

const DEFAULT_FROM = "Mission Control <hello@yourdomain.com>";

/**
 * Deliver a password reset link to the account owner via Resend.
 *
 * Uses the same Resend client + EMAIL_FROM as marketing sends. In
 * RESEND_DEV_MODE (no API key) the client returns a synthetic id and the
 * route still echoes `devResetUrl` in non-production so the local flow
 * works offline. A send failure is logged and swallowed so the forgot-
 * password response cannot be used to enumerate accounts.
 */
export async function deliverPasswordResetEmail(opts: { to: string; resetUrl: string }): Promise<void> {
  logger.info({ to: opts.to }, "password-reset-link");

  const from = process.env.EMAIL_FROM || DEFAULT_FROM;
  const html = [
    "<p>You asked to reset your Mission Control password.</p>",
    `<p><a href="${escapeHtml(opts.resetUrl)}">Reset your password</a></p>`,
    "<p>If you did not request this, you can ignore this email.</p>",
  ].join("");

  try {
    const result = await new ResendClient().send({
      from,
      to: opts.to,
      subject: "Reset your Mission Control password",
      html,
    });
    logger.info({ to: opts.to, messageId: result.id }, "password-reset-sent");
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.warn({ to: opts.to, err: message }, "password-reset-send-failed");
  }
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export { logger };
