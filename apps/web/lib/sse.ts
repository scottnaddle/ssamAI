/**
 * Minimal SSE parser for LibreChat's event stream.
 *
 * LibreChat emits standard SSE frames:
 *   event: message\ndata: {...json...}\n\n
 *   event: error\ndata: "..." \n\n
 *   event: attachment\ndata: {...}\n\n
 *
 * Some endpoints emit typed events like `event: on text`,
 * `event: on final`, etc. This parser is deliberately permissive —
 * any line starting with `event:` or `data:` is captured; anything else
 * terminates the current event on a blank line.
 */

export interface SSEEvent {
  event: string | null;
  data: string;
}

export interface StreamHandlers {
  onEvent: (evt: SSEEvent) => void;
  onError?: (err: Error) => void;
  onClose?: () => void;
}

/**
 * Consume a fetch Response body as SSE. Calls `onEvent` per parsed frame.
 */
export async function consumeSSEStream(
  response: Response,
  handlers: StreamHandlers,
): Promise<void> {
  if (!response.body) {
    throw new Error("SSE response has no body");
  }
  const reader = response.body.getReader();
  const decoder = new TextDecoder("utf-8");
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      // SSE frames are separated by a blank line.
      let frameEnd: number;
      while ((frameEnd = buffer.indexOf("\n\n")) !== -1) {
        const frame = buffer.slice(0, frameEnd);
        buffer = buffer.slice(frameEnd + 2);
        const evt = parseFrame(frame);
        if (evt) handlers.onEvent(evt);
      }
    }
    // Flush any trailing partial frame.
    if (buffer.trim()) {
      const evt = parseFrame(buffer);
      if (evt) handlers.onEvent(evt);
    }
    handlers.onClose?.();
  } catch (err) {
    handlers.onError?.(err instanceof Error ? err : new Error(String(err)));
    throw err;
  } finally {
    reader.releaseLock();
  }
}

function parseFrame(frame: string): SSEEvent | null {
  let event: string | null = null;
  const dataLines: string[] = [];

  for (const line of frame.split("\n")) {
    if (line.startsWith("event:")) {
      event = line.slice(6).trim();
    } else if (line.startsWith("data:")) {
      dataLines.push(line.slice(5).trimStart());
    }
    // Comments (lines starting with ":") are ignored.
  }

  // Discard the OpenAI-style [DONE] sentinel.
  const data = dataLines.join("\n");
  if (data === "[DONE]") return null;

  return { event, data };
}

/**
 * Try to parse a LibreChat SSE data payload as JSON.
 * LibreChat's `event: message` carries a JSON object whose shape varies by
 * event (text deltas, final message, run progress, etc.). Returns null on
 * non-JSON payloads so the caller can skip silently.
 */
export function tryParseData<T = unknown>(data: string): T | null {
  if (!data) return null;
  try {
    return JSON.parse(data) as T;
  } catch {
    return null;
  }
}

/**
 * LibreChat v0.8.6 agents stream — payload shapes.
 *
 * The stream emits `event: message` frames with a JSON body whose shape varies
 * by phase of the run. The most common shapes:
 *
 *   1. User echo:
 *      { created: true, message: { messageId, sender: "User", text, ... }, streamId }
 *
 *   2. Run step (not text, but progress):
 *      { event: "on_run_step", data: { id, type, ... } }
 *
 *   3. Text delta (the actual streamed response):
 *      { event: "on_message_delta", data: { id, delta: { content: [{ type: "text", text: "토" }] } } }
 *
 *   4. Final (stream end, contains the full responseMessage):
 *      { final: true, conversation, responseMessage: { messageId, text, ... } }
 */
export interface LibreChatMessageEvent {
  // Phase 1 — user echo
  created?: boolean;
  message?: {
    messageId?: string;
    sender?: string;
    text?: string;
    isCreatedByUser?: boolean;
    parentMessageId?: string;
    conversationId?: string;
  };

  // Phase 2 — run-step (ignored by UI, useful for debugging)
  event?: string;
  data?: {
    id?: string;
    type?: string;
    delta?: { content?: Array<{ type?: string; text?: string }> };
    [key: string]: unknown;
  };

  // Phase 3 — text delta (already nested above)

  // Phase 4 — final
  final?: boolean;
  conversation?: { conversationId?: string; title?: string; [key: string]: unknown };
  responseMessage?: {
    messageId?: string;
    parentMessageId?: string;
    conversationId?: string;
    text?: string;
    content?: Array<{ type?: string; text?: string }>;
    model?: string;
  };

  // Error / meta
  error?: string;
  streamId?: string;
}
