import { QueryClient } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { HttpResponse, http } from "msw";
import type { ReactNode } from "react";
import { AuthContext, type AuthContextProps } from "react-oidc-context";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppProviders } from "@/app/providers";
import { cultureStorageKey } from "@/shared/i18n";
import { referenceDataFixture } from "@/test/mocks/handlers";
import { server } from "@/test/mocks/server";
import { useFormat } from "./useFormat";

const auth = vi.hoisted(() => ({ isAuthenticated: true, user: { access_token: "token" } }));

vi.mock("react-oidc-context", async (importOriginal) => ({
  ...await importOriginal<typeof import("react-oidc-context")>(),
  AuthProvider: ({ children }: { children: ReactNode }) => children,
  useAuth: () => auth as AuthContextProps,
}));

describe("formato con perfil de cuenta", () => {
  beforeEach(() => { localStorage.clear(); });

  it("prefiere cultura, zona y moneda efectivas de /api/me sobre las locales", async () => {
    localStorage.setItem(cultureStorageKey, "es-AR");
    const reference = referenceDataFixture();
    server.use(http.get("/api/reference-data", () => HttpResponse.json({
      ...reference,
      currencies: [...reference.currencies, { ...reference.currencies[0], code: "USD" }],
      timeZones: [...reference.timeZones, { ...reference.timeZones[0], id: "UTC" }],
    })));
    server.use(http.get("/api/me", () => HttpResponse.json({
      id: "ana", displayName: "Ana", email: "ana@example.com",
      access: "business", activeTenantId: "empresa-a", hasPersonalSpace: true,
      organizations: [], permissions: [], culture: "en-US", timeZoneId: "UTC", currencyCode: "USD",
    })));
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const wrapper = ({ children }: { children: ReactNode }) => (
      <AuthContext.Provider value={auth as AuthContextProps}>
        <AppProviders client={client}>{children}</AppProviders>
      </AuthContext.Provider>
    );

    const { result } = renderHook(() => useFormat(), { wrapper });
    await waitFor(() => expect(result.current.culture).toBe("en-US"));
    expect(result.current).toMatchObject({ timeZone: "UTC", currency: "USD" });
    expect(result.current.formatInteger(1234)).toBe("1,234");
  });

  it("no inventa moneda cuando /api/me devuelve null", async () => {
    const reference = referenceDataFixture();
    server.use(http.get("/api/reference-data", () => HttpResponse.json({
      ...reference,
      currencies: [...reference.currencies, { ...reference.currencies[0], code: "USD" }],
      countries: [...reference.countries, { ...reference.countries[0], code: "US", defaultCurrencyCode: "USD", defaultTimeZoneId: "UTC" }],
      timeZones: [...reference.timeZones, { ...reference.timeZones[0], id: "UTC", countryCodes: ["US"] }],
    })));
    server.use(http.get("/api/me", () => HttpResponse.json({
      id: "ana", access: "consumer", hasPersonalSpace: true,
      organizations: [], effectivePermissions: { organization: [], companies: {} }, features: [],
      culture: "en-US", timeZoneId: "UTC", currencyCode: null,
    })));
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const wrapper = ({ children }: { children: ReactNode }) => (
      <AuthContext.Provider value={auth as AuthContextProps}>
        <AppProviders client={client}>{children}</AppProviders>
      </AuthContext.Provider>
    );

    const { result } = renderHook(() => useFormat(), { wrapper });
    await waitFor(() => expect(result.current.culture).toBe("en-US"));
    expect(result.current.currency).toBeNull();
  });
});
