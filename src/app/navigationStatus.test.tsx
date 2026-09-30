import { QueryClient } from "@tanstack/react-query";
import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import type { AuthContextProps } from "react-oidc-context";
import { createMemoryRouter, RouterProvider } from "react-router";
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import { AppProviders } from "./providers";
import { routes } from "./routes";
import { cancelSignOut } from "@/auth/signOutStatus";
import { configureI18n } from "@/shared/i18n";
import { fixtureAuth } from "@/test/mocks/authContext";
import { businessUser, consumerWithoutOrganizations } from "@/test/mocks/currentUsers";
import { meHandlerFor } from "@/test/mocks/handlers";
import { server } from "@/test/mocks/server";

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((complete) => { resolve = complete; });
  return { promise, resolve };
}

beforeAll(async () => {
  await configureI18n([{ code: "es-AR", languageCode: "es", fallbackCulture: null, isEnabled: true, isDefault: true }]);
});
afterEach(() => cancelSignOut());

describe("navegación OIDC transitoria", () => {
  it("mantiene Cambiando a Personal durante isLoading y muestra el error si signinSilent devuelve null", async () => {
    server.use(meHandlerFor(businessUser));
    const pending = deferred<null>();
    const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
    const router = createMemoryRouter(routes, { initialEntries: ["/org"] });
    const base = fixtureAuth("business-admin");
    function LiveAuth() {
      const [isLoading, setIsLoading] = useState(false);
      const context = {
        ...base,
        isLoading,
        signinSilent: async () => {
          setIsLoading(true);
          const result = await pending.promise;
          setIsLoading(false);
          return result;
        },
      } as unknown as AuthContextProps;
      return <AppProviders client={client} authContext={context}><RouterProvider router={router} /></AppProviders>;
    }
    const user = userEvent.setup();
    render(<LiveAuth />);

    (await screen.findByRole("button", { name: "Ana, Empresa A" })).focus();
    await user.keyboard("{Enter}");
    await user.click(within(await screen.findByRole("menu")).getByRole("menuitemradio", { name: /Personal/ }));
    expect(await screen.findByRole("heading", { name: "Cambiando a Personal…" })).toBeVisible();
    expect(router.state.location.pathname).toBe("/org");

    await act(async () => pending.resolve(null));
    expect(await screen.findByRole("heading", { name: "No pudimos iniciar tu sesión" })).toBeVisible();
    expect(screen.getByRole("link", { name: "Volver a ingresar" })).toHaveAttribute("href", "/login/empresa");
  });

  it("mantiene Cerrando sesión durante isLoading y vuelve a la pantalla si el wrapper devuelve null", async () => {
    server.use(meHandlerFor(consumerWithoutOrganizations));
    const pending = deferred<null>();
    const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
    const router = createMemoryRouter(routes, { initialEntries: ["/"] });
    const base = fixtureAuth("consumer-empty");
    function LiveAuth() {
      const [isLoading, setIsLoading] = useState(false);
      const context = {
        ...base,
        isLoading,
        signoutRedirect: async () => {
          setIsLoading(true);
          const result = await pending.promise;
          setIsLoading(false);
          return result;
        },
      } as unknown as AuthContextProps;
      return <AppProviders client={client} authContext={context}><RouterProvider router={router} /></AppProviders>;
    }
    const user = userEvent.setup();
    render(<LiveAuth />);

    (await screen.findByRole("button", { name: "Ana, Personal" })).focus();
    await user.keyboard("{Enter}");
    await user.click(within(await screen.findByRole("menu")).getByRole("menuitem", { name: "Salir" }));
    expect(await screen.findByRole("heading", { name: "Cerrando sesión…" })).toBeVisible();
    expect(screen.queryByRole("heading", { name: "Iniciando sesión…" })).not.toBeInTheDocument();

    await act(async () => pending.resolve(null));
    await waitFor(() => expect(screen.getByRole("link", { name: "Inicio" })).toBeVisible());
  });
});
