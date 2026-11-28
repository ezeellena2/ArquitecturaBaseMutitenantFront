import { assistantAttachmentTypes } from "../lib/assistantFiles";
import { validationConstraints } from "@/shared/api/generated/validation";
import { z } from "zod";
import type { AssistantAttachmentSummaryResponse, AssistantDeltaEventResponse, AssistantErrorEventResponse, AssistantLinkResponse, AssistantMessageProposalResponse, AssistantMessageResponse, AssistantStartEventResponse, AssistantStreamHttpResponse, AssistantTitleEventResponse, AssistantToolEventResponse, AssistantTurnResultResponse, AssistantTurnUsageResponse } from "@/modules/assistant/api/types";

export class AssistantStreamError extends Error {
  readonly code: "Assistant.Stream.Protocol" | "Assistant.Stream.Incomplete";

  constructor(code: "Assistant.Stream.Protocol" | "Assistant.Stream.Incomplete") {
    // No incorpora el JSON, texto ni bytes privados del proveedor.
    super(code);
    this.name = "AssistantStreamError";
    this.code = code;
  }
}

const version = z.number().int().min(0).max(validationConstraints.AssistantAttachmentSummaryResponse.version.maximum);
const integer = z.number().int();
const money = z.object({ amount: z.number(), currency: z.string() });
const attachment: z.ZodType<AssistantAttachmentSummaryResponse> = z.object({
  id: z.string(), fileName: z.string(), mediaType: z.enum(assistantAttachmentTypes), byteLength: integer, version,
});
const link: z.ZodType<AssistantLinkResponse> = z.object({
  routeKey: z.enum(["business.users", "business.roles", "business.companies", "business.audit", "business.home", "business.forms.catalogs",
    "platform.organizations", "platform.accounts", "platform.recoveries", "platform.audit", "platform.assistant.usage",
    "personal.account", "personal.organizations"]),
  parameters: z.object({ userId: z.string().nullish(), roleId: z.string().nullish(), companyId: z.string().nullish(),
    tenantId: z.string().nullish(), recoveryId: z.string().nullish() }),
  query: z.object({ status: z.enum(["Active", "Pending", "Expired"]).nullish(), page: integer.nullish(), pageSize: integer.nullish(), search: z.string().nullish() }),
  labelKey: z.string(),
});
const proposal: z.ZodType<AssistantMessageProposalResponse> = z.object({
  id: z.string(), kind: z.enum(["action"]), action: z.string(), version: integer,
  state: z.enum(["new", "replaced", "applied", "unconfirmed", "unavailable"]),
});
const message: z.ZodType<AssistantMessageResponse> = z.object({
  id: z.string(), role: z.enum(["user", "assistant"]), text: z.string(),
  status: z.enum(["Complete", "Stopped", "Failed", "Generating"]), createdAtUtc: z.string(), version,
  attachments: z.array(attachment), links: z.array(link), rating: z.enum(["up", "down"]).nullish(),
  proposal: proposal.nullish(),
});
const usage: z.ZodType<AssistantTurnUsageResponse> = z.object({
  inputTokens: integer, outputTokens: integer, cacheWriteTokens: integer, cacheReadTokens: integer, cost: money,
  remainingMessages: integer.nullish(), monthlyUsedCost: money.nullish(),
});
const turn: z.ZodType<AssistantTurnResultResponse> = z.object({
  turnId: z.string(), message, conversationVersion: version, usage,
}).refine((value) => value.message.status !== "Generating");
const start: z.ZodType<AssistantStartEventResponse> = z.object({
  turnId: z.string(), userMessageId: z.string(), assistantMessageId: z.string(), conversationVersion: version,
});
const delta: z.ZodType<AssistantDeltaEventResponse> = z.object({ turnId: z.string(), sequence: integer, text: z.string() });
const tool: z.ZodType<AssistantToolEventResponse> = z.object({
  turnId: z.string(), toolKey: z.string(), state: z.enum(["running", "complete", "failed"]), labelKey: z.string(),
});
const title: z.ZodType<AssistantTitleEventResponse> = z.object({ conversationId: z.string(), title: z.string(), version });
const failed: z.ZodType<AssistantErrorEventResponse> = z.object({
  turnId: z.string().nullish(), code: z.string(), traceId: z.string(), retryAfter: integer.nullish(), status: z.literal("Failed"),
});

