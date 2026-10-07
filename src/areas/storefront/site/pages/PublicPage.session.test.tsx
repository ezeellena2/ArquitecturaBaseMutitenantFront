import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import type { User } from "oidc-client-ts";
import type { AuthContextProps } from "react-oidc-context";
import { createMemoryRouter, RouterProvider } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AppProviders } from "@/app/providers";
import { currentUserQueryKey } from "@/auth/useCurrentUser";
import { cancelSignOut } from "@/auth/signOutStatus";
import { createQueryClient } from "@/shared/api/queryClient";
import { configureI18n } from "@/shared/i18n";
import type { MeResponse, PublicSiteResponse } from "@/shared/api/types";
import { homeOf } from "@/tenancy/access";
import { mainSiteUrl, publicSiteHost } from "@/tenancy/publicSite";
import { PublicSiteHostContext } from "@/tenancy/usePublicSite";
import { consumerWithOrganizations } from "@/test/mocks/currentUsers";
import { referenceDataFixture } from "@/test/mocks/handlers";
import { server } from "@/test/mocks/server";
import { asPhone } from "@/test/utils/phone";
import { PublicPage } from "./PublicPage";

const host = publicSiteHost("grupo-delta");
const publicPage: PublicSiteResponse = { slug: "grupo-delta", name: "Grupo Delta", description: null, logoUrl: null,
  address: null, phone: null, email: null, website: null };

beforeEach(async () => {
  await configureI18n(referenceDataFixture().cultures);
  server.use(http.get("/api/public-site", () => HttpResponse.json(publicPage)));
});
afterEach(() => { cancelSignOut(); vi.unstubAllGlobals(); });

function show(account?: MeResponse, path = "/?from=directory#contacto") {
  const client = createQueryClient({ queries: { retry: false }, mutations: { retry: false } });
  const signinRedirect = vi.fn(async () => {});
  const signinSilent = vi.fn(async () => ({ access_token: "business", profile: { access: "business", tenant_id: "empresa-a" } } as unknown as User));
  const signoutRedirect = vi.fn(async () => null);
  const auth = { isAuthenticated: Boolean(account), isLoading: false,
    user: account ? { access_token: "personal", profile: { sub: account.id, access: "consumer" } } : undefined,
    signinRedirect, signinSilent, signoutRedirect } as unknown as AuthContextProps;
  if (account) {
    client.setQueryData(currentUserQueryKey, account);
    server.use(http.get("/api/me", () => HttpResponse.json(account)));
  }
  const router = createMemoryRouter([{ path: "/", element: <PublicPage /> }], { initialEntries: [path] });
  const view = render(<PublicSiteHostContext.Provider value={host}>
    <AppProviders client={client} authContext={auth}><RouterProvider router={router} /></AppProviders>
  </PublicSiteHostContext.Provider>);
  return { ...view, router, client, auth, signinRedirect, signinSilent, signoutRedirect, user: userEvent.setup() };
}

describe("PublicPage: ingreso y menú global", () => {
  it("el CTA inicia Consumer con la ruta, búsqueda y fragmento actuales como retorno del callback propio", async () => {
    const { user, signinRedirect, router } = show();
    await screen.findByRole("heading", { name: publicPage.name });
    await user.click(screen.getByRole("button", { name: "Ingresá para continuar" }));
    expect(signinRedirect).toHaveBeenCalledExactlyOnceWith({ extraQueryParams: { access: "consumer" },
      state: { returnTo: "/?from=directory#contacto" } });
    expect(router.state.location.pathname).toBe("/");
    expect(screen.queryByRole("button", { name: "Ana, Personal" })).not.toBeInTheDocument();
  });

  it("con sesión oculta el CTA, marca Personal, enlaza Mi cuenta al principal y cierra por useSignOut hacia el origen propio", async () => {
    const { user, client, signoutRedirect, unmount } = show(consumerWithOrganizations);
    await screen.findByRole("heading", { name: publicPage.name });
    expect(screen.queryByText("Ingresá para continuar")).not.toBeInTheDocument();
    (await screen.findByRole("button", { name: "Ana, Personal" })).focus();
    await user.keyboard("{Enter}");
    const menu = screen.getByRole("menu");
    expect(within(menu).getByRole("menuitemradio", { name: /Personal.*Tu perfil personal/ })).toHaveAttribute("aria-checked", "true");
    expect(within(menu).getByRole("menuitemradio", { name: /Empresa A/ })).toHaveAttribute("aria-checked", "false");
    expect(within(menu).getByRole("menuitem", { name: "Mi cuenta" })).toHaveAttribute("href", mainSiteUrl("/cuenta"));
    client.setQueryData(["private-before-signout"], { value: 1 });
    await user.click(within(menu).getByRole("menuitem", { name: "Salir" }));
    await waitFor(() => expect(signoutRedirect).toHaveBeenCalledExactlyOnceWith({ post_logout_redirect_uri: `${globalThis.location.origin}/` }));
    expect(client.getQueryData(["private-before-signout"])).toBeUndefined();
    unmount();
    // El redirect de salida recarga la raíz sin usuario en memoria.
    show(undefined, "/");
    expect(await screen.findByRole("button", { name: "Ingresá para continuar" })).toBeVisible();
    expect(screen.queryByRole("button", { name: "Ana, Personal" })).not.toBeInTheDocument();
  });

  it("seleccionar una organización usa el cambio central y abre su inicio en el principal", async () => {
    const { user, client, signinSilent } = show(consumerWithOrganizations);
    const assign = vi.fn();
    vi.stubGlobal("location", { ...globalThis.location, assign });
    (await screen.findByRole("button", { name: "Ana, Personal" })).focus();
    await user.keyboard("{Enter}");
    client.setQueryData(["private-before-switch"], { value: 1 });
    await user.click(screen.getByRole("menuitemradio", { name: /Empresa A/ }));
    await waitFor(() => expect(assign).toHaveBeenCalledExactlyOnceWith(mainSiteUrl(homeOf("business"))));
    expect(signinSilent).toHaveBeenCalledExactlyOnceWith({ forceIframeAuth: true, extraQueryParams: { access: "business", tenant: "empresa-a" } });
    expect(client.getQueryData(["private-before-switch"])).toBeUndefined();
  });

  it("en el teléfono Tu cuenta abre la misma hoja con manija, Personal activo y Mi cuenta en el principal", async () => {
    const restore = asPhone();
    try {
      const { user } = show(consumerWithOrganizations);
      await screen.findByRole("heading", { name: publicPage.name });
      expect(screen.queryByText("Ingresá para continuar")).not.toBeInTheDocument();
      await user.click(await screen.findByRole("button", { name: "Tu cuenta" }));
      const sheet = screen.getByRole("dialog", { name: "Menú de Ana" });
      expect(sheet.querySelector("[data-slot=dialog-handle]")).not.toBeNull();
      expect(within(sheet).getByRole("button", { name: /Personal.*Tu perfil personal/ })).toHaveAttribute("aria-pressed", "true");
      expect(within(sheet).getByRole("link", { name: "Mi cuenta" })).toHaveAttribute("href", mainSiteUrl("/cuenta"));
      expect(within(sheet).getByRole("button", { name: "Salir" })).toBeVisible();
      expect(screen.queryByRole("navigation")).not.toBeInTheDocument();
    } finally { restore(); }
  });
});
