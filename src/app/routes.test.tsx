import { screen, waitFor, within } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { server } from "@/test/mocks/server";
import { renderRouteWithProviders } from "@/test/utils/renderWithProviders";
import { routes } from "./routes";
import { ProtectedRoute } from "@/auth/ProtectedRoute";
import { AccessRoute } from "@/auth/AccessRoute";

describe("rutas de ingreso 3a", () => {
  it("declara la portada privada con ProtectedRoute y AccessRoute consumer", () => {
    const app = routes[0];
    const recovery = app.children?.find((route) => route.children?.some((child) => child.path === "/"));
    const home = recovery?.children?.find((route) => route.path === "/");
    const protectedHome = home?.children?.[0];
    const consumerHome = protectedHome?.children?.[0];

    expect(protectedHome?.element).toMatchObject({ type: ProtectedRoute });
    expect(consumerHome?.element).toMatchObject({ type: AccessRoute, props: { access: "consumer" } });
    expect(consumerHome?.children?.[0]?.index).toBe(true);
  });

  it("/ con persona autenticada muestra el inicio personal; /org muestra el de empresa", async () => {
    const personal = renderRouteWithProviders("/", { as: "consumer-empty" });
    expect(await screen.findByRole("link", { name: "Inicio" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("main")).toBeEmptyDOMElement();
    personal.unmount();

    renderRouteWithProviders("/org", { as: "business-admin" });
    expect(await screen.findByRole("link", { name: "Inicio" })).toHaveAttribute("aria-current", "page");
    expect(screen.queryByRole("button", { name: "Administración" })).not.toBeInTheDocument();
    expect(screen.getByRole("main")).toBeEmptyDOMElement();
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
