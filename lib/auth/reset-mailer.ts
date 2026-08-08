import pino from "pino";

const logger = pino({ level: process.env.LOG_LEVEL ?? "info" });

/**
 * Deliver a password reset link to the account owner.
 *
 * The M3 milestone wires a real email provider (Resend) here. Until then the
 * link is emitted via structured logs so the local end-to-end flow — signup →
 * login → logout → reset — is fully exercisable without external services.
 * Route handlers additionally echo the link to the API response in
 * non-production environments for the same reason.
 */
export function deliverPasswordResetEmail(opts: { to: string; resetUrl: string }): void {
  logger.info({ to: opts.to, resetUrl: opts.resetUrl }, "password-reset-link");
}

export { logger };
