import { describe, expect, it } from "vitest";
import { beginAssistantTurn, reduceAssistantTurn } from "./assistantTurnState";

describe("Assistant turn", () => {
  it("admite ids del back y descarta deltas duplicados, atrasados y de otro turno", () => {
    const initial = beginAssistantTurn("chat", { text: "Hola", conversationVersion: 3 });
    const started = reduceAssistantTurn(initial, { event: "start", data: { turnId: "turn", userMessageId: "user", assistantMessageId: "assistant", conversationVersion: 4 } });
    const first = reduceAssistantTurn(started, { event: "delta", data: { turnId: "turn", sequence: 1, text: "Uno" } });
    expect(reduceAssistantTurn(first, { event: "delta", data: { turnId: "other", sequence: 2, text: "Ajeno" } })).toBe(first);
    expect(reduceAssistantTurn(first, { event: "delta", data: { turnId: "turn", sequence: 1, text: "Repetido" } })).toBe(first);
    expect(reduceAssistantTurn(first, { event: "delta", data: { turnId: "turn", sequence: 0, text: "Viejo" } })).toBe(first);
    expect(first.text).toBe("Uno");
    expect(first.phase).toBe("writing");
    expect(initial.start).toBeUndefined();
  });

  it("no cambia el título de otra conversación ni admite un segundo start", () => {
    const started = reduceAssistantTurn(beginAssistantTurn("chat", {}), { event: "start", data: { turnId: "turn", userMessageId: "u", assistantMessageId: "a", conversationVersion: 4 } });
    expect(reduceAssistantTurn(started, { event: "title", data: { conversationId: "other", title: "Ajeno", version: 99 } })).toBe(started);
    expect(reduceAssistantTurn(started, { event: "start", data: { turnId: "other", userMessageId: "u2", assistantMessageId: "a2", conversationVersion: 99 } })).toBe(started);
  });

  it("conserva Failed sin inventar mensajes y bloquea eventos después del terminal", () => {
    const failed = reduceAssistantTurn(beginAssistantTurn("chat", {}), { event: "error", data: { code: "Assistant.Provider.Failed", traceId: "trace", status: "Failed" } });
    expect(failed.phase).toBe("Failed");
    expect(failed.start).toBeUndefined();
    expect(reduceAssistantTurn(failed, { event: "start", data: { turnId: "late", userMessageId: "u", assistantMessageId: "a", conversationVersion: 9 } })).toBe(failed);
  });

  it("acepta replay done sin start y conserva la versión/status emitidos", () => {
    const result = { turnId: "turn", conversationVersion: 7,
      message: { id: "a", role: "assistant" as const, status: "Stopped" as const, text: "Parcial", createdAtUtc: "2026-10-09T12:00:00Z", version: 9, attachments: [], links: [] },
      usage: { inputTokens: 1, outputTokens: 2, cacheReadTokens: 0, cacheWriteTokens: 0, cost: { amount: 0, currency: "USD" } } };
    const terminal = reduceAssistantTurn(beginAssistantTurn("chat", {}), { event: "done", data: result });
    expect(terminal.result).toBe(result);
    expect(terminal.phase).toBe("Stopped");
    expect(terminal.start).toBeUndefined();
    expect(reduceAssistantTurn(terminal, { event: "done", data: result })).toBe(terminal);
  });

  it("ignora terminal de otro turno/id y no devuelve una herramienta terminada a running", () => {
    let current = reduceAssistantTurn(beginAssistantTurn("chat", {}), { event: "start", data: { turnId: "turn", userMessageId: "u", assistantMessageId: "a", conversationVersion: 4 } });
    current = reduceAssistantTurn(current, { event: "tool", data: { turnId: "turn", toolKey: "users", labelKey: "users", state: "complete" } });
    expect(reduceAssistantTurn(current, { event: "tool", data: { turnId: "turn", toolKey: "users", labelKey: "users", state: "running" } })).toBe(current);
    expect(reduceAssistantTurn(current, { event: "error", data: { turnId: "other", code: "Failed", status: "Failed", traceId: "trace" } })).toBe(current);
    expect(reduceAssistantTurn(current, { event: "done", data: { turnId: "other", conversationVersion: 10,
      message: { id: "other", role: "assistant", status: "Complete", text: "Ajeno", createdAtUtc: "2026-10-09T12:00:00Z", version: 1, attachments: [], links: [] },
      usage: { inputTokens: 0, outputTokens: 0, cacheReadTokens: 0, cacheWriteTokens: 0, cost: { amount: 0, currency: "USD" } } } })).toBe(current);
  });
});
