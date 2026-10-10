import { QueryObserver, type QueryClient, type QueryKey } from "@tanstack/react-query";
import type { AssistantConversationResponse } from "@/shared/api/types";

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

/** El observer de Query posee el polling; el envío sigue pendiente mientras el back dice Generating. */
export function waitForAssistantTerminal(
  client: QueryClient,
  queryKey: QueryKey,
  queryFn: (signal: AbortSignal) => Promise<AssistantConversationResponse>,
  signal: AbortSignal,
): Promise<AssistantConversationResponse> {
  signal.throwIfAborted();
  return new Promise((resolve, reject) => {
    const observer = new QueryObserver(client, {
      queryKey, queryFn: ({ signal: querySignal }) => queryFn(querySignal),
      retry: false, staleTime: 0, refetchInterval: 1_000, refetchIntervalInBackground: true,
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
      else if (result.data && !result.isFetching && !result.data.messages.items.some((message) => message.status === "Generating")) {
        cleanup(); resolve(result.data);
      }
    });
  });
}
