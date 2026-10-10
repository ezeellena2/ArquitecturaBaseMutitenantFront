import { act, renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider, QueryObserver } from "@tanstack/react-query";
import { HttpResponse, http } from "msw";
import { StrictMode, type PropsWithChildren } from "react";
import { afterEach, describe, expect, it } from "vitest";
import { server } from "@/test/mocks/server";
import { resetHttpClient } from "@/shared/api/httpClient";
import type { AssistantConversationResponse, AssistantMessageResponse, AssistantStateResponse, AssistantTurnResultResponse } from "@/shared/api/types";
import { assistantConversationQueryKey, type AssistantScope } from "../api/assistant";
import { useAssistantRuntime } from "./useAssistantRuntime";

const scope: AssistantScope = { access: "business", tenantId: "org", userId: "user" };
const state: AssistantStateResponse = {
  configured: true, canConfigure: false, models: [], quickQueries: [], dailyLimit: 100,
  dailyResetAtUtc: "2026-10-10T03:00:00Z", remainingMessages: 80, noticeVersion: "v1", noticeAccepted: true,
  retentionDays: 30, maxAttachmentBytes: 1024, maxAttachments: 2,
};
const message = (id: string, role: AssistantMessageResponse["role"], status: AssistantMessageResponse["status"] = "Complete", text = "Respuesta"): AssistantMessageResponse => ({
  id, role, status, text, version: 2, createdAtUtc: "2026-10-09T12:00:00Z", attachments: [], links: [],
});
const conversation = (messages: AssistantMessageResponse[] = []): AssistantConversationResponse => ({
  conversation: { id: "chat", title: null, version: 3, isSaved: false, createdAtUtc: "2026-10-09T12:00:00Z", lastActivityAtUtc: "2026-10-09T12:00:00Z" },
  messages: { items: messages, hasMore: false },
});
const terminal: AssistantTurnResultResponse = {
  turnId: "turn", message: message("a", "assistant"), conversationVersion: 4,
  usage: { inputTokens: 1, outputTokens: 1, cacheReadTokens: 0, cacheWriteTokens: 0, cost: { amount: 0, currency: "USD" }, remainingMessages: 79 },
};

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => { resolve = done; });
  return { promise, resolve };
}

function setup(initialState = state, strict = false) {
  let durable = conversation();
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  server.use(http.get("/api/organization/assistant", () => HttpResponse.json(initialState)),
    http.get("/api/organization/assistant/conversations/chat", () => HttpResponse.json(durable)));
  const wrapper = ({ children }: PropsWithChildren) => <QueryClientProvider client={client}>{strict ? <StrictMode>{children}</StrictMode> : children}</QueryClientProvider>;
  const hook = renderHook(({ currentScope = scope, enabled = true }) => useAssistantRuntime({ scope: currentScope, conversationId: "chat", enabled }), {
    wrapper, initialProps: { currentScope: scope, enabled: true },
  });
  return { ...hook, client, setDurable: (next: AssistantConversationResponse) => { durable = next; } };
}

function stream() {
  let controller!: ReadableStreamDefaultController<Uint8Array>;
  const body = new ReadableStream<Uint8Array>({ start(value) { controller = value; } });
  return { body, event: (event: string, data: unknown) => controller.enqueue(new TextEncoder().encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)), close: () => controller.close() };
}
const start = { turnId: "turn", userMessageId: "u", assistantMessageId: "a", conversationVersion: 4 };
afterEach(resetHttpClient);

