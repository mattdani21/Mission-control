/**
 * Affordable photorealistic image generation for Mission Control.
 *
 * Primary: FLUX.1-dev via DeepInfra (~$0.025–0.05/image, photorealistic).
 * Fallback: Gemini 2.5 Flash Image ("Nano Banana") via GOOGLE_API_KEY.
 * Both keys stay server-side; the browser only talks to our proxy route.
 *
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

const DEEPINFRA_URL = "https://api.deepinfra.com/v1/images/generations";
const DEEPINFRA_MODEL = "black-forest-labs/FLUX.1-dev";
const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent";

interface DeepInfraResponse {
  images?: Array<{ url?: string; b64_json?: string }>;
  error?: { message?: string };
}

interface GeminiResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{ inlineData?: { data?: string; mimeType?: string } }>;
    };
  }>;
  error?: { message?: string };
}

async function fetchBytes(url: string): Promise<{ bytes: Uint8Array; mime: string }> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new ImageGenError(`image download failed (HTTP ${response.status})`, response.status);
  }
  const bytes = new Uint8Array(await response.arrayBuffer());
  const mime = response.headers.get("content-type")?.split(";")[0]?.trim() || "image/png";
  return { bytes, mime };
}

async function deepInfraImage(prompt: string, apiKey: string): Promise<GeneratedImage> {
  const response = await fetch(DEEPINFRA_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.DEEPINFRA_MODEL ?? DEEPINFRA_MODEL,
      prompt,
      image_size: "1024x1024",
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new ImageGenError(
      `DeepInfra rejected the request (HTTP ${response.status}): ${detail.slice(0, 200)}`,
      response.status,
    );
  }

  const body = (await response.json()) as DeepInfraResponse;
  const item = body.images?.[0];
  if (body.error?.message || !item) {
    throw new ImageGenError(`DeepInfra returned no image: ${body.error?.message ?? "empty result"}`);
  }
  if (item.b64_json) {
    return { image: `data:image/png;base64,${item.b64_json}`, provider: "deepinfra", model: process.env.DEEPINFRA_MODEL ?? DEEPINFRA_MODEL };
  }
  if (item.url) {
    const { bytes, mime } = await fetchBytes(item.url);
    const b64 = Buffer.from(bytes).toString("base64");
    return { image: `data:${mime};base64,${b64}`, provider: "deepinfra", model: process.env.DEEPINFRA_MODEL ?? DEEPINFRA_MODEL };
  }
  throw new ImageGenError("DeepInfra returned an unexpected response (no image).");
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
 * Generate an image: DeepInfra FLUX.1-dev first, Gemini 2.5 Flash Image as
 * fallback. Throws ImageGenError when no provider is configured (503) or all
 * providers failed (502 details preserved on the error message).
 */
export async function generateImage(prompt: string): Promise<GeneratedImage> {
  const deepinfraKey = process.env.DEEPINFRA_API_KEY;
  const googleKey = process.env.GOOGLE_API_KEY;

  if (!deepinfraKey && !googleKey) {
    throw new ImageGenError(
      "No image provider configured — set DEEPINFRA_API_KEY or GOOGLE_API_KEY.",
    );
  }

  let lastError: unknown = null;
  if (deepinfraKey) {
    try {
      return await deepInfraImage(prompt, deepinfraKey);
    } catch (err) {
      lastError = err;
      logger.warn({ err }, "deepinfra image generation failed; trying gemini fallback");
    }
  }
  if (googleKey) {
    try {
      return await geminiImage(prompt, googleKey);
    } catch (err) {
      lastError = err;
    }
  }
  throw new ImageGenError(
    `Image providers failed: ${lastError instanceof Error ? lastError.message : String(lastError)}`,
    502,
  );
}
