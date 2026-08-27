/**
 * Photorealistic image generation for Mission Control — Gemini 2.5 Flash
 * Image ("Nano Banana") only. DeepInfra FLUX was removed per owner
 * direction (Envogue runs Gemini primary: photorealistic, flash-tier
 * affordable, watermark-free).
 *
 * The key stays server-side; the browser only talks to our proxy route.
 * The route /api/ai/image returns { image: "<data URL>", provider, model }.
 */

import pino from "pino";

const logger = pino({ level: process.env.LOG_LEVEL ?? "info" });

export interface GeneratedImage {
  image: string; // data URL, e.g. data:image/png;base64,…
  provider: string;
  model: string;
}

export class ImageGenError extends Error {
  constructor(message: string, readonly status: number | null = null) {
    super(message);
    this.name = "ImageGenError";
  }
}

const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent";

interface GeminiResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{ inlineData?: { data?: string; mimeType?: string } }>;
    };
  }>;
  error?: { message?: string };
}

async function geminiImage(prompt: string, apiKey: string): Promise<GeneratedImage> {
  const response = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
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
    model: "gemini-2.5-flash-image",
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
