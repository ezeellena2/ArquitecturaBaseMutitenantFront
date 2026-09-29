import { render, screen } from "@testing-library/react";
import type { AuthContextProps } from "react-oidc-context";
import { createMemoryRouter, RouterProvider } from "react-router";
import { describe, expect, it, vi } from "vitest";
import { ProtectedRoute } from "./ProtectedRoute";

const auth: { isAuthenticated: boolean; isLoading: boolean; user?: { expired: boolean } } = { isAuthenticated: false, isLoading: false };
vi.mock("react-oidc-context", () => ({ useAuth: () => auth as AuthContextProps }));

describe("ProtectedRoute", () => {
  it("conserva la URL de destino y la puerta B2B cuando falta sesión", async () => {
    const router = createMemoryRouter([
      { path: "/login/empresa", element: <main aria-label="Ingreso de empresa" /> },
      { element: <ProtectedRoute />, children: [
        { path: "/org/usuarios", element: <main aria-label="Usuarios" /> },
      ] },
    ], { initialEntries: ["/org/usuarios?pagina=2"] });
    render(<RouterProvider router={router} />);

    expect(await screen.findByRole("main", { name: "Ingreso de empresa" })).toBeInTheDocument();
    expect(new URLSearchParams(router.state.location.search).get("returnUrl")).toBe("/org/usuarios?pagina=2");
  });

  it("recuerda una sesión vencida mientras atraviesa el authorize de OIDC", async () => {
    auth.user = { expired: true };
    try {
      const router = createMemoryRouter([
        { path: "/login", element: <main aria-label="Ingreso" /> },
        { element: <ProtectedRoute />, children: [{ path: "/cuenta", element: <main aria-label="Cuenta" /> }] },
      ], { initialEntries: ["/cuenta"] });
      render(<RouterProvider router={router} />);
      expect(await screen.findByRole("main", { name: "Ingreso" })).toBeInTheDocument();
      expect(sessionStorage.getItem("arquitecturabasemt.sessionExpired")).toBe("1");
    } finally {
      delete auth.user;
      sessionStorage.removeItem("arquitecturabasemt.sessionExpired");
    }
  });
});
