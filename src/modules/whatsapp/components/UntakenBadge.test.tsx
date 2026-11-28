import { act, render, screen } from "@testing-library/react";
import { focusManager, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HttpResponse, http } from "msw";
import { MemoryRouter } from "react-router";
import { afterEach, describe, expect, it, vi } from "vitest";
import { resetHttpClient } from "@/shared/api/httpClient";
import { server } from "@/test/mocks/server";
import { platformUntakenQueryKey, untakenQueryKey, untakenRefetchInterval } from "../api/untaken";
import { PlatformUntakenBadge, UntakenBadge } from "./UntakenBadge";

function mountBadge(path: string, variant: "organization" | "platform", client?: QueryClient) {
  const queryClient = client ?? new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const Badge = variant === "platform" ? PlatformUntakenBadge : UntakenBadge;
  const view = render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[path]}>
        <Badge>{(count) => <span role="status">{count}</span>}</Badge>
      </MemoryRouter>
    </QueryClientProvider>,
  );
  return { ...view, client: queryClient };
}

afterEach(() => {
  focusManager.setFocused(undefined);
  vi.useRealTimers();
  resetHttpClient();
});

describe("UntakenBadge", () => {
  it.each(["/org/whatsapp/chats", "/org/whatsapp/chats/c-123"])("en la bandeja (%s) no sondea ni duplica pedidos y muestra el valor en caché", async (path) => {
    vi.useFakeTimers();
    let requests = 0;
    server.use(http.get("/api/organization/whatsapp/untaken", () => {
      requests++;
      return HttpResponse.json({ customers: 4, internal: 1 });
    }));

    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    client.setQueryData(untakenQueryKey, { customers: 2, internal: 1 });
    mountBadge(path, "organization", client);

    expect(screen.getByRole("status")).toHaveTextContent("3");
    await act(async () => { await vi.advanceTimersByTimeAsync(untakenRefetchInterval * 2); });
    expect(requests).toBe(0);
  });

  it("fuera de la bandeja muestra la suma, espacia el sondeo a 30 s y no sondea en segundo plano", async () => {
    vi.useFakeTimers();
    let requests = 0;
    server.use(http.get("/api/organization/whatsapp/untaken", () => {
      requests++;
      return HttpResponse.json({ customers: 2, internal: requests });
    }));

    mountBadge("/org/whatsapp/contactos", "organization");
    await act(async () => { await vi.advanceTimersByTimeAsync(10); });
    expect(requests).toBe(1);
    expect(screen.getByRole("status")).toHaveTextContent("3");

    // A los 10 s todavía no volvió a sondear (se espació a 30 s).
    await act(async () => { await vi.advanceTimersByTimeAsync(10_000); });
    expect(requests).toBe(1);

    // Al cumplirse los 30 s sondea una vez y actualiza el contador.
    await act(async () => { await vi.advanceTimersByTimeAsync(untakenRefetchInterval - 10_000); });
    await act(async () => { await vi.advanceTimersByTimeAsync(10); });
    expect(requests).toBe(2);
    expect(screen.getByRole("status")).toHaveTextContent("4");

    // Con la pestaña en segundo plano no sondea.
    focusManager.setFocused(false);
    await act(async () => { await vi.advanceTimersByTimeAsync(untakenRefetchInterval * 2); });
    expect(requests).toBe(2);
  });
});

describe("PlatformUntakenBadge", () => {
  it.each(["/plataforma/whatsapp", "/plataforma/whatsapp/consultas/c-123"])("en Consultas (%s) no sondea ni duplica pedidos y muestra el valor en caché", async (path) => {
    vi.useFakeTimers();
    let requests = 0;
    server.use(http.get("/api/platform/whatsapp/conversations", () => {
      requests++;
      return HttpResponse.json({
        conversations: { items: [], page: 1, pageSize: 10, totalCount: 0, totalPages: 0, hasPrevious: false, hasNext: false },
        counts: { customers: 0, internal: 0, untaken: 5 },
      });
    }));

    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    client.setQueryData(platformUntakenQueryKey, 4);
    mountBadge(path, "platform", client);

    expect(screen.getByRole("status")).toHaveTextContent("4");
    await act(async () => { await vi.advanceTimersByTimeAsync(untakenRefetchInterval * 2); });
    expect(requests).toBe(0);
  });

  it("fuera de Consultas pide pageSize=10, espacia el sondeo a 30 s y no sondea en segundo plano", async () => {
    vi.useFakeTimers();
    const pageSizesRequested: Array<string | null> = [];
    server.use(http.get("/api/platform/whatsapp/conversations", ({ request }) => {
      pageSizesRequested.push(new URL(request.url).searchParams.get("pageSize"));
      return HttpResponse.json({
        conversations: { items: [], page: 1, pageSize: 10, totalCount: 0, totalPages: 0, hasPrevious: false, hasNext: false },
        counts: { customers: 0, internal: 0, untaken: pageSizesRequested.length + 1 },
      });
    }));

    mountBadge("/plataforma/whatsapp/bot", "platform");
    await act(async () => { await vi.advanceTimersByTimeAsync(10); });
    expect(pageSizesRequested).toEqual(["10"]);
    expect(screen.getByRole("status")).toHaveTextContent("2");

    await act(async () => { await vi.advanceTimersByTimeAsync(10_000); });
    expect(pageSizesRequested).toHaveLength(1);

    await act(async () => { await vi.advanceTimersByTimeAsync(untakenRefetchInterval - 10_000); });
    await act(async () => { await vi.advanceTimersByTimeAsync(10); });
    expect(pageSizesRequested).toEqual(["10", "10"]);
    expect(screen.getByRole("status")).toHaveTextContent("3");

    focusManager.setFocused(false);
    await act(async () => { await vi.advanceTimersByTimeAsync(untakenRefetchInterval * 2); });
    expect(pageSizesRequested).toHaveLength(2);
  });
});
