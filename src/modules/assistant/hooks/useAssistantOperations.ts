import { useResourceAction } from "@/shared/hooks/useResourceAction";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useIdempotentMutation } from "@/shared/api/useIdempotentMutation";
import { AssistantLifetime } from "../runtime/assistantLifetime";
import { assistantQueryKeyRoot, type AssistantScope } from "../api/assistant";

export interface AssistantOperationContext { signal: AbortSignal; key: string; assertActive: () => void }
export interface AssistantConversationOperationContext extends AssistantOperationContext { ownConversation: (id: string) => void }
interface Operation {
  id: string;
  key?: string;
  lifetime: AssistantLifetime;
  resource?: AbortController;
  execute: (context: AssistantConversationOperationContext) => Promise<void>;
}

/** Cada recorrido conserva su dueño aun cuando el Retry global ya no tiene observer. */
export function useAssistantOperations(scope: AssistantScope, generation: number) {
  const client = useQueryClient();
  const { access, tenantId, userId } = scope;
  const lifetime = useMemo(() => new AssistantLifetime(client, [...assistantQueryKeyRoot({ access, tenantId, userId }), "ui", generation]),
    [client, access, tenantId, userId, generation]);
  const active = useSyncExternalStore(lifetime.subscribe, lifetime.getSnapshot, lifetime.getSnapshot);
  const resources = useMemo(() => ({ lifetime, conversations: new Map<string, AbortController>() }), [lifetime]);
  const resourceFor = (id: string) => {
    let resource = resources.conversations.get(id);
    if (!resource) { resource = new AbortController(); resources.conversations.set(id, resource); }
    return resource;
  };
  const [failure, setFailure] = useState<{ lifetime: AssistantLifetime; error: unknown } | null>(null);
  useEffect(() => {
    lifetime.attach();
    const unsubscribe = lifetime.subscribe(() => {
      if (!lifetime.getSnapshot()) {
        for (const resource of resources.conversations.values()) resource.abort();
        resources.conversations.clear();
      }
    });
    return () => { lifetime.close(); unsubscribe(); };
  }, [lifetime, resources]);
  const action = useResourceAction<Operation>({ isCurrent: (operation) => operation.lifetime.getSnapshot() && !operation.resource?.signal.aborted });
  const mutation = useIdempotentMutation(action.guarded(async (operation: Operation, key: string) => {
    operation.lifetime.assertActive();
    operation.resource?.signal.throwIfAborted();
    operation.key ??= key;
    const controller = operation.lifetime.controller();
    const assertActive = () => { controller.signal.throwIfAborted(); operation.resource?.signal.throwIfAborted(); operation.lifetime.assertActive(); };
    try {
      setFailure(null);
      await operation.execute({
        get signal() { return operation.resource ? AbortSignal.any([controller.signal, operation.resource.signal]) : controller.signal; },
        key: operation.key, assertActive,
        ownConversation: (id) => { operation.resource ??= resourceFor(id); assertActive(); },
      });
      assertActive();
    } catch (error) {
      assertActive();
      if (error instanceof DOMException && error.name === "AbortError") throw error;
      setFailure({ lifetime: operation.lifetime, error });
      throw error;
    } finally { operation.lifetime.release(controller); }
    // P2 (E9, Asistente-Org): el límite de uso lo dice la banda arriba de la caja, con su cuenta; no se repite abajo.
  }), { meta: { ...action.meta, handlesRateLimit: true }, sameOperation: (a, b) => a.id === b.id });
  const pending = action.isPending;
  const run = (execute: Operation["execute"], conversationId?: string | null) => mutation.mutateAsync({ id: crypto.randomUUID(), lifetime, execute, resource: conversationId ? resourceFor(conversationId) : undefined });
  // Conserva la señal abortada: ni un Retry ni un callback viejo puede revivir el recurso.
  const retireConversation = (id: string) => resourceFor(id).abort();
  return { active, pending, lifetime, run, retireConversation, error: active && failure?.lifetime === lifetime ? failure.error : null };
}
