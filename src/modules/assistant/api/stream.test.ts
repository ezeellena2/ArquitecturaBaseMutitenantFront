import { describe, expect, expectTypeOf, it, vi } from "vitest";
import type { AssistantStreamHttpResponse, AssistantTurnResultResponse } from "@/shared/api/types";
import { decodeAssistantStream, AssistantStreamError } from "./stream";

const result = {
  turnId: "turn", conversationVersion: 5,
  message: { id: "message", role: "assistant", text: "Sí 😊", status: "Complete", createdAtUtc: "2026-10-09T12:00:00Z", version: 1, attachments: [], links: [], rating: null },
  usage: { inputTokens: 1, outputTokens: 2, cacheWriteTokens: 3, cacheReadTokens: 4, cost: { amount: 1, currency: "USD" }, remainingMessages: null, monthlyUsedCost: null },
} satisfies AssistantTurnResultResponse;

function response(text: string, contentType = "text/event-stream", byteChunks = 1): Response {
  const bytes = new TextEncoder().encode(text);
  return new Response(new ReadableStream<Uint8Array>({ start(controller) {
    for (let index = 0; index < bytes.length; index += byteChunks) controller.enqueue(bytes.slice(index, index + byteChunks));
    controller.close();
  } }), { headers: { "content-type": contentType } });
}

function frame(event: AssistantStreamHttpResponse["event"], data: unknown): string {
  return `event: ${event}\r\ndata: ${JSON.stringify(data)}\r\n\r\n`;
}

async function collect(source: Response, signal?: AbortSignal): Promise<AssistantStreamHttpResponse[]> {
  const events: AssistantStreamHttpResponse[] = [];
  for await (const event of decodeAssistantStream(source, signal)) events.push(event);
  return events;
}

