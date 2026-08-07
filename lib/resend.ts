import { randomUUID } from "crypto";

/**
 * Minimal Resend HTTP client for sending email (fetch-based, no SDK).
 *
 * The browser never talks to Resend directly — the worker and the API routes
 * use this server-side client with RESEND_API_KEY, which never leaves the
 * server. Responses carry a Resend message id that is stored on the
 * send_schedules row so later webhook events can be correlated to the send.
 *
 * Dev mode (RESEND_DEV_MODE=1): when no RESEND_API_KEY is configured the
 * client returns a synthetic message id instead of calling the network, so
 * the full schedule → claim → send → settle flow works locally without a
 * Resend account. It never activates when a real key is present.
 */

export interface ResendEmail {
  from: string;
  to: string;
  subject: string;
  html: string;
}

export interface ResendSendResult {
  id: string;
}

/** Boundary the worker depends on; real implementation is ResendClient. */
export interface EmailSender {
  send(email: ResendEmail): Promise<ResendSendResult>;
}

export class ResendError extends Error {
  constructor(
    message: string,
    readonly status: number | null = null,
    readonly code: string | null = null,
  ) {
    super(message);
    this.name = "ResendError";
  }
}

const RESEND_URL = "https://api.resend.com/emails";

type ResendResponseBody = { id?: string; message?: string; name?: string };

export class ResendClient implements EmailSender {
  constructor(
    private readonly apiKey: string | undefined = process.env.RESEND_API_KEY,
    private readonly devMode: boolean = process.env.RESEND_DEV_MODE === "1",
  ) {}

  async send(email: ResendEmail): Promise<ResendSendResult> {
    if (!this.apiKey) {
      if (this.devMode) {
        return { id: `dev_${randomUUID()}` };
      }
      throw new ResendError(
        "RESEND_API_KEY is not set — configure it or set RESEND_DEV_MODE=1 for local development.",
      );
    }

    let response: Response;
    try {
      response = await fetch(RESEND_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: email.from,
          to: [email.to],
          subject: email.subject,
          html: email.html,
        }),
      });
    } catch (err) {
      throw new ResendError(
        `Resend request failed: ${err instanceof Error ? err.message : String(err)}`,
      );
    }

    let body: ResendResponseBody | null = null;
    try {
      body = (await response.json()) as ResendResponseBody;
    } catch {
      // Non-JSON error body — fall through to the status-based message.
    }

    if (!response.ok) {
      const detail = body?.message ?? body?.name ?? `HTTP ${response.status}`;
      throw new ResendError(`Resend rejected the send (${detail}).`, response.status, body?.name ?? null);
    }

    if (!body?.id) {
      throw new ResendError("Resend returned an unexpected response (no message id).", response.status);
    }

    return { id: body.id };
  }
}
