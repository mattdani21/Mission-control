/**
 * Photorealistic image generation for Mission Control — Gemini only.
 * DeepInfra FLUX was removed per owner direction (Envogue runs Gemini:
 * photorealistic, flash-tier affordable, watermark-free).
 *
 * Two tiers:
 *  - generateImage (drafts/volume): Gemini 2.5 Flash Image ("Nano Banana").
 *  - generateHeroImage (heroes/lookbook): routes hero shots to
 *    gemini-3-pro-image (better anatomy), appends a hand-safe prompt
 *    suffix, then runs an automatic vision-QA gate (PASS/FAIL on deformed
 *    hands/artifacts) with up to 3 regeneration attempts. Only a
 *    QA-passed image is returned — callers publish it to gallery cards, so
 *    owner-facing assets never show deformed hands.
 *
 * All keys stay server-side; the browser only talks to our proxy route.
 * The route /api/ai/image returns { image: "<data URL>", provider, model }.
 */

import pino from "pino";

const logger = pino({ level: process.env.LOG_LEVEL ?? "info" });

export interface GeneratedImage {
  image: string; // data URL, e.g. data:image/png;base64,…
  provider: string;
  model: string;
  /** Hero tier only: QA verdict + attempt count (drafts omit this). */
  qa?: { passed: boolean; attempts: number; reason: string };
}

export class ImageGenError extends Error {
  constructor(message: string, readonly status: number | null = null) {
    super(message);
    this.name = "ImageGenError";
  }
}

const GEMINI_IMAGE_MODEL = "gemini-2.5-flash-image";
const HERO_IMAGE_MODEL = "gemini-3-pro-image";
// gemini-2.5-flash is retired for this key; the QA gate defaults to
// gemini-3.5-flash (verified working). Override via the IMAGE_QA_MODEL
// env var (documented in .env.example); read lazily so tests and config
// changes take effect per call.
const DEFAULT_QA_VISION_MODEL = "gemini-3.5-flash";
function qaVisionModel(): string {
  return process.env.IMAGE_QA_MODEL ?? DEFAULT_QA_VISION_MODEL;
}
const GEMINI_GENERATE_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/";
const MAX_HERO_QA_ATTEMPTS = 3;

/**
 * Hand-safe suffix appended to every hero/lookbook prompt (QA fix):
 * anatomical hands, five separated fingers, no extra digits, relaxed
 * pose, hands not gripping fabric.
 */
export const HERO_HAND_SAFE_SUFFIX =
  "Anatomically correct hands, five natural separated fingers on each hand, " +
  "no extra digits, relaxed natural hand pose, hands not gripping fabric.";

interface GeminiResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{ inlineData?: { data?: string; mimeType?: string }; text?: string }>;
    };
  }>;
  error?: { message?: string };
}

function geminiGenerateUrl(model: string, apiKey: string): string {
  return `${GEMINI_GENERATE_URL}${model}:generateContent?key=${apiKey}`;
}

async function geminiImage(
  prompt: string,
  apiKey: string,
  model: string = GEMINI_IMAGE_MODEL,
): Promise<GeneratedImage> {
  const response = await fetch(geminiGenerateUrl(model, apiKey), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { responseModalities: ["IMAGE"] },
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new ImageGenError(
      `Gemini rejected the request (HTTP ${response.status}): ${detail.slice(0, 200)}`,
      response.status,
    );
  }

  const body = (await response.json()) as GeminiResponse;
  const part = body.candidates?.[0]?.content?.parts?.find((p) => p.inlineData?.data);
  if (body.error?.message || !part?.inlineData?.data) {
    throw new ImageGenError(`Gemini returned no image: ${body.error?.message ?? "empty result"}`);
  }
  return {
    image: `data:${part.inlineData.mimeType ?? "image/png"};base64,${part.inlineData.data}`,
    provider: "gemini",
    model,
  };
}

/**
 * Generate an image via Gemini 2.5 Flash Image. Requires GOOGLE_API_KEY.
 * Throws ImageGenError when no key is configured (503) or the provider
 * fails (502 details preserved on the error message).
 */
export async function generateImage(prompt: string): Promise<GeneratedImage> {
  const googleKey = process.env.GOOGLE_API_KEY;

  if (!googleKey) {
    throw new ImageGenError("No image provider configured — set GOOGLE_API_KEY.");
  }

  try {
    return await geminiImage(prompt, googleKey);
  } catch (err) {
    logger.warn({ err }, "image generation failed");
    throw new ImageGenError(
      `Image provider failed: ${err instanceof Error ? err.message : String(err)}`,
      502,
    );
  }
}

