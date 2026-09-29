import { render, screen } from "@testing-library/react";
import type { AuthContextProps } from "react-oidc-context";
import { createMemoryRouter, RouterProvider } from "react-router";
import { describe, expect, it, vi } from "vitest";
import { ProtectedRoute } from "./ProtectedRoute";

const auth = { isAuthenticated: false, isLoading: false };
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
});
