import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { useCursorList } from "./useCursorList";

const srcRoot = path.resolve(import.meta.dirname, "../..");

function sourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) return sourceFiles(full);
    return /\.tsx?$/.test(entry.name) && !/\.(test|spec|d)\.tsx?$/.test(entry.name) ? [full] : [];
  });
}

function wrapperWithClient() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  }
  return { client, Wrapper };
}

describe("useCursorList", () => {
  it("no lee hasta habilitar y entrega la señal cancelable a cada página", async () => {
    const fetchPage = vi.fn(async (_after: string | null, signal: AbortSignal) => ({ items: [{ id: signal.aborted ? "cancelado" : "primera" }], hasMore: false }));
    const { client, Wrapper } = wrapperWithClient();
    const hook = renderHook(({ enabled }) => useCursorList(["privado"], fetchPage, { enabled }), { wrapper: Wrapper, initialProps: { enabled: false } });
    expect(fetchPage).not.toHaveBeenCalled();
    hook.rerender({ enabled: true });
    await waitFor(() => expect(hook.result.current.items).toEqual([{ id: "primera" }]));
    expect(fetchPage.mock.calls[0]?.[0]).toBeNull();
    expect(fetchPage.mock.calls[0]?.[1]).toBeInstanceOf(AbortSignal);
    client.clear();
  });
  it("al cambiar de dueño puede retirar las filas anteriores durante la lectura", async () => {
    let release!: () => void;
    const fetchPage = vi.fn((owner: string) => owner === "anterior"
      ? Promise.resolve({ items: [{ id: "privado-anterior" }], hasMore: false })
      : new Promise<CursorTestPage>((resolve) => { release = () => resolve({ items: [{ id: "nuevo" }], nextCursor: null, hasMore: false }); }));
    const { client, Wrapper } = wrapperWithClient();
    const hook = renderHook(({ owner }) => useCursorList(["privado", owner], () => fetchPage(owner), { retainPreviousData: false }),
      { wrapper: Wrapper, initialProps: { owner: "anterior" } });
    await waitFor(() => expect(hook.result.current.items).toEqual([{ id: "privado-anterior" }]));
    hook.rerender({ owner: "nuevo" });
    await waitFor(() => expect(fetchPage).toHaveBeenCalledTimes(2));
    expect(hook.result.current.items).toEqual([]);
    expect(hook.result.current.isPlaceholderData).toBe(false);
    act(() => release());
    await waitFor(() => expect(hook.result.current.items).toEqual([{ id: "nuevo" }]));
    client.clear();
  });
  it("desmontar cancela la lectura pendiente mediante la señal", async () => {
    let received!: AbortSignal;
    const { client, Wrapper } = wrapperWithClient();
    const hook = renderHook(() => useCursorList(["privado"], (_after, signal) => {
      received = signal;
      return new Promise<CursorTestPage>((_resolve, reject) => signal.addEventListener("abort", () => reject(new DOMException("", "AbortError")), { once: true }));
    }), { wrapper: Wrapper });
    await waitFor(() => expect(received).toBeInstanceOf(AbortSignal));
    hook.unmount();
    expect(received.aborted).toBe(true);
    client.clear();
  });
  it("carga páginas por cursor opaco, sin total ni número de página", async () => {
    const fetchPage = vi.fn(async (after: string | null) => after === null
      ? { items: [{ id: "nuevo" }], nextCursor: "cursor-opaco", hasMore: true }
      : { items: [{ id: "viejo" }], nextCursor: null, hasMore: false });
    const { client, Wrapper } = wrapperWithClient();
    const { result } = renderHook(() => useCursorList(["actividad"], fetchPage), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.items).toEqual([{ id: "nuevo" }]));
    expect(result.current.hasNextPage).toBe(true);
    await act(async () => { await result.current.fetchNextPage(); });

    expect(fetchPage.mock.calls.map(([after]) => after)).toEqual([null, "cursor-opaco"]);
    await waitFor(() => expect(result.current.items).toEqual([{ id: "nuevo" }, { id: "viejo" }]));
    expect(result.current.hasNextPage).toBe(false);
    expect("totalCount" in result.current).toBe(false);
    expect("page" in result.current).toBe(false);
    client.clear();
  });

  it("reinicia el cursor cuando cambia la clave de filtros", async () => {
    const fetchPage = vi.fn(async (_after: string | null) => ({ items: [{ id: "fila" }], nextCursor: null, hasMore: false }));
    const { client, Wrapper } = wrapperWithClient();
    const { result, rerender } = renderHook(
      ({ filter }: { filter: string }) => useCursorList(["actividad", filter], fetchPage),
      { wrapper: Wrapper, initialProps: { filter: "todos" } },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    rerender({ filter: "errores" });
    await waitFor(() => expect(fetchPage).toHaveBeenCalledTimes(2));
    expect(fetchPage.mock.calls.map(([after]) => after)).toEqual([null, null]);
    client.clear();
  });

  // Como usePagedQuery (`placeholderData: keepPreviousData`): mientras llega la primera tanda de los filtros nuevos, la
  // tabla muestra la anterior, atenuada, en vez de quedar vacía.
  it("al cambiar los filtros, conserva la lista anterior mientras llega la nueva", async () => {
    let release: (() => void) | undefined;
    const fetchPage = vi.fn((filter: string) => filter === "todos"
      ? Promise.resolve({ items: [{ id: "anterior" }], nextCursor: null, hasMore: false })
      : new Promise<CursorTestPage>((resolve) => { release = () => resolve({ items: [{ id: "nueva" }], nextCursor: null, hasMore: false }); }));
    const { client, Wrapper } = wrapperWithClient();
    const { result, rerender } = renderHook(
      ({ filter }: { filter: string }) => useCursorList(["actividad", filter], () => fetchPage(filter)),
      { wrapper: Wrapper, initialProps: { filter: "todos" } },
    );

    await waitFor(() => expect(result.current.items).toEqual([{ id: "anterior" }]));
    rerender({ filter: "errores" });
    await waitFor(() => expect(fetchPage).toHaveBeenCalledTimes(2));
    expect(result.current.items).toEqual([{ id: "anterior" }]);
    expect(result.current.isPlaceholderData).toBe(true);

    act(() => release?.());
    await waitFor(() => expect(result.current.items).toEqual([{ id: "nueva" }]));
    expect(result.current.isPlaceholderData).toBe(false);
    client.clear();
  });

  // La consulta principal de la pantalla (Auditoría) muestra su error en la tabla y un 403 la reemplaza por «No tenés
  // permiso»: se lo dice al manejo global de errores con `meta`, como cualquier consulta (errores.md).
  it("le pasa su meta a la consulta", async () => {
    const { client, Wrapper } = wrapperWithClient();
    const { result } = renderHook(
      () => useCursorList(["actividad"], async () => ({ items: [], nextCursor: null, hasMore: false }), { meta: { silent: true, blocksView: true } }),
      { wrapper: Wrapper },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(client.getQueryCache().find({ queryKey: ["actividad"] })?.meta).toEqual({ silent: true, blocksView: true });
    client.clear();
  });

  // paginado-y-listados.md: una sola forma de listar por cursor. Una pantalla no arma su propio `useInfiniteQuery`.
  it("es lo único que usa useInfiniteQuery", () => {
    const offenders = sourceFiles(srcRoot)
      .map((file) => path.relative(srcRoot, file).replaceAll("\\", "/"))
      .filter((file) => file !== "shared/hooks/useCursorList.ts" && /\buseInfiniteQuery\b/.test(readFileSync(path.join(srcRoot, file), "utf8")));

    expect(offenders).toEqual([]);
  });
});

interface CursorTestPage {
  items: { id: string }[];
  nextCursor: string | null;
  hasMore: boolean;
}
