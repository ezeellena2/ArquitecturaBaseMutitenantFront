import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react";
import { HttpResponse, http } from "msw";
import { createElement, type ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { server } from "@/test/mocks/server";
import { ApiError } from "./ApiError";
import { api, resetHttpClient } from "./httpClient";
import { useIdempotentMutation } from "./useIdempotentMutation";

function renderMutation<TData, TVariables>(fn: (variables: TVariables, key: string) => Promise<TData>) {
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  function Wrapper({ children }: { children: ReactNode }) {
    return createElement(QueryClientProvider, { client }, children);
  }
  const hook = renderHook(() => useIdempotentMutation(fn), { wrapper: Wrapper });
  return { ...hook, client };
}

afterEach(() => {
  resetHttpClient();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("useIdempotentMutation", () => {
  it("mantiene la misma clave tras una falla y un reintento manual", async () => {
    const keys: string[] = [];
    let attempt = 0;
    const { result, client } = renderMutation(async (_body: { name: string }, key) => {
      keys.push(key);
      attempt++;
      if (attempt === 1) throw ApiError.network();
      return { id: "created" };
    });

    await act(async () => {
      await expect(result.current.mutateAsync({ name: "Acme" })).rejects.toMatchObject({ code: "Network.Unavailable" });
    });
    await act(async () => {
      await expect(result.current.mutateAsync({ name: "Acme" })).resolves.toEqual({ id: "created" });
    });

    expect(keys).toHaveLength(2);
    expect(keys[0]).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    expect(keys[1]).toBe(keys[0]);
    client.clear();
  });

  it("renueva la clave tras un éxito", async () => {
    const keys: string[] = [];
    const { result, client } = renderMutation(async (_body: { name: string }, key) => {
      keys.push(key);
      return { id: key };
    });

    await act(async () => { await result.current.mutateAsync({ name: "Uno" }); });
    await act(async () => { await result.current.mutateAsync({ name: "Dos" }); });

    expect(keys).toHaveLength(2);
    expect(keys[1]).not.toBe(keys[0]);
    client.clear();
  });

  it("espera y reintenta Request.InProgress con la misma clave", async () => {
    vi.useFakeTimers();
    const keys: string[] = [];
    const fn = vi.fn(async (_body: { name: string }, key: string) => {
      keys.push(key);
      if (keys.length === 1) throw new ApiError(409, { code: "Request.InProgress" });
      return { id: "created" };
    });
    const { result, client } = renderMutation(fn);

    let request: Promise<{ id: string }> | undefined;
    act(() => { request = result.current.mutateAsync({ name: "Acme" }); });
    await act(async () => { await Promise.resolve(); });
    expect(fn).toHaveBeenCalledTimes(1);

    await act(async () => { await vi.advanceTimersByTimeAsync(999); });
    expect(fn).toHaveBeenCalledTimes(1);
    await act(async () => { await vi.advanceTimersByTimeAsync(1); });
    await expect(request).resolves.toEqual({ id: "created" });
    expect(keys).toHaveLength(2);
    expect(keys[1]).toBe(keys[0]);
    client.clear();
  });

  it("no reintenta un 409 que no sea Request.InProgress", async () => {
    const fn = vi.fn(async () => { throw new ApiError(409, { code: "General.ConcurrencyConflict" }); });
    const { result, client } = renderMutation(fn);

    await act(async () => {
      await expect(result.current.mutateAsync({ name: "Acme" })).rejects.toMatchObject({ code: "General.ConcurrencyConflict" });
    });
    expect(fn).toHaveBeenCalledTimes(1);
    client.clear();
  });

  it("manda la misma Idempotency-Key por httpClient en un reintento manual", async () => {
    const keys: Array<string | null> = [];
    server.use(http.post("/api/idempotent-test", ({ request }) => {
      keys.push(request.headers.get("idempotency-key"));
      return keys.length === 2
        ? HttpResponse.json({ id: "created" })
        : HttpResponse.json({ code: "General.Unavailable" }, { status: 503 });
    }));
    const { result, client } = renderMutation((body: { name: string }, key) =>
      api.post<{ id: string }>("/api/idempotent-test", body, { headers: { "Idempotency-Key": key } }));

    await act(async () => {
      await expect(result.current.mutateAsync({ name: "Acme" })).rejects.toMatchObject({ status: 503 });
    });
    await act(async () => {
      await expect(result.current.mutateAsync({ name: "Acme" })).resolves.toEqual({ id: "created" });
    });
    expect(keys).toHaveLength(2);
    expect(keys[0]).toMatch(/^[0-9a-f-]{36}$/i);
    expect(keys[1]).toBe(keys[0]);
    client.clear();
  });
});
