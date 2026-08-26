import { NextResponse } from "next/server";
import pino from "pino";
import { z } from "zod";

import { auth } from "../../../../auth";
import { withUsageCapture } from "../../../../lib/anthropic";
import { deepSeekRequestBody, toAnthropicSse } from "../../../../lib/deepseek";
import { PgUsageRepository } from "../../../../lib/usage";

const logger = pino({ level: process.env.LOG_LEVEL ?? "info" });

// POST /api/ai/draft — server-side LLM proxy. Never called from the browser
// directly: the browser only talks to this route, which forwards to the
// DeepSeek (OpenAI-compatible) chat-completions API with the API key kept
// out of the client, and records per-workspace token usage in `ai_usage`.
//
// Streaming: DeepSeek's OpenAI-style chunks are converted to the same
// Anthropic-shaped SSE events the route always emitted (message_start →
// content_block_delta… → message_delta → message_stop → [DONE]), so the
// client contract is unchanged; while it passes through, usage is tallied
// and persisted once the stream ends (see lib/anthropic.ts + lib/deepseek.ts).
//
// Cost: DeepSeek v4-flash via the shared GAPOS_LLM_API_KEY — typically an
// order of magnitude cheaper than the claude-opus-class model it replaces.
//
// Dev mode (LLM_DEV_MODE=1): when no API key is configured the route returns
// a canned streaming draft instead of calling the network, so the full
// signup → campaign → AI draft → send flow works offline (mirrors
// RESEND_DEV_MODE). Never activates when a real key is present.

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

function llmApiKey(): string | undefined {
  return process.env.GAPOS_LLM_API_KEY ?? process.env.LLM_API_KEY;
}

const DEV_SSE = [
  'event: message_start',
  'data: {"type":"message_start","message":{"usage":{"input_tokens":24,"output_tokens":1,"cache_read_input_tokens":0}}}',
  "",
  'event: content_block_delta',
  'data: {"type":"content_block_delta","delta":{"type":"text_delta","text":"Draft for Envogue — the corseted column is the matric look of 2027.\\n\\nEarly-bird bookings include complimentary alterations before 30 June. Sizes 34–42."}}',
  "",
  'event: message_delta',
  'data: {"type":"message_delta","usage":{"output_tokens":38}}',
  "",
  'event: message_stop',
  'data: {"type":"message_stop"}',
  "",
  "data: [DONE]",
  "",
].join("\n");

function devModeStream(): ReadableStream<Uint8Array> {
  return new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(new TextEncoder().encode(DEV_SSE));
      controller.close();
    },
  });
}

// POST /api/ai/draft — { prompt: string } → streaming draft (SSE).
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

  const apiKey = llmApiKey();
  if (!apiKey && process.env.LLM_DEV_MODE !== "1") {
    return NextResponse.json({ error: "The AI assistant is not configured." }, { status: 503 });
  }

  const model = process.env.DEEPSEEK_MODEL ?? "deepseek-v4-flash";
  const baseUrl = (process.env.DEEPSEEK_BASE_URL ?? "https://api.deepseek.com").replace(/\/$/, "");
  const startedAt = Date.now();

  const recordUsage = (inputTokens: number, outputTokens: number, cacheReadTokens: number, requestId: string | null) => {
    void usageRepo
      .record({
        workspaceId,
        provider: "deepseek",
        model,
        inputTokens,
        outputTokens,
        cacheReadTokens,
        latencyMs: Date.now() - startedAt,
        requestId,
      })
      .catch((err: unknown) => logger.warn({ err }, "failed to record ai_usage row"));
  };

  let stream: ReadableStream<Uint8Array>;
  let requestId: string | null = null;

  if (!apiKey) {
    // Dev mode: canned stream, still exercised through the real capture path.
    stream = devModeStream();
    requestId = "dev_mode";
  } else {
    let upstream: Response;
    try {
      upstream = await fetch(`${baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(deepSeekRequestBody(SYSTEM_PROMPT, parsed.data.prompt, model, MAX_TOKENS)),
      });
    } catch {
      return NextResponse.json({ error: "The AI provider could not be reached." }, { status: 502 });
    }

    if (!upstream.ok || !upstream.body) {
      const detail = await upstream.text().catch(() => "");
      logger.warn({ status: upstream.status, detail: detail.slice(0, 300) }, "deepseek upstream error");
      return NextResponse.json({ error: "The AI provider returned an error." }, { status: 502 });
    }

    requestId = upstream.headers.get("request-id") ?? upstream.headers.get("x-request-id");
    stream = toAnthropicSse(upstream.body);
  }

  const finalStream = withUsageCapture(stream, (usage) => {
    recordUsage(usage.inputTokens, usage.outputTokens, usage.cacheReadTokens, requestId);
  });

  return new Response(finalStream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
