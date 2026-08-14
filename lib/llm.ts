import type OpenAI from "openai";

export async function chatCompletionWithRetry(
  openai: OpenAI,
  params: OpenAI.Chat.ChatCompletionCreateParamsNonStreaming,
  maxRetries = 3,
) {
  let lastError: unknown;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await openai.chat.completions.create(params);
    } catch (error: unknown) {
      lastError = error;
      const err = error as { status?: number; code?: string; error?: { code?: string } };
      const isRateLimit =
        err?.status === 429 ||
        err?.code === "rate_limit_exceeded" ||
        err?.error?.code === "rate_limit_exceeded";

      if (!isRateLimit || attempt === maxRetries - 1) throw error;

      const waitMs = Math.min(12000, 2500 * (attempt + 1));
      await new Promise((resolve) => setTimeout(resolve, waitMs));
    }
  }

  throw lastError;
}

export async function chatCompletionStream(
  openai: OpenAI,
  params: Omit<OpenAI.Chat.ChatCompletionCreateParamsStreaming, "stream">,
) {
  return openai.chat.completions.create({
    ...params,
    stream: true,
    stream_options: { include_usage: true },
  });
}

export type SsePayload =
  | { type: "start" }
  | { type: "token"; text: string }
  | { type: "replace"; text: string }
  | {
      type: "done";
      reply: string;
      products?: unknown[];
      actions?: unknown[];
      flowMessages?: string[];
      conversationId?: string;
      offerHandoff?: boolean;
      latencyMs?: number;
    }
  | { type: "error"; message: string; reply?: string };

export function sseEncode(payload: SsePayload): string {
  return `data: ${JSON.stringify(payload)}\n\n`;
}