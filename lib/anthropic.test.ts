import { describe, expect, it } from "vitest";

import { parseSseUsage, withUsageCapture, type AnthropicUsage } from "./anthropic";

/**
 * Unit tests for the AI proxy core (lib/anthropic.ts) — the SSE usage
 * tallying and stream-forwarding helpers used by POST /api/ai/draft.
 *
 * The route-level tests exercise the happy path end to end; these cover the
 * failure and edge paths directly: malformed events, upstream errors, and
 * downstream disconnects, all of which must still fire `onComplete` exactly
 * once so the usage record survives.
 */

const encoder = new TextEncoder();

function sseChunk(line: string): Uint8Array {
  return encoder.encode(`${line}\n\n`);
}

async function readAll(stream: ReadableStream<Uint8Array>): Promise<string> {
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

describe("parseSseUsage", () => {
  it("tallies input and cache-read tokens from message_start", () => {
    const usage: AnthropicUsage = { inputTokens: 0, outputTokens: 0, cacheReadTokens: 0 };
    parseSseUsage(
      '{"type":"message_start","message":{"usage":{"input_tokens":50,"output_tokens":1,"cache_read_input_tokens":12}}}',
      usage,
    );
    expect(usage).toEqual({ inputTokens: 50, outputTokens: 0, cacheReadTokens: 12 });
  });

  it("tallies output tokens from message_delta", () => {
    const usage: AnthropicUsage = { inputTokens: 7, outputTokens: 0, cacheReadTokens: 2 };
    parseSseUsage('{"type":"message_delta","usage":{"output_tokens":9}}', usage);
    expect(usage.outputTokens).toBe(9);
  });

  it("ignores message_delta events without a usage field", () => {
    const usage: AnthropicUsage = { inputTokens: 1, outputTokens: 1, cacheReadTokens: 1 };
    parseSseUsage('{"type":"message_delta","delta":{"stop_reason":"end_turn"}}', usage);
    expect(usage).toEqual({ inputTokens: 1, outputTokens: 1, cacheReadTokens: 1 });
  });

  it("ignores non-usage events (content deltas, stops, pings)", () => {
    const usage: AnthropicUsage = { inputTokens: 0, outputTokens: 0, cacheReadTokens: 0 };
    parseSseUsage('{"type":"content_block_delta","delta":{"type":"text_delta","text":"hi"}}', usage);
    parseSseUsage('{"type":"message_stop"}', usage);
    parseSseUsage('{"type":"ping"}', usage);
    expect(usage).toEqual({ inputTokens: 0, outputTokens: 0, cacheReadTokens: 0 });
  });

  it("leaves usage untouched on malformed or non-JSON payloads", () => {
    const usage: AnthropicUsage = { inputTokens: 3, outputTokens: 4, cacheReadTokens: 5 };
    parseSseUsage("not json at all", usage);
    parseSseUsage('[DONE]', usage);
    parseSseUsage('{"type":"message_start",', usage);
    expect(usage).toEqual({ inputTokens: 3, outputTokens: 4, cacheReadTokens: 5 });
  });
});

describe("withUsageCapture", () => {
  it("forwards bytes exactly and fires onComplete once with tallied usage", async () => {
    const body = [
      'data: {"type":"message_start","message":{"usage":{"input_tokens":25,"cache_read_input_tokens":7}}}',
      "",
      'data: {"type":"content_block_delta","delta":{"text":"hello"}}',
      "",
      'data: {"type":"message_delta","usage":{"output_tokens":3}}',
      "",
      "data: [DONE]",
      "",
    ].join("\n");
    const pieces = [body.slice(0, 33), body.slice(33, 70), body.slice(70)];

    const source = new ReadableStream<Uint8Array>({
      start(controller) {
        for (const piece of pieces) controller.enqueue(encoder.encode(piece));
        controller.close();
      },
    });

    const tallied: AnthropicUsage[] = [];
    const stream = withUsageCapture(source, (usage) => tallied.push({ ...usage }));

    expect(await readAll(stream)).toBe(body);
    expect(tallied).toHaveLength(1);
    expect(tallied[0]).toEqual({ inputTokens: 25, outputTokens: 3, cacheReadTokens: 7 });
  });

  it("fires onComplete with usage-so-far and propagates the error when the upstream fails mid-stream", async () => {
    // Pull-based source: each read() triggers exactly one pull, so two chunks
    // are delivered before the third pull throws and errors the stream.
    // (controller.error() in start() would discard the enqueued queue, so the
    // error must arrive after the consumer has received the chunks.)
    let pulls = 0;
    const source = new ReadableStream<Uint8Array>({
      pull(controller) {
        pulls += 1;
        if (pulls === 1) {
          controller.enqueue(sseChunk('data: {"type":"message_start","message":{"usage":{"input_tokens":10,"cache_read_input_tokens":2}}}'));
        } else if (pulls === 2) {
          controller.enqueue(sseChunk('data: {"type":"message_delta","usage":{"output_tokens":4}}'));
        } else {
          throw new Error("upstream exploded");
        }
      },
    });

    const tallied: AnthropicUsage[] = [];
    const stream = withUsageCapture(source, (usage) => tallied.push({ ...usage }));
    const reader = stream.getReader();
    const decoder = new TextDecoder();
    let received = "";

    try {
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        received += decoder.decode(value, { stream: true });
      }
    } catch (err) {
      expect(err).toBeInstanceOf(Error);
      expect((err as Error).message).toBe("upstream exploded");
    }

    // The failure still settles the usage record: onComplete fires exactly
    // once, tallying every event that arrived before the upstream error.
    expect(tallied).toHaveLength(1);
    expect(tallied[0]).toEqual({ inputTokens: 10, outputTokens: 4, cacheReadTokens: 2 });
    expect(received).toContain("input_tokens");
  });

  it("still fires onComplete once with zero usage when the upstream errors before any event", async () => {
    const source = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.error(new Error("connection reset"));
      },
    });

    const tallied: AnthropicUsage[] = [];
    const stream = withUsageCapture(source, (usage) => tallied.push({ ...usage }));

    await expect(readAll(stream)).rejects.toThrow("connection reset");
    expect(tallied).toHaveLength(1);
    expect(tallied[0]).toEqual({ inputTokens: 0, outputTokens: 0, cacheReadTokens: 0 });
  });

  it("fires onComplete exactly once and cancels the upstream when the client disconnects", async () => {
    let upstreamCancelled = false;
    const source = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(sseChunk('data: {"type":"message_start","message":{"usage":{"input_tokens":10}}}'));
        // Deliberately never close: the client hangs up mid-stream.
      },
      cancel() {
        upstreamCancelled = true;
      },
    });

    const tallied: AnthropicUsage[] = [];
    const stream = withUsageCapture(source, (usage) => tallied.push({ ...usage }));
    const reader = stream.getReader();

    await expect(reader.read()).resolves.toMatchObject({ done: false });
    await reader.cancel();
    // Let the cancel handler's reader.cancel() propagate.
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(tallied).toHaveLength(1);
    expect(tallied[0]).toEqual({ inputTokens: 10, outputTokens: 0, cacheReadTokens: 0 });
    expect(upstreamCancelled).toBe(true);
  });
});
