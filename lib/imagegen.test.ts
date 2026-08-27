import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { generateImage } from "./imagegen";

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
  process.env.GOOGLE_API_KEY = "test-google-key";
});

afterAll(() => {
  vi.unstubAllGlobals();
  delete process.env.GOOGLE_API_KEY;
});

describe("generateImage", () => {
  it("generates via Gemini when the key is set", async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse({
        candidates: [
          { content: { parts: [{ inlineData: { data: "QUJD", mimeType: "image/png" } }] } },
        ],
      }),
    );

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
