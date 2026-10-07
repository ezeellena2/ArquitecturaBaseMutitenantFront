import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { http, HttpResponse } from "msw";
import { describe, expect, it, vi } from "vitest";
import { ApiError } from "@/shared/api/ApiError";
import type { PublicSiteResponse } from "@/shared/api/types";
import { server } from "@/test/mocks/server";
import { mainSiteHost } from "./publicSite";
import { PublicSiteHostContext, publicSiteQueryKey, usePublicSite } from "./usePublicSite";

const page: PublicSiteResponse = {
  slug: "grupo-delta", name: "Grupo Delta", description: null, logoUrl: null,
  address: null, phone: null, email: null, website: null,
};
const host = "grupo-delta.localtest.me:5174";

function renderPublicSite(currentHost = host, context = false) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  function Wrapper({ children }: { children: ReactNode }) {
    return <PublicSiteHostContext.Provider value={context ? currentHost : undefined}>
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    </PublicSiteHostContext.Provider>;
  }
  return { client, ...renderHook(() => usePublicSite(context ? undefined : currentHost), { wrapper: Wrapper }) };
}

describe("usePublicSite", () => {
  it("trae solo la página publicada del origen propio, sin enviar slug ni tenant", async () => {
    const requested = vi.fn();
    server.use(http.get("/api/public-site", ({ request }) => {
      requested(new URL(request.url).search, request.headers.get("X-Tenant-Id"));
      return HttpResponse.json(page);
    }));
    const { result } = renderPublicSite();
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(page);
    expect(result.current.slug).toBe("grupo-delta");
    expect(result.current.isUnavailable).toBe(false);
    expect(requested).toHaveBeenCalledTimes(1);
    expect(requested).toHaveBeenCalledWith("", null);
  });

  it("el 404 público exacto es No disponible y no un error", async () => {
    server.use(http.get("/api/public-site", () => HttpResponse.json({ code: "PublicSite.PublicPage.NotFound" }, { status: 404 })));
    const { result } = renderPublicSite();
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toBeNull();
    expect(result.current.isUnavailable).toBe(true);
    expect(result.current.error).toBeNull();
  });

  it.each([
    [404, "General.NotFound"], [404, undefined], [403, "Legal.AcceptanceRequired"],
    [500, "General.Unexpected"], [400, "PublicSite.PublicPage.NotFound"],
  ] as const)("conserva el error %s/%s sin esconderlo como No disponible", async (status, code) => {
    server.use(http.get("/api/public-site", () => HttpResponse.json({ code }, { status })));
    const { result } = renderPublicSite();
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBeInstanceOf(ApiError);
    expect(result.current.error).toMatchObject({ status });
    expect(result.current.isUnavailable).toBe(false);
    expect(result.current.data).toBeUndefined();
  });

  it("un fallo de red sigue siendo un error", async () => {
    server.use(http.get("/api/public-site", () => HttpResponse.error()));
    const { result } = renderPublicSite();
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toMatchObject({ isNetworkError: true });
    expect(result.current.isUnavailable).toBe(false);
  });

  it.each([mainSiteHost, "otra.example.test:5174", "grupo-delta.localtest.me:5175", "dos.grupo-delta.localtest.me:5174"])(
    "no consulta fuera de un host público válido: %s", (currentHost) => {
      const requested = vi.fn(() => HttpResponse.json(page));
      server.use(http.get("/api/public-site", requested));
      const { result } = renderPublicSite(currentHost);
      expect(result.current.fetchStatus).toBe("idle");
      expect(result.current.slug).toBeNull();
      expect(result.current.isUnavailable).toBe(true);
      expect(requested).not.toHaveBeenCalled();
    },
  );

  it("usa el host del provider de pruebas y separa la caché por host", async () => {
    server.use(http.get("/api/public-site", () => HttpResponse.json(page)));
    const { result, client } = renderPublicSite(host, true);
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(client.getQueryData(publicSiteQueryKey(host))).toEqual(page);
    expect(client.getQueryData(publicSiteQueryKey("otra-organizacion.localtest.me:5174"))).toBeUndefined();
    expect(publicSiteQueryKey(host.toUpperCase())).toEqual(publicSiteQueryKey(host));
  });
});
