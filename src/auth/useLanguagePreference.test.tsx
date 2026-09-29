import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import { HttpResponse, http } from "msw";
import type { ReactNode } from "react";
import { AuthContext, type AuthContextProps } from "react-oidc-context";
import { beforeAll, describe, expect, it } from "vitest";
import { configureI18n, changeCulture } from "@/shared/i18n";
import i18n from "@/shared/i18n";
import { server } from "@/test/mocks/server";
import { currentUserQueryKey } from "./useCurrentUser";
import { useLanguagePreference } from "./useLanguagePreference";

const auth = { isAuthenticated: true } as unknown as AuthContextProps;

const me = {
  id: "ana", displayName: "Ana", email: "ana@example.com",
  access: "business", activeTenantId: "empresa-a", hasPersonalSpace: true,
  organizations: [], permissions: [], culture: "es-AR",
  timeZoneId: "America/Argentina/Buenos_Aires", currencyCode: "ARS",
};

beforeAll(async () => {
  await configureI18n([
    { code: "es-AR", languageCode: "es", fallbackCulture: null, isEnabled: true, isDefault: true },
    { code: "en-US", languageCode: "en", fallbackCulture: "es-AR", isEnabled: true, isDefault: false },
  ]);
});

describe("useLanguagePreference", () => {
  it("guarda la cultura con PUT 204 y vuelve a leer /api/me", async () => {
    await changeCulture("es-AR");
    let body: unknown;
    let profileReads = 0;
    server.use(
      http.put("/api/me", async ({ request }) => {
        body = await request.json();
        return new HttpResponse(null, { status: 204 });
      }),
      http.get("/api/me", () => {
        profileReads++;
        return HttpResponse.json({ ...me, culture: "en-US" });
      }),
    );
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    client.setQueryData(currentUserQueryKey, me);
    const wrapper = ({ children }: { children: ReactNode }) => (
      <AuthContext.Provider value={auth}><QueryClientProvider client={client}>{children}</QueryClientProvider></AuthContext.Provider>
    );
    const { result } = renderHook(() => useLanguagePreference(), { wrapper });

    await act(async () => { await result.current.change("en-US"); });

    expect(body).toEqual({ displayName: "Ana", culture: "en-US", timeZoneId: me.timeZoneId });
    expect(i18n.language).toBe("en-US");
    await waitFor(() => expect(client.getQueryData(currentUserQueryKey)).toMatchObject({ culture: "en-US" }));
    expect(profileReads).toBe(1);
  });

  it("deshace el cambio local si falló el guardado", async () => {
    await changeCulture("es-AR");
    server.use(http.put("/api/me", () => HttpResponse.json({ code: "General.Unexpected" }, { status: 500 })));
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    client.setQueryData(currentUserQueryKey, me);
    const wrapper = ({ children }: { children: ReactNode }) => (
      <AuthContext.Provider value={auth}><QueryClientProvider client={client}>{children}</QueryClientProvider></AuthContext.Provider>
    );
    const { result } = renderHook(() => useLanguagePreference(), { wrapper });

    await act(async () => { await result.current.change("en-US"); });

    expect(i18n.language).toBe("es-AR");
    expect(client.getQueryData(currentUserQueryKey)).toMatchObject({ culture: "es-AR" });
  });
});
