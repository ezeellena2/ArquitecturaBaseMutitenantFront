import { QueryObserver, type QueryClient, type QueryKey } from "@tanstack/react-query";
import type { AssistantConversationResponse } from "@/modules/assistant/api/types";

/** Espera creciente del sondeo mientras un turno sigue pendiente (KAN-30): 1 s → 2 s → 3 s → 5 s tope. */
export const assistantPollBackoffMs = [1_000, 2_000, 3_000, 5_000] as const;

export function assistantPollDelay(attempt: number): number {
  const index = Math.min(Math.max(0, attempt), assistantPollBackoffMs.length - 1);
  return assistantPollBackoffMs[index]!;
}

/** Query.clear no cancela MutationCache: cada operación posee una señal del módulo. */
export class AssistantLifetime {
  private controllers = new Set<AbortController>();
  private listeners = new Set<() => void>();
  private unsubscribe?: () => void;
  private alive = true;
  private readonly client: QueryClient;
  private readonly key: QueryKey;

  constructor(client: QueryClient, key: QueryKey) { this.client = client; this.key = key; }

  getSnapshot = () => this.alive;
  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => { this.listeners.delete(listener); };
  };

  attach(): void {
    this.unsubscribe?.();
    this.alive = true;
    this.client.getQueryCache().build(this.client, { queryKey: this.key, gcTime: Infinity }).setData(true);
    const sentinel = this.client.getQueryCache().find({ queryKey: this.key, exact: true });
    this.unsubscribe = this.client.getQueryCache().subscribe((event) => {
      if (event.type === "removed" && event.query === sentinel) this.close();
    });
    for (const listener of this.listeners) listener();
  }

  assertActive(): void {
    if (!this.alive) throw new DOMException("", "AbortError");
  }

  controller(): AbortController {
    this.assertActive();
    const controller = new AbortController();
    this.controllers.add(controller);
    return controller;
  }

  release(controller: AbortController): void { this.controllers.delete(controller); }

  close(): void {
    this.alive = false;
    this.unsubscribe?.();
    this.unsubscribe = undefined;
    for (const controller of this.controllers) controller.abort();
    this.controllers.clear();
    for (const listener of this.listeners) listener();
  }
}

export function isAssistantConversationPending(conversation: AssistantConversationResponse | undefined): boolean {
  return !!conversation && (conversation.activeTurnId !== null
    || conversation.messages.items.some((message) => message.status === "Generating"));
}

/** Query sigue pendiente durante la admisión y mientras hay un mensaje Generating. */
export function waitForAssistantTerminal(
  client: QueryClient,
  queryKey: QueryKey,
  queryFn: (signal: AbortSignal) => Promise<AssistantConversationResponse>,
  signal: AbortSignal,
  isPending: (conversation: AssistantConversationResponse | undefined) => boolean = isAssistantConversationPending,
): Promise<AssistantConversationResponse> {
  signal.throwIfAborted();
  let attempts = 0;
  return new Promise((resolve, reject) => {
    const observer = new QueryObserver(client, {
      queryKey,
      queryFn: async ({ signal: querySignal }) => {
        const result = await queryFn(querySignal);
        attempts = isPending(result) ? attempts + 1 : 0;
        return result;
      },
      retry: false,
      staleTime: 0,
      refetchInterval: (query) => (isPending(query.state.data) ? assistantPollDelay(attempts - 1) : false),
      refetchIntervalInBackground: false,
      meta: { silent: true },
    });
    let unsubscribe: (() => void) | undefined;
    const cleanup = () => {
      unsubscribe?.();
      observer.destroy();
      signal.removeEventListener("abort", onAbort);
    };
    const onAbort = () => { cleanup(); reject(signal.reason); };
    signal.addEventListener("abort", onAbort, { once: true });
    unsubscribe = observer.subscribe((result) => {
      if (signal.aborted) return;
      if (result.isError && !result.isFetching) { cleanup(); reject(result.error); }
      else if (result.data && !result.isFetching && !isPending(result.data)) {
        cleanup(); resolve(result.data);
      }
    });
  });
}
