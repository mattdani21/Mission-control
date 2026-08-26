import { describe, expect, it } from "vitest";

import { chunkToSseLines, deepSeekRequestBody, parseOpenAiChunk, toAnthropicSse } from "./deepseek";

async function readStreamText(stream: ReadableStream<Uint8Array>): Promise<string> {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let text = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    text += decoder.decode(value, { stream: true });
  }
  return text;
}

function streamFromLines(lines: string[]): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  return new ReadableStream<Uint8Array>({
    start(controller) {
      for (const line of lines) controller.enqueue(encoder.encode(`${line}\n`));
      controller.close();
    },
  });
}

describe("deepSeekRequestBody", () => {
  it("builds an OpenAI-compatible streaming chat request", () => {
    const body = deepSeekRequestBody("sys", "user prompt", "deepseek-v4-flash");
    expect(body).toMatchObject({
      model: "deepseek-v4-flash",
      max_tokens: 4096,
      stream: true,
      stream_options: { include_usage: true },
      messages: [
        { role: "system", content: "sys" },
        { role: "user", content: "user prompt" },
      ],
    });
  });
});

describe("parseOpenAiChunk", () => {
  it("parses data payloads and returns null for non-JSON", () => {
    expect(parseOpenAiChunk('{"choices":[]}')).toEqual({ choices: [] });
    expect(parseOpenAiChunk("keep-alive")).toBeNull();
  });
});

describe("chunkToSseLines", () => {
  it("emits content deltas as text_delta events", () => {
    const frames = chunkToSseLines({ choices: [{ delta: { content: "Hi" } }] });
    expect(frames).toHaveLength(1);
    expect(frames[0]).toContain("event: content_block_delta");
    expect(frames[0]).toContain('"text":"Hi"');
  });

  it("emits message_start + message_delta from the usage chunk", () => {
    const frames = chunkToSseLines({
      choices: [],
      usage: { prompt_tokens: 40, completion_tokens: 7 },
    });
    expect(frames).toHaveLength(2);
    expect(frames[0]).toContain("event: message_start");
    expect(frames[0]).toContain('"input_tokens":40');
    expect(frames[0]).toContain('"cache_read_input_tokens":0');
    expect(frames[1]).toContain("event: message_delta");
    expect(frames[1]).toContain('"output_tokens":7');
  });

  it("emits message_stop on finish_reason", () => {
    const frames = chunkToSseLines({ choices: [{ delta: {}, finish_reason: "stop" }] });
    expect(frames).toHaveLength(1);
    expect(frames[0]).toBe('event: message_stop\ndata: {"type":"message_stop"}');
  });
});

describe("toAnthropicSse", () => {
  it("converts a DeepSeek chunk stream into Anthropic-shaped SSE", async () => {
    const source = streamFromLines([
      'data: {"id":"1","choices":[{"index":0,"delta":{"role":"assistant","content":""},"finish_reason":null}]}',
      'data: {"id":"1","choices":[{"index":0,"delta":{"content":"Hello"},"finish_reason":null}]}',
      'data: {"id":"1","choices":[{"index":0,"delta":{"content":" world"},"finish_reason":null}]}',
      'data: {"id":"1","choices":[{"index":0,"delta":{},"finish_reason":"stop"}]}',
      'data: {"id":"1","choices":[],"usage":{"prompt_tokens":12,"completion_tokens":2,"total_tokens":14}}',
      "data: [DONE]",
    ]);

    const text = await readStreamText(toAnthropicSse(source));
    expect(text).toBe(
      [
        'event: content_block_delta',
        'data: {"type":"content_block_delta","delta":{"type":"text_delta","text":"Hello"}}',
        "",
        'event: content_block_delta',
        'data: {"type":"content_block_delta","delta":{"type":"text_delta","text":" world"}}',
        "",
        'event: message_stop',
        'data: {"type":"message_stop"}',
        "",
        'event: message_start',
        'data: {"type":"message_start","message":{"usage":{"input_tokens":12,"output_tokens":1,"cache_read_input_tokens":0}}}',
        "",
        'event: message_delta',
        'data: {"type":"message_delta","usage":{"output_tokens":2}}',
        "",
        "data: [DONE]",
        "",
        "",
      ].join("\n"),
    );
  });

  it("handles data split across chunk boundaries and swallows keep-alives", async () => {
    const full = [
      ': keep-alive comment',
      'data: {"id":"1","choices":[{"index":0,"delta":{"content":"sp"},"finish_reason":null}]}',
      'data: {"id":"1","choices":[{"index":0,"delta":{"content":"lit"},"finish_reason":null}]}',
      'data: {"id":"1","choices":[{"index":0,"delta":{},"finish_reason":"stop"}]}',
      "data: [DONE]",
    ].join("\n");

    const encoder = new TextEncoder();
    const pieces = [full.slice(0, 31), full.slice(31, 79), full.slice(79, 141), full.slice(141)];
    const source = new ReadableStream<Uint8Array>({
      start(controller) {
        for (const piece of pieces) controller.enqueue(encoder.encode(piece));
        controller.close();
      },
    });

    const text = await readStreamText(toAnthropicSse(source));
    expect(text).toContain('"text":"sp"');
    expect(text).toContain('"text":"lit"');
    expect(text).toContain('event: message_stop');
    expect(text.trimEnd().endsWith("data: [DONE]")).toBe(true);
    expect(text).not.toContain("keep-alive");
  });

  it("emits the [DONE] terminator even on an empty stream", async () => {
    const source = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.close();
      },
    });
    expect(await readStreamText(toAnthropicSse(source))).toBe("data: [DONE]\n\n");
  });
});
