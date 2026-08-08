import { NextResponse } from "next/server";
import pino from "pino";
import { z } from "zod";

import { auth } from "../../../../auth";
import { withUsageCapture } from "../../../../lib/anthropic";
import { PgUsageRepository } from "../../../../lib/usage";

const logger = pino({ level: process.env.LOG_LEVEL ?? "info" });

// POST /api/ai/draft — server-side Anthropic proxy. Never called from the
// browser directly: the browser only talks to this route, which forwards to
// the Anthropic Messages API with the API key (kept out of the client) and
// records per-workspace token usage in the `ai_usage` table.
//
// Streaming: the Anthropic SSE stream is forwarded to the client verbatim;
// while it passes through, usage is tallied from the message_start /
// message_delta events and persisted once the stream ends (see lib/anthropic).
//
// Prompt caching: the system prompt is a stable prefix across every request,
// so it is marked cacheable (cache_control: ephemeral). Repeat calls in the
// same cache window are billed as cache_read tokens instead of fresh input.

const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_VERSION = "2023-06-01";
const PROMPT_CACHING_BETA = "prompt-caching-2024-07-31";
const MAX_TOKENS = 4096;

const SYSTEM_PROMPT = `You are Mission Control, the AI assistant for a marketing
operations team. You write sharp, on-brand marketing copy: campaign drafts,
subject lines, email bodies, and social posts. Match the brand voice: clear,
confident, and human. Return only the requested copy — no preamble, no
explanation.`;

const draftSchema = z.object({
  prompt: z
    .string()
    .min(1, "Prompt is required.")
    .max(20_000, "Prompt is too long (max 20,000 characters)."),
});

// POST /api/ai/draft — { prompt: string } → streaming draft.
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = draftSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input." }, { status: 400 });
  }

  const usageRepo = new PgUsageRepository();
  const workspaceId = await usageRepo.getWorkspaceIdForUser(session.user.id);
  if (!workspaceId) {
    return NextResponse.json({ error: "No workspace is attached to this account." }, { status: 403 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "The AI assistant is not configured." }, { status: 503 });
  }

  const model = process.env.ANTHROPIC_MODEL ?? "claude-opus-4-7";
  const startedAt = Date.now();

  let upstream: Response;
  try {
    upstream = await fetch(ANTHROPIC_URL, {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": ANTHROPIC_VERSION,
        "anthropic-beta": PROMPT_CACHING_BETA,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model,
        max_tokens: MAX_TOKENS,
        system: [{ type: "text", text: SYSTEM_PROMPT, cache_control: { type: "ephemeral" } }],
        messages: [{ role: "user", content: parsed.data.prompt }],
        stream: true,
      }),
    });
  } catch {
    return NextResponse.json({ error: "The AI provider could not be reached." }, { status: 502 });
  }

  if (!upstream.ok || !upstream.body) {
    const detail = await upstream.text().catch(() => "");
    logger.warn({ status: upstream.status, detail: detail.slice(0, 300) }, "anthropic upstream error");
    return NextResponse.json({ error: "The AI provider returned an error." }, { status: 502 });
  }

  const requestId = upstream.headers.get("request-id");
  const stream = withUsageCapture(upstream.body, (usage) => {
    void usageRepo
      .record({
        workspaceId,
        provider: "anthropic",
        model,
        inputTokens: usage.inputTokens,
        outputTokens: usage.outputTokens,
        cacheReadTokens: usage.cacheReadTokens,
        latencyMs: Date.now() - startedAt,
        requestId,
      })
      .catch((err: unknown) => logger.warn({ err }, "failed to record ai_usage row"));
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
