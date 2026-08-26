import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { generateImage } from "./imagegen";

const PNG_BYTES = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 13]);

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

let fetchMock: ReturnType<typeof vi.fn>;

beforeAll(() => {
  vi.stubGlobal("fetch", (fetchMock = vi.fn()));
});

beforeEach(() => {
  fetchMock.mockReset();
  process.env.DEEPINFRA_API_KEY = "test-deepinfra-key";
  process.env.GOOGLE_API_KEY = "test-google-key";
});

afterAll(() => {
  vi.unstubAllGlobals();
  delete process.env.DEEPINFRA_API_KEY;
  delete process.env.GOOGLE_API_KEY;
});

describe("generateImage", () => {
  it("generates via DeepInfra when its key is set", async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ images: [{ url: "https://cdn.example/i.png" }] }))
      .mockResolvedValueOnce(
        new Response(PNG_BYTES as unknown as BodyInit, {
          status: 200,
          headers: { "Content-Type": "image/png" },
        }),
      );

    const result = await generateImage("a gown");
    expect(result.provider).toBe("deepinfra");
    expect(result.image.startsWith("data:image/png;base64,")).toBe(true);

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://api.deepinfra.com/v1/images/generations");
    expect(JSON.parse(init.body as string).prompt).toBe("a gown");
  });

  it("uses b64_json when the provider returns it inline", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ images: [{ b64_json: "QUJD" }] }));
    const result = await generateImage("inline image");
    expect(result.image).toBe("data:image/png;base64,QUJD");
  });

  it("falls back to Gemini when DeepInfra fails", async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ error: { message: "quota" } }, 429))
      .mockResolvedValueOnce(
        jsonResponse({
          candidates: [
            { content: { parts: [{ inlineData: { data: "QUJD", mimeType: "image/jpeg" } }] } },
          ],
        }),
      );

    const result = await generateImage("fallback please");
    expect(result.provider).toBe("gemini");
    expect(result.image).toBe("data:image/jpeg;base64,QUJD");
  });

  it("prefers Gemini when IMAGE_PROVIDER=gemini", async () => {
    process.env.IMAGE_PROVIDER = "gemini";
    try {
      fetchMock
        .mockResolvedValueOnce(
          jsonResponse({
            candidates: [
              { content: { parts: [{ inlineData: { data: "QUJD", mimeType: "image/png" } }] } },
            ],
          }),
        )
        .mockResolvedValueOnce(jsonResponse({ images: [{ b64_json: "REVG" }] }));

      const result = await generateImage("nano banana");
      expect(result.provider).toBe("gemini");
      expect(result.image).toBe("data:image/png;base64,QUJD");
      expect(String(fetchMock.mock.calls[0][0])).toContain("gemini-2.5-flash-image");
    } finally {
      delete process.env.IMAGE_PROVIDER;
    }
  });

  it("throws when no provider key is configured", async () => {
    delete process.env.DEEPINFRA_API_KEY;
    delete process.env.GOOGLE_API_KEY;
    await expect(generateImage("nothing")).rejects.toThrow("No image provider configured");
  });

  it("throws 502-style error when every provider fails", async () => {
    fetchMock
      .mockResolvedValueOnce(jsonResponse({ error: { message: "down" } }, 500))
      .mockResolvedValueOnce(jsonResponse({ error: { message: "also down" } }, 500));
    await expect(generateImage("sad")).rejects.toThrow(/Image providers failed/);
  });
});
