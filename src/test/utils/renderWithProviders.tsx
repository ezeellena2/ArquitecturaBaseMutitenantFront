import { QueryClient } from "@tanstack/react-query";
import { render } from "@testing-library/react";
import type { ReactElement, ReactNode } from "react";
import { RouterProvider, createMemoryRouter } from "react-router";
import { AppProviders } from "@/app/providers";
import { routes } from "@/app/routes";

/// Renderiza con los mismos providers que la app: traducciones y datos.
/// Cada render entrega un QueryClient nuevo a todos los providers, incluido el catálogo inicial,
/// y sin reintentos para que un error llegue derecho a la aserción.
export function renderWithProviders(ui: ReactElement) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });

  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <AppProviders client={queryClient}>{children}</AppProviders>
    );
  }

  return render(ui, { wrapper: Wrapper });
}

/// Renderiza la app entera en una ruta concreta, con los providers reales. Devuelve también el router, para
/// saber dónde terminó una navegación o para moverse como lo haría el navegador (`router.navigate`).
export function renderRouteWithProviders(path: string, options?: { state?: unknown }) {
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
    ...renderWithProviders(<RouterProvider router={router} />),
  };
}
