import { NextResponse } from "next/server";
import pino from "pino";
import { z } from "zod";

import { auth } from "../../../../auth";
import { generateHeroImage, generateImage } from "../../../../lib/imagegen";
import { PgUsageRepository } from "../../../../lib/usage";

const logger = pino({ level: process.env.LOG_LEVEL ?? "info" });

// POST /api/ai/image — server-side image-generation proxy.
//
// The browser never talks to Gemini directly: it calls this route
// with a prompt and gets back a data URL. Two tiers:
//   - default (drafts/volume): Gemini 2.5 Flash Image (Nano Banana).
//   - hero:true (hero/lookbook shots): routes to gemini-3-pro-image with a
//     hand-safe prompt suffix and an automatic vision-QA gate (up to 3
//     regeneration attempts, PASS/FAIL on deformed hands/artifacts). Only a
//     QA-passed image is returned — gallery cards never publish bad hands.
// Each request records an `ai_usage` row attributed to the caller's
// workspace (image requests carry no token counts; the row exists for audit
// + cost accounting).
//
// Response: 200 { image: "data:<mime>;base64,…", provider, model, qa? }
// Errors:   401 unauthenticated · 400 invalid prompt · 403 no workspace ·
//           503 no provider configured · 502 provider failed / QA failed

const imageSchema = z.object({
  prompt: z
    .string()
    .min(1, "Prompt is required.")
    .max(2_000, "Prompt is too long (max 2,000 characters)."),
  hero: z.boolean().optional(),
});

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

  const parsed = imageSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input." }, { status: 400 });
  }

  const usageRepo = new PgUsageRepository();
  const workspaceId = await usageRepo.getWorkspaceIdForUser(session.user.id);
  if (!workspaceId) {
    return NextResponse.json({ error: "No workspace is attached to this account." }, { status: 403 });
  }

  let result;
  try {
    result = parsed.data.hero
      ? await generateHeroImage(parsed.data.prompt)
      : await generateImage(parsed.data.prompt);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const status = message.includes("No image provider configured") ? 503 : 502;
    logger.warn({ err }, "image generation failed");
    return NextResponse.json({ error: message }, { status });
  }

  void usageRepo
    .record({
      workspaceId,
      provider: result.provider,
      model: result.model,
      inputTokens: 0,
      outputTokens: 0,
      latencyMs: null,
      requestId: null,
    })
    .catch((err: unknown) => logger.warn({ err }, "failed to record ai_usage row"));

  return NextResponse.json(result);
}
