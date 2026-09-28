import { renderHook, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it } from "vitest";
import { http, HttpResponse } from "msw";
import { AppProviders } from "@/app/providers";
import { resetHttpClient } from "@/shared/api/httpClient";
import { queryClient } from "@/shared/api/queryClient";
import { cultureStorageKey } from "@/shared/i18n";
import { referenceDataFixture } from "@/test/mocks/handlers";
import { server } from "@/test/mocks/server";
import { timeZoneOffsetMinutes, useFormat } from "./useFormat";

function wrapper({ children }: { children: ReactNode }) {
  return <AppProviders>{children}</AppProviders>;
}

describe("contexto de formato E1", () => {
  beforeEach(() => {
    resetHttpClient();
    queryClient.clear();
    localStorage.clear();
  });

  it("monta children y expone carga sin cultura, zona, moneda ni formatos supuestos", async () => {
    let release: (() => void) | undefined;
    const gate = new Promise<void>((resolve) => { release = resolve; });
    server.use(http.get("/api/reference-data", async () => {
      await gate;
      return HttpResponse.json(referenceDataFixture());
    }));

    const { result } = renderHook(() => useFormat(), { wrapper });
    expect(result.current.isLoading).toBe(true);
    expect(result.current.culture).toBeNull();
    expect(result.current.timeZone).toBeNull();
    expect(result.current.currency).toBeNull();
    expect(result.current.formatInteger(1234)).toBe("");
    expect(screen.getByRole("status")).toHaveAttribute("aria-busy", "true");

    release?.();
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.formatInteger(1234)).toBe("1.234");
    expect(result.current.parseTime("14:35")).toBe("14:35:00");
    expect(result.current.parseDateTime("27/09/2026 14:35"))
      .toBe("2026-09-27T17:35:00Z");
  });

  it("deriva los defaults del catálogo y aplica solo cultura local habilitada", async () => {
    localStorage.setItem(cultureStorageKey, "es-AR");
    const fixture = referenceDataFixture();
    const custom = {
      ...fixture,
      currencies: [...fixture.currencies, { ...fixture.currencies[0], code: "USD" }],
      countries: [...fixture.countries, {
        ...fixture.countries[0], code: "US", defaultCurrencyCode: "USD",
        defaultTimeZoneId: "America/New_York",
      }],
      timeZones: [...fixture.timeZones, {
        ...fixture.timeZones[0], id: "America/New_York", countryCodes: ["US"],
      }],
      cultures: fixture.cultures.map((item) => ({
        ...item, isDefault: item.code === "en-US",
      })),
    };
    server.use(http.get("/api/reference-data", () => HttpResponse.json(custom)));

    const { result } = renderHook(() => useFormat(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current).toMatchObject({
      culture: "es-AR", timeZone: "America/New_York", currency: "USD",
    });
    expect(result.current.formatInteger(1234)).toBe("1.234");
    expect(result.current.parsePercent("12,5")).toBe(0.125);
  });

  it("descarta la cultura local si ya no está habilitada", async () => {
    localStorage.setItem(cultureStorageKey, "en-US");
    const fixture = referenceDataFixture();
    const custom = {
      ...fixture,
      cultures: fixture.cultures.map((item) => ({
        ...item, isEnabled: item.code !== "en-US",
      })),
    };
    server.use(http.get("/api/reference-data", () => HttpResponse.json(custom)));

    const { result } = renderHook(() => useFormat(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.culture).toBe("es-AR");
    expect(result.current.timeZone).toBe("America/Argentina/Buenos_Aires");
    expect(result.current.currency).toBe("ARS");
  });

  it("calcula el offset IANA de una fecha dada para ordenar zonas sin guardarlo", () => {
    const now = new Date("2026-09-27T15:00:00Z");
    expect(timeZoneOffsetMinutes("America/Argentina/Buenos_Aires", now)).toBe(-180);
    expect(timeZoneOffsetMinutes("UTC", now)).toBe(0);
  });
});