describe("Assistant runtime HTTP + Query + SDK", () => {
  it("StrictMode y enabled false→true reactivan el mismo scope/id", async () => {
    const hook = setup(state, true);
    await waitFor(() => expect(hook.result.current.canSend).toBe(true));
    hook.rerender({ currentScope: scope, enabled: false });
    expect(hook.result.current.canSend).toBe(false);
    hook.rerender({ currentScope: scope, enabled: true });
    await waitFor(() => expect(hook.result.current.canSend).toBe(true));
    hook.unmount();
  });

  it.each(["disable", "unmount"] as const)("%s borra durable privado y SDK, sin borrar otra conversación", async (action) => {
    const hook = setup();
    hook.setDurable(conversation([message("private", "assistant")]));
    const otherKey = assistantConversationQueryKey(scope, "other-chat");
    const other = { ...conversation([message("other", "assistant")]), conversation: { ...conversation().conversation, id: "other-chat" } };
    hook.client.setQueryData(otherKey, other);
    await waitFor(() => expect(hook.result.current.runtime.thread.getState().messages.map((item) => item.id)).toEqual(["private"]));
    const runtime = hook.result.current.runtime;
    act(() => {
      if (action === "disable") hook.rerender({ currentScope: scope, enabled: false });
      else hook.unmount();
    });
    expect(hook.client.getQueryData(assistantConversationQueryKey(scope, "chat"))).toBeUndefined();
    expect(hook.client.getQueryData(otherKey)).toEqual(other);
    expect(runtime.thread.export().messages).toEqual([]);
    // El SDK publicado limpia export por import, pero no expone reemplazo de la
    // snapshot del objeto ya desmontado. Con UI montada sí debe estar vacía.
    if (action === "disable") expect(runtime.thread.getState().messages).toEqual([]);
    hook.unmount();
  });

  it("SDK conserva createdAtUtc durable y no la hora cliente", async () => {
    const hook = setup();
    hook.setDurable(conversation([message("dated", "assistant")]));
    await waitFor(() => expect(hook.result.current.runtime.thread.getState().messages).toHaveLength(1));
    expect(hook.result.current.runtime.thread.getState().messages[0]?.createdAt.toISOString()).toBe("2026-10-09T12:00:00.000Z");
    hook.unmount();
  });

  it("unmount preserva una ficha compartida con otro observer activo", async () => {
    const hook = setup();
    const durable = conversation([message("shared-private", "assistant")]);
    hook.setDurable(durable);
    await waitFor(() => expect(hook.result.current.detail.data).toEqual(durable));
    const observer = new QueryObserver(hook.client, {
      queryKey: assistantConversationQueryKey(scope, "chat"), queryFn: async () => durable, staleTime: Infinity,
    });
    const unsubscribe = observer.subscribe(() => {});
    const runtime = hook.result.current.runtime;
    hook.unmount();
    expect(hook.client.getQueryData(assistantConversationQueryKey(scope, "chat"))).toEqual(durable);
    expect(observer.getCurrentResult().data).toEqual(durable);
    expect(runtime.thread.export().messages).toEqual([]);
    unsubscribe();
    observer.destroy();
  });
  it("mantiene pending después de headers, muestra ids admitidos y termina con datos durables", async () => {
    const source = stream();
    server.use(http.post("/api/organization/assistant/conversations/chat/messages", () => new HttpResponse(source.body, { headers: { "Content-Type": "text/event-stream" } })));
    const hook = setup();
    await waitFor(() => expect(hook.result.current.canSend).toBe(true));
    let operation!: Promise<AssistantConversationResponse>;
    act(() => { operation = hook.result.current.send({ text: "Consulta", conversationVersion: 3 }); });
    await waitFor(() => expect(hook.result.current.isPending).toBe(true));
    expect(hook.result.current.runtime.thread.getState().messages).toHaveLength(0);
    act(() => { source.event("start", start); source.event("delta", { turnId: "turn", sequence: 1, text: "Parcial" }); });
    await waitFor(() => expect(hook.result.current.runtime.thread.getState().messages.map((item) => item.id)).toEqual(["u", "a"]));
    expect(hook.result.current.isPending).toBe(true);
    hook.setDurable(conversation([message("u", "user", "Complete", "Consulta"), terminal.message]));
    await act(async () => { source.event("done", terminal); source.close(); await operation; });
    await waitFor(() => expect(hook.result.current.isPending).toBe(false));
    expect(hook.result.current.turn?.phase).toBe("Complete");
    hook.unmount();
  });

  it("redelivery usa exactamente cuerpo/versión/key originales; Failed explícito crea otra operación", async () => {
    const seen: Array<{ key: string | null; body: unknown }> = [];
    server.use(http.post("/api/organization/assistant/conversations/chat/messages", async ({ request }) => {
      seen.push({ key: request.headers.get("idempotency-key"), body: await request.json() });
      return seen.length === 1 ? HttpResponse.error() : HttpResponse.json({ ...terminal, message: { ...terminal.message, status: "Failed" } });
    }));
    const hook = setup();
    await waitFor(() => expect(hook.result.current.canSend).toBe(true));
    await act(async () => { await hook.result.current.send({ text: "Original", attachmentIds: ["file"], conversationVersion: 3 }).catch(() => {}); });
    await waitFor(() => expect(hook.result.current.error).toMatchObject({ isNetworkError: true }));
    hook.setDurable(conversation([message("u", "user"), { ...terminal.message, status: "Failed" }]));
    await act(async () => { await hook.result.current.retryNetwork(); });
    expect(seen[1]).toEqual(seen[0]);
    await waitFor(() => expect(hook.result.current.turn?.phase).toBe("Failed"));
    await act(async () => { await hook.result.current.retryFailed({ text: "Nueva", attachmentIds: [], conversationVersion: 4 }); });
    expect(seen[2]?.key).not.toBe(seen[1]?.key);
    expect(seen[2]?.body).toEqual({ text: "Nueva", attachmentIds: [], conversationVersion: 4 });
    hook.unmount();
  });

  it("EOF relee Stopped sin un segundo POST ni ocultar el usuario admitido", async () => {
    const source = stream();
    let posts = 0;
    server.use(http.post("/api/organization/assistant/conversations/chat/messages", () => { posts++; return new HttpResponse(source.body, { headers: { "Content-Type": "text/event-stream" } }); }));
    const hook = setup();
    await waitFor(() => expect(hook.result.current.canSend).toBe(true));
    let operation!: Promise<AssistantConversationResponse>;
    act(() => { operation = hook.result.current.send({ text: "Consulta", conversationVersion: 3 }); });
    act(() => { source.event("start", start); source.event("delta", { turnId: "turn", sequence: 1, text: "Parcial" }); });
    await waitFor(() => expect(hook.result.current.turn?.text).toBe("Parcial"));
    hook.setDurable(conversation([message("u", "user"), message("a", "assistant", "Stopped", "Parcial")]));
    await act(async () => { source.close(); await operation; });
    expect(hook.result.current.turn?.phase).toBe("Stopped");
    expect(hook.result.current.runtime.thread.getState().messages.map((item) => item.id)).toEqual(["u", "a"]);
    expect(posts).toBe(1);
    hook.unmount();
  });

  it("Retry global de un envío viejo no reemplaza ni admite concurrencia sobre un turno nuevo", async () => {
    const source = stream();
    let posts = 0;
    server.use(http.post("/api/organization/assistant/conversations/chat/messages", () => {
      posts++;
      return posts === 1 ? HttpResponse.error() : new HttpResponse(source.body, { headers: { "Content-Type": "text/event-stream" } });
    }));
    const hook = setup();
    await waitFor(() => expect(hook.result.current.canSend).toBe(true));
    await act(async () => { await hook.result.current.send({ text: "Viejo", conversationVersion: 3 }).catch(() => {}); });
    await waitFor(() => expect(hook.result.current.canSend).toBe(true));
    const lost = hook.client.getMutationCache().getAll().find((mutation) => mutation.state.status === "error");
    expect(lost).toBeDefined();
    let operation!: Promise<AssistantConversationResponse>;
    act(() => { operation = hook.result.current.send({ text: "Nuevo", conversationVersion: 3 }); source.event("start", start); });
    await waitFor(() => expect(hook.result.current.turn?.request.text).toBe("Nuevo"));
    await act(async () => { await expect(lost!.execute(lost!.state.variables)).rejects.toMatchObject({ code: "Assistant.Runtime.OperationExpired" }); });
    expect(posts).toBe(2);
    expect(hook.result.current.turn?.request.text).toBe("Nuevo");
    act(() => { source.event("delta", { turnId: "turn", sequence: 1, text: "Sigue nuevo" }); });
    await waitFor(() => expect(hook.result.current.turn?.text).toBe("Sigue nuevo"));
    hook.setDurable(conversation([message("u", "user"), terminal.message]));
    await act(async () => { source.event("done", terminal); source.close(); await operation; });
    hook.unmount();
  });

  it("Retry global de Stop viejo conserva key y no aborta el lector de un turno nuevo", async () => {
    const first = stream();
    const second = stream();
    let posts = 0;
    const keys: Array<string | null> = [];
    server.use(http.post("/api/organization/assistant/conversations/chat/messages", () => {
      posts++;
      return new HttpResponse(posts === 1 ? first.body : second.body, { headers: { "Content-Type": "text/event-stream" } });
    }), http.post("/api/organization/assistant/conversations/chat/turns/turn/stop", ({ request }) => {
      keys.push(request.headers.get("idempotency-key"));
      return keys.length === 1 ? HttpResponse.error() : new HttpResponse(null, { status: 204 });
    }));
    const hook = setup();
    await waitFor(() => expect(hook.result.current.canSend).toBe(true));
    let oldOperation!: Promise<AssistantConversationResponse>;
    act(() => { oldOperation = hook.result.current.send({ text: "Uno", conversationVersion: 3 }); first.event("start", start); });
    await waitFor(() => expect(hook.result.current.canStop).toBe(true));
    await act(async () => { await hook.result.current.stop().catch(() => {}); });
    const lostStop = hook.client.getMutationCache().getAll().find((mutation) => mutation.state.status === "error");
    expect(lostStop).toBeDefined();
    hook.setDurable(conversation([message("u", "user"), terminal.message]));
    await act(async () => { first.event("done", terminal); first.close(); await oldOperation; });
    await waitFor(() => expect(hook.result.current.canSend).toBe(true));
    let operation!: Promise<AssistantConversationResponse>;
    act(() => { operation = hook.result.current.send({ text: "Dos", conversationVersion: 4 }); second.event("start", { ...start, turnId: "new-turn", userMessageId: "new-u", assistantMessageId: "new-a" }); });
    await waitFor(() => expect(hook.result.current.turn?.start?.turnId).toBe("new-turn"));
    await act(async () => { await lostStop!.execute(lostStop!.state.variables); });
    expect(keys[1]).toBe(keys[0]);
    act(() => { second.event("delta", { turnId: "new-turn", sequence: 1, text: "Sigue" }); });
    await waitFor(() => expect(hook.result.current.turn?.text).toBe("Sigue"));
    const nextTerminal = { ...terminal, turnId: "new-turn", message: { ...terminal.message, id: "new-a" } };
    hook.setDurable(conversation([message("new-u", "user"), nextTerminal.message]));
    await act(async () => { second.event("done", nextTerminal); second.close(); await operation; });
    hook.unmount();
  });

  it("Detener antes de start espera el turnId real y relee el resultado sin borrar usuario", async () => {
    const source = stream();
    const stopped = deferred<string>();
    const hook = setup();
    server.use(http.post("/api/organization/assistant/conversations/chat/messages", () => new HttpResponse(source.body, { headers: { "Content-Type": "text/event-stream" } })),
      http.post("/api/organization/assistant/conversations/chat/turns/:turnId/stop", ({ params }) => {
        hook.setDurable(conversation([message("u", "user"), message("a", "assistant", "Stopped", "")]));
        stopped.resolve(String(params.turnId));
        return new HttpResponse(null, { status: 204 });
      }));
    await waitFor(() => expect(hook.result.current.canSend).toBe(true));
    let operation!: Promise<AssistantConversationResponse>;
    let stop!: Promise<void>;
    act(() => { operation = hook.result.current.send({ text: "Consulta", conversationVersion: 3 }); });
    await waitFor(() => expect(hook.result.current.turn?.phase).toBe("sending"));
    act(() => { stop = hook.result.current.stop(); source.event("start", start); });
    await act(async () => { await stop; await operation; });
    expect(await stopped.promise).toBe("turn");
    expect(hook.result.current.turn?.phase).toBe("Stopped");
    hook.unmount();
  });

  it.each(["clear", "unmount", "scope"] as const)("%s después de headers no admite eventos tardíos ni repuebla historial", async (action) => {
    const source = stream();
    server.use(http.post("/api/organization/assistant/conversations/chat/messages", () => new HttpResponse(source.body, { headers: { "Content-Type": "text/event-stream" } })));
    const hook = setup();
    await waitFor(() => expect(hook.result.current.canSend).toBe(true));
    let operation!: Promise<unknown>;
    act(() => { operation = hook.result.current.send({ text: "Privado", conversationVersion: 3 }).catch(() => undefined); });
    act(() => { source.event("start", start); });
    await waitFor(() => expect(hook.result.current.turn?.start?.turnId).toBe("turn"));
    act(() => {
      if (action === "unmount") hook.unmount();
      else if (action === "clear") hook.client.clear();
      else hook.rerender({ currentScope: { ...scope, userId: "other" }, enabled: false });
    });
    await act(async () => { await operation; });
    if (action === "clear") {
      expect(hook.client.getQueryData(assistantConversationQueryKey(scope, "chat"))).toBeUndefined();
      await waitFor(() => expect(hook.result.current.runtime.thread.export().messages).toEqual([]));
    }
    else expect(hook.client.getQueryData(assistantConversationQueryKey(scope, "chat"))).toBeUndefined();
    hook.unmount();
  });

  it("EOF Generating conserva pending y parcial hasta una relectura autoritativa Failed", async () => {
    const source = stream();
    let posts = 0;
    server.use(http.post("/api/organization/assistant/conversations/chat/messages", () => { posts++; return new HttpResponse(source.body, { headers: { "Content-Type": "text/event-stream" } }); }));
    const hook = setup();
    await waitFor(() => expect(hook.result.current.canSend).toBe(true));
    let operation!: Promise<AssistantConversationResponse>;
    act(() => { operation = hook.result.current.send({ text: "Consulta", conversationVersion: 3 }); });
    act(() => { source.event("start", start); source.event("delta", { turnId: "turn", sequence: 1, text: "Parcial" }); });
    await waitFor(() => expect(hook.result.current.turn?.text).toBe("Parcial"));
    hook.setDurable(conversation([message("u", "user"), message("a", "assistant", "Generating", "")]));
    act(() => { source.close(); });
    await waitFor(() => expect(hook.result.current.turn?.phase).toBe("reconciling"));
    await waitFor(() => expect(hook.result.current.detail.data?.messages.items.at(-1)?.status).toBe("Generating"));
    expect(hook.result.current.isPending).toBe(true);
    expect(hook.result.current.canSend).toBe(false);
    expect(hook.result.current.runtime.thread.getState().messages.at(-1)?.content).toEqual([{ type: "text", text: "Parcial" }]);
    expect(hook.result.current.runtime.thread.getState().messages.at(-1)?.createdAt.toISOString()).toBe("2026-10-09T12:00:00.000Z");
    hook.setDurable(conversation([message("u", "user"), message("a", "assistant", "Failed", "Parcial")]));
    await act(async () => { await hook.result.current.detail.refetch(); await operation; });
    await waitFor(() => expect(hook.result.current.isPending).toBe(false));
    expect(hook.result.current.turn?.phase).toBe("Failed");
    expect(posts).toBe(1);
    hook.unmount();
  });

  it("Retry de red tras admisión relee durable y nunca repite POST de proveedor", async () => {
    const source = stream();
    let posts = 0;
    server.use(http.post("/api/organization/assistant/conversations/chat/messages", () => { posts++; return new HttpResponse(source.body, { headers: { "Content-Type": "text/event-stream" } }); }));
    const hook = setup();
    await waitFor(() => expect(hook.result.current.canSend).toBe(true));
    server.use(http.get("/api/organization/assistant/conversations/chat", () => HttpResponse.error()));
    let operation!: Promise<unknown>;
    act(() => { operation = hook.result.current.send({ text: "Consulta", conversationVersion: 3 }).catch(() => undefined); source.event("start", start); source.close(); });
    await act(async () => { await operation; });
    await waitFor(() => expect(hook.result.current.error).toMatchObject({ isNetworkError: true }));
    const durable = conversation([message("u", "user"), message("a", "assistant", "Stopped", "Parcial")]);
    server.use(http.get("/api/organization/assistant/conversations/chat", () => HttpResponse.json(durable)));
    await act(async () => { await hook.result.current.retryNetwork(); });
    expect(posts).toBe(1);
    expect(hook.result.current.turn?.phase).toBe("Stopped");
    hook.unmount();
  });

  it("Stop rechazado conserva el stream y expone el error de guardado", async () => {
    const source = stream();
    server.use(http.post("/api/organization/assistant/conversations/chat/messages", () => new HttpResponse(source.body, { headers: { "Content-Type": "text/event-stream" } })),
      http.post("/api/organization/assistant/conversations/chat/turns/turn/stop", () => HttpResponse.json({ code: "Assistant.Turn.NotGenerating", traceId: "trace" }, { status: 409 })));
    const hook = setup();
    await waitFor(() => expect(hook.result.current.canSend).toBe(true));
    let operation!: Promise<AssistantConversationResponse>;
    act(() => { operation = hook.result.current.send({ text: "Consulta", conversationVersion: 3 }); source.event("start", start); });
    await waitFor(() => expect(hook.result.current.turn?.start?.turnId).toBe("turn"));
    await act(async () => { await expect(hook.result.current.stop()).rejects.toMatchObject({ code: "Assistant.Turn.NotGenerating" }); });
    await waitFor(() => expect(hook.result.current.error).toMatchObject({ code: "Assistant.Turn.NotGenerating" }));
    act(() => { source.event("delta", { turnId: "turn", sequence: 1, text: "Sigue" }); });
    await waitFor(() => expect(hook.result.current.turn?.text).toBe("Sigue"));
    hook.setDurable(conversation([message("u", "user"), terminal.message]));
    await act(async () => { source.event("done", terminal); source.close(); await operation; });
    expect(hook.result.current.error).toMatchObject({ code: "Assistant.Turn.NotGenerating" });
    hook.unmount();
  });

  it("Cancel del SDK guarda Stop y conserva el usuario admitido", async () => {
    const source = stream();
    const hook = setup();
    let stops = 0;
    server.use(http.post("/api/organization/assistant/conversations/chat/messages", () => new HttpResponse(source.body, { headers: { "Content-Type": "text/event-stream" } })),
      http.post("/api/organization/assistant/conversations/chat/turns/turn/stop", () => {
        stops++;
        hook.setDurable(conversation([message("u", "user"), message("a", "assistant", "Stopped", "Parcial")]));
        return new HttpResponse(null, { status: 204 });
      }));
    await waitFor(() => expect(hook.result.current.canSend).toBe(true));
    let operation!: Promise<AssistantConversationResponse>;
    act(() => { operation = hook.result.current.send({ text: "Consulta", conversationVersion: 3 }); source.event("start", start); });
    await waitFor(() => expect(hook.result.current.runtime.thread.getState().isRunning).toBe(true));
    await act(async () => { hook.result.current.runtime.thread.cancelRun(); await operation; });
    await waitFor(() => expect(hook.result.current.turn?.phase).toBe("Stopped"));
    expect(stops).toBe(1);
    expect(hook.result.current.runtime.thread.getState().messages.map((item) => item.id)).toEqual(["u", "a"]);
    hook.unmount();
  });

  it("reabrir Generating relee por Query, conserva ids durables y no inventa turnId para Stop", async () => {
    const hook = setup();
    hook.setDurable(conversation([message("u", "user"), message("a", "assistant", "Generating", "Parcial")]));
    await waitFor(() => expect(hook.result.current.detail.data?.messages.items).toHaveLength(2));
    expect(hook.result.current.isPending).toBe(true);
    expect(hook.result.current.canSend).toBe(false);
    expect(hook.result.current.canStop).toBe(false);
    await waitFor(() => expect(hook.result.current.runtime.thread.getState().messages.map((item) => item.id)).toEqual(["u", "a"]));
    hook.setDurable(conversation([message("u", "user"), terminal.message]));
    await act(async () => { await hook.result.current.detail.refetch(); });
    await waitFor(() => expect(hook.result.current.isPending).toBe(false));
    hook.unmount();
  });

  it("reabrir Failed permite reintentar con cuerpo/versión nuevos explícitos", async () => {
    const hook = setup();
    hook.setDurable(conversation([message("u", "user"), message("a", "assistant", "Failed")]));
    let body: unknown;
    server.use(http.post("/api/organization/assistant/conversations/chat/messages", async ({ request }) => {
      body = await request.json();
      hook.setDurable(conversation([message("u", "user"), terminal.message]));
      return HttpResponse.json(terminal);
    }));
    await waitFor(() => expect(hook.result.current.canSend).toBe(true));
    await act(async () => { await hook.result.current.retryFailed({ text: "Nueva consulta", conversationVersion: 3, attachmentIds: [] }); });
    expect(body).toEqual({ text: "Nueva consulta", conversationVersion: 3, attachmentIds: [] });
    expect(hook.result.current.turn?.phase).toBe("Complete");
    hook.unmount();
  });

  it.each(["headers", "reconcile"] as const)("clear durante %s cancela la espera y bloquea respuesta tardía", async (stage) => {
    const release = deferred<void>();
    const waiting = deferred<void>();
    const hook = setup();
    await waitFor(() => expect(hook.result.current.canSend).toBe(true));
    server.use(http.post("/api/organization/assistant/conversations/chat/messages", async () => {
      if (stage === "headers") { waiting.resolve(); await release.promise; }
      return HttpResponse.json(terminal);
    }));
    if (stage === "reconcile") server.use(http.get("/api/organization/assistant/conversations/chat", async () => {
      waiting.resolve(); await release.promise;
      return HttpResponse.json(conversation([message("u", "user"), terminal.message]));
    }));
    let operation!: Promise<unknown>;
    act(() => { operation = hook.result.current.send({ text: "Privado", conversationVersion: 3 }).catch(() => undefined); });
    await waiting.promise;
    act(() => { hook.client.clear(); release.resolve(); });
    await act(async () => { await operation; });
    expect(hook.client.getQueryData(assistantConversationQueryKey(scope, "chat"))).toBeUndefined();
    await waitFor(() => expect(hook.result.current.runtime.thread.export().messages).toEqual([]));
    expect(hook.result.current.canSend).toBe(false);
    hook.unmount();
  });

  it.each([{ ...state, configured: false }, { ...state, noticeAccepted: false }, { ...state, remainingMessages: 0 }])("bloquea envío por configuración/aviso/límite sin alterar State", async (data) => {
    const hook = setup(data);
    await waitFor(() => expect(hook.result.current.state.data).toEqual(data));
    expect(hook.result.current.canSend).toBe(false);
    expect(hook.result.current.runtime.thread.getState().isRunning).toBe(false);
    hook.unmount();
  });

  it.each(["Assistant.Limit.DailyReached", "Assistant.Limit.MonthlyReached", "Legal.AcceptanceRequired"])("%s bloquea enviar conservando historial y atajos", async (code) => {
    const quick = { key: "users", labelKey: "users" };
    const hook = setup({ ...state, quickQueries: [quick] });
    hook.setDurable(conversation([message("old", "assistant")]));
    server.use(http.post("/api/organization/assistant/conversations/chat/messages", () => HttpResponse.json({ code, traceId: "trace", retryAfter: 20 }, { status: code === "Legal.AcceptanceRequired" ? 403 : 429 })));
    await waitFor(() => expect(hook.result.current.canSend).toBe(true));
    await act(async () => { await hook.result.current.send({ text: "Consulta", conversationVersion: 3 }).catch(() => {}); });
    await waitFor(() => expect(hook.result.current.blockedCode).toBe(code));
    expect(hook.result.current.canSend).toBe(false);
    expect(hook.result.current.detail.data?.messages.items.map((item) => item.id)).toEqual(["old"]);
    expect(hook.result.current.state.data?.quickQueries).toEqual([quick]);
    hook.unmount();
  });
});
