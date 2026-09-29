import { render, screen } from "@testing-library/react";
import type { User } from "oidc-client-ts";
import type { AuthContextProps } from "react-oidc-context";
import { createMemoryRouter, RouterProvider } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AccessRoute } from "./AccessRoute";

const auth = { user: undefined as User | undefined };
vi.mock("react-oidc-context", () => ({ useAuth: () => auth as AuthContextProps }));

describe("AccessRoute", () => {
  beforeEach(() => { auth.user = undefined; });

  it("manda al inicio personal cuando una URL B2B pertenece a otro acceso", async () => {
    auth.user = { profile: { access: "consumer" } } as unknown as User;
    const router = createMemoryRouter([
      { path: "/", element: <main aria-label="Inicio personal" /> },
      { element: <AccessRoute access="business" />, children: [
        { path: "/org", element: <main aria-label="Inicio de organización" /> },
      ] },
    ], { initialEntries: ["/org"] });
    render(<RouterProvider router={router} />);

    expect(await screen.findByRole("main", { name: "Inicio personal" })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe("/");
  });

  it("permite la ruta del acceso activo", async () => {
    auth.user = { profile: { access: "business" } } as unknown as User;
    const router = createMemoryRouter([
      { path: "/", element: <main aria-label="Inicio personal" /> },
      { element: <AccessRoute access="business" />, children: [
        { path: "/org", element: <main aria-label="Inicio de organización" /> },
      ] },
    ], { initialEntries: ["/org"] });
    render(<RouterProvider router={router} />);

    expect(await screen.findByRole("main", { name: "Inicio de organización" })).toBeInTheDocument();
  });
});
