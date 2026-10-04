import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { AuthContext, type AuthContextProps } from "react-oidc-context";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cancelSignOut, useIsSigningOut } from "./signOutStatus";
import { useSignOut } from "./useSignOut";

function renderSignOut(signoutRedirect: (args?: unknown) => Promise<unknown>) {
  const client = new QueryClient();
  client.setQueryData(["current-user"], { id: "ana" });
  const auth = { isAuthenticated: true, signoutRedirect } as unknown as AuthContextProps;
  function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={client}><AuthContext.Provider value={auth}>{children}</AuthContext.Provider></QueryClientProvider>;
  }
  const hook = renderHook(() => ({ signOut: useSignOut(), signingOut: useIsSigningOut() }), { wrapper: Wrapper });
  return { ...hook, client };
}

afterEach(() => cancelSignOut());

describe("useSignOut", () => {
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
