import { act, render, screen, waitFor } from "@testing-library/react";
import { StrictMode } from "react";
import type { User } from "oidc-client-ts";
import type { AuthContextProps } from "react-oidc-context";
import { createMemoryRouter, RouterProvider } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ProtectedRoute } from "./ProtectedRoute";
import { SessionRecovery } from "./SessionRecovery";

const signinSilent = vi.fn<() => Promise<User | null>>();
const auth = {
  isAuthenticated: false,
  isLoading: false,
  user: undefined as User | undefined,
  signinSilent,
};

vi.mock("react-oidc-context", () => ({ useAuth: () => auth as unknown as AuthContextProps }));

function renderPrivateRoute(strict = false) {
  const router = createMemoryRouter([
    { path: "/login/empresa", element: <main aria-label="Ingreso de empresa" /> },
    { element: <SessionRecovery />, children: [
      { element: <ProtectedRoute />, children: [
        { path: "/org", element: <main aria-label="Inicio de organización" /> },
      ] },
    ] },
  ], { initialEntries: ["/org"] });
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
        auth.user = { access_token: "token" } as User;
        auth.isAuthenticated = true;
        resolve(auth.user);
      };
    }));
    const router = renderPrivateRoute();

    await waitFor(() => expect(signinSilent).toHaveBeenCalledOnce());
    expect(router.state.location.pathname).toBe("/org");
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

  it("omite el iframe cuando ya hay un usuario en memoria", async () => {
    auth.user = { access_token: "token" } as User;
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
