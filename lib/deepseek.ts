/**
 * DeepSeek (OpenAI-compatible chat completions) client for the AI proxy.
 *
 * Mission Control's AI route used to forward Anthropic Messages API SSE
 * streams verbatim. The client contract is the stream *shape*, not the
 * upstream — so this module converts DeepSeek's OpenAI-style streaming
 * chunks into the same Anthropic-shaped SSE events the route has always
 * emitted (message_start → content_block_delta… → message_delta →
 * message_stop → [DONE]). lib/anthropic.ts's usage tallying sits on the
 * transformed stream and keeps working unchanged.
 *
 * Cheap by design: DeepSeek v4-flash via the shared GAPOS_LLM_API_KEY
 * (DeepSeek key), typically an order of magnitude cheaper than the
 * claude-opus-class model it replaces.
 */

export interface DeepSeekUsage {
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
}

export interface OpenAiChunk {
  id?: string;
  choices?: Array<{
    index?: number;
    delta?: { content?: string | null; role?: string };
    finish_reason?: string | null;
  }>;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
}

export const DEEPSEEK_URL = "https://api.deepseek.com/chat/completions";

/** Build the OpenAI-compatible request body the proxy sends upstream. */
export function deepSeekRequestBody(
  systemPrompt: string,
  userPrompt: string,
  model: string,
  maxTokens = 4096,
): Record<string, unknown> {
  return {
    model,
    max_tokens: maxTokens,
    stream: true,
    stream_options: { include_usage: true },
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
  };
}

/** Parse one OpenAI-style `data:` JSON payload; null on non-JSON lines. */
export function parseOpenAiChunk(payload: string): OpenAiChunk | null {
  try {
    return JSON.parse(payload) as OpenAiChunk;
  } catch {
    return null;
  }
}

/**
 * Convert a parsed OpenAI chunk into Anthropic-shaped SSE event frames.
 * Each frame is one complete SSE event ("event: …\ndata: …"); the caller
 * joins frames with a blank line ("\n\n") per the SSE spec.
 */
export function chunkToSseLines(chunk: OpenAiChunk): string[] {
  const frames: string[] = [];

  const text = chunk.choices?.[0]?.delta?.content;
  if (text) {
    frames.push(
      `event: content_block_delta\ndata: ${JSON.stringify({
        type: "content_block_delta",
        delta: { type: "text_delta", text },
      })}`,
    );
  }

  if (chunk.usage) {
    // OpenAI-style streams report usage only on the final chunk, so the
    // input-token figure arrives after the text. Anthropic reports it on
    // message_start; emit the same event here so the tally sees it.
    frames.push(
      `event: message_start\ndata: ${JSON.stringify({
        type: "message_start",
        message: {
          usage: {
            input_tokens: chunk.usage.prompt_tokens ?? 0,
            output_tokens: 1,
            cache_read_input_tokens: 0,
          },
        },
      })}`,
    );
    frames.push(
      `event: message_delta\ndata: ${JSON.stringify({
        type: "message_delta",
        usage: { output_tokens: chunk.usage.completion_tokens ?? 0 },
      })}`,
    );
  }

  if (chunk.choices?.[0]?.finish_reason) {
    frames.push(`event: message_stop\ndata: ${JSON.stringify({ type: "message_stop" })}`);
  }

  return frames;
}

const encoder = new TextEncoder();
const decoder = new TextDecoder();

/**
 * Wrap a DeepSeek OpenAI-style SSE stream and re-emit it as Anthropic-shaped
 * SSE events (see chunkToSseLines). Non-JSON keep-alives and `[DONE]` are
 * swallowed; a final `data: [DONE]` terminator is appended so downstream
 * clients always see a clean end.
 */
export function toAnthropicSse(
  source: ReadableStream<Uint8Array>,
): ReadableStream<Uint8Array> {
  let buffer = "";
  let finished = false;

  const reader = source.getReader();

  const emit = (controller: ReadableStreamDefaultController<Uint8Array>, frames: string[]) => {
    if (frames.length === 0) return;
    // Join frames with a blank line, then terminate the last frame.
    controller.enqueue(encoder.encode(`${frames.join("\n\n")}\n\n`));
  };

  return new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";
          for (const raw of lines) {
            const trimmed = raw.trim();
            if (!trimmed.startsWith("data:")) continue;
            const payload = trimmed.slice(5).trim();
            if (!payload || payload === "[DONE]") continue;
            const chunk = parseOpenAiChunk(payload);
            if (chunk) emit(controller, chunkToSseLines(chunk));
          }
        }
        emit(controller, ["data: [DONE]"]);
        finished = true;
        controller.close();
      } catch (err) {
        finished = true;
        controller.error(err instanceof Error ? err : new Error(String(err)));
      }
    },
    cancel() {
      if (!finished) {
        finished = true;
        void reader.cancel().catch(() => undefined);
      }
    },
  });
}
