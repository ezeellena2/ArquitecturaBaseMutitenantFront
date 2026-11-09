import { render, screen } from "@testing-library/react";
import type { User } from "oidc-client-ts";
import type { AuthContextProps } from "react-oidc-context";
import { createMemoryRouter, RouterProvider } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AccessRoute } from "./AccessRoute";

const auth = { user: undefined as User | undefined };
vi.mock("react-oidc-context", () => ({ useAuth: () => auth as AuthContextProps }));
vi.mock("./useCurrentUser", () => ({ useCurrentUser: () => ({ data: { organizations: [] } }) }));

// El ofrecimiento de «Otro acceso» y el link que no existe para la cuenta se prueban con la app entera
// (app/otherAccess.test.tsx), dentro del marco del acceso activo.
function open(path: string) {
  const router = createMemoryRouter([
    { element: <AccessRoute access="consumer" />, children: [{ path: "/", element: <main aria-label="Inicio personal" /> }] },
    { element: <AccessRoute access="business" />, children: [{ path: "/org", element: <main aria-label="Inicio de organización" /> }] },
    { element: <AccessRoute access="platform" />, children: [{ path: "/plataforma", element: <main aria-label="Plataforma" /> }] },
  ], { initialEntries: [path] });
  render(<RouterProvider router={router} />);
  return router;
}

describe("AccessRoute", () => {
  beforeEach(() => { auth.user = undefined; });

  it("permite la ruta del acceso activo", async () => {
    auth.user = { profile: { access: "business" } } as unknown as User;
    open("/org");

    expect(await screen.findByRole("main", { name: "Inicio de organización" })).toBeInTheDocument();
  });

  // El inicio personal es el de siempre, no un link: quien está en su empresa va al inicio de la empresa.
  it("el inicio personal de quien está en su empresa lo manda al inicio de la empresa", async () => {
    auth.user = { profile: { access: "business" } } as unknown as User;
    const router = open("/");

    expect(await screen.findByRole("main", { name: "Inicio de organización" })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe("/org");
  });

  // Un operador no tiene perfiles de persona: un link de una persona lo manda al inicio de Plataforma.
  it("un operador que abre un link de una persona va al inicio de Plataforma", async () => {
    auth.user = { profile: { access: "platform" } } as unknown as User;
    const router = open("/org");

    expect(await screen.findByRole("main", { name: "Plataforma" })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe("/plataforma");
  });
});
