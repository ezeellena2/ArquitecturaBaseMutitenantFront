import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { AuthContext, type AuthContextProps } from "react-oidc-context";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cancelSignOut, useIsSigningOut } from "./signOutStatus";
import { useSignOut } from "./useSignOut";
import type { Access } from "@/tenancy/access";

function renderSignOut(signoutRedirect: (args?: unknown) => Promise<unknown>, access?: Access, context: Partial<AuthContextProps> = {}) {
  const client = new QueryClient();
  client.setQueryData(["current-user"], { id: "ana" });
  const auth = { isAuthenticated: true, signoutRedirect, ...context } as unknown as AuthContextProps;
  function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={client}><AuthContext.Provider value={auth}>{children}</AuthContext.Provider></QueryClientProvider>;
  }
  const hook = renderHook(() => ({ signOut: useSignOut(access), signingOut: useIsSigningOut() }), { wrapper: Wrapper });
  return { ...hook, client };
}

afterEach(() => cancelSignOut());

describe("useSignOut", () => {
  it.each(["consumer", "business"] as const)("sale del lado público %s sin dejar que OIDC use el token Platform en memoria", async (access) => {
    let cachedIdToken: string | undefined = "platform-token";
    const removeUser = vi.fn(async () => { cachedIdToken = undefined; });
    const signoutRedirect = vi.fn(async () => { expect(cachedIdToken).toBeUndefined(); return null; });
    const { result, client } = renderSignOut(signoutRedirect, access, {
      removeUser, user: { profile: { access: "platform" } } as unknown as AuthContextProps["user"],
    });
    await act(async () => { await expect(result.current.signOut()).resolves.toBe(true); });
    expect(removeUser).toHaveBeenCalledOnce();
    expect(signoutRedirect).toHaveBeenCalledWith(undefined);
    expect(client.getQueryData(["current-user"])).toBeUndefined();
  });

  it("conserva el token de la sesión pública al salir de su puerta y el de Platform al salir de Platform", async () => {
    const removeUser = vi.fn(async () => {});
    for (const access of ["consumer", "platform"] as const) {
      const { result, unmount } = renderSignOut(async () => null, access, {
        removeUser, user: { profile: { access } } as unknown as AuthContextProps["user"],
      });
      await act(async () => { await result.current.signOut(); });
      unmount();
    }
    expect(removeUser).not.toHaveBeenCalled();
  });
  // La secuencia de Salir que repetían el menú, «Más», la organización no disponible, los términos y la invitación.
  it("muestra «Cerrando sesión…», limpia la caché y cierra en el servidor de ingreso", async () => {
    const signoutRedirect = vi.fn(() => new Promise<void>(() => {}));
    const { result, client } = renderSignOut(signoutRedirect);

    act(() => { void result.current.signOut({ post_logout_redirect_uri: "https://plataforma.test/invitacion" }); });

    expect(result.current.signingOut).toBe(true);
    expect(client.getQueryData(["current-user"])).toBeUndefined();
    expect(signoutRedirect).toHaveBeenCalledWith({ post_logout_redirect_uri: "https://plataforma.test/invitacion" });
  });

  it("vuelve a la pantalla si el navegador no se fue y avisa si no se pudo salir", async () => {
    const { result } = renderSignOut(async () => null);
    await act(async () => { await expect(result.current.signOut()).resolves.toBe(true); });
    expect(result.current.signingOut).toBe(false);

    const failing = renderSignOut(async () => { throw new Error("sin conexión"); });
    await act(async () => { await expect(failing.result.current.signOut()).resolves.toBe(false); });
    expect(failing.result.current.signingOut).toBe(false);
  });
});
