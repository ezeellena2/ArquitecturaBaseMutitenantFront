import { useEffect, useMemo, useRef, useSyncExternalStore } from "react";
import { useIsMutating, useQuery, useQueryClient } from "@tanstack/react-query";
import { ExportedMessageRepository, useExternalStoreRuntime, type ThreadMessageLike } from "@assistant-ui/react";
import type { AssistantConversationResponse, AssistantMessageResponse, SendAssistantMessageRequest } from "@/shared/api/types";
import { ApiError } from "@/shared/api/ApiError";
import { useIdempotentMutation } from "@/shared/api/useIdempotentMutation";
import { parseUtcInstant } from "@/shared/time/parseUtcInstant";
import { assistantConversationQueryKey, assistantQueryKeyRoot, assistantStateQueryKey, fetchAssistantConversation, fetchAssistantState, sendAssistantMessageResponse, stopAssistantTurn, type AssistantScope } from "../api/assistant";
import { decodeAssistantStream } from "../api/stream";
import { AssistantLifetime, waitForAssistantTerminal } from "./assistantLifetime";
import { beginAssistantTurn, isAssistantTurnPending, reduceAssistantTurn, type AssistantTurnState } from "./assistantTurnState";

interface SendOperation {
  operationId: string;
  scope: AssistantScope;
  conversationId: string;
  request: SendAssistantMessageRequest;
  lifetime: AssistantLifetime;
  idempotencyKey?: string;
  admitted?: boolean;
}

interface StopOperation {
  scope: AssistantScope;
  conversationId: string;
  turnId: string;
  lifetime: AssistantLifetime;
  idempotencyKey?: string;
}

function convertMessage(message: AssistantMessageResponse | ThreadMessageLike): ThreadMessageLike {
  if (!("text" in message)) return message;
  return {
    id: message.id, role: message.role, content: message.text, createdAt: parseUtcInstant(message.createdAtUtc),
    status: message.role === "assistant" ? sdkStatus(message.status) : undefined,
    metadata: { custom: { durable: message } },
  };
}

function sdkStatus(status: AssistantMessageResponse["status"]): ThreadMessageLike["status"] {
  switch (status) {
    case "Generating": return { type: "running" };
    case "Complete": return { type: "complete", reason: "stop" };
    case "Stopped": return { type: "incomplete", reason: "cancelled" };
    case "Failed": return { type: "incomplete", reason: "error" };
  }
}

export interface AssistantRuntimeOptions {
  scope: AssistantScope;
  conversationId: string | null;
  enabled: boolean;
}

