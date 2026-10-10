import { HttpResponse, http } from "msw";
import { afterEach, describe, expect, it } from "vitest";
import { server } from "@/test/mocks/server";
import { configureHttpClient, resetHttpClient } from "@/shared/api/httpClient";
import {
  acceptAssistantNotice, assistantConversationQueryKey, assistantConversationsQueryKey,
  assistantQueryKeyRoot, assistantStateQueryKey, createAssistantConversation, deleteAssistantConversation,
  fetchAssistantConversation, fetchAssistantConversations, fetchAssistantState, runAssistantQuick,
  sendAssistantMessageResponse, setAssistantFeedback, stopAssistantTurn, updateAssistantConversation,
} from "./assistant";
import type { AssistantScope } from "./assistant";

const scope: AssistantScope = { access: "business", tenantId: "organization", userId: "person" };
afterEach(resetHttpClient);

describe("Assistant HTTP", () => {
  it("separa cada acceso, organización, usuario, conversación y cursor en las claves", () => {
    expect(assistantQueryKeyRoot(scope)).toEqual(["assistant", "business", "organization", "person"]);
    expect(assistantStateQueryKey(scope)).toEqual([...assistantQueryKeyRoot(scope), "state"]);
    expect(assistantConversationsQueryKey(scope, { cursor: "next", saved: false })).toEqual([
      ...assistantQueryKeyRoot(scope), "conversations", { cursor: "next", saved: false },
    ]);
    expect(assistantConversationQueryKey(scope, "chat", { cursor: "older", limit: 20 })).toEqual([
      ...assistantQueryKeyRoot(scope), "detail", "chat", { cursor: "older", limit: 20 },
    ]);
    for (const next of [{ ...scope, access: "consumer" as const }, { ...scope, tenantId: "other" }, { ...scope, userId: "other" }]) {
      expect(assistantQueryKeyRoot(next)).not.toEqual(assistantQueryKeyRoot(scope));
    }
  });

  it.each([["consumer", "me"], ["business", "organization"], ["platform", "platform"]] as const)("usa el prefijo firmado de %s", async (access, prefix) => {
    server.use(http.get(`/api/${prefix}/assistant`, ({ request }) => {
      expect(request.headers.get("authorization")).toBe("Bearer memory-token");
      expect(new URL(request.url).search).toBe("");
      return HttpResponse.json({ configured: false });
    }));
    configureHttpClient({ getAccessToken: () => "memory-token" });
    await expect(fetchAssistantState({ ...scope, access })).resolves.toEqual({ configured: false });
  });

  it("conserva queries generadas, falsos y cursores codificados", async () => {
    const seen: string[] = [];
    server.use(http.get("/api/organization/assistant/conversations", ({ request }) => {
      seen.push(new URL(request.url).search);
      return HttpResponse.json({ items: [], hasMore: false });
    }), http.get("/api/organization/assistant/conversations/:id", ({ request }) => {
      seen.push(new URL(request.url).pathname + new URL(request.url).search);
      return HttpResponse.json({ conversation: {}, messages: {} });
    }));
    await fetchAssistantConversations(scope, { cursor: "a+b/=", limit: 2, saved: false });
    await fetchAssistantConversation(scope, "a/b", { cursor: "c+d", limit: 3 });
    expect(seen).toEqual(["?cursor=a%2Bb%2F%3D&limit=2&saved=false", "/api/organization/assistant/conversations/a%2Fb?cursor=c%2Bd&limit=3"]);
  });

  it("envía los cuerpos congelados sin identidad local, y las versiones DELETE en query", async () => {
    const seen: Array<{ method: string; path: string; key: string | null; body: string }> = [];
    server.use(http.all("/api/organization/assistant/*", async ({ request }) => {
      const url = new URL(request.url);
      seen.push({ method: request.method, path: url.pathname + url.search, key: request.headers.get("idempotency-key"), body: await request.text() });
      return request.method === "DELETE" || url.pathname.endsWith("notice") || url.pathname.endsWith("stop")
        ? new HttpResponse(null, { status: 204 }) : HttpResponse.json({ version: 8 });
    }));
    await acceptAssistantNotice(scope, { noticeVersion: "notice-v1" }, "notice-key");
    await createAssistantConversation(scope, {}, "create-key");
    await updateAssistantConversation(scope, "chat", { title: "Nuevo", isSaved: true, version: 7 });
    await deleteAssistantConversation(scope, "chat", 8);
    await stopAssistantTurn(scope, "chat", "turn/a", {}, "stop-key");
    await runAssistantQuick(scope, "people/all", { conversationId: "chat", version: 8 }, "quick-key");
    await setAssistantFeedback(scope, "chat", "message/a", { rating: "up", version: 2 });
    expect(seen).toEqual([
      { method: "POST", path: "/api/organization/assistant/notice", key: "notice-key", body: '{"noticeVersion":"notice-v1"}' },
      { method: "POST", path: "/api/organization/assistant/conversations", key: "create-key", body: "{}" },
      { method: "PUT", path: "/api/organization/assistant/conversations/chat", key: null, body: '{"title":"Nuevo","isSaved":true,"version":7}' },
      { method: "DELETE", path: "/api/organization/assistant/conversations/chat?version=8", key: null, body: "" },
      { method: "POST", path: "/api/organization/assistant/conversations/chat/turns/turn%2Fa/stop", key: "stop-key", body: "{}" },
      { method: "POST", path: "/api/organization/assistant/quick/people%2Fall", key: "quick-key", body: '{"conversationId":"chat","version":8}' },
      { method: "PUT", path: "/api/organization/assistant/conversations/chat/messages/message%2Fa/feedback", key: null, body: '{"rating":"up","version":2}' },
    ]);
  });

  it("obtiene SSE o replay JSON sin consumir, reusando el cuerpo y key tras 401", async () => {
    const seen: string[] = [];
    server.use(http.post("/api/organization/assistant/conversations/chat/messages", async ({ request }) => {
      seen.push(`${request.headers.get("authorization")}:${request.headers.get("accept")}:${request.headers.get("idempotency-key")}:${await request.text()}`);
      return seen.length === 1 ? HttpResponse.json({ code: "Http.Unauthorized" }, { status: 401 })
        : HttpResponse.json({ turnId: "terminal" });
    }));
    configureHttpClient({ getAccessToken: () => "old", renewAccessToken: async () => "new" });
    const response = await sendAssistantMessageResponse(scope, "chat", { text: "Hola", attachmentIds: [], conversationVersion: 4 }, "durable-key");
    expect(response.bodyUsed).toBe(false);
    expect(seen).toEqual([
      'Bearer old:text/event-stream, application/json:durable-key:{"text":"Hola","attachmentIds":[],"conversationVersion":4}',
      'Bearer new:text/event-stream, application/json:durable-key:{"text":"Hola","attachmentIds":[],"conversationVersion":4}',
    ]);
  });

  it("el caller puede cancelar todos los pedidos antes del envío", async () => {
    const controller = new AbortController();
    controller.abort();
    await expect(fetchAssistantState(scope, controller.signal)).rejects.toMatchObject({ name: "AbortError" });
    await expect(sendAssistantMessageResponse(scope, "chat", {}, "key", controller.signal)).rejects.toMatchObject({ name: "AbortError" });
  });
});
