import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react";
import { createElement, type ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { ApiError } from "@/shared/api/ApiError";
import { useIdempotentMutation } from "@/shared/api/useIdempotentMutation";
import { useResourceAction } from "./useResourceAction";

describe("useResourceAction", () => {
  it("el primer envío propio queda pendiente aunque todavía no haya otro evento de la mutación", async () => {
    const client = new QueryClient();
    let finish: () => void = () => {};
    const pending = new Promise<void>((resolve) => { finish = resolve; });
    const hook = renderHook(() => {
      const action = useResourceAction<{ id: string }>({ matches: (meta) => meta?.resource === "A", isCurrent: (sent) => sent.id === "first" });
      const mutation = useIdempotentMutation(action.guarded(async () => { await pending; return true; }), { meta: { resource: "A" } });
      return { action, mutation };
    }, { wrapper: ({ children }: { children: ReactNode }) => createElement(QueryClientProvider, { client }, children) });
    let request: Promise<unknown> = Promise.resolve();
    await act(async () => { request = hook.result.current.mutation.mutateAsync({ id: "first" }); await Promise.resolve(); });
    expect(client.isMutating()).toBe(1);
    expect(hook.result.current.action.isPending).toBe(true);
    await act(async () => { finish(); await request; });
    expect(hook.result.current.action.isPending).toBe(false);
    hook.unmount(); client.clear();
  });

  it("un Retry nativo sin observer conserva las variables y avisa sólo el error final de su recurso", async () => {
    const client = new QueryClient();
    const onError = vi.fn();
    const keys: string[] = [];
    let attempts = 0;
    const hook = renderHook(() => {
      const action = useResourceAction<{ id: string }>({ matches: (meta) => meta?.resource === "A", onError });
      const mutation = useIdempotentMutation(action.guarded(async (_sent, key: string) => {
        keys.push(key); attempts++;
        throw ApiError.network();
      }), { meta: { resource: "A" } });
      return { action, mutation };
    }, { wrapper: ({ children }: { children: ReactNode }) => createElement(QueryClientProvider, { client }, children) });
    const original = { id: "first" };
    await act(async () => { await hook.result.current.mutation.mutateAsync(original).catch(() => undefined); });
    const previous = client.getMutationCache().getAll()[0]!;
    await act(async () => { await hook.result.current.mutation.mutateAsync({ id: "second" }).catch(() => undefined); });
    onError.mockClear();
    await act(async () => { await previous.execute(original).catch(() => undefined); });
    expect(attempts).toBe(3);
    expect(keys[2]).toBe(keys[0]);
    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError).toHaveBeenCalledWith(expect.any(ApiError), original);
    hook.unmount(); client.clear();
  });

  it("abandonar el borrador ignora la respuesta tardía y el Retry viejo no envía", async () => {
    const client = new QueryClient();
    const onError = vi.fn(); const send = vi.fn();
    let revision = 0; let finish!: () => void;
    const hook = renderHook(() => {
      const action = useResourceAction<{ revision: number }>({ matches: (meta) => meta?.resource === "A", isCurrent: (sent) => sent.revision === revision, onError });
      const mutation = useIdempotentMutation(action.guarded(async () => { send(); await new Promise<void>((resolve) => { finish = resolve; }); throw ApiError.network(); }), { meta: { resource: "A" } });
      return mutation;
    }, { wrapper: ({ children }: { children: ReactNode }) => createElement(QueryClientProvider, { client }, children) });
    let request!: Promise<unknown>;
    act(() => { request = hook.result.current.mutateAsync({ revision: 0 }).catch((error: unknown) => error); });
    await act(async () => { await Promise.resolve(); });
    revision++;
    await act(async () => { finish(); await request; });
    expect(onError).not.toHaveBeenCalled();
    const previous = client.getMutationCache().getAll()[0]!;
    await act(async () => { await previous.execute({ revision: 0 }).catch(() => undefined); });
    expect(send).toHaveBeenCalledTimes(1);
    hook.unmount(); client.clear();
  });
});
