import { useResourceAction } from "@/shared/hooks/useResourceAction";
import { useEffect, useMemo, useRef, useSyncExternalStore } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ExportedMessageRepository, MessageNotSentError, useExternalStoreRuntime, type ExternalStoreAdapter, type ThreadMessageLike } from "@assistant-ui/react";
import type { AssistantConversationResponse, AssistantMessageResponse, SendAssistantMessageRequest } from "@/modules/assistant/api/types";
import { ApiError } from "@/shared/api/ApiError";
import { useIdempotentMutation } from "@/shared/api/useIdempotentMutation";
import { parseUtcInstant } from "@/shared/time/parseUtcInstant";
import { assistantConversationQueryKey, assistantQueryKeyRoot, assistantStateQueryKey, fetchAssistantConversation, fetchAssistantState, sendAssistantMessageResponse, stopAssistantTurn, type AssistantScope } from "../api/assistant";
import { decodeAssistantStream } from "../api/stream";
import { AssistantLifetime, isAssistantConversationPending, waitForAssistantTerminal } from "./assistantLifetime";
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
  localSend?: SendOperation;
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
  ui?: Pick<ExternalStoreAdapter<AssistantMessageResponse | ThreadMessageLike>, "onNew" | "adapters">;
}

/** UI reutilizable: datos raw de Query, estado efímero y acciones con cuerpos/versiones explícitos. */
export function useAssistantRuntime({ scope, conversationId, enabled, ui }: AssistantRuntimeOptions) {
  const client = useQueryClient();
  const identity = useMemo(() => ({ access: scope.access, tenantId: scope.tenantId, userId: scope.userId }), [scope.access, scope.tenantId, scope.userId]);
  const root = useMemo(() => assistantQueryKeyRoot(identity), [identity]);
  const turnKey = useMemo(() => [...root, "turn", conversationId] as const, [root, conversationId]);
  const detailKey = useMemo(() => assistantConversationQueryKey(identity, conversationId ?? ""), [identity, conversationId]);
  const messagesKey = useMemo(() => [...root, "messages", conversationId] as const, [root, conversationId]);
  // Cada activación es un ciclo nuevo: una operación vieja nunca revive con el módulo.
  const lifetime = useMemo(() => new AssistantLifetime(client, [...root, "lifetime", conversationId, enabled]), [client, root, conversationId, enabled]);
  const active = useSyncExternalStore(lifetime.subscribe, lifetime.getSnapshot, lifetime.getSnapshot) && enabled;
  const subscribeCache = (listener: () => void) => client.getQueryCache().subscribe(listener);
  const readTurn = () => client.getQueryData<AssistantTurnState>(turnKey) ?? null;
  const turn = useSyncExternalStore(subscribeCache, readTurn, readTurn);
  const readMessages = () => client.getQueryData<AssistantMessageResponse[]>(messagesKey) ?? null;
  const pagedMessages = useSyncExternalStore(subscribeCache, readMessages, readMessages);
  const readerRef = useRef<{ controller: AbortController; operation: SendOperation } | null>(null);
  const lastOperation = useRef<SendOperation | null>(null);
  const flightRef = useRef<SendOperation | null>(null);
  // Los callbacks de UI no van en variables de MutationCache; vencen con su
  // dueño y sólo sobreviven un error de red para el Retry del mismo POST.
  const admissions = useRef(new Map<string, { lifetime: AssistantLifetime; callback: () => void }>());
  const reconciliationControllers = useRef(new Set<AbortController>());
  const stopBeforeStart = useRef<{ resolve: () => void; reject: (error: unknown) => void } | null>(null);
  useEffect(() => {
    const ownedAdmissions = admissions.current;
    if (enabled) lifetime.attach();
    else lifetime.close();
    return () => {
      lifetime.close();
      for (const [id, admission] of ownedAdmissions) if (admission.lifetime === lifetime) ownedAdmissions.delete(id);
      client.removeQueries({ queryKey: turnKey, exact: true });
      client.removeQueries({ queryKey: messagesKey, exact: true });
      const privateDetail = client.getQueryCache().find({ queryKey: detailKey, exact: true });
      // Otro consumidor activo de la misma ficha conserva su caché. El módulo
      // quita su ficha al salir; no toca otra conversación ni otro scope.
      if (privateDetail && privateDetail.getObserversCount() <= 1) client.removeQueries({ queryKey: [...root, "detail", conversationId ?? ""] });
      stopBeforeStart.current?.reject(new DOMException("", "AbortError"));
      stopBeforeStart.current = null;
    };
  }, [client, lifetime, turnKey, detailKey, messagesKey, root, conversationId, enabled]);
  useEffect(() => {
    if (active) return;
    admissions.current.clear();
    lastOperation.current = null;
    flightRef.current = null;
    readerRef.current = null;
    stopBeforeStart.current?.reject(new DOMException("", "AbortError"));
    stopBeforeStart.current = null;
  }, [active]);
  const sendAction = useResourceAction<SendOperation>({ isCurrent: (operation) => operation.lifetime.getSnapshot() });
  const stopAction = useResourceAction<StopOperation>({ isCurrent: (operation) => operation.lifetime.getSnapshot() });
  const pendingMutations = Number(sendAction.isPending) + Number(stopAction.isPending);
  const localSendOwner = (ownerLifetime: AssistantLifetime) => lastOperation.current?.lifetime === ownerLifetime ? lastOperation.current : undefined;

  const readDetail = async (id: string, querySignal: AbortSignal, ownerLifetime = lifetime, requestScope = identity) => {
    const controller = ownerLifetime.controller();
    try {
      const signal = AbortSignal.any([controller.signal, querySignal]);
      const result = await fetchAssistantConversation(requestScope, id, {}, signal);
      signal.throwIfAborted();
      ownerLifetime.assertActive();
      // El contrato ordena desde el primer mensaje. Cada página es un DTO real;
      // la proyección para el SDK es una lista aparte y nunca sustituye la ficha.
      const pages = [result];
      const cursors = new Set<string>();
      let page = result;
      while (page.messages.hasMore && page.messages.nextCursor) {
        const cursor = page.messages.nextCursor;
        if (cursors.has(cursor)) throw new ApiError(502, { code: "Assistant.Runtime.InvalidCursor" });
        cursors.add(cursor);
        page = await client.fetchQuery({
          queryKey: assistantConversationQueryKey(requestScope, id, { cursor }), staleTime: 0,
          queryFn: async ({ signal: pageSignal }) => {
            const combined = AbortSignal.any([signal, pageSignal]);
            const next = await fetchAssistantConversation(requestScope, id, { cursor }, combined);
            combined.throwIfAborted();
            ownerLifetime.assertActive();
            return next;
          }, meta: { silent: true },
        });
        signal.throwIfAborted();
        ownerLifetime.assertActive();
        pages.push(page);
      }
      const unique = new Map(pages.flatMap((item) => item.messages.items).map((message) => [message.id, message]));
      client.setQueryData([...assistantQueryKeyRoot(requestScope), "messages", id], [...unique.values()]);
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
    // Un State revocado vuelve al núcleo; no bloquea todo el acceso.
    meta: { silent: true },
  });
  const detail = useQuery({
    queryKey: detailKey,
    staleTime: 0,
    enabled: active && conversationId !== null && state.data?.noticeAccepted === true,
    queryFn: ({ signal }) => readDetail(conversationId!, signal),
    refetchInterval: (query) => isAssistantConversationPending(query.state.data) ? 1_000 : false,
    meta: { blocksView: true, silent: true },
  });

  async function reconcile(operation: SendOperation | StopOperation, signal: AbortSignal): Promise<AssistantConversationResponse> {
    const expectedOwner = "operationId" in operation ? operation : operation.localSend;
    const controller = operation.lifetime.controller();
    reconciliationControllers.current.add(controller);
    const reconciliationSignal = AbortSignal.any([signal, controller.signal]);
    const assertOwner = () => {
      reconciliationSignal.throwIfAborted();
      operation.lifetime.assertActive();
      if (localSendOwner(operation.lifetime) !== expectedOwner) throw new DOMException("", "AbortError");
    };
    try {
      assertOwner();
      const operationTurnKey = [...assistantQueryKeyRoot(operation.scope), "turn", operation.conversationId];
      const current = client.getQueryData<AssistantTurnState>(operationTurnKey);
      if (current && isAssistantTurnPending(current)) client.setQueryData(operationTurnKey, { ...current, phase: "reconciling" });
      // Una señal nueva permite la relectura después de abortar el lector por Detener.
      const result = await waitForAssistantTerminal(client, assistantConversationQueryKey(operation.scope, operation.conversationId), async (querySignal) => {
        assertOwner();
        const result = await readDetail(operation.conversationId, querySignal, operation.lifetime, operation.scope);
        assertOwner();
        return result;
      }, reconciliationSignal);
      assertOwner();
      const allMessages = client.getQueryData<AssistantMessageResponse[]>([...assistantQueryKeyRoot(operation.scope), "messages", operation.conversationId]) ?? result.messages.items;
      const message = allMessages.find((item) => item.id === current?.start?.assistantMessageId)
        ?? allMessages.findLast((item) => item.role === "assistant");
      if (current && message) client.setQueryData(operationTurnKey, { ...current, text: message.text, phase: message.status === "Generating" ? "reconciling" : message.status });
      await client.invalidateQueries({ queryKey: assistantStateQueryKey(operation.scope) });
      assertOwner();
      return result;
    } finally {
      reconciliationControllers.current.delete(controller);
      operation.lifetime.release(controller);
    }
  }

  const performStop = async (operation: StopOperation, key: string) => {
    operation.idempotencyKey ??= key;
    const controller = operation.lifetime.controller();
    try {
      await stopAssistantTurn(operation.scope, operation.conversationId, operation.turnId, {}, operation.idempotencyKey, controller.signal);
      controller.signal.throwIfAborted();
      operation.lifetime.assertActive();
      if (localSendOwner(operation.lifetime) !== operation.localSend) return;
      const reader = readerRef.current;
      const current = client.getQueryData<AssistantTurnState>([...assistantQueryKeyRoot(operation.scope), "turn", operation.conversationId]);
      const durable = client.getQueryData<AssistantConversationResponse>(assistantConversationQueryKey(operation.scope, operation.conversationId));
      // Un Retry tardío conserva su ruta/clave, pero no cancela ni reconcilia otro turno.
      const localPending = isAssistantTurnPending(current);
      if (localPending && current?.start) {
        if (current.start.turnId !== operation.turnId) return;
      } else if (localPending && flightRef.current?.lifetime === operation.lifetime) {
        if (flightRef.current !== operation.localSend) return;
      } else if (durable?.activeTurnId && durable.activeTurnId !== operation.turnId) return;
      if (reader?.operation.lifetime === operation.lifetime
        && (current?.start?.turnId === operation.turnId || reader.operation === operation.localSend)) reader.controller.abort();
      await reconcile(operation, controller.signal);
    } catch (error) {
      operation.lifetime.assertActive();
      if (localSendOwner(operation.lifetime) !== operation.localSend) throw new DOMException("", "AbortError");
      throw error;
    } finally { operation.lifetime.release(controller); }
  };
  const stopMutation = useIdempotentMutation((operation: StopOperation, key) => stopAction.guarded(performStop)(operation, key), { meta: { ...stopAction.meta, handlesError: true }, sameOperation: (a, b) => a.lifetime === b.lifetime && a.turnId === b.turnId });

  const performSend = async (operation: SendOperation, key: string) => {
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
    // Cancelar por Query antes de abrir otro envío evita que una relectura del
    // dueño anterior publique datos o errores tardíos sobre la ficha actual.
    await client.cancelQueries({ queryKey: assistantConversationQueryKey(operation.scope, operation.conversationId), exact: true });
    operation.lifetime.assertActive();
    if (lastOperation.current !== operation) throw new DOMException("", "AbortError");
    const controller = operation.lifetime.controller();
    const reconciliation = operation.lifetime.controller();
    readerRef.current = { controller, operation };
    const previous = client.getQueryData<AssistantTurnState>(turnKey);
    client.setQueryData(turnKey, previous?.request === operation.request && previous.start
      ? { ...previous, phase: "reconciling" } : beginAssistantTurn(operation.conversationId, operation.request));
    let admitted = false;
    try {
      const response = await sendAssistantMessageResponse(operation.scope, operation.conversationId, operation.request, operation.idempotencyKey, controller.signal);
      controller.signal.throwIfAborted();
      operation.lifetime.assertActive();
      admitted = true;
      operation.admitted = true;
      const admission = admissions.current.get(operation.operationId);
      admissions.current.delete(operation.operationId);
      admission?.callback();
      for await (const event of decodeAssistantStream(response, controller.signal)) {
        controller.signal.throwIfAborted();
        operation.lifetime.assertActive();
        client.setQueryData<AssistantTurnState>(turnKey, (previous) => previous ? reduceAssistantTurn(previous, event) : previous);
        if (event.event === "start" && stopBeforeStart.current) {
          const waiting = stopBeforeStart.current;
          stopBeforeStart.current = null;
          // El error queda en la mutación de Stop y en el Promise del caller; no se pierde la lectura.
          void stopMutation.mutateAsync({ scope: operation.scope, conversationId: operation.conversationId, turnId: event.data.turnId, lifetime: operation.lifetime, localSend: operation }).then(waiting.resolve, waiting.reject);
        }
      }
    } catch (error) {
      reconciliation.signal.throwIfAborted();
      operation.lifetime.assertActive();
      if (!admitted) {
        if (!(error instanceof ApiError) || !error.isNetworkError) admissions.current.delete(operation.operationId);
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
  };
  const sendMutation = useIdempotentMutation((operation: SendOperation, key) => sendAction.guarded(performSend)(operation, key), { meta: { ...sendAction.meta, handlesError: true }, sameOperation: (a, b) => a.operationId === b.operationId });

  const durableMessages = pagedMessages ?? detail.data?.messages.items ?? [];
  const durableGenerating = durableMessages.some((message) => message.status === "Generating");
  const durablePending = isAssistantConversationPending(detail.data) || durableGenerating;
  const activeTurnId = detail.data?.activeTurnId;
  // useMutation conserva el último resultado al cambiar las props. El error
  // pertenece al scope/conversación de su operación, igual que sus datos privados.
  const sendError = active && sendMutation.variables?.lifetime === lifetime ? sendMutation.error : null;
  const stopError = active && stopMutation.variables?.lifetime === lifetime
    && !(stopMutation.error instanceof DOMException && stopMutation.error.name === "AbortError") ? stopMutation.error : null;
  const sendErrorCode = active ? sendError?.code ?? turn?.error?.code : undefined;
  const blockedCode = sendErrorCode && ["Assistant.Limit.DailyReached", "Assistant.Limit.MonthlyReached",
    "Assistant.Settings.NotConfigured", "Assistant.Notice.AcceptanceRequired", "Legal.AcceptanceRequired"].includes(sendErrorCode)
    ? sendErrorCode : null;
  const canSend = active && !!conversationId && !!detail.data && state.data?.configured === true && state.data.noticeAccepted
    && state.data.remainingMessages !== 0 && state.data.monthlyBudgetProgress?.status !== "LimitReached" && !pendingMutations && !isAssistantTurnPending(turn)
    && !durablePending && !blockedCode;

  const send = (request: SendAssistantMessageRequest, onAdmitted?: () => void) => {
    if (!lifetime.getSnapshot() || !canSend || !conversationId || flightRef.current?.lifetime === lifetime) return Promise.reject(new ApiError(409, { code: "Assistant.Runtime.SendDisabled" }));
    const operation: SendOperation = {
      operationId: globalThis.crypto.randomUUID(), scope: identity, conversationId, lifetime,
      request: { ...request, attachmentIds: request.attachmentIds ? [...request.attachmentIds] : request.attachmentIds },
    };
    lastOperation.current = operation;
    admissions.current.clear();
    if (onAdmitted) admissions.current.set(operation.operationId, { lifetime, callback: onAdmitted });
    for (const controller of reconciliationControllers.current) controller.abort();
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
    // El dueño viaja con Stop: un Retry no captura el envío que esté activo después.
    const localSend = localSendOwner(lifetime);
    if (current?.start && isAssistantTurnPending(current)) {
      return stopMutation.mutateAsync({ scope: identity, conversationId: current.conversationId, turnId: current.start.turnId, lifetime, localSend });
    }
    if (conversationId && activeTurnId) {
      return stopMutation.mutateAsync({ scope: identity, conversationId, turnId: activeTurnId, lifetime, localSend });
    }
    if (current?.phase === "sending" && !stopBeforeStart.current) {
      return new Promise<void>((resolve, reject) => { stopBeforeStart.current = { resolve, reject }; });
    }
    return Promise.reject(new ApiError(409, { code: "Assistant.Turn.NotGenerating" }));
  };
  const retryFailed = (request: SendAssistantMessageRequest) => {
    const durableFailed = durableMessages.findLast((message) => message.role === "assistant")?.status === "Failed";
    if ((turn && turn.phase !== "Failed") || (!turn?.error && !durableFailed)) {
      return Promise.reject(new ApiError(409, { code: "Assistant.Runtime.NoFailedRetry" }));
    }
    return send(request);
  };
  const refreshState = async () => {
    lifetime.assertActive();
    const result = await state.refetch();
    lifetime.assertActive();
    if (result.isSuccess) {
      const recovered = (code: string | undefined) => code === "Assistant.Notice.AcceptanceRequired" && result.data.noticeAccepted
        || code === "Assistant.Settings.NotConfigured" && result.data.configured
        || code === "Assistant.Limit.DailyReached" && result.data.remainingMessages != null && result.data.remainingMessages > 0;
      if (recovered(sendError?.code)) sendMutation.reset();
      client.setQueryData<AssistantTurnState>(turnKey, (current) => {
        return current && recovered(current.error?.code) ? { ...current, error: undefined } : current;
      });
    }
    return result;
  };

  const messages: Array<AssistantMessageResponse | ThreadMessageLike> = (active ? durableMessages : []).map((message) => {
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
    isLoading: detail.isLoading, isDisabled: !active, isSendDisabled: !canSend && (!ui || conversationId !== null),
    unstable_enableToolInvocations: false,
    adapters: ui?.adapters,
    onNew: ui?.onNew ?? (async (message) => {
      if (message.attachments?.length) throw new MessageNotSentError();
      const text = message.content.filter((part) => part.type === "text").map((part) => part.text).join("\n");
      await send({ text, attachmentIds: [], conversationVersion: detail.data?.conversation.version });
    }),
    // La mutación ya publica su error en la UI; evita que el SDK vuelva a
    // registrarlo (incluido el ProblemDetails) como un rechazo sin manejar.
    onCancel: async () => { await stop().catch(() => undefined); },
    // Import limpia sólo la proyección del SDK. Nunca acepta escrituras en la API/caché.
    onImport: () => {},
  });
  useEffect(() => () => {
    // API pública: borra repository/export del objeto que ya no tiene UI.
    // El SDK no ofrece actualizar su última snapshot visible tras desmontar;
    // disable/scope sí reciben el adapter vacío durante el render montado.
    runtime.thread.import({ messages: [] });
  }, [runtime, lifetime, enabled]);

  return { runtime, state, detail, turn, messages: active ? durableMessages : [], canSend,
    canStop: active && (!!activeTurnId || isAssistantTurnPending(turn) && (!!turn?.start || turn?.phase === "sending")),
    isPending: active && (pendingMutations > 0 || isAssistantTurnPending(turn) || durablePending),
    error: active ? stopError ?? sendError ?? turn?.error ?? null : null,
    blockedCode, send, retryNetwork, retryFailed, stop, refreshState };
}