/** UI reutilizable: datos raw de Query, estado efímero y acciones con cuerpos/versiones explícitos. */
export function useAssistantRuntime({ scope, conversationId, enabled }: AssistantRuntimeOptions) {
  const client = useQueryClient();
  const identity = useMemo(() => ({ access: scope.access, tenantId: scope.tenantId, userId: scope.userId }), [scope.access, scope.tenantId, scope.userId]);
  const root = useMemo(() => assistantQueryKeyRoot(identity), [identity]);
  const turnKey = useMemo(() => [...root, "turn", conversationId] as const, [root, conversationId]);
  const detailKey = useMemo(() => assistantConversationQueryKey(identity, conversationId ?? ""), [identity, conversationId]);
  const lifetime = useMemo(() => new AssistantLifetime(client, [...root, "lifetime", conversationId]), [client, root, conversationId]);
  const active = useSyncExternalStore(lifetime.subscribe, lifetime.getSnapshot, lifetime.getSnapshot) && enabled;
  const subscribeCache = (listener: () => void) => client.getQueryCache().subscribe(listener);
  const readTurn = () => client.getQueryData<AssistantTurnState>(turnKey) ?? null;
  const turn = useSyncExternalStore(subscribeCache, readTurn, readTurn);
  const readerRef = useRef<{ controller: AbortController; operation: SendOperation } | null>(null);
  const lastOperation = useRef<SendOperation | null>(null);
  const flightRef = useRef<SendOperation | null>(null);
  const stopBeforeStart = useRef<{ resolve: () => void; reject: (error: unknown) => void } | null>(null);
  const owner = useMemo(() => ({ lifetime, id: globalThis.crypto.randomUUID() }), [lifetime]).id;
  useEffect(() => {
    if (enabled) lifetime.attach();
    else lifetime.close();
    return () => {
      lifetime.close();
      client.removeQueries({ queryKey: turnKey, exact: true });
      const privateDetail = client.getQueryCache().find({ queryKey: detailKey, exact: true });
      // Otro consumidor activo de la misma ficha conserva su caché. El módulo
      // quita su ficha al salir; no toca otra conversación ni otro scope.
      if (privateDetail && privateDetail.getObserversCount() <= 1) client.removeQueries({ queryKey: detailKey, exact: true });
      stopBeforeStart.current?.reject(new DOMException("", "AbortError"));
      stopBeforeStart.current = null;
    };
  }, [client, lifetime, turnKey, detailKey, enabled]);
  useEffect(() => {
    if (active) return;
    lastOperation.current = null;
    flightRef.current = null;
    readerRef.current = null;
    stopBeforeStart.current?.reject(new DOMException("", "AbortError"));
    stopBeforeStart.current = null;
  }, [active]);
  const pendingMutations = useIsMutating({ predicate: (mutation) => mutation.meta?.assistantOwner === owner });

  const readDetail = async (id: string, querySignal: AbortSignal, ownerLifetime = lifetime, requestScope = identity) => {
    const controller = ownerLifetime.controller();
    try {
      const signal = AbortSignal.any([controller.signal, querySignal]);
      const result = await fetchAssistantConversation(requestScope, id, {}, signal);
      signal.throwIfAborted();
      ownerLifetime.assertActive();
      return result;
    } finally { ownerLifetime.release(controller); }
  };

  const state = useQuery({
    queryKey: assistantStateQueryKey(identity), enabled: active,
    queryFn: async ({ signal: querySignal }) => {
      const controller = lifetime.controller();
      try {
        const signal = AbortSignal.any([querySignal, controller.signal]);
        const result = await fetchAssistantState(identity, signal);
        signal.throwIfAborted();
        lifetime.assertActive();
        return result;
      } finally { lifetime.release(controller); }
    },
    meta: { blocksView: true, silent: true },
  });
  const detail = useQuery({
    queryKey: detailKey,
    enabled: active && conversationId !== null,
    queryFn: ({ signal }) => readDetail(conversationId!, signal),
    refetchInterval: (query) => query.state.data?.messages.items.some((message) => message.status === "Generating") ? 1_000 : false,
    meta: { blocksView: true, silent: true },
  });

  const stopMutation = useIdempotentMutation(async (operation: StopOperation, key) => {
    operation.idempotencyKey ??= key;
    const controller = operation.lifetime.controller();
    try {
      await stopAssistantTurn(operation.scope, operation.conversationId, operation.turnId, {}, operation.idempotencyKey, controller.signal);
      controller.signal.throwIfAborted();
      operation.lifetime.assertActive();
      const reader = readerRef.current;
      const current = client.getQueryData<AssistantTurnState>([...assistantQueryKeyRoot(operation.scope), "turn", operation.conversationId]);
      if (current?.start?.turnId === operation.turnId) {
        if (reader?.operation.lifetime === operation.lifetime) reader.controller.abort();
        await reconcile(operation, controller.signal);
      }
    } finally { operation.lifetime.release(controller); }
  }, { meta: { assistantOwner: owner }, sameOperation: (a, b) => a.lifetime === b.lifetime && a.turnId === b.turnId });

  const reconcile = async (operation: Pick<SendOperation, "scope" | "conversationId" | "lifetime">, signal: AbortSignal): Promise<AssistantConversationResponse> => {
    signal.throwIfAborted();
    operation.lifetime.assertActive();
    const current = client.getQueryData<AssistantTurnState>(turnKey);
    if (current && isAssistantTurnPending(current)) client.setQueryData(turnKey, { ...current, phase: "reconciling" });
    // Una señal nueva permite la relectura después de abortar el lector por Detener.
    const result = await waitForAssistantTerminal(client, assistantConversationQueryKey(operation.scope, operation.conversationId),
      (querySignal) => readDetail(operation.conversationId, querySignal, operation.lifetime, operation.scope), signal);
    signal.throwIfAborted();
    operation.lifetime.assertActive();
    const message = result.messages.items.find((item) => item.id === current?.start?.assistantMessageId)
      ?? result.messages.items.findLast((item) => item.role === "assistant");
    if (current && message) client.setQueryData(turnKey, { ...current, text: message.text, phase: message.status === "Generating" ? "reconciling" : message.status });
    await client.invalidateQueries({ queryKey: assistantStateQueryKey(operation.scope) });
    return result;
  };

  const sendMutation = useIdempotentMutation(async (operation: SendOperation, key) => {
    operation.idempotencyKey ??= key;
    operation.lifetime.assertActive();
    if (lastOperation.current !== operation) throw new ApiError(409, { code: "Assistant.Runtime.OperationExpired" });
    if (flightRef.current && flightRef.current.operationId !== operation.operationId && flightRef.current.lifetime === operation.lifetime) {
      throw new ApiError(409, { code: "Assistant.Runtime.SendDisabled" });
    }
    flightRef.current = operation;
    if (operation.admitted) {
      const controller = operation.lifetime.controller();
      try { return await reconcile(operation, controller.signal); }
      finally {
        operation.lifetime.release(controller);
        if (flightRef.current === operation) flightRef.current = null;
      }
    }
    const controller = operation.lifetime.controller();
    const reconciliation = operation.lifetime.controller();
    readerRef.current = { controller, operation };
    const previous = client.getQueryData<AssistantTurnState>(turnKey);
    client.setQueryData(turnKey, previous?.request === operation.request && previous.start
      ? { ...previous, phase: "reconciling" } : beginAssistantTurn(operation.conversationId, operation.request));
    let admitted = false;
    try {
      const response = await sendAssistantMessageResponse(operation.scope, operation.conversationId, operation.request, operation.idempotencyKey, controller.signal);
      admitted = true;
      operation.admitted = true;
      for await (const event of decodeAssistantStream(response, controller.signal)) {
        controller.signal.throwIfAborted();
        operation.lifetime.assertActive();
        client.setQueryData<AssistantTurnState>(turnKey, (previous) => previous ? reduceAssistantTurn(previous, event) : previous);
        if (event.event === "start" && stopBeforeStart.current) {
          const waiting = stopBeforeStart.current;
          stopBeforeStart.current = null;
          // El error queda en la mutación de Stop y en el Promise del caller; no se pierde la lectura.
          void stopMutation.mutateAsync({ scope: operation.scope, conversationId: operation.conversationId, turnId: event.data.turnId, lifetime: operation.lifetime }).then(waiting.resolve, waiting.reject);
        }
      }
    } catch (error) {
      reconciliation.signal.throwIfAborted();
      operation.lifetime.assertActive();
      if (!admitted) {
        const current = client.getQueryData<AssistantTurnState>(turnKey);
        if (current) client.setQueryData(turnKey, { ...current, phase: "Failed" });
        operation.lifetime.release(reconciliation);
        if (flightRef.current === operation) flightRef.current = null;
        stopBeforeStart.current?.reject(error);
        stopBeforeStart.current = null;
        throw error;
      }
      // EOF, protocolo, red o cancelación del lector después de admitir: sólo releer, nunca reenviar.
    } finally {
      operation.lifetime.release(controller);
      if (readerRef.current?.controller === controller) readerRef.current = null;
    }
    try { return await reconcile(operation, reconciliation.signal); }
    finally {
      operation.lifetime.release(reconciliation);
      if (flightRef.current === operation) flightRef.current = null;
      const waiting = stopBeforeStart.current;
      stopBeforeStart.current = null;
      waiting?.reject(new ApiError(409, { code: "Assistant.Turn.NotGenerating" }));
    }
  }, { meta: { assistantOwner: owner }, sameOperation: (a, b) => a.operationId === b.operationId });

  const durableGenerating = detail.data?.messages.items.some((message) => message.status === "Generating") === true;
  const sendErrorCode = sendMutation.variables?.lifetime === lifetime ? sendMutation.error?.code ?? turn?.error?.code : undefined;
  const blockedCode = sendErrorCode && ["Assistant.Limit.DailyReached", "Assistant.Limit.MonthlyReached",
    "Assistant.Settings.NotConfigured", "Assistant.Notice.AcceptanceRequired", "Legal.AcceptanceRequired"].includes(sendErrorCode)
    ? sendErrorCode : null;
  const canSend = active && !!conversationId && !!detail.data && state.data?.configured === true && state.data.noticeAccepted
    && state.data.remainingMessages !== 0 && !pendingMutations && !isAssistantTurnPending(turn)
    && !durableGenerating && !blockedCode;

  const send = (request: SendAssistantMessageRequest) => {
    if (!canSend || !conversationId || flightRef.current?.lifetime === lifetime) return Promise.reject(new ApiError(409, { code: "Assistant.Runtime.SendDisabled" }));
    const operation: SendOperation = {
      operationId: globalThis.crypto.randomUUID(), scope: identity, conversationId, lifetime,
      request: { ...request, attachmentIds: request.attachmentIds ? [...request.attachmentIds] : request.attachmentIds },
    };
    lastOperation.current = operation;
    flightRef.current = operation;
    stopMutation.reset();
    return sendMutation.mutateAsync(operation);
  };
  const retryNetwork = () => {
    const operation = lastOperation.current;
    if (!operation || operation.lifetime !== lifetime || !(sendMutation.error instanceof ApiError) || !sendMutation.error.isNetworkError) {
      return Promise.reject(new ApiError(409, { code: "Assistant.Runtime.NoNetworkRetry" }));
    }
    return sendMutation.mutateAsync(operation);
  };
  const stop = (): Promise<void> => {
    lifetime.assertActive();
    const current = readTurn();
    if (current?.start && isAssistantTurnPending(current)) {
      return stopMutation.mutateAsync({ scope: identity, conversationId: current.conversationId, turnId: current.start.turnId, lifetime });
    }
    if (current?.phase === "sending" && !stopBeforeStart.current) {
      return new Promise<void>((resolve, reject) => { stopBeforeStart.current = { resolve, reject }; });
    }
    return Promise.reject(new ApiError(409, { code: "Assistant.Turn.NotGenerating" }));
  };
  const retryFailed = (request: SendAssistantMessageRequest) => {
    const durableFailed = detail.data?.messages.items.findLast((message) => message.role === "assistant")?.status === "Failed";
    if ((turn && turn.phase !== "Failed") || (!turn?.error && !durableFailed)) {
      return Promise.reject(new ApiError(409, { code: "Assistant.Runtime.NoFailedRetry" }));
    }
    return send(request);
  };
  const refreshState = async () => {
    lifetime.assertActive();
    const result = await state.refetch();
    lifetime.assertActive();
    if (result.isSuccess) sendMutation.reset();
    return result;
  };

  const messages: Array<AssistantMessageResponse | ThreadMessageLike> = (active ? detail.data?.messages.items ?? [] : []).map((message) => {
    if (message.id !== turn?.start?.assistantMessageId || message.status !== "Generating") return message;
    return { id: message.id, role: message.role, content: turn.text || message.text, createdAt: parseUtcInstant(message.createdAtUtc),
      status: sdkStatus(isAssistantTurnPending(turn) ? "Generating" : turn.phase === "Stopped" ? "Stopped" : turn.phase === "Failed" ? "Failed" : "Complete"),
      metadata: { custom: { durable: message } } };
  });
  if (active && turn?.start) {
    if (!messages.some((message) => message.id === turn.start?.userMessageId)) messages.push({ id: turn.start.userMessageId, role: "user", content: turn.request.text ?? "" });
    if (!messages.some((message) => message.id === turn.start?.assistantMessageId)) messages.push(turn.result?.message ?? {
      id: turn.start.assistantMessageId, role: "assistant", content: turn.text,
      status: sdkStatus(isAssistantTurnPending(turn) ? "Generating" : turn.phase === "Stopped" ? "Stopped" : turn.phase === "Failed" ? "Failed" : "Complete"),
    });
  } else if (active && turn?.result && !messages.some((message) => message.id === turn.result?.message.id)) messages.push(turn.result.message);
  const runtime = useExternalStoreRuntime({
    // La snapshot completa elimina ramas privadas anteriores al cambiar scope/conversación o clear.
    messageRepository: ExportedMessageRepository.fromArray(messages.map(convertMessage)),
    // SDK genera un placeholder propio si isRunning no tiene un tail assistant.
    // La UI usa isPending para el busy previo a start; los mensajes llevan sólo ids reales.
    messages, convertMessage, isRunning: (pendingMutations > 0 || isAssistantTurnPending(turn))
      && !!turn?.start && messages.at(-1)?.id === turn.start.assistantMessageId
      || (!turn && durableGenerating && messages.at(-1)?.role === "assistant"),
    isLoading: detail.isLoading, isDisabled: !active, isSendDisabled: !canSend,
    unstable_enableToolInvocations: false,
    onNew: async (message) => {
      const text = message.content.filter((part) => part.type === "text").map((part) => part.text).join("\n");
      await send({ text, attachmentIds: [], conversationVersion: detail.data?.conversation.version });
    },
    onCancel: stop,
    // Import limpia sólo la proyección del SDK. Nunca acepta escrituras en la API/caché.
    onImport: () => {},
  });
  useEffect(() => () => {
    // API pública: borra repository/export del objeto que ya no tiene UI.
    // El SDK no ofrece actualizar su última snapshot visible tras desmontar;
    // disable/scope sí reciben el adapter vacío durante el render montado.
    runtime.thread.import({ messages: [] });
  }, [runtime, lifetime, enabled]);

  return { runtime, state, detail, turn, canSend,
    canStop: active && isAssistantTurnPending(turn) && (!!turn?.start || turn?.phase === "sending"),
    isPending: pendingMutations > 0 || isAssistantTurnPending(turn) || durableGenerating,
    error: stopMutation.error ?? sendMutation.error ?? turn?.error ?? null,
    blockedCode, send, retryNetwork, retryFailed, stop, refreshState };
}
