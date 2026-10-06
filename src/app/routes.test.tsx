import { render, screen, waitFor, within } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { server } from "@/test/mocks/server";
import { renderRouteWithProviders } from "@/test/utils/renderWithProviders";
import { createMemoryRouter, RouterProvider } from "react-router";
import type { LazyRouteFunction, RouteObject } from "react-router";
import { routes, createPlatformPageRoutes, platformPages, type PlatformPages } from "./routes";
import { AppProviders } from "./providers";
import { createQueryClient } from "@/shared/api/queryClient";
import { fixtureAuth } from "@/test/mocks/authContext";
import type { MeResponse } from "@/shared/api/types";
import { currentUsers, platformOperator } from "@/test/mocks/currentUsers";
import { meHandlerFor } from "@/test/mocks/handlers";
import { platformRoutes } from "@/layouts/navigation/platform";
import { PlatformLayout } from "@/layouts/PlatformLayout";
import { ProtectedRoute } from "@/auth/ProtectedRoute";
import { AccessRoute } from "@/auth/AccessRoute";
import { LegalAcceptanceGate } from "@/auth/LegalAcceptanceGate";
import { businessRoutes } from "@/layouts/navigation/business";
import type { AppRoute } from "@/layouts/navigation/types";

describe("rutas de ingreso 3a", () => {
  it("declara la portada privada con ProtectedRoute y AccessRoute consumer", () => {
    const app = routes[0];
    const recovery = app.children?.find((route) => route.children?.some((child) => child.path === "/"));
    const home = recovery?.children?.find((route) => route.path === "/");
    const protectedHome = home?.children?.[0];
    const legalGate = protectedHome?.children?.[0];
    const consumerHome = legalGate?.children?.[0];

    expect(protectedHome?.element).toMatchObject({ type: ProtectedRoute });
    expect(legalGate?.element).toMatchObject({ type: LegalAcceptanceGate });
    expect(consumerHome?.element).toMatchObject({ type: AccessRoute, props: { access: "consumer" } });
    expect(consumerHome?.children?.[0]?.index).toBe(true);
  });

  it("/ con persona autenticada muestra el inicio personal; /org muestra el de empresa", async () => {
    const personal = renderRouteWithProviders("/", { as: "consumer-empty" });
    expect(await screen.findByRole("link", { name: "Inicio" })).toHaveAttribute("aria-current", "page");
    // Tablero Inicio-Personal: solo la banda «Inicio».
    expect(screen.getByRole("main")).toHaveTextContent(/^Inicio$/);
    personal.unmount();

    renderRouteWithProviders("/org", { as: "business-admin" });
    expect(await screen.findByRole("link", { name: "Inicio" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("button", { name: "Administración" })).toBeVisible();
    // Tablero Inicio-Org: la banda «Inicio» con la organización (ADR 0040).
    expect(within(screen.getByRole("main")).getByRole("heading", { level: 1, name: "Inicio" })).toBeVisible();
  });

  it.each([
    ["visual-unavailable-suspended", "Beta S.R.L. está suspendida"],
    ["visual-unavailable-pending", "Estamos revisando Grupo Delta"],
    ["visual-unavailable-closed", "Beta S.R.L. está cerrada"],
  ] as const)("/org muestra el estado real %s leído de /api/me aunque ninguna otra consulta falle", async (as, title) => {
    renderRouteWithProviders("/org", { as });
    expect(await screen.findByRole("heading", { name: title })).toBeVisible();
    expect(screen.queryByRole("complementary", { name: "Navegación principal" })).not.toBeInTheDocument();
  });

  it("corrige con replace una URL de otro acceso hacia su inicio", async () => {
    const consumer = renderRouteWithProviders("/org", { as: "consumer-with-organizations" });
    await waitFor(() => expect(consumer.router.state.location.pathname).toBe("/"));
    consumer.unmount();

    const business = renderRouteWithProviders("/", { as: "business-admin" });
    await waitFor(() => expect(business.router.state.location.pathname).toBe("/org"));
  });

  it("monta portada, registro, callback y páginas legales como rutas públicas", async () => {
    const landing = renderRouteWithProviders("/");
    expect(await screen.findByRole("heading", { name: /Para vos y para tu empresa/i })).toBeVisible();
    expect(screen.getByRole("link", { name: "Términos" })).toHaveAttribute("href", "/terminos");
    landing.unmount();

    const signup = renderRouteWithProviders("/registro");
    expect(await screen.findByRole("heading", { name: "Creá tu cuenta" })).toBeVisible();
    signup.unmount();

    const callback = renderRouteWithProviders("/auth/callback");
    expect(await screen.findByRole("heading", { name: "Iniciando sesión…" })).toBeVisible();
    callback.unmount();

    server.use(http.get("/api/legal/terms", () => HttpResponse.json({ id: "terms", kind: "Terms", version: 1, effectiveAtUtc: "2026-09-01T15:00:00Z", culture: "es-AR", text: "Texto vigente" })));
    const legal = renderRouteWithProviders("/terminos");
    expect(await screen.findByRole("heading", { name: "Términos y condiciones" })).toBeVisible();
    legal.unmount();
  });

  // F5: el permiso de cada ruta se declara una vez, en el manifiesto, y lo aplica la ruta; la pantalla no lo repite.
  it.each(Object.entries<AppRoute>(businessRoutes).filter(([, route]) => route.permission !== undefined))(
    "la ruta %s pide el permiso de su manifiesto: sin él, «No tenés permiso» dentro de la organización", async (_name, route) => {
      renderRouteWithProviders(route.path.replaceAll(/:\w+/g, "x"), { as: "business-no-permissions" });

      expect(await screen.findByRole("heading", { name: "No tenés permiso para ver esta página" })).toBeVisible();
      expect(screen.getByRole("complementary", { name: "Navegación principal" })).toBeVisible();
    });

  it("monta 403 y 404 con retorno al inicio del acceso", async () => {
    const denied = renderRouteWithProviders("/sin-permiso", { as: "business-admin" });
    expect(await screen.findByRole("heading", { name: "No tenés permiso para ver esta página" })).toBeVisible();
    expect(screen.getByRole("complementary", { name: "Navegación principal" })).toBeVisible();
    expect(within(screen.getByRole("complementary", { name: "Navegación principal" })).getByText("Empresa A")).toBeVisible();
    denied.unmount();

    renderRouteWithProviders("/no-existe", { as: "business-admin" });
    expect(await screen.findByRole("heading", { name: "No encontramos esta página" })).toBeVisible();
    expect(screen.getByRole("complementary", { name: "Navegación principal" })).toBeVisible();
    expect(screen.getByRole("link", { name: "Ir al inicio" })).toHaveAttribute("href", "/org");
  });
});

// Las pantallas reales se agregan en T21–T23. Estas páginas sólo existen en el router de prueba para comprobar el marco.
const testPages = Object.keys(platformRoutes).reduce((pages, key) => {
  const name = key as keyof typeof platformRoutes;
  pages[name] = async () => ({ Component: () => <h1>{name}</h1> });
  return pages;
}, {} as Record<keyof typeof platformRoutes, LazyRouteFunction<RouteObject>>);

function platformRouter(path: string, pages: PlatformPages = testPages, account: MeResponse = platformOperator, production = false) {
  const router = createMemoryRouter(production ? routes : [{ path: "/plataforma", element: <PlatformLayout />, children: createPlatformPageRoutes(pages) }], { initialEntries: [path] });
  server.use(meHandlerFor(account));
  const queryClient = createQueryClient({ queries: { retry: false }, mutations: { retry: false } });
  return { router, ...render(<AppProviders client={queryClient} authContext={fixtureAuth("platform-operator")}><RouterProvider router={router} /></AppProviders>) };
}

describe("las rutas del marco de Plataforma", () => {
  it("T21c monta Organizaciones y su ficha lazy; las demás features conservan sólo su manifiesto", async () => {
    expect(Object.keys(platformPages)).toEqual(["organizations", "organization"]);
    const available = createPlatformPageRoutes(platformPages);
    expect(available).toHaveLength(2);
    expect(available[0].children?.[0]).toMatchObject({ index: true, lazy: platformPages.organizations });
    const page = platformPages.organizations;
    expect(typeof page).toBe("function");
    if (typeof page === "function") expect(await page()).toHaveProperty("Component");
    expect(available[1].children?.[0]).toMatchObject({ path: platformRoutes.organization.path, lazy: platformPages.organization });
    const detail = platformPages.organization;
    expect(typeof detail).toBe("function");
    if (typeof detail === "function") expect(await detail()).toHaveProperty("Component");
    expect(available.flatMap((route) => route.children ?? []).some((route) => route.path === platformRoutes.account.path)).toBe(false);
  });
  it("cada destino declara el permiso del contrato de Plataforma", () => {
    expect(Object.fromEntries(Object.values(platformRoutes).map((route) => [route.path, route.platformPermission]))).toEqual({
      "/plataforma": "platform.tenants.read",
      "/plataforma/organizaciones/:id": "platform.tenants.read",
      "/plataforma/cuentas": "platform.accounts.read",
      "/plataforma/cuentas/:id": "platform.accounts.read",
      "/plataforma/recuperaciones": "platform.recoveries.manage",
      "/plataforma/legales": "platform.legal.manage",
      "/plataforma/legales/nueva": "platform.legal.manage",
      "/plataforma/auditoria": "platform.audit.read",
      "/plataforma/configuracion": "platform.settings.manage",
    });
  });
  it("el inicio real sin permisos muestra Sin permiso dentro del marco", async () => {
    platformRouter("/plataforma", {}, { ...platformOperator, effectivePermissions: { platform: [], organization: [], companies: {} } }, true);
    expect(await screen.findByRole("heading", { name: "No tenés permiso para ver esta página" })).toBeVisible();
    expect(screen.getByRole("complementary", { name: "Navegación principal" })).toBeVisible();
  });
  it("no monta pantallas que todavía no existen", () => {
    const pending = createPlatformPageRoutes({});
    expect(pending).toHaveLength(1);
    expect(pending[0].children).toMatchObject([{ index: true }]);
    expect(pending[0].children?.some((route) => route.lazy || route.path)).toBe(false);
    const paths = createPlatformPageRoutes(platformPages).flatMap((route) => route.children ?? []).filter((route) => route.path).map((route) => route.path);
    expect(paths).toEqual(Object.keys(platformPages).filter((name) => name !== "organizations")
      .map((name) => platformRoutes[name as keyof typeof platformRoutes].path));
  });

  it("mientras no existen páginas, un operador autorizado conserva sólo el Outlet del marco", async () => {
    platformRouter("/plataforma", {});
    expect(await screen.findByRole("button", { name: "Gestión" })).toBeVisible();
    expect(screen.getByRole("main")).toBeEmptyDOMElement();
  });

  it.each(Object.entries<AppRoute>(platformRoutes))("la ruta %s exige el permiso de su manifiesto", async (_name, route) => {
    platformRouter(route.path.replaceAll(/:\w+/g, "x"), testPages, { ...platformOperator, permissions: [], effectivePermissions: { platform: [], organization: [], companies: {} } });
    expect(await screen.findByRole("heading", { name: "No tenés permiso para ver esta página" })).toBeVisible();
    expect(screen.getByRole("complementary", { name: "Navegación principal" })).toBeVisible();
  });

  it("Publicar versión nueva exige legal.manage, aunque se pueda leer cuentas", async () => {
    platformRouter("/plataforma/legales/nueva", testPages, currentUsers["platform-operator-reader"]);
    expect(platformRoutes.newLegal.platformPermission).toBe("platform.legal.manage");
    expect(await screen.findByRole("heading", { name: "No tenés permiso para ver esta página" })).toBeVisible();
  });

  it("sin tenants.read, Inicio lleva a la primera pantalla permitida disponible", async () => {
    const { router } = platformRouter("/plataforma", { accounts: testPages.accounts, audit: testPages.audit },
      { ...platformOperator, effectivePermissions: { platform: ["platform.accounts.read", "platform.audit.read"], organization: [], companies: {} } });
    expect(await screen.findByRole("heading", { name: "accounts" })).toBeVisible();
    expect(router.state.location.pathname).toBe("/plataforma/cuentas");
    expect(router.state.historyAction).toBe("REPLACE");
  });

  it("sin ninguna pantalla permitida, Inicio muestra Sin permiso", async () => {
    platformRouter("/plataforma", testPages, { ...platformOperator, effectivePermissions: { platform: ["platform.operators.manage"], organization: [], companies: {} } });
    expect(await screen.findByRole("heading", { name: "No tenés permiso para ver esta página" })).toBeVisible();
  });
});