describe("Assistant wire SSE", () => {
  it("decodifica UTF8 incremental, CR/LF divididos, comentarios, heartbeat y data multilinea", async () => {
    const source = response(': heartbeat\r\n\r\nevent: heartbeat\r\n\r\n' + frame("start", { turnId: "turn", userMessageId: "user", assistantMessageId: "assistant", conversationVersion: 4 })
      + 'event: delta\r\ndata: {"turnId":"turn",\r\ndata: "sequence":1,"text":"Sí 😊"}\r\n\r\n'
      + frame("tool", { turnId: "turn", toolKey: "people", state: "running", labelKey: "people" })
      + frame("title", { conversationId: "chat", title: "Título", version: 4 }) + frame("done", result));
    const events = await collect(source);
    expect(events.map((event) => event.event)).toEqual(["start", "delta", "tool", "title", "done"]);
    expect(events[1]).toEqual({ event: "delta", data: { turnId: "turn", sequence: 1, text: "Sí 😊" } });
    expect(events.at(-1)).toEqual({ event: "done", data: result });
    expect(source.body?.locked).toBe(false);
    expectTypeOf(events).toEqualTypeOf<AssistantStreamHttpResponse[]>();
  });

  it("soporta LF y CR y conserva secuencias repetidas para el reducer", async () => {
    const delta = { turnId: "turn", sequence: 7, text: "a" };
    const text = frame("delta", delta).replaceAll("\r\n", "\n") + frame("delta", delta).replaceAll("\r\n", "\r") + frame("done", result);
    const events = await collect(response(text, "text/event-stream; charset=utf-8", 3));
    expect(events).toHaveLength(3);
    expect(events[0]).toEqual(events[1]);
  });

  it("no procesa frames posteriores al primer terminal, ni terminales duplicados", async () => {
    const source = response(frame("done", result) + frame("done", result) + "event: unknown\ndata: private-invalid\n\n", "text/event-stream", 9999);
    await expect(collect(source)).resolves.toEqual([{ event: "done", data: result }]);
  });

  it("error es terminal tipado Failed y conserva code/traceId/retryAfter", async () => {
    const data = { turnId: null, status: "Failed", code: "Assistant.Provider.Unavailable", traceId: "trace", retryAfter: 3 };
    await expect(collect(response(frame("error", data) + frame("done", result)))).resolves.toEqual([{ event: "error", data }]);
  });

  it.each([
    'event: delta\ndata: private-broken-json\n\n',
    'event: surprise\ndata: {}\n\n',
    'data: {}\n\n',
    frame("delta", { turnId: "turn", sequence: "private-sequence", text: "private" }),
    frame("tool", { turnId: "turn", toolKey: "people", state: "unknown", labelKey: "private" }),
    frame("error", { code: "private", traceId: "trace", status: 500 }),
    frame("done", { ...result, message: { ...result.message, status: "Generating" } }),
    frame("delta", { event: "delta", data: { turnId: "turn", sequence: 1, text: "private" } }),
  ])("rechaza frames malformados sin datos privados en el error (%#)", async (text) => {
    const error: unknown = await collect(response(text)).catch((caught: unknown) => caught);
    expect(error).toBeInstanceOf(AssistantStreamError);
    expect(error).toMatchObject({ code: "Assistant.Stream.Protocol", message: "Assistant.Stream.Protocol" });
  });

  it.each(["", ": heartbeat\n\n", frame("delta", { turnId: "turn", sequence: 1, text: "partial" }), frame("done", result).trimEnd()])("EOF sin terminal informa que hay que releer durable (%#)", async (text) => {
    await expect(collect(response(text))).rejects.toMatchObject({ code: "Assistant.Stream.Incomplete" });
  });

  it("replay JSON usa el mismo evento done sin exigir un sobre SSE", async () => {
    await expect(collect(response(JSON.stringify(result), "application/json; charset=utf-8"))).resolves.toEqual([{ event: "done", data: result }]);
    await expect(collect(response('{"private":"broken"}', "application/json"))).rejects.toMatchObject({ code: "Assistant.Stream.Protocol" });
  });

  it("rechaza media type o UTF8 inválidos sin exponer bytes", async () => {
    await expect(collect(response("private", "text/html"))).rejects.toMatchObject({ code: "Assistant.Stream.Protocol" });
    await expect(collect(new Response(new Uint8Array([0xff]), { headers: { "content-type": "text/event-stream" } }))).rejects.toMatchObject({ code: "Assistant.Stream.Protocol" });
  });

  it.each(["text/event-stream", "application/json"])("abortar cancela un reader bloqueado y libera su lock (%s)", async (contentType) => {
    const cancel = vi.fn();
    const source = new Response(new ReadableStream<Uint8Array>({ cancel }), { headers: { "content-type": contentType } });
    const controller = new AbortController();
    const events = decodeAssistantStream(source, controller.signal);
    const pending = events.next();
    controller.abort();
    await expect(pending).rejects.toMatchObject({ name: "AbortError" });
    expect(cancel).toHaveBeenCalledOnce();
    expect(source.body?.locked).toBe(false);
  });

  it("cancela el cuerpo de una respuesta de media type inesperado", async () => {
    const cancel = vi.fn();
    const source = new Response(new ReadableStream<Uint8Array>({ cancel }), { headers: { "content-type": "text/html" } });
    await expect(collect(source)).rejects.toMatchObject({ code: "Assistant.Stream.Protocol" });
    expect(cancel).toHaveBeenCalledOnce();
    expect(source.body?.locked).toBe(false);
  });

  it("salir del consumidor cancela el cuerpo y libera el lock", async () => {
    const cancel = vi.fn();
    const source = new Response(new ReadableStream<Uint8Array>({ start(controller) {
      controller.enqueue(new TextEncoder().encode(frame("delta", { turnId: "turn", sequence: 1, text: "partial" })));
    }, cancel }), { headers: { "content-type": "text/event-stream" } });
    const events = decodeAssistantStream(source);
    await events.next();
    await events.return();
    expect(cancel).toHaveBeenCalledOnce();
    expect(source.body?.locked).toBe(false);
  });
});
