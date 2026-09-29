import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { HttpResponse, http } from "msw";
import type { ReactNode } from "react";
import { AuthContext, type AuthContextProps } from "react-oidc-context";
import { beforeEach, describe, expect, it } from "vitest";
import { server } from "@/test/mocks/server";
import { currentUserQueryKey, useCurrentUser } from "./useCurrentUser";

const auth = { isAuthenticated: false };
describe("useCurrentUser", () => {
  beforeEach(() => { auth.isAuthenticated = false; });

  it("consulta /api/me solo con sesión y usa la clave única de perfil", async () => {
    let calls = 0;
    server.use(http.get("/api/me", () => {
      calls += 1;
      return HttpResponse.json({
        id: "ana", displayName: "Ana", email: "ana@example.com",
        access: "business", activeTenantId: "empresa-a", hasPersonalSpace: false,
        organizations: [], permissions: [], culture: "en-US",
        timeZoneId: "America/Argentina/Buenos_Aires", currencyCode: "ARS",
      });
    }));
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const wrapper = ({ children }: { children: ReactNode }) => (
      <AuthContext.Provider value={auth as unknown as AuthContextProps}>
        <QueryClientProvider client={client}>{children}</QueryClientProvider>
      </AuthContext.Provider>
    );

    const { result, rerender } = renderHook(() => useCurrentUser(), { wrapper });
    expect(calls).toBe(0);
    auth.isAuthenticated = true;
    rerender();

    await waitFor(() => expect(result.current.data?.culture).toBe("en-US"));
    expect(result.current.data?.access).toBe("business");
    expect(client.getQueryData(currentUserQueryKey)).toMatchObject({ id: "ana" });
    expect(calls).toBe(1);
  });
});
