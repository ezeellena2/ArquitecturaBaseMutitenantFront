import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { AuthContext, type AuthContextProps } from "react-oidc-context";
import { describe, expect, it } from "vitest";
import { currentUserQueryKey } from "@/auth/useCurrentUser";
import { resolveEffectiveTimeZone, useEffectiveTimeZone } from "./useEffectiveTimeZone";

describe("zona horaria efectiva", () => {
  it("prioriza cuenta, empresa y organización dentro de B2B", () => {
    const sources = {
      access: "business" as const,
      accountTimeZoneId: "America/Montevideo",
      companyTimeZoneId: "America/Santiago",
      organizationTimeZoneId: "America/Argentina/Buenos_Aires",
    };
    expect(resolveEffectiveTimeZone(sources)).toBe("America/Montevideo");
    expect(resolveEffectiveTimeZone({ ...sources, accountTimeZoneId: null })).toBe("America/Santiago");
    expect(resolveEffectiveTimeZone({ ...sources, accountTimeZoneId: null, companyTimeZoneId: null }))
      .toBe("America/Argentina/Buenos_Aires");
  });

  it("usa la zona guardada del navegador como respaldo B2C", () => {
    expect(resolveEffectiveTimeZone({
      access: "consumer", accountTimeZoneId: null, browserTimeZoneId: "America/Lima",
    })).toBe("America/Lima");
    expect(resolveEffectiveTimeZone({
      access: "consumer", accountTimeZoneId: "UTC", browserTimeZoneId: "America/Lima",
    })).toBe("UTC");
  });

  it("en 3a lee la zona efectiva publicada por /api/me", () => {
    const client = new QueryClient();
    client.setQueryData(currentUserQueryKey, {
      id: "ana", displayName: "Ana", email: "ana@example.com",
      access: "business", activeTenantId: "empresa-a", hasPersonalSpace: true,
      organizations: [], permissions: [], culture: "es-AR",
      timeZoneId: "America/Argentina/Buenos_Aires", currencyCode: "ARS",
    });
    const auth = { isAuthenticated: true } as unknown as AuthContextProps;
    const wrapper = ({ children }: { children: ReactNode }) => (
      <AuthContext.Provider value={auth}><QueryClientProvider client={client}>{children}</QueryClientProvider></AuthContext.Provider>
    );

    const { result } = renderHook(() => useEffectiveTimeZone("company-a"), { wrapper });
    expect(result.current).toBe("America/Argentina/Buenos_Aires");
  });
});
