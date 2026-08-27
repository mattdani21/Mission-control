import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { generateHeroImage, generateImage, HERO_HAND_SAFE_SUFFIX, visionQaImage } from "./imagegen";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function qaPassResponse(reason = "PASS, clean editorial image"): Response {
  return jsonResponse({
    candidates: [{ content: { parts: [{ text: reason }] } }],
  });
}

function qaFailResponse(reason = "FAIL, fused fingers"): Response {
  return jsonResponse({
    candidates: [{ content: { parts: [{ text: reason }] } }],
  });
}

function geminiImageResponse(data = "QUJD", mimeType = "image/png"): Response {
  return jsonResponse({
    candidates: [{ content: { parts: [{ inlineData: { data, mimeType } }] } }],
  });
}

let fetchMock: ReturnType<typeof vi.fn>;

beforeAll(() => {
  vi.stubGlobal("fetch", (fetchMock = vi.fn()));
});

beforeEach(() => {
  fetchMock.mockReset();
  process.env.GOOGLE_API_KEY = "test-google-key";
});

afterAll(() => {
  vi.unstubAllGlobals();
  delete process.env.GOOGLE_API_KEY;
});

describe("generateImage", () => {
  it("generates via Gemini when the key is set", async () => {
    fetchMock.mockResolvedValueOnce(geminiImageResponse());

    const result = await generateImage("a gown");
    expect(result.provider).toBe("gemini");
    expect(result.model).toBe("gemini-2.5-flash-image");
    expect(result.image).toBe("data:image/png;base64,QUJD");

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("gemini-2.5-flash-image:generateContent");
    expect(JSON.parse(init.body as string).contents[0].parts[0].text).toBe("a gown");
  });

  it("throws when no provider key is configured", async () => {
    delete process.env.GOOGLE_API_KEY;
    await expect(generateImage("nothing")).rejects.toThrow("No image provider configured");
  });

  it("throws 502-style error when Gemini fails", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ error: { message: "down" } }, 500));
    await expect(generateImage("sad")).rejects.toThrow(/Image provider failed/);
  });
});

describe("visionQaImage", () => {
  it("returns PASS for a clean verdict", async () => {
    fetchMock.mockResolvedValueOnce(qaPassResponse());
    const verdict = await visionQaImage("data:image/png;base64,QUJD", "k");
    expect(verdict.passed).toBe(true);
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(init.body as string) as {
      contents: Array<{ parts: Array<{ inline_data?: { data: string } }> }>;
    };
    expect(body.contents[0].parts[1].inline_data?.data).toBe("QUJD");
  });

  it("returns FAIL for a deformed-hand verdict", async () => {
    fetchMock.mockResolvedValueOnce(qaFailResponse());
    const verdict = await visionQaImage("data:image/jpeg;base64,/9j/x", "k");
    expect(verdict.passed).toBe(false);
    expect(verdict.reason).toContain("FAIL");
  });

  it("honors the IMAGE_QA_MODEL env override for the QA gate model", async () => {
    process.env.IMAGE_QA_MODEL = "gemini-4-flash-image";
    fetchMock.mockResolvedValueOnce(qaPassResponse("PASS, override model"));
    await visionQaImage("data:image/png;base64,QUJD", "k");
    const [url] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(String(url)).toContain("gemini-4-flash-image:generateContent");
    delete process.env.IMAGE_QA_MODEL;
  });
});

describe("generateHeroImage", () => {
  it("appends the hand-safe suffix and routes to gemini-3-pro-image, QA passes on attempt 1", async () => {
    fetchMock
      .mockResolvedValueOnce(geminiImageResponse("QUJD", "image/png"))
      .mockResolvedValueOnce(qaPassResponse("PASS, hands correct"));

    const result = await generateHeroImage("Emerald corseted column");
    expect(result.provider).toBe("gemini");
    expect(result.model).toBe("gemini-3-pro-image");
    expect(result.qa?.passed).toBe(true);
    expect(result.qa?.attempts).toBe(1);

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(String(url)).toContain("gemini-3-pro-image");
    expect(JSON.parse(init.body as string).contents[0].parts[0].text).toContain(HERO_HAND_SAFE_SUFFIX);
  });

  it("regenerates on QA FAIL and returns the first clean image", async () => {
    fetchMock
      .mockResolvedValueOnce(geminiImageResponse("QUJD", "image/png")) // attempt 1 image
      .mockResolvedValueOnce(qaFailResponse("FAIL, fused fingers")) // attempt 1 QA
      .mockResolvedValueOnce(geminiImageResponse("REVG", "image/png")) // attempt 2 image
      .mockResolvedValueOnce(qaPassResponse("PASS, clean")); // attempt 2 QA

    const result = await generateHeroImage("Champagne gown");
    expect(result.qa?.passed).toBe(true);
    expect(result.qa?.attempts).toBe(2);
    expect(result.image).toBe("data:image/png;base64,REVG");
  });

  it("throws after MAX_HERO_QA_ATTEMPTS when QA never passes", async () => {
    fetchMock
      .mockResolvedValueOnce(geminiImageResponse("QUJD", "image/png"))
      .mockResolvedValueOnce(qaFailResponse("FAIL, fused fingers"))
      .mockResolvedValueOnce(geminiImageResponse("REVG", "image/png"))
      .mockResolvedValueOnce(qaFailResponse("FAIL, six fingers"))
      .mockResolvedValueOnce(geminiImageResponse("TUVH", "image/png"))
      .mockResolvedValueOnce(qaFailResponse("FAIL, extra digit"));

    await expect(generateHeroImage("Chocolate slip")).rejects.toThrow(/failed QA after 3 attempts/);
  });

  it("falls back to gemini-2.5-flash-image when the hero model is unavailable, still QA-gated", async () => {
    // Hero model HTTP error → standard model fallback → QA PASS.
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ error: { message: "model not found" } }, 404))
      .mockResolvedValueOnce(geminiImageResponse("QUJD", "image/png"))
      .mockResolvedValueOnce(qaPassResponse("PASS, fallback chain clean"));

    const result = await generateHeroImage("Burgundy cape");
    expect(result.qa?.passed).toBe(true);
    expect(result.model).toBe("gemini-2.5-flash-image");
  });

  it("throws when no Google key is configured", async () => {
    delete process.env.GOOGLE_API_KEY;
    await expect(generateHeroImage("nothing")).rejects.toThrow("set GOOGLE_API_KEY");
  });
});
