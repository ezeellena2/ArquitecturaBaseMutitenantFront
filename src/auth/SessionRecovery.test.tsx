import { act, render, screen, waitFor } from "@testing-library/react";
import { StrictMode } from "react";
import type { User } from "oidc-client-ts";
import type { AuthContextProps } from "react-oidc-context";
import { createMemoryRouter, RouterProvider } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ProtectedRoute } from "./ProtectedRoute";
import { AccessRoute } from "./AccessRoute";
import { SessionRecovery } from "./SessionRecovery";

const signinSilent = vi.fn<(...args: unknown[]) => Promise<User | null>>();
const auth = {
  isAuthenticated: false,
  isLoading: false,
  user: undefined as User | undefined,
  signinSilent,
};

vi.mock("react-oidc-context", () => ({ useAuth: () => auth as unknown as AuthContextProps }));

function renderPrivateRoute(strict = false, path = "/org") {
  const router = createMemoryRouter([
    { path: "/login/empresa", element: <main aria-label="Ingreso de empresa" /> },
    { element: <SessionRecovery />, children: [
      { element: <ProtectedRoute />, children: [
        { element: <AccessRoute access="business" />, children: [
          { path: "/org", element: <main aria-label="Inicio de organización" /> },
        ] },
        { element: <AccessRoute access="platform" />, children: [
          { path: "/plataforma", element: <main aria-label="Inicio de plataforma" /> },
        ] },
      ] },
    ] },
  ], { initialEntries: [path] });
  const route = <RouterProvider router={router} />;
  render(strict ? <StrictMode>{route}</StrictMode> : route);
  return router;
}

describe("SessionRecovery", () => {
  beforeEach(() => {
    auth.isAuthenticated = false;
    auth.user = undefined;
    auth.isLoading = false;
    signinSilent.mockReset();
  });

  it("canjea la cookie tras F5 y conserva la ruta privada", async () => {
    let complete = (): void => { throw new Error("No se inició la recuperación"); };
    signinSilent.mockImplementation(() => new Promise<User>((resolve) => {
      complete = () => {
        auth.user = { access_token: "token", profile: { access: "business" } } as unknown as User;
        auth.isAuthenticated = true;
        resolve(auth.user);
      };
    }));
    const router = renderPrivateRoute();

    await waitFor(() => expect(signinSilent).toHaveBeenCalledOnce());
    expect(signinSilent).toHaveBeenCalledWith({ extraQueryParams: { access: "business" } });
    expect(router.state.location.pathname).toBe("/org");
    expect(screen.getByRole("heading", { name: "Iniciando sesión…" })).toBeVisible();
    expect(screen.queryByRole("main", { name: "Inicio de organización" })).not.toBeInTheDocument();
    await act(async () => { complete(); });
    expect(screen.getByRole("main", { name: "Inicio de organización" })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe("/org");
  });

  it("si no hay cookie termina en la puerta correcta con retorno", async () => {
    signinSilent.mockRejectedValue(new Error("login_required"));
    const router = renderPrivateRoute();

    await waitFor(() => expect(router.state.location.pathname).toBe("/login/empresa"));
    expect(router.state.location.search).toContain("returnUrl=%2Forg");
    expect(signinSilent).toHaveBeenCalledOnce();
  });

  it("recupera el acceso de plataforma desde su ruta", async () => {
    signinSilent.mockImplementation(() => new Promise<User>(() => undefined));
    renderPrivateRoute(false, "/plataforma");

    await waitFor(() => expect(signinSilent).toHaveBeenCalledOnce());
    expect(signinSilent).toHaveBeenCalledWith({ extraQueryParams: { access: "platform" } });
  });

  it("omite el iframe cuando ya hay un usuario en memoria", async () => {
    auth.user = { access_token: "token", profile: { access: "business" } } as unknown as User;
    auth.isAuthenticated = true;
    renderPrivateRoute();

    expect(await screen.findByRole("main", { name: "Inicio de organización" })).toBeInTheDocument();
    expect(signinSilent).not.toHaveBeenCalled();
  });

  it("no duplica el canje de cookie en StrictMode", async () => {
    signinSilent.mockImplementation(() => new Promise<User>(() => undefined));
    renderPrivateRoute(true);

    await waitFor(() => expect(signinSilent).toHaveBeenCalledOnce());
  });
});
