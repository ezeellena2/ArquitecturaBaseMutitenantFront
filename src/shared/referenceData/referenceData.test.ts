import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, render, renderHook, screen, waitFor } from "@testing-library/react";
import { createElement, type ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AppProviders } from "@/app/providers";
import { resetHttpClient } from "@/shared/api/httpClient";
import { queryClient } from "@/shared/api/queryClient";
import i18n, { changeCulture, configureI18n, cultureStorageKey } from "@/shared/i18n";
import { referenceDataFixture } from "@/test/mocks/handlers";
import { server } from "@/test/mocks/server";
import { http, HttpResponse } from "msw";
import { enabledOptions, parseReferenceData } from "./referenceData";
import { useReferenceData } from "./useReferenceData";

function testClient() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  function Wrapper({ children }: { children: ReactNode }) {
    return createElement(QueryClientProvider, { client }, children);
  }
  return { client, Wrapper };
}

describe("datos de referencia", () => {
  beforeEach(() => {
    resetHttpClient();
    queryClient.clear();
    localStorage.clear();
  });

  afterEach(() => {
    queryClient.clear();
    localStorage.clear();
  });

  it("valida la forma de los cinco catálogos sin perder patrones ni nombres traducidos", () => {
    const data = parseReferenceData(referenceDataFixture("en-US"));

    expect(data.culture).toBe("en-US");
    expect(data.currencies[0]).toMatchObject({ code: "ARS", minorUnits: 2, displaySymbol: "ARS" });
    expect(data.countries[0]).toMatchObject({ code: "AR", name: "Argentina" });
    expect(data.timeZones[0]).toMatchObject({ id: "America/Argentina/Buenos_Aires", city: "Buenos Aires" });
    expect(data.cultures[0]).toMatchObject({ code: "es-AR", name: "Spanish (Argentina)", datePattern: "dd/MM/yyyy" });
    expect(data.taxIdTypes[0]).toMatchObject({ code: "AR-CUIT", name: "CUIT", countryCode: "AR" });
    expect(() => parseReferenceData({ ...referenceDataFixture(), currencies: [{ code: 123 }] })).toThrow();
  });

  it("mantiene las referencias históricas y ofrece solo filas habilitadas para una selección nueva", () => {
    const fixture = referenceDataFixture();
    const data = parseReferenceData({
      ...fixture,
      currencies: [...fixture.currencies, { ...fixture.currencies[0], code: "USD", isEnabled: false }],
    });

    expect(data.currencies).toHaveLength(2);
    expect(enabledOptions(data.currencies).map((item) => item.code)).toEqual(["ARS"]);
  });

  it("carga una vez con TanStack Query y deja el catálogo fresco indefinidamente", async () => {
    let calls = 0;
    let initialLanguage: string | null = null;
    server.use(http.get("/api/reference-data", ({ request }) => {
      calls += 1;
      initialLanguage = request.headers.get("accept-language");
      return HttpResponse.json(referenceDataFixture());
    }));
    const { Wrapper } = testClient();
    const first = renderHook(() => useReferenceData(), { wrapper: Wrapper });
    const second = renderHook(() => useReferenceData(), { wrapper: Wrapper });

    expect(first.result.current.isPending).toBe(true);
    await waitFor(() => expect(first.result.current.data?.currencies).toHaveLength(1));
    expect(second.result.current.data?.cultures).toHaveLength(2);
    expect(first.result.current.isStale).toBe(false);
    expect(calls).toBe(1);
    expect(initialLanguage).toBe("und");
  });

  it("revalida con ETag y conserva los datos ante 304", async () => {
    const received: Array<string | null> = [];
    server.use(http.get("/api/reference-data", ({ request }) => {
      const etag = request.headers.get("if-none-match");
      received.push(etag);
      return etag === '"version-1"'
        ? new HttpResponse(null, { status: 304, headers: { ETag: '"version-1"' } })
        : HttpResponse.json(referenceDataFixture(), { headers: { ETag: '"version-1"' } });
    }));
    const { Wrapper } = testClient();
    const { result } = renderHook(() => useReferenceData(), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.data?.culture).toBe("es-AR"));
    const firstData = result.current.data;
    await act(async () => { await result.current.refetch(); });
    expect(received).toEqual([null, '"version-1"']);
    expect(result.current.data).toEqual(firstData);
    expect(result.current.isError).toBe(false);
  });

  it("pide la cultura local y usa los nombres traducidos por la API con fallback del servidor", async () => {
    localStorage.setItem(cultureStorageKey, "en-US");
    let requested: string | null = null;
    server.use(http.get("/api/reference-data", ({ request }) => {
      requested = request.headers.get("accept-language");
      return HttpResponse.json(referenceDataFixture("en-US"));
    }));
    const { Wrapper } = testClient();
    const { result } = renderHook(() => useReferenceData(), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.data?.culture).toBe("en-US"));
    expect(requested).toBe("en-US");
    expect(result.current.data?.cultures[0].name).toBe("Spanish (Argentina)");
    expect(result.current.data?.taxIdTypes[0].name).toBe("CUIT");
  });

  it("vuelve a cargar nombres traducidos al cambiar la cultura efectiva", async () => {
    const requested: string[] = [];
    server.use(http.get("/api/reference-data", ({ request }) => {
      const culture = request.headers.get("accept-language") === "en-US" ? "en-US" : "es-AR";
      requested.push(culture);
      return HttpResponse.json(referenceDataFixture(culture));
    }));
    const { Wrapper } = testClient();
    const { result } = renderHook(() => useReferenceData(), { wrapper: Wrapper });

    await waitFor(() => expect(result.current.data?.culture).toBe("es-AR"));
    await configureI18n(result.current.data!.cultures);
    await act(async () => { await changeCulture("en-US"); });

    await waitFor(() => expect(result.current.data?.culture).toBe("en-US"));
    expect(result.current.data?.cultures[0].name).toBe("Spanish (Argentina)");
    expect(requested).toEqual(["es-AR", "en-US"]);
  });

  it("el proveedor inicia una sola carga al arrancar y configura la cultura al recibirla", async () => {
    const calls = vi.fn();
    server.use(http.get("/api/reference-data", () => {
      calls();
      return HttpResponse.json(referenceDataFixture());
    }));
    render(createElement(AppProviders, null, createElement("div", { "data-testid": "app-ready" })));

    expect(screen.getByTestId("app-ready")).toBeInTheDocument();
    await waitFor(() => expect(i18n.language).toBe("es-AR"));
    expect(calls).toHaveBeenCalledTimes(1);
  });
});
