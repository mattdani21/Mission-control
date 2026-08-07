/**
 * Anthropic Messages API SSE helpers: forward a streaming response while
 * tallying token usage from the events in flight. Kept out of the route
 * module so it stays unit-testable (Next.js route files may only export
 * route handler fields).
 */

const decoder = new TextDecoder();

export interface AnthropicUsage {
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
}

/** Tally token usage from a single SSE `data:` JSON payload. */
export function parseSseUsage(payload: string, usage: AnthropicUsage): AnthropicUsage {
  try {
    const event = JSON.parse(payload) as {
      type?: string;
      message?: { usage?: { input_tokens?: number; cache_read_input_tokens?: number } };
      usage?: { output_tokens?: number };
    };
    if (event.type === "message_start" && event.message?.usage) {
      usage.inputTokens = event.message.usage.input_tokens ?? 0;
      usage.cacheReadTokens = event.message.usage.cache_read_input_tokens ?? 0;
    } else if (event.type === "message_delta" && event.usage) {
      usage.outputTokens = event.usage.output_tokens ?? usage.outputTokens;
    }
  } catch {
    // Non-JSON SSE lines (comments, keep-alives) are forwarded untouched.
  }
  return usage;
}

/**
 * Wrap an Anthropic SSE stream: forward every byte to the client while parsing
 * usage from the events in flight. `onComplete` fires exactly once — when the
 * stream ends normally, on upstream error, or when the downstream client
 * disconnects — with the tallied usage, so the record survives a dropped
 * connection.
 */
export function withUsageCapture(
  source: ReadableStream<Uint8Array>,
  onComplete: (usage: AnthropicUsage) => void,
): ReadableStream<Uint8Array> {
  const usage: AnthropicUsage = { inputTokens: 0, outputTokens: 0, cacheReadTokens: 0 };
  let buffer = "";
  let finished = false;

  const finish = () => {
    if (finished) return;
    finished = true;
    onComplete(usage);
  };

  const reader = source.getReader();

  return new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";
          for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.startsWith("data:")) {
              const payload = trimmed.slice(5).trim();
              if (payload && payload !== "[DONE]") parseSseUsage(payload, usage);
            }
          }
          controller.enqueue(value);
        }
        finish();
        controller.close();
      } catch (err) {
        finish();
        controller.error(err instanceof Error ? err : new Error(String(err)));
      }
    },
    cancel() {
      finish();
      void reader.cancel().catch(() => undefined);
    },
  });
}
