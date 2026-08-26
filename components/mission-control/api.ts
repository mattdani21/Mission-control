/**
 * Client-side helpers for the Mission Control dashboard's API calls.
 * The browser only ever talks to our own proxy routes — provider keys stay
 * server-side. The draft route streams Anthropic-shaped SSE events; we read
 * text deltas as they arrive.
 */

export interface CampaignInput {
  title: string;
  brief: string;
  channel: string;
}

export interface ScheduleInput {
  to: string;
  subject: string;
  html: string;
  scheduledFor: string;
}

export async function apiError(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as { error?: string };
    return body.error ?? `Request failed (${response.status})`;
  } catch {
    return `Request failed (${response.status})`;
  }
}

/** POST /api/ai/draft with SSE streaming; onDelta fires per text chunk. */
export async function streamDraft(
  prompt: string,
  onDelta: (text: string) => void,
  signal?: AbortSignal,
): Promise<void> {
  const response = await fetch("/api/ai/draft", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt }),
    signal,
  });
  if (!response.ok || !response.body) {
    throw new Error(await apiError(response));
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data:")) continue;
      const payload = trimmed.slice(5).trim();
      if (!payload || payload === "[DONE]") continue;
      try {
        const event = JSON.parse(payload) as {
          type?: string;
          delta?: { text?: string };
        };
        if (event.type === "content_block_delta" && typeof event.delta?.text === "string") {
          onDelta(event.delta.text);
        }
      } catch {
        // Non-JSON keep-alives are ignored.
      }
    }
  }
}

export async function createCampaign(input: CampaignInput): Promise<{ id: string; status: string }> {
  const response = await fetch("/api/campaigns", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!response.ok) throw new Error(await apiError(response));
  return (await response.json()) as { id: string; status: string };
}

export async function scheduleSend(input: ScheduleInput): Promise<{ id: string; status: string; scheduledFor: string }> {
  const response = await fetch("/api/sends/schedule", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!response.ok) throw new Error(await apiError(response));
  return (await response.json()) as { id: string; status: string; scheduledFor: string };
}

export async function generateImage(prompt: string): Promise<{ image: string; provider: string; model: string }> {
  const response = await fetch("/api/ai/image", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt }),
  });
  if (!response.ok) throw new Error(await apiError(response));
  return (await response.json()) as { image: string; provider: string; model: string };
}

export function tomorrowNineSast(): string {
  // 09:00 SAST (UTC+2) on the next calendar day.
  const now = new Date();
  const next = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 7, 0, 0));
  return next.toISOString();
}
