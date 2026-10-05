import { MutationCache, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react";
import { HttpResponse, http } from "msw";
import { createElement, type ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { server } from "@/test/mocks/server";
import { ApiError } from "./ApiError";
import { api, resetHttpClient } from "./httpClient";
import { useIdempotentMutation } from "./useIdempotentMutation";

function renderMutation<TData, TVariables>(fn: (variables: TVariables, key: string) => Promise<TData>, sameOperation?: (previous: TVariables, next: TVariables) => boolean) {
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  function Wrapper({ children }: { children: ReactNode }) {
    return createElement(QueryClientProvider, { client }, children);
  }
  const hook = renderHook(() => useIdempotentMutation(fn, { sameOperation }), { wrapper: Wrapper });
  return { ...hook, client };
}

afterEach(() => {
  resetHttpClient();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe("useIdempotentMutation", () => {
  it.each(["network", "server"] as const)("sameOperation conserva la clave para %s y la renueva al corregir el cuerpo", async (failure) => {
    const keys: string[] = [];
    const { result, client } = renderMutation(async (_body: { email: string }, key) => {
      keys.push(key);
      throw failure === "network" ? ApiError.network() : new ApiError(503, { code: "General.Unavailable" });
    }, (previous, next) => previous.email === next.email);
    for (const email of ["first@example.test", "first@example.test", "second@example.test", "second@example.test"]) {
      await act(async () => { await result.current.mutateAsync({ email }).catch(() => undefined); });
    }
    expect(keys).toHaveLength(4);
    expect(keys[1]).toBe(keys[0]);
    expect(keys[2]).not.toBe(keys[0]);
    expect(keys[3]).toBe(keys[2]);
    client.clear();
  });

  it("sameOperation puede separar un recorrido abandonado aunque el cuerpo sea igual", async () => {
    const keys: string[] = [];
    const { result, client } = renderMutation(async (_operation: { email: string; revision: number }, key) => {
      keys.push(key);
      throw ApiError.network();
    }, (previous, next) => previous.email === next.email && previous.revision === next.revision);
    await act(async () => { await result.current.mutateAsync({ email: "first@example.test", revision: 0 }).catch(() => undefined); });
    await act(async () => { await result.current.mutateAsync({ email: "first@example.test", revision: 1 }).catch(() => undefined); });
    expect(keys[1]).not.toBe(keys[0]);
    client.clear();
  });

  it.each([200, 400, 422])("sameOperation renueva la clave tras una respuesta definitiva %i aun con el mismo cuerpo", async (status) => {
    const keys: string[] = [];
    const { result, client } = renderMutation(async (_body: { email: string }, key) => {
      keys.push(key);
      if (status !== 200) throw new ApiError(status, { code: "Validation.Failed" });
      return { id: "created" };
    }, (previous, next) => previous.email === next.email);
    for (let attempt = 0; attempt < 2; attempt++) {
      await act(async () => { await result.current.mutateAsync({ email: "first@example.test" }).catch(() => undefined); });
    }
    expect(keys).toHaveLength(2);
    expect(keys[1]).not.toBe(keys[0]);
    client.clear();
  });

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

  it.each([400, 422])("renueva la clave tras un %i definitivo para permitir corregir el cuerpo", async (status) => {
    const keys: string[] = [];
    const bodies: string[] = [];
    const { result, client } = renderMutation(async (body: { name: string }, key) => {
      keys.push(key);
      bodies.push(body.name);
      if (bodies.length === 1) throw new ApiError(status, { code: "Validation.Failed" });
      return { id: "created" };
    });

    await act(async () => {
      await expect(result.current.mutateAsync({ name: "Incorrecto" })).rejects.toMatchObject({ status });
    });
    await act(async () => {
      await expect(result.current.mutateAsync({ name: "Corregido" })).resolves.toEqual({ id: "created" });
    });

    expect(bodies).toEqual(["Incorrecto", "Corregido"]);
    expect(keys[1]).not.toBe(keys[0]);
    client.clear();
  });

  it.each([false, true])("espera y reintenta Request.InProgress con la misma clave (sameOperation=%s)", async (compareOperation) => {
    vi.useFakeTimers();
    const keys: string[] = [];
    const fn = vi.fn(async (_body: { name: string }, key: string) => {
      keys.push(key);
      if (keys.length === 1) throw new ApiError(409, { code: "Request.InProgress" });
      return { id: "created" };
    });
    const { result, client } = renderMutation(fn, compareOperation ? (previous, next) => previous.name === next.name : undefined);

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

  it("limita Request.InProgress a treinta reintentos", async () => {
    vi.useFakeTimers();
    const keys: string[] = [];
    const fn = vi.fn(async (_body: { name: string }, key: string) => {
      keys.push(key);
      if (keys.length <= 31) throw new ApiError(409, { code: "Request.InProgress", retryAfter: 1 });
      return { id: "unexpected" };
    });
    const { result, client } = renderMutation(fn);
    let request: Promise<{ id: string }> | undefined;
    act(() => { request = result.current.mutateAsync({ name: "Acme" }); });
    const outcome = request!.then(() => "resolved", (error: unknown) =>
      error instanceof ApiError ? error.code : "unexpected-error");

    await act(async () => { await vi.advanceTimersByTimeAsync(31_000); });
    expect(await outcome).toBe("Request.InProgress");
    expect(fn).toHaveBeenCalledTimes(31);
    expect(new Set(keys).size).toBe(1);
    client.clear();
  });

  it.each([false, true])("cancela la espera y no reintenta después de desmontar el formulario (sameOperation=%s)", async (compareOperation) => {
    vi.useFakeTimers();
    const fn = vi.fn(async () => {
      if (fn.mock.calls.length === 1) throw new ApiError(409, { code: "Request.InProgress", retryAfter: 1 });
      return { id: "unexpected" };
    });
    const hook = renderMutation(fn, compareOperation ? () => true : undefined);
    let request: Promise<{ id: string }> | undefined;
    act(() => { request = hook.result.current.mutateAsync({ name: "Acme" }); });
    const outcome = request!.then(() => "resolved", (error: unknown) =>
      error !== null && typeof error === "object" && "name" in error ? error.name : "unexpected-error");
    await act(async () => { await Promise.resolve(); });
    expect(fn).toHaveBeenCalledTimes(1);

    hook.unmount();
    await act(async () => { await vi.advanceTimersByTimeAsync(1_000); });
    expect(fn).toHaveBeenCalledTimes(1);
    expect(await outcome).toBe("AbortError");
    hook.client.clear();
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

  // F2: un alta que muestra su error en pantalla (el ingreso) se lo dice al manejo global con meta.handlesError.
  it("lleva la meta de la pantalla a la mutación", async () => {
    const seen: unknown[] = [];
    const client = new QueryClient({
      mutationCache: new MutationCache({ onError: (_error, _variables, _context, mutation) => { seen.push(mutation.meta); } }),
      defaultOptions: { mutations: { retry: false } },
    });
    function Wrapper({ children }: { children: ReactNode }) {
      return createElement(QueryClientProvider, { client }, children);
    }
    const { result } = renderHook(() => useIdempotentMutation(async () => { throw ApiError.network(); }, { meta: { handlesError: true } }), { wrapper: Wrapper });

    await act(async () => { await result.current.mutateAsync(undefined).catch(() => undefined); });

    expect(seen).toEqual([{ handlesError: true }]);
    client.clear();
  });
});