export interface QaVerdict {
  passed: boolean;
  reason: string;
}

/**
 * Vision-QA gate: inspect a generated image with a Gemini vision model and
 * return PASS/FAIL on deformed hands / AI artifacts. The QA prompt is
 * strict — any fused/missing/extra finger, uncanny hand, garbled text, or
 * obvious artifact is a FAIL.
 */
export async function visionQaImage(dataUrl: string, apiKey: string): Promise<QaVerdict> {
  const mimeMatch = dataUrl.match(/^data:([^;]+);base64,(.*)$/);
  if (!mimeMatch) {
    return { passed: false, reason: "QA gate: image is not a valid data URL." };
  }
  const mime = mimeMatch[1];
  const b64 = mimeMatch[2];

  const prompt =
    "You are an image QA gate for an AI fashion lookbook. Inspect the image and answer PASS or FAIL only. " +
    "FAIL if: deformed or extra fingers, missing/merged/fused fingers, uncanny hands, garbled text, or obvious " +
    "AI artifacts. PASS if: hands (if visible) are anatomically correct with five natural separated fingers, " +
    "no extra digits, and the image looks like a clean editorial fashion photograph. " +
    "Reply with exactly: PASS or FAIL, then one short reason.";

  const response = await fetch(geminiGenerateUrl(qaVisionModel(), apiKey), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            { text: prompt },
            { inline_data: { mime_type: mime, data: b64 } },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    return { passed: false, reason: `QA gate: vision check failed (HTTP ${response.status}): ${detail.slice(0, 120)}` };
  }

  const body = (await response.json()) as GeminiResponse;
  const text = body.candidates?.[0]?.content?.parts?.find((p) => p.text)?.text?.trim() ?? "";
  const passed = /^PASS\b/i.test(text);
  return { passed, reason: text.slice(0, 200) || "no verdict" };
}

/**
 * Generate a hero/lookbook image with the auto-QA gate.
 *
 * Hero shots route to gemini-3-pro-image (better anatomy than
 * gemini-2.5-flash-image) with the hand-safe suffix appended. After each
 * generation the image is vision-QA'd; on FAIL it regenerates, up to
 * MAX_HERO_QA_ATTEMPTS. Only a QA-passed image is returned. Throws
 * ImageGenError when nothing passes — callers must not publish.
 */
export async function generateHeroImage(prompt: string): Promise<GeneratedImage> {
  const googleKey = process.env.GOOGLE_API_KEY;
  if (!googleKey) {
    throw new ImageGenError("No image provider configured — set GOOGLE_API_KEY.");
  }

  const safePrompt = `${prompt} ${HERO_HAND_SAFE_SUFFIX}`.trim();
  let lastError: unknown = null;
  let lastVerdict: QaVerdict | null = null;

  for (let attempt = 1; attempt <= MAX_HERO_QA_ATTEMPTS; attempt++) {
    let candidate: GeneratedImage;
    try {
      candidate = await geminiImage(safePrompt, googleKey, HERO_IMAGE_MODEL);
    } catch (err) {
      // Hero model unavailable → fall back to the standard model for this
      // attempt — still QA-gated.
      logger.warn({ err }, "gemini-3-pro-image unavailable; using gemini-2.5-flash-image");
      try {
        candidate = await geminiImage(safePrompt, googleKey, GEMINI_IMAGE_MODEL);
      } catch (err2) {
        lastError = err2;
        continue;
      }
    }

    try {
      const verdict = await visionQaImage(candidate.image, googleKey);
      lastVerdict = verdict;
      if (verdict.passed) {
        return { ...candidate, qa: { passed: true, attempts: attempt, reason: verdict.reason } };
      }
      logger.warn({ attempt, reason: verdict.reason }, "hero image failed QA; regenerating");
    } catch (err) {
      lastError = err;
      logger.warn({ err }, "hero QA check failed; treating as fail and regenerating");
    }
  }

  const detail = lastVerdict ? `last QA verdict: ${lastVerdict.reason}` : `last error: ${String(lastError)}`;
  throw new ImageGenError(`Hero image failed QA after ${MAX_HERO_QA_ATTEMPTS} attempts — ${detail}`, 502);
}