function protocolError(): AssistantStreamError {
  return new AssistantStreamError("Assistant.Stream.Protocol");
}

function parseJson(text: string): unknown {
  try { return JSON.parse(text); } catch { throw protocolError(); }
}

function validate<T>(schema: z.ZodType<T>, data: unknown): T {
  const parsed = schema.safeParse(data);
  if (!parsed.success) throw protocolError();
  return parsed.data;
}

// Una pestaña abierta descarta lo que no conoce (0064 §6): un evento que esta versión no sabe leer no frena la consulta,
// y los campos nuevos de un evento conocido se descartan (z.object). Un valor fuera de un enum sigue siendo un error: el
// back lo escribe un despliegue después de la versión que lo lee.
function parseEvent(event: string, text: string): AssistantStreamHttpResponse | null {
  switch (event) {
    case "start": return { event, data: validate(start, parseJson(text)) };
    case "delta": return { event, data: validate(delta, parseJson(text)) };
    case "tool": return { event, data: validate(tool, parseJson(text)) };
    case "title": return { event, data: validate(title, parseJson(text)) };
    case "error": return { event, data: validate(failed, parseJson(text)) };
    case "done": return { event, data: validate(turn, parseJson(text)) };
    default: return null;
  }
}

// El wire usa event: nombre + data: payload JSON, nunca el sobre generated completo.
class SseFrames {
  private buffer = "";
  private event = "";
  private data: string[] = [];

  *push(text: string, eof = false): Generator<AssistantStreamHttpResponse> {
    this.buffer += text;
    while (true) {
      const index = this.buffer.search(/[\r\n]/u);
      if (index < 0 || (!eof && this.buffer[index] === "\r" && index === this.buffer.length - 1)) return;
      const line = this.buffer.slice(0, index);
      const separatorLength = this.buffer[index] === "\r" && this.buffer[index + 1] === "\n" ? 2 : 1;
      this.buffer = this.buffer.slice(index + separatorLength);
      if (line === "") {
        const event = this.event;
        const data = this.data;
        this.event = "";
        this.data = [];
        const parsed = data.length > 0 ? parseEvent(event, data.join("\n")) : null;
        if (parsed) yield parsed;
      } else if (!line.startsWith(":")) {
        const colon = line.indexOf(":");
        const field = colon < 0 ? line : line.slice(0, colon);
        const value = colon < 0 ? "" : line.slice(colon + 1).replace(/^ /u, "");
        if (field === "event") this.event = value;
        if (field === "data") this.data.push(value);
      }
    }
  }
}

/** EOF sin terminal exige releer el turno durable. AbortError conserva la cancelación local. */
export async function* decodeAssistantStream(response: Response, signal?: AbortSignal): AsyncGenerator<AssistantStreamHttpResponse, void> {
  signal?.throwIfAborted();
  const contentType = response.headers.get("content-type")?.split(";", 1)[0].trim().toLowerCase();
  if (!response.body) throw protocolError();
  const reader = response.body.getReader();
  const abort = () => { void reader.cancel(signal?.reason).catch(() => {}); };
  signal?.addEventListener("abort", abort, { once: true });
  const decoder = new TextDecoder("utf-8", { fatal: true });
  const frames = new SseFrames();
  let replay = "";
  try {
    if (contentType !== "text/event-stream" && contentType !== "application/json") throw protocolError();
    while (true) {
      signal?.throwIfAborted();
      const chunk = await reader.read();
      signal?.throwIfAborted();
      let text: string;
      try { text = decoder.decode(chunk.value, { stream: !chunk.done }); } catch { throw protocolError(); }
      if (contentType === "application/json") {
        replay += text;
        if (chunk.done) {
          yield { event: "done", data: validate(turn, parseJson(replay)) };
          return;
        }
      } else {
        for (const event of frames.push(text, chunk.done)) {
          signal?.throwIfAborted();
          yield event;
          if (event.event === "done" || event.event === "error") return;
        }
        if (chunk.done) throw new AssistantStreamError("Assistant.Stream.Incomplete");
      }
    }
  } finally {
    signal?.removeEventListener("abort", abort);
    // Cancel inicia el cierre, pero su Promise puede esperar otra rama del
    // transporte. El terminal ya recibido debe liberar la UI y permitir releer.
    void reader.cancel().catch(() => {});
    reader.releaseLock();
  }
}
