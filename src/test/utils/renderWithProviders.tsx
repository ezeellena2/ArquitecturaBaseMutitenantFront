import { QueryClient } from "@tanstack/react-query";
import { render } from "@testing-library/react";
import type { ReactElement, ReactNode } from "react";
import type { User } from "oidc-client-ts";
import type { AuthContextProps } from "react-oidc-context";
import { RouterProvider, createMemoryRouter } from "react-router";
import { AppProviders } from "@/app/providers";
import { routes } from "@/app/routes";
import { currentUsers, type CurrentUserFixture } from "../mocks/currentUsers";
import { meHandlerFor } from "../mocks/handlers";
import { server } from "../mocks/server";

function fixtureAuth(as: CurrentUserFixture): AuthContextProps {
  const fixture = currentUsers[as];
  const user = {
    access_token: `test-${as}`,
    profile: { sub: fixture.id, access: fixture.access, tenant_id: fixture.activeTenantId },
  } as unknown as User;
  return {
    isAuthenticated: true,
    isLoading: false,
    user,
    signinSilent: async () => user,
    signinRedirect: async () => {},
    signoutRedirect: async () => {},
  } as unknown as AuthContextProps;
}

function anonymousAuth(): AuthContextProps {
  return {
    isAuthenticated: false,
    isLoading: false,
    user: undefined,
    signinSilent: async () => { throw new Error("login_required"); },
    signinRedirect: async () => {},
    signoutRedirect: async () => {},
  } as unknown as AuthContextProps;
}

/// Renderiza con los mismos providers que la app: traducciones y datos.
/// Cada render entrega un QueryClient nuevo a todos los providers, incluido el catálogo inicial,
/// y sin reintentos para que un error llegue derecho a la aserción.
export function renderWithProviders(ui: ReactElement, options?: { as?: CurrentUserFixture }) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  if (options?.as) server.use(meHandlerFor(currentUsers[options.as]));
  const authContext = options?.as ? fixtureAuth(options.as) : anonymousAuth();

  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <AppProviders client={queryClient} authContext={authContext}>{children}</AppProviders>
    );
  }

  return render(ui, { wrapper: Wrapper });
}

/// Renderiza la app entera en una ruta concreta, con los providers reales. Devuelve también el router, para
/// saber dónde terminó una navegación o para moverse como lo haría el navegador (`router.navigate`).
export function renderRouteWithProviders(path: string, options?: { state?: unknown; as?: CurrentUserFixture }) {
  const router = createMemoryRouter(routes, {
    initialEntries: [
      {
        pathname: path.split("?")[0],
        search: path.includes("?") ? `?${path.split("?")[1]}` : "",
        state: options?.state,
      },
    ],
  });

  return {
    router,
    ...renderWithProviders(<RouterProvider router={router} />, options),
  };
}
