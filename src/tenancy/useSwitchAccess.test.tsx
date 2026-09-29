import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react";
import type { User } from "oidc-client-ts";
import type { ReactNode } from "react";
import type { AuthContextProps } from "react-oidc-context";
import { MemoryRouter, useLocation } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/shared/api/ApiError";
import { clearAccessError, getAccessError, publishAccessError } from "@/shared/api/accessErrorStore";
import { accessHome } from "./accessHome";
import { useSwitchAccess } from "./useSwitchAccess";

const signinSilent = vi.fn<() => Promise<User | null>>();
vi.mock("react-oidc-context", () => ({ useAuth: () => ({ signinSilent }) as unknown as AuthContextProps }));

function setup() {
  const client = new QueryClient();
  client.setQueryData(["private", "empresa-a"], { value: 1 });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={["/"]}>{children}</MemoryRouter>
    </QueryClientProvider>
  );
  const hook = renderHook(() => ({ switching: useSwitchAccess(), location: useLocation() }), { wrapper });
  return { client, ...hook };
}

describe("useSwitchAccess", () => {
  beforeEach(() => { signinSilent.mockReset(); clearAccessError(); });

  it("fuerza authorize con access y tenant, limpia caché y llega al inicio B2B", async () => {
    signinSilent.mockResolvedValue({ access_token: "nuevo" } as User);
    publishAccessError(new ApiError(403, { code: "Tenancy.Tenant.Suspended" }));
    const { client, result } = setup();
    let switching = Promise.resolve();

    act(() => { switching = result.current.switching.switchAccess({ access: "business", tenantId: "empresa-a" }); });
    expect(result.current.switching.isSwitching).toBe(true);
    expect(result.current.switching.isSwitching).toBe(true);
    expect(signinSilent).toHaveBeenCalledWith({
      forceIframeAuth: true,
      extraQueryParams: { access: "business", tenant: "empresa-a" },
    });
    expect(client.getQueryData(["private", "empresa-a"])).toBeDefined();

    await act(async () => { await switching; });
    expect(client.getQueryData(["private", "empresa-a"])).toBeUndefined();
    expect(getAccessError()).toBeNull();
    expect(result.current.location.pathname).toBe("/org");
  });

  it("al volver a Personal no envía tenant y deja la caché limpia", async () => {
    signinSilent.mockResolvedValue({ access_token: "personal" } as User);
    const { client, result } = setup();

    await act(async () => { await result.current.switching.switchAccess({ access: "consumer" }); });

    expect(signinSilent).toHaveBeenCalledWith({
      forceIframeAuth: true,
      extraQueryParams: { access: "consumer" },
    });
    expect(client.getQueryData(["private", "empresa-a"])).toBeUndefined();
    expect(result.current.location.pathname).toBe("/");
  });

  it("si falla el cambio conserva el acceso y la caché actuales", async () => {
    signinSilent.mockResolvedValue(null);
    const { client, result } = setup();

    await act(async () => { await result.current.switching.switchAccess({ access: "business", tenantId: "empresa-a" }); });

    expect(result.current.switching.hasError).toBe(true);
    expect(client.getQueryData(["private", "empresa-a"])).toBeDefined();
    expect(result.current.location.pathname).toBe("/");
  });

  it("mapea el inicio de cada acceso sin reusar el lado previo", () => {
    expect(accessHome("consumer")).toBe("/");
    expect(accessHome("business")).toBe("/org");
    expect(accessHome("platform")).toBe("/plataforma");
  });
});
