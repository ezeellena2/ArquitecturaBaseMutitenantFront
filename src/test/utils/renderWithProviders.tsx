import { render } from "@testing-library/react";
import type { ReactElement, ReactNode } from "react";
import type { AuthContextProps } from "react-oidc-context";
import { RouterProvider, createMemoryRouter } from "react-router";
import { AppProviders } from "@/app/providers";
import { routes } from "@/app/routes";
import { createQueryClient } from "@/shared/api/queryClient";
import { currentUsers, type CurrentUserFixture } from "../mocks/currentUsers";
import { fixtureAuth } from "../mocks/authContext";
import { meHandlerFor } from "../mocks/handlers";
import { server } from "../mocks/server";

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
/// Cada render entrega un QueryClient nuevo a todos los providers, incluido el catálogo inicial, con los mismos
/// avisos de error que la app y sin reintentos para que un error llegue derecho a la aserción. Devuelve también ese
/// cliente, para provocar una relectura de fondo, como la de volver a la pestaña (`invalidateQueries`).
export function renderWithProviders(ui: ReactElement, options?: { as?: CurrentUserFixture }) {
  const queryClient = createQueryClient({ queries: { retry: false }, mutations: { retry: false } });
  if (options?.as) server.use(meHandlerFor(currentUsers[options.as]));
  const authContext = options?.as ? fixtureAuth(options.as) : anonymousAuth();

  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <AppProviders client={queryClient} authContext={authContext}>{children}</AppProviders>
    );
  }

  return { ...render(ui, { wrapper: Wrapper }), queryClient };
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
