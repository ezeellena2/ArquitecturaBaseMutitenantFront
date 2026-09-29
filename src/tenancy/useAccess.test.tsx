import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { AuthContext, type AuthContextProps } from "react-oidc-context";
import { describe, expect, it } from "vitest";
import { currentUserQueryKey } from "@/auth/useCurrentUser";
import { businessUser, consumerWithoutOrganizations } from "@/test/mocks/currentUsers";
import { useAccess } from "./useAccess";

describe("useAccess", () => {
  it("expone el acceso y organizaciones del perfil, sin almacenarlos", () => {
    const client = new QueryClient();
    client.setQueryData(currentUserQueryKey, businessUser);
    const auth = { isAuthenticated: true } as unknown as AuthContextProps;
    const wrapper = ({ children }: { children: ReactNode }) => (
      <AuthContext.Provider value={auth}><QueryClientProvider client={client}>{children}</QueryClientProvider></AuthContext.Provider>
    );
    const { result } = renderHook(() => useAccess(), { wrapper });

    expect(result.current).toMatchObject({
      access: "business", activeTenantId: "empresa-a", hasPersonalSpace: true,
      organizations: [{ id: "empresa-a", name: "Empresa A" }],
    });
    expect(consumerWithoutOrganizations.organizations).toEqual([]);
  });
});
