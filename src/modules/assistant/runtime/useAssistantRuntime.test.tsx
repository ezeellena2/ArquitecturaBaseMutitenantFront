import { act, renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider, QueryObserver } from "@tanstack/react-query";
import { HttpResponse, http } from "msw";
import { StrictMode, type PropsWithChildren } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { server } from "@/test/mocks/server";
import { resetHttpClient } from "@/shared/api/httpClient";
import type { AssistantConversationResponse, AssistantMessageResponse, AssistantStateResponse, AssistantTurnResultResponse } from "@/modules/assistant/api/types";
import { assistantConversationQueryKey, type AssistantScope } from "../api/assistant";
import { useAssistantRuntime } from "./useAssistantRuntime";

const scope: AssistantScope = { access: "business", tenantId: "org", userId: "user" };
const state: AssistantStateResponse = {
  configured: true, canConfigure: false, models: [], quickQueries: [], dailyLimit: 100,
  dailyResetAtUtc: "2026-10-10T03:00:00Z", remainingMessages: 80, noticeVersion: "v1", noticeAccepted: true,
  retentionDays: 30, maxAttachmentBytes: 1024, maxAttachments: 2, monthlyBudgetProgress: null,
};
const message = (id: string, role: AssistantMessageResponse["role"], status: AssistantMessageResponse["status"] = "Complete", text = "Respuesta"): AssistantMessageResponse => ({
  id, role, status, text, version: 2, createdAtUtc: "2026-10-09T12:00:00Z", attachments: [], links: [],
});
const conversation = (messages: AssistantMessageResponse[] = []): AssistantConversationResponse => ({
  conversation: { id: "chat", title: null, version: 3, isSaved: false, createdAtUtc: "2026-10-09T12:00:00Z", lastActivityAtUtc: "2026-10-09T12:00:00Z" },
  messages: { items: messages, hasMore: false },
  activeTurnId: null,
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

function setup(initialState = state, strict = false, initialDurable = conversation()) {
  let durable = initialDurable;
  let detailReads = 0;
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  server.use(http.get("/api/organization/assistant", () => HttpResponse.json(initialState)),
    http.get("/api/organization/assistant/conversations/chat", () => { detailReads++; return HttpResponse.json(durable); }));
  const wrapper = ({ children }: PropsWithChildren) => <QueryClientProvider client={client}>{strict ? <StrictMode>{children}</StrictMode> : children}</QueryClientProvider>;
  const initialProps: { currentScope?: AssistantScope; currentConversationId?: string; enabled?: boolean } = { currentScope: scope, enabled: true };
  const hook = renderHook(({ currentScope = scope, currentConversationId = "chat", enabled = true }) => useAssistantRuntime({ scope: currentScope, conversationId: currentConversationId, enabled }), {
    wrapper, initialProps,
  });
  return { ...hook, client, detailReads: () => detailReads, setDurable: (next: AssistantConversationResponse) => { durable = next; } };
}

function stream() {
  let controller!: ReadableStreamDefaultController<Uint8Array>;
  const body = new ReadableStream<Uint8Array>({ start(value) { controller = value; } });
  return { body, event: (event: string, data: unknown) => controller.enqueue(new TextEncoder().encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)), close: () => controller.close() };
}
const start = { turnId: "turn", userMessageId: "u", assistantMessageId: "a", conversationVersion: 4 };
afterEach(() => { vi.useRealTimers(); resetHttpClient(); });

describe("páginas cronológicas del runtime", () => {
  it("notifica la admisión al recibir 2xx antes de start y no la repite al reconciliar", async () => {
    const hook = setup();
    const live = stream();
    const admitted = vi.fn();
    server.use(http.post("/api/organization/assistant/conversations/chat/messages", () => new HttpResponse(live.body, { headers: { "Content-Type": "text/event-stream" } })));
    await waitFor(() => expect(hook.result.current.canSend).toBe(true));
    let sending!: ReturnType<typeof hook.result.current.send>;
    act(() => { sending = hook.result.current.send({ text: "Consulta", conversationVersion: 3 }, admitted); });
    await waitFor(() => expect(admitted).toHaveBeenCalledOnce());
    expect(hook.result.current.turn?.start).toBeUndefined();
    hook.setDurable(conversation([message("u", "user"), terminal.message]));
    act(() => { live.event("start", start); live.event("done", terminal); live.close(); });
    await act(async () => { await sending; });
    expect(admitted).toHaveBeenCalledOnce();
  });
  it("una respuesta tardía tras clear no admite ni limpia el borrador de otro dueño", async () => {
    const hook = setup();
    const gate = deferred<void>();
    const admitted = vi.fn();
    let requests = 0;
    server.use(http.post("/api/organization/assistant/conversations/chat/messages", async () => { requests++; await gate.promise; return HttpResponse.json(terminal); }));
    await waitFor(() => expect(hook.result.current.canSend).toBe(true));
    let sending!: Promise<unknown>;
    act(() => { sending = hook.result.current.send({ text: "Privada", conversationVersion: 3 }, admitted).catch(() => undefined); });
    await waitFor(() => expect(requests).toBe(1));
    act(() => hook.client.clear());
    await act(async () => { gate.resolve(); await sending; });
    expect(admitted).not.toHaveBeenCalled();
    expect(hook.result.current.messages).toEqual([]);
  });
  it("refrescar Estado conserva el bloqueo mensual HTTP sin recuperación autorizada", async () => {
    const hook = setup();
    server.use(http.post("/api/organization/assistant/conversations/chat/messages", () => HttpResponse.json({ code: "Assistant.Limit.MonthlyReached" }, { status: 429 })));
    await waitFor(() => expect(hook.result.current.canSend).toBe(true));
    await act(async () => { await hook.result.current.send({ text: "Consulta", conversationVersion: 3 }).catch(() => {}); });
    await waitFor(() => expect(hook.result.current.blockedCode).toBe("Assistant.Limit.MonthlyReached"));
    let updatedAt = hook.result.current.state.dataUpdatedAt;
    await act(async () => { await hook.result.current.refreshState(); });
    await waitFor(() => expect(hook.result.current.state.dataUpdatedAt).not.toBe(updatedAt));
    expect(hook.result.current.blockedCode).toBe("Assistant.Limit.MonthlyReached");
    expect(hook.result.current.canSend).toBe(false);
    updatedAt = hook.result.current.state.dataUpdatedAt;
    server.use(http.get("/api/organization/assistant", () => HttpResponse.json({ ...state, retentionDays: 60 })));
    await act(async () => { await hook.result.current.refreshState(); });
    await waitFor(() => expect(hook.result.current.state.dataUpdatedAt).not.toBe(updatedAt));
    expect(hook.result.current.state.data?.retentionDays).toBe(60);
    expect(hook.result.current.blockedCode).toBe("Assistant.Limit.MonthlyReached");
    expect(hook.result.current.canSend).toBe(false);
  });

  it("refrescar Estado libera el bloqueo HTTP del aviso sólo tras confirmar su aceptación", async () => {
    const hook = setup();
    server.use(http.post("/api/organization/assistant/conversations/chat/messages", () => HttpResponse.json({ code: "Assistant.Notice.AcceptanceRequired" }, { status: 409 })));
    await waitFor(() => expect(hook.result.current.canSend).toBe(true));
    await act(async () => { await hook.result.current.send({ text: "Consulta", conversationVersion: 3 }).catch(() => {}); });
    await waitFor(() => expect(hook.result.current.blockedCode).toBe("Assistant.Notice.AcceptanceRequired"));
    server.use(http.get("/api/organization/assistant", () => HttpResponse.json({ ...state, noticeAccepted: false })));
    await act(async () => { await hook.result.current.refreshState(); });
    expect(hook.result.current.blockedCode).toBe("Assistant.Notice.AcceptanceRequired");
    server.use(http.get("/api/organization/assistant", () => HttpResponse.json(state)));
    await act(async () => { await hook.result.current.refreshState(); });
    await waitFor(() => expect(hook.result.current.blockedCode).toBeNull());
    expect(hook.result.current.canSend).toBe(true);
  });

  it("aceptar el aviso y refrescar Estado libera el error durable de aceptación", async () => {
    const failed = conversation([message("u", "user"), message("a", "assistant", "Failed", "")]);
    const hook = setup(state, false, failed);
    await waitFor(() => expect(hook.result.current.detail.data).toEqual(failed));
    // El detalle se leyó con un aviso vigente; luego el servidor exige una aceptación nueva.
    server.use(http.get("/api/organization/assistant", () => HttpResponse.json({ ...state, noticeAccepted: false })));
    await act(async () => { await hook.result.current.refreshState(); });
    act(() => hook.client.setQueryData(["assistant", "business", "org", "user", "turn", "chat"], {
      conversationId: "chat", request: { text: "Consulta" }, phase: "Failed", text: "", sequence: -1, tools: [],
      error: { code: "Assistant.Notice.AcceptanceRequired", traceId: "trace", status: "Failed" },
    }));
    expect(hook.result.current.blockedCode).toBe("Assistant.Notice.AcceptanceRequired");
    server.use(http.get("/api/organization/assistant", () => HttpResponse.json(state)));
    await act(async () => { await hook.result.current.refreshState(); });
    expect(hook.result.current.blockedCode).toBeNull();
    expect(hook.result.current.canSend).toBe(true);
  });
  it("abre más de 50 mensajes reales, conserva la primera ficha y detiene el último turno", async () => {
    const first = { ...conversation(Array.from({ length: 50 }, (_, i) => message(`old-${i}`, i % 2 ? "assistant" : "user"))), activeTurnId: "last-turn", messages: { items: Array.from({ length: 50 }, (_, i) => message(`old-${i}`, i % 2 ? "assistant" : "user")), hasMore: true, nextCursor: "page-2" } };
    const hook = setup(state, false, first);
    let stopped = false;
    server.use(http.get("/api/organization/assistant/conversations/chat", ({ request }) => {
      const cursor = new URL(request.url).searchParams.get("cursor");
      return HttpResponse.json(cursor ? { ...conversation([message("last-user", "user"), message("last-assistant", "assistant", stopped ? "Stopped" : "Generating", "Última parcial")]), activeTurnId: stopped ? null : "last-turn" }
        : { ...first, activeTurnId: stopped ? null : "last-turn" });
    }), http.post("/api/organization/assistant/conversations/chat/turns/last-turn/stop", () => { stopped = true; return new HttpResponse(null, { status: 204 }); }));
    await waitFor(() => expect(hook.result.current.messages).toHaveLength(52));
    const expectedIds = [...Array.from({ length: 50 }, (_, i) => `old-${i}`), "last-user", "last-assistant"];
    const messageIds = hook.result.current.messages.map((item) => item.id);
    expect(messageIds).toEqual(expectedIds);
    expect(new Set(messageIds).size).toBe(expectedIds.length);
    expect(hook.result.current.runtime.thread.getState().messages.map((item) => item.id)).toEqual(expectedIds);
    expect(hook.result.current.detail.data?.messages.items).toHaveLength(50);
    expect(hook.result.current.detail.data?.messages.nextCursor).toBe("page-2");
    expect(hook.result.current.runtime.thread.getState().messages.at(-1)?.id).toBe("last-assistant");
    expect(hook.result.current.canStop).toBe(true);
    await act(async () => { await hook.result.current.stop(); });
    expect(hook.result.current.messages.at(-1)?.status).toBe("Stopped");
    hook.unmount();
    expect(hook.client.getQueryCache().getAll().some((query) => query.queryKey.includes("page-2"))).toBe(false);
  });

  it("clear durante otra página no repuebla la proyección privada", async () => {
    const response = deferred<AssistantConversationResponse>();
    const first = { ...conversation([message("old", "user")]), messages: { items: [message("old", "user")], hasMore: true, nextCursor: "next" } };
    let requested = false;
    const hook = setup(state, false, first);
    server.use(http.get("/api/organization/assistant/conversations/chat", async ({ request }) => {
      if (!new URL(request.url).searchParams.has("cursor")) return HttpResponse.json(first);
      requested = true; return HttpResponse.json(await response.promise);
    }));
    await waitFor(() => expect(requested).toBe(true));
    act(() => hook.client.clear());
    await act(async () => { response.resolve(conversation([message("private", "assistant")])); await response.promise; });
    expect(hook.result.current.messages).toEqual([]);
    expect(hook.result.current.runtime.thread.getState().messages).toEqual([]);
    expect(hook.client.getQueryCache().getAll().some((query) => query.state.data !== undefined)).toBe(false);
  });
});

describe("Assistant runtime HTTP + Query + SDK", () => {
  it("lee el detalle sólo después del aviso aunque el envío ya no esté configurado ni tenga presupuesto", async () => {
    const hook = setup({ ...state, noticeAccepted: false });
    await waitFor(() => expect(hook.result.current.state.isSuccess).toBe(true));
    expect(hook.detailReads()).toBe(0);
    server.use(http.get("/api/organization/assistant", () => HttpResponse.json({ ...state, configured: false, remainingMessages: 0 })));
    await act(async () => { await hook.result.current.refreshState(); });
    await waitFor(() => expect(hook.result.current.detail.isSuccess).toBe(true));
    expect(hook.detailReads()).toBe(1);
    expect(hook.result.current.canSend).toBe(false);
  });
  it.each(["Generating", "admitted"] as const)("reabre %s con activeTurnId y Stop relee ficha/version y Estado", async (phase) => {
    const initial = { ...conversation(phase === "Generating" ? [message("u", "user"), message("a", "assistant", "Generating", "Parcial")] : [message("u", "user")]), activeTurnId: "durable-turn" };
    const hook = setup(state, false, initial);
    let savedKey: string | null = null;
    let stateReads = 0;
    server.use(http.get("/api/organization/assistant", () => { stateReads++; return HttpResponse.json({ ...state, remainingMessages: 79 }); }),
      http.post("/api/organization/assistant/conversations/chat/turns/durable-turn/stop", ({ request }) => {
        savedKey = request.headers.get("idempotency-key");
        hook.setDurable({ ...conversation([message("u", "user"), message("a", "assistant", "Stopped", "Parcial")]), conversation: { ...initial.conversation, version: 5 } });
        return new HttpResponse(null, { status: 204 });
      }));
    await waitFor(() => expect(hook.result.current.detail.data).toEqual(initial));
    expect(hook.result.current.turn).toBeNull();
    expect(hook.result.current.canStop).toBe(true);
    expect(hook.result.current.isPending).toBe(true);
    expect(hook.result.current.canSend).toBe(false);
    expect(hook.result.current.runtime.thread.getState().messages.map((item) => item.id)).toEqual(phase === "Generating" ? ["u", "a"] : ["u"]);
    const before = stateReads;
    await act(async () => { await hook.result.current.stop(); });
    expect(savedKey).toBeTruthy();
    expect(stateReads).toBeGreaterThan(before);
    await waitFor(() => expect(hook.result.current.detail.data?.conversation.version).toBe(5));
    expect(hook.result.current.detail.data?.activeTurnId).toBeNull();
    await waitFor(() => expect(hook.result.current.canSend).toBe(true));
    expect(hook.result.current.runtime.thread.getState().messages.at(-1)?.status).toEqual({ type: "incomplete", reason: "cancelled" });
    expect(hook.result.current.canStop).toBe(false);
    expect(hook.result.current.isPending).toBe(false);
    hook.unmount();
  });

  it("admitted sin assistant sigue polling hasta activeTurnId null sin inventar mensajes", async () => {
    const initial = { ...conversation(), activeTurnId: "durable-turn" };
    const hook = setup(state, false, initial);
    await waitFor(() => expect(hook.result.current.detail.data).toEqual(initial));
    vi.useFakeTimers();
    // Reprograma el observer bajo el reloj falso después de la carga HTTP inicial.
    await act(async () => { await hook.result.current.detail.refetch(); });
    let reads = 0;
    server.use(http.get("/api/organization/assistant/conversations/chat", () => {
      reads++;
      return HttpResponse.json(reads === 1 ? initial : conversation([message("u", "user"), terminal.message]));
    }));
    await act(async () => { await vi.advanceTimersByTimeAsync(1_000); });
    await act(async () => { await vi.advanceTimersByTimeAsync(10); });
    expect(reads).toBe(1);
    expect(hook.result.current.canStop).toBe(true);
    expect(hook.result.current.canSend).toBe(false);
    expect(hook.result.current.isPending).toBe(true);
    expect(hook.result.current.runtime.thread.getState().messages.map((item) => item.id)).toEqual([]);
    await act(async () => { await vi.advanceTimersByTimeAsync(1_000); });
    await act(async () => { await vi.advanceTimersByTimeAsync(10); });
    expect(reads).toBe(2);
    expect(hook.result.current.canStop).toBe(false);
    expect(hook.result.current.isPending).toBe(false);
    expect(hook.result.current.canSend).toBe(true);
    await act(async () => { await vi.advanceTimersByTimeAsync(2_000); });
    expect(reads).toBe(2);
    hook.unmount();
  });

  it("Stop fallido al reabrir conserva pending/polling y Retry conserva la clave", async () => {
    const initial = { ...conversation([message("a", "assistant", "Generating", "Parcial")]), activeTurnId: "durable-turn" };
    const hook = setup(state, false, initial);
    const keys: Array<string | null> = [];
    server.use(http.post("/api/organization/assistant/conversations/chat/turns/durable-turn/stop", ({ request }) => {
      keys.push(request.headers.get("idempotency-key"));
      if (keys.length === 1) return HttpResponse.error();
      hook.setDurable(conversation([message("a", "assistant", "Stopped", "Parcial") ]));
      return new HttpResponse(null, { status: 204 });
    }));
    await waitFor(() => expect(hook.result.current.detail.data).toEqual(initial));
    await act(async () => { await hook.result.current.stop().catch(() => {}); });
    expect(hook.result.current.isPending).toBe(true);
    expect(hook.result.current.canStop).toBe(true);
    expect(hook.result.current.canSend).toBe(false);
    expect(hook.result.current.runtime.thread.getState().messages.at(-1)?.status).toEqual({ type: "running" });
    const lost = hook.client.getMutationCache().getAll().find((mutation) => mutation.state.status === "error");
    vi.useFakeTimers();
    await act(async () => { await hook.result.current.detail.refetch(); });
    let reads = 0;
    server.use(http.get("/api/organization/assistant/conversations/chat", () => { reads++; return HttpResponse.json(initial); }));
    await act(async () => { await vi.advanceTimersByTimeAsync(1_000); });
    expect(reads).toBe(1);
    vi.useRealTimers();
    server.use(http.get("/api/organization/assistant/conversations/chat", () => HttpResponse.json(conversation([message("a", "assistant", "Stopped", "Parcial")]))));
    await act(async () => { await lost!.execute(lost!.state.variables); });
    expect(keys[1]).toBe(keys[0]);
    await waitFor(() => expect(hook.result.current.isPending).toBe(false));
    hook.unmount();
  });

  it("Stop espera activeTurnId null aunque ya no haya mensaje Generating", async () => {
    const initial = { ...conversation([message("u", "user")]), activeTurnId: "durable-turn" };
    const hook = setup(state, false, initial);
    server.use(http.post("/api/organization/assistant/conversations/chat/turns/durable-turn/stop", () => new HttpResponse(null, { status: 204 })));
    await waitFor(() => expect(hook.result.current.detail.data).toEqual(initial));
    let reads = 0;
    server.use(http.get("/api/organization/assistant/conversations/chat", () => {
      reads++; return HttpResponse.json(initial);
    }));
    let settled = false;
    let operation!: Promise<void>;
    act(() => { operation = hook.result.current.stop().then(() => { settled = true; }); });
    await waitFor(() => {
      expect(reads).toBeGreaterThan(0);
      expect(hook.result.current.detail.isFetching).toBe(false);
    });
    expect(settled).toBe(false);
    expect(hook.result.current.isPending).toBe(true);
    server.use(http.get("/api/organization/assistant/conversations/chat", () => HttpResponse.json(conversation([message("u", "user"), message("a", "assistant", "Stopped")]))));
    hook.setDurable(conversation([message("u", "user"), message("a", "assistant", "Stopped")]));
    await act(async () => { await hook.result.current.detail.refetch(); await operation; });
    expect(settled).toBe(true);
    await waitFor(() => expect(hook.result.current.canSend).toBe(true));
    hook.unmount();
  });

  it("null terminal no permite Stop ni inventa un turno", async () => {
    const hook = setup(state, false, conversation([terminal.message]));
    await waitFor(() => expect(hook.result.current.canSend).toBe(true));
    expect(hook.result.current.canStop).toBe(false);
    expect(hook.result.current.isPending).toBe(false);
    await expect(hook.result.current.stop()).rejects.toMatchObject({ code: "Assistant.Turn.NotGenerating" });
    hook.unmount();
  });

  it("SSE start vivo prioriza su turnId sobre una ficha durable atrasada para Stop", async () => {
    const source = stream();
    const hook = setup();
    const stopped = deferred<void>();
    server.use(http.post("/api/organization/assistant/conversations/chat/messages", () => new HttpResponse(source.body, { headers: { "Content-Type": "text/event-stream" } })),
      http.post("/api/organization/assistant/conversations/chat/turns/turn/stop", () => {
        hook.setDurable(conversation([message("u", "user"), message("a", "assistant", "Stopped")]));
        stopped.resolve();
        return new HttpResponse(null, { status: 204 });
      }));
    await waitFor(() => expect(hook.result.current.canSend).toBe(true));
    let operation!: Promise<AssistantConversationResponse>;
    act(() => { operation = hook.result.current.send({ text: "Actual", conversationVersion: 3 }); source.event("start", start); });
    await waitFor(() => expect(hook.result.current.turn?.start?.turnId).toBe("turn"));
    hook.setDurable({ ...conversation([message("old-a", "assistant", "Generating")]), activeTurnId: "old-turn" });
    await act(async () => { await hook.result.current.detail.refetch(); });
    await act(async () => { await hook.result.current.stop(); });
    await stopped.promise;
    await waitFor(() => expect(hook.result.current.turn?.phase).toBe("Stopped"));
    await act(async () => { await operation; });
    hook.unmount();
  });

  it.each([false, true])("Stop con ID durable antes de start reconcilia su lector, pedido previo igual=%s", async (sameBody) => {
    const source = stream();
    const hook = setup();
    let posts = 0;
    server.use(http.post("/api/organization/assistant/conversations/chat/messages", () => {
      posts++;
      if (sameBody && posts === 1) return HttpResponse.error();
      return new HttpResponse(source.body, { headers: { "Content-Type": "text/event-stream" } });
    }));
    await waitFor(() => expect(hook.result.current.canSend).toBe(true));
    if (sameBody) {
      await act(async () => { await hook.result.current.send({ text: "Admitido", conversationVersion: 3 }).catch(() => {}); });
      await waitFor(() => expect(hook.result.current.canSend).toBe(true));
    }
    let operation!: Promise<AssistantConversationResponse | undefined>;
    act(() => {
      operation = hook.result.current.send({ text: "Admitido", conversationVersion: 3 }).catch(() => undefined);
      source.event("title", { conversationId: "chat", title: "Admitido", version: 4 });
    });
    await waitFor(() => expect(hook.result.current.turn?.title?.version).toBe(4));
    let durable: AssistantConversationResponse = { ...conversation([message("u", "user")]), activeTurnId: "durable-turn" };
    let reads = 0;
    let stateReads = 0;
    let stopKey: string | null = null;
    server.use(http.get("/api/organization/assistant/conversations/chat", () => { reads++; return HttpResponse.json(durable); }),
      http.get("/api/organization/assistant", () => { stateReads++; return HttpResponse.json({ ...state, remainingMessages: 79 }); }),
      http.post("/api/organization/assistant/conversations/chat/turns/durable-turn/stop", ({ request }) => {
        stopKey = request.headers.get("idempotency-key");
        durable = conversation([message("u", "user"), message("a", "assistant", "Stopped")]);
        return new HttpResponse(null, { status: 204 });
      }));
    // La ficha es el único origen del ID; todavía no llegó start por SSE.
    await act(async () => { await hook.result.current.detail.refetch(); });
    await waitFor(() => expect(hook.result.current.detail.data?.activeTurnId).toBe("durable-turn"));
    expect(hook.result.current.turn?.start).toBeUndefined();
    const before = reads;
    try {
      await act(async () => { await hook.result.current.stop(); });
      await waitFor(() => expect(hook.result.current.turn?.phase).toBe("Stopped"));
      expect(reads).toBeGreaterThan(before);
      expect(stateReads).toBeGreaterThan(0);
      expect(stopKey).toBeTruthy();
      await act(async () => { expect(await operation).toEqual(durable); });
      await waitFor(() => expect(hook.result.current.canSend).toBe(true));
      expect(hook.result.current.isPending).toBe(false);
      expect(hook.result.current.canStop).toBe(false);
      expect(hook.result.current.runtime.thread.getState().messages.map((item) => item.id)).toEqual(["u", "a"]);
      expect(posts).toBe(sameBody ? 2 : 1);
    } finally { source.close(); hook.unmount(); await operation; }
  });

  it("Stop durable después de EOF sin start y relectura fallida reconcilia sin dueño en vuelo", async () => {
    const source = stream();
    const hook = setup();
    let posts = 0;
    server.use(http.post("/api/organization/assistant/conversations/chat/messages", () => {
      posts++; return new HttpResponse(source.body, { headers: { "Content-Type": "text/event-stream" } });
    }));
    await waitFor(() => expect(hook.result.current.canSend).toBe(true));
    let operation!: Promise<unknown>;
    act(() => {
      operation = hook.result.current.send({ text: "Admitido", conversationVersion: 3 }).catch((error: unknown) => error);
      source.event("title", { conversationId: "chat", title: "Admitido", version: 4 });
    });
    await waitFor(() => expect(hook.result.current.turn?.title?.version).toBe(4));
    hook.setDurable({ ...conversation([message("u", "user")]), activeTurnId: "durable-turn" });
    await act(async () => { await hook.result.current.detail.refetch(); });
    await waitFor(() => expect(hook.result.current.detail.data?.activeTurnId).toBe("durable-turn"));
    server.use(http.get("/api/organization/assistant/conversations/chat", () => HttpResponse.error()));
    await act(async () => { source.close(); expect(await operation).toMatchObject({ isNetworkError: true }); });
    expect(hook.result.current.turn?.phase).toBe("reconciling");
    expect(hook.result.current.turn?.start).toBeUndefined();
    let reads = 0;
    let stateReads = 0;
    const stopped = conversation([message("u", "user"), message("a", "assistant", "Stopped")]);
    server.use(http.get("/api/organization/assistant/conversations/chat", () => { reads++; return HttpResponse.json(stopped); }),
      http.get("/api/organization/assistant", () => { stateReads++; return HttpResponse.json(state); }),
      http.post("/api/organization/assistant/conversations/chat/turns/durable-turn/stop", () => new HttpResponse(null, { status: 204 })));
    try {
      await act(async () => { await hook.result.current.stop(); });
      await waitFor(() => expect(hook.result.current.turn?.phase).toBe("Stopped"));
      expect(reads).toBeGreaterThan(0);
      expect(stateReads).toBeGreaterThan(0);
      await waitFor(() => expect(hook.result.current.canSend).toBe(true));
      expect(hook.result.current.isPending).toBe(false);
      expect(posts).toBe(1);
    } finally { hook.unmount(); }
  });

  it.each((["scope", "conversation", "cycle", "clear", "unmount"] as const).flatMap((change) => [false, true].map((failure) => ({ change, failure }))))("Stop durable diferido tras $change (failure=$failure) no relee ni resucita/error en otra vida", async ({ change, failure }) => {
    const initial = { ...conversation([message("private-a", "assistant", "Generating")]), activeTurnId: "durable-turn" };
    const hook = setup(state, false, initial);
    const release = deferred<void>();
    const entered = deferred<void>();
    let posts = 0;
    let reads = 0;
    server.use(http.post("/api/organization/assistant/conversations/chat/turns/durable-turn/stop", async () => {
      posts++; entered.resolve(); await release.promise;
      return failure ? HttpResponse.json({ code: "Assistant.Turn.NotGenerating", traceId: "private-old-trace" }, { status: 409 }) : new HttpResponse(null, { status: 204 });
    }), http.get("/api/organization/assistant/conversations/other-chat", () => {
      reads++; return HttpResponse.json({ ...conversation([message("other-a", "assistant")]), conversation: { ...initial.conversation, id: "other-chat" } });
    }));
    await waitFor(() => expect(hook.result.current.canStop).toBe(true));
    const oldStop = hook.result.current.stop;
    let operation!: Promise<unknown>;
    act(() => { operation = oldStop().catch((error: unknown) => error); });
    await entered.promise;
    const oldMutation = hook.client.getMutationCache().getAll().find((mutation) => mutation.state.status === "pending");
    hook.setDurable(conversation([message("new-a", "assistant")]));
    act(() => {
      if (change === "scope") hook.rerender({ currentScope: { ...scope, userId: "other" } });
      else if (change === "conversation") hook.rerender({ currentConversationId: "other-chat" });
      else if (change === "cycle") hook.rerender({ enabled: false });
      else if (change === "clear") hook.client.clear();
      else hook.unmount();
    });
    if (change === "cycle") hook.rerender({ enabled: true });
    if (["scope", "conversation", "cycle"].includes(change)) await waitFor(() => expect(hook.result.current.canSend).toBe(true));
    server.use(http.get("/api/organization/assistant/conversations/chat", () => { reads++; return HttpResponse.json(initial); }),
      http.get("/api/organization/assistant", () => { reads++; return HttpResponse.json(state); }));
    const afterClose = reads;
    await act(async () => { release.resolve(); expect(await operation).toMatchObject({ name: "AbortError" }); });
    expect(reads).toBe(afterClose);
    await act(async () => {
      await expect(oldMutation!.execute(oldMutation!.state.variables)).rejects.toMatchObject({ name: "AbortError" });
      await expect(Promise.resolve().then(oldStop)).rejects.toMatchObject({ name: "AbortError" });
    });
    expect(posts).toBe(1);
    if (change !== "unmount") {
      expect(hook.result.current.error).toBeNull();
      const ids = hook.result.current.runtime.thread.getState().messages.map((item) => item.id);
      expect(ids).toEqual(change === "clear" ? [] : change === "conversation" ? ["other-a"] : ["new-a"]);
      expect(hook.result.current.canStop).toBe(false);
    }
    if (change !== "cycle") expect(hook.client.getQueryData(assistantConversationQueryKey(scope, "chat"))).toBeUndefined();
    hook.unmount();
  });
  it.each([
    ["send", "scope"], ["send", "conversation"], ["send", "cycle"],
    ["stop", "scope"], ["stop", "conversation"], ["stop", "cycle"],
  ] as const)("error de %s pertenece sólo al lifetime actual al cambiar %s", async (action, change) => {
    const source = stream();
    const hook = setup();
    let sendRequests = 0;
    let stopRequests = 0;
    const code = action === "send" ? "Assistant.Settings.NotConfigured" : "Assistant.Turn.NotGenerating";
    server.use(http.get("/api/organization/assistant/conversations/other-chat", () => HttpResponse.json({
      ...conversation(), conversation: { ...conversation().conversation, id: "other-chat" },
    })), http.post("/api/organization/assistant/conversations/chat/messages", () => {
      sendRequests++;
      return action === "send" ? HttpResponse.json({ code, traceId: "private-old-trace" }, { status: 409 })
        : new HttpResponse(source.body, { headers: { "Content-Type": "text/event-stream" } });
    }), http.post("/api/organization/assistant/conversations/chat/turns/turn/stop", () => {
      stopRequests++;
      return HttpResponse.json({ code, traceId: "private-old-trace" }, { status: 409 });
    }));
    await waitFor(() => expect(hook.result.current.canSend).toBe(true));
    if (action === "send") {
      await act(async () => { await hook.result.current.send({ text: "Consulta", conversationVersion: 3 }).catch(() => {}); });
    } else {
      let operation!: Promise<AssistantConversationResponse>;
      act(() => { operation = hook.result.current.send({ text: "Consulta", conversationVersion: 3 }); source.event("start", start); });
      await waitFor(() => expect(hook.result.current.turn?.start?.turnId).toBe("turn"));
      await act(async () => { await hook.result.current.stop().catch(() => {}); });
      hook.setDurable(conversation([message("u", "user"), terminal.message]));
      await act(async () => { source.event("done", terminal); source.close(); await operation; });
    }
    await waitFor(() => expect(hook.result.current.error).toMatchObject({ code, traceId: "private-old-trace" }));
    const oldMutation = hook.client.getMutationCache().getAll().find((mutation) => mutation.state.status === "error");
    const oldSend = hook.result.current.send;
    expect(oldMutation).toBeDefined();
    if (change === "cycle") {
      hook.setDurable(conversation());
      hook.rerender({ enabled: false });
      expect(hook.result.current.error).toBeNull();
      hook.rerender({ enabled: true });
    } else hook.rerender(change === "scope" ? { currentScope: { ...scope, userId: "other" } } : { currentConversationId: "other-chat" });
    await waitFor(() => expect(hook.result.current.canSend).toBe(true));
    expect(hook.result.current.blockedCode).toBeNull();
    expect(hook.result.current.error).toBeNull();
    await act(async () => {
      await expect(oldMutation!.execute(oldMutation!.state.variables)).rejects.toMatchObject({ name: "AbortError" });
      await expect(oldSend({ text: "Tardío", conversationVersion: 3 })).rejects.toMatchObject({ code: "Assistant.Runtime.SendDisabled" });
    });
    expect(sendRequests).toBe(1);
    expect(stopRequests).toBe(action === "stop" ? 1 : 0);
    expect(hook.result.current.canSend).toBe(true);
    expect(hook.result.current.error).toBeNull();
    hook.unmount();
  });

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

  it.each(["before-start", "after-start"] as const)("Retry global de Stop viejo conserva key y no aborta el lector nuevo %s", async (stage) => {
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
    act(() => {
      operation = hook.result.current.send({ text: "Dos", conversationVersion: 4 });
      if (stage === "after-start") second.event("start", { ...start, turnId: "new-turn", userMessageId: "new-u", assistantMessageId: "new-a" });
      else second.event("title", { conversationId: "chat", title: "Dos", version: 5 });
    });
    await waitFor(() => stage === "after-start" ? expect(hook.result.current.turn?.start?.turnId).toBe("new-turn") : expect(hook.result.current.turn?.title?.version).toBe(5));
    await act(async () => { await lostStop!.execute(lostStop!.state.variables); });
    expect(keys[1]).toBe(keys[0]);
    if (stage === "before-start") {
      expect(hook.result.current.turn?.phase).toBe("sending");
      expect(hook.result.current.turn?.start).toBeUndefined();
      act(() => { second.event("start", { ...start, turnId: "new-turn", userMessageId: "new-u", assistantMessageId: "new-a" }); });
    }
    act(() => { second.event("delta", { turnId: "new-turn", sequence: 1, text: "Sigue" }); });
    await waitFor(() => expect(hook.result.current.turn?.text).toBe("Sigue"));
    const nextTerminal = { ...terminal, turnId: "new-turn", message: { ...terminal.message, id: "new-a" } };
    hook.setDurable(conversation([message("new-u", "user"), nextTerminal.message]));
    await act(async () => { second.event("done", nextTerminal); second.close(); await operation; });
    hook.unmount();
  });

  it.each([false, true])("Retry Stop viejo no reconcilia el envío nuevo tras EOF fallido, cuerpo igual=%s", async (sameBody) => {
    const first = stream();
    const second = stream();
    const hook = setup();
    let posts = 0;
    const keys: Array<string | null> = [];
    server.use(http.post("/api/organization/assistant/conversations/chat/messages", () => {
      posts++; return new HttpResponse(posts === 1 ? first.body : second.body, { headers: { "Content-Type": "text/event-stream" } });
    }), http.post("/api/organization/assistant/conversations/chat/turns/turn/stop", ({ request }) => {
      keys.push(request.headers.get("idempotency-key"));
      return keys.length === 1 ? HttpResponse.error() : new HttpResponse(null, { status: 204 });
    }));
    await waitFor(() => expect(hook.result.current.canSend).toBe(true));
    let firstOperation!: Promise<AssistantConversationResponse>;
    act(() => { firstOperation = hook.result.current.send({ text: "Uno", conversationVersion: 3 }); first.event("start", start); });
    await waitFor(() => expect(hook.result.current.turn?.start?.turnId).toBe("turn"));
    await act(async () => { await hook.result.current.stop().catch(() => {}); });
    const lostStop = hook.client.getMutationCache().getAll().find((mutation) => mutation.state.status === "error");
    hook.setDurable(conversation([message("u", "user"), terminal.message]));
    await act(async () => { first.event("done", terminal); first.close(); await firstOperation; });
    await waitFor(() => expect(hook.result.current.canSend).toBe(true));
    let secondOperation!: Promise<unknown>;
    act(() => {
      secondOperation = hook.result.current.send({ text: sameBody ? "Uno" : "Dos", conversationVersion: 3 }).catch((error: unknown) => error);
      second.event("title", { conversationId: "chat", title: "Nuevo", version: 5 });
    });
    await waitFor(() => expect(hook.result.current.turn?.title?.version).toBe(5));
    server.use(http.get("/api/organization/assistant/conversations/chat", () => HttpResponse.error()));
    await act(async () => { second.close(); expect(await secondOperation).toMatchObject({ isNetworkError: true }); });
    expect(hook.result.current.turn?.phase).toBe("reconciling");
    expect(hook.result.current.turn?.start).toBeUndefined();
    expect(hook.result.current.detail.data?.activeTurnId).toBeNull();
    let reads = 0;
    let stateReads = 0;
    server.use(http.get("/api/organization/assistant/conversations/chat", () => { reads++; return HttpResponse.json(conversation([terminal.message])); }),
      http.get("/api/organization/assistant", () => { stateReads++; return HttpResponse.json(state); }));
    try {
      await act(async () => { await lostStop!.execute(lostStop!.state.variables); });
      expect(keys[1]).toBe(keys[0]);
      expect(reads).toBe(0);
      expect(stateReads).toBe(0);
      expect(hook.result.current.turn?.phase).toBe("reconciling");
      expect(hook.result.current.turn?.title?.title).toBe("Nuevo");
      expect(hook.result.current.isPending).toBe(true);
      expect(hook.result.current.canSend).toBe(false);
      expect(hook.result.current.error).toMatchObject({ isNetworkError: true });
      expect(posts).toBe(2);
    } finally { hook.unmount(); }
  });

  it.each([false, true].flatMap((failure) => ["none", "terminal", "pending"].map((cacheUpdate) => ({ failure, cacheUpdate }))))("Stop GET tardío no contamina Query nueva (failure=$failure, cacheUpdate=$cacheUpdate)", async ({ failure, cacheUpdate }) => {
    const first = stream();
    const second = stream();
    const hook = setup();
    let posts = 0;
    let stops = 0;
    server.use(http.post("/api/organization/assistant/conversations/chat/messages", () => {
      posts++; return new HttpResponse(posts === 1 ? first.body : second.body, { headers: { "Content-Type": "text/event-stream" } });
    }), http.post("/api/organization/assistant/conversations/chat/turns/turn/stop", () => {
      stops++; return stops === 1 ? HttpResponse.error() : new HttpResponse(null, { status: 204 });
    }));
    await waitFor(() => expect(hook.result.current.canSend).toBe(true));
    let firstOperation!: Promise<AssistantConversationResponse>;
    act(() => { firstOperation = hook.result.current.send({ text: "Uno", conversationVersion: 3 }); first.event("start", start); });
    await waitFor(() => expect(hook.result.current.turn?.start?.turnId).toBe("turn"));
    await act(async () => { await hook.result.current.stop().catch(() => {}); });
    const lostStop = hook.client.getMutationCache().getAll().find((mutation) => mutation.state.status === "error");
    const before = conversation([message("u", "user"), terminal.message]);
    hook.setDurable(before);
    await act(async () => { first.event("done", terminal); first.close(); await firstOperation; });
    await waitFor(() => expect(hook.result.current.canSend).toBe(true));
    // Una acción ya capturada conserva el recorrido original mientras llega el GET de Stop.
    const queuedSend = hook.result.current.send;
    const entered = deferred<void>();
    const release = deferred<void>();
    let stateReads = 0;
    server.use(http.get("/api/organization/assistant/conversations/chat", async () => {
      entered.resolve(); await release.promise;
      return failure ? HttpResponse.json({ code: "Private.Old.Error", traceId: "private-old-trace" }, { status: 400 })
        : HttpResponse.json(conversation([message("stale-private", "assistant", "Complete", "Viejo") ]));
    }), http.get("/api/organization/assistant", () => { stateReads++; return HttpResponse.json(state); }));
    let oldStop!: Promise<unknown>;
    let oldStopSettled = false;
    act(() => { oldStop = lostStop!.execute(lostStop!.state.variables).catch((error: unknown) => error).finally(() => { oldStopSettled = true; }); });
    await entered.promise;
    const currentDetail = cacheUpdate === "none" ? before : { ...before, conversation: { ...before.conversation, version: 7 }, activeTurnId: cacheUpdate === "pending" ? "new-durable-turn" : null, messages: { ...before.messages, items: [message("current-durable", "assistant", cacheUpdate === "pending" ? "Generating" : "Complete")] } };
    if (cacheUpdate !== "none") act(() => { hook.client.setQueryData(assistantConversationQueryKey(scope, "chat"), currentDetail); });
    let secondOperation!: Promise<unknown>;
    act(() => {
      secondOperation = queuedSend({ text: "Dos", conversationVersion: 3 }).catch((error: unknown) => error);
      second.event("title", { conversationId: "chat", title: "Nuevo", version: 5 });
    });
    await waitFor(() => expect(hook.result.current.turn?.title?.version).toBe(5));
    try {
      await waitFor(() => expect(oldStopSettled).toBe(true), { timeout: 500 });
      expect(hook.client.getQueryCache().find({ queryKey: assistantConversationQueryKey(scope, "chat"), exact: true })?.getObserversCount()).toBe(1);
      await act(async () => { release.resolve(); expect(await oldStop).toMatchObject({ name: "AbortError" }); });
      await waitFor(() => expect(hook.result.current.detail.isFetching).toBe(false));
      expect(hook.result.current.detail.data).toEqual(currentDetail);
      expect(hook.result.current.detail.isError).toBe(false);
      expect(hook.result.current.detail.error).toBeNull();
      expect(hook.result.current.detail.status).toBe("success");
      expect(hook.client.getQueryState(assistantConversationQueryKey(scope, "chat"))).toMatchObject({ status: "success", error: null, fetchStatus: "idle", data: currentDetail });
      expect(hook.result.current.turn?.phase).toBe("sending");
      expect(hook.result.current.turn?.title?.title).toBe("Nuevo");
      expect(stateReads).toBe(0);
      expect(hook.result.current.error).toBeNull();
      expect(hook.result.current.isPending).toBe(true);
      expect(posts).toBe(2);
    } finally { release.resolve(); hook.unmount(); second.close(); await secondOperation; }
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
    const hook = setup(state, false, conversation([message("u", "user"), message("a", "assistant", "Generating", "Parcial")]));
    await waitFor(() => expect(hook.result.current.detail.data?.messages.items).toHaveLength(2));
    expect(hook.result.current.isPending).toBe(true);
    expect(hook.result.current.canSend).toBe(false);
    expect(hook.result.current.canStop).toBe(false);
    await expect(hook.result.current.stop()).rejects.toMatchObject({ code: "Assistant.Turn.NotGenerating" });
    await waitFor(() => expect(hook.result.current.runtime.thread.getState().messages.map((item) => item.id)).toEqual(["u", "a"]));
    vi.useFakeTimers();
    await act(async () => { await hook.result.current.detail.refetch(); });
    let reads = 0;
    server.use(http.get("/api/organization/assistant/conversations/chat", () => {
      reads++; return HttpResponse.json(conversation([message("u", "user"), terminal.message]));
    }));
    await act(async () => { await vi.advanceTimersByTimeAsync(1_010); });
    await act(async () => { await vi.advanceTimersByTimeAsync(10); });
    expect(reads).toBe(1);
    vi.useRealTimers();
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

  it.each([{ ...state, configured: false }, { ...state, noticeAccepted: false }, { ...state, remainingMessages: 0 },
    { ...state, monthlyBudgetProgress: { fraction: 0.1, status: "LimitReached" as const } }])("bloquea envío por configuración/aviso/límite sin alterar State", async (data) => {
    const hook = setup(data);
    await waitFor(() => expect(hook.result.current.state.data).toEqual(data));
    expect(hook.result.current.canSend).toBe(false);
    expect(hook.result.current.runtime.thread.getState().isRunning).toBe(false);
    hook.unmount();
  });
  it.each(["WithinLimit", "NearLimit"] as const)("State %s conserva admisión local sin calcular la fracción", async (status) => {
    const hook = setup({ ...state, monthlyBudgetProgress: { fraction: 1.2, status } });
    await waitFor(() => expect(hook.result.current.canSend).toBe(true));
    expect(hook.result.current.state.data?.monthlyBudgetProgress).toEqual({ fraction: 1.2, status });
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
