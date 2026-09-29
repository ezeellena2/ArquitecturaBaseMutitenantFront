import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { I18nextProvider } from "react-i18next";
import { createMemoryRouter, MemoryRouter, RouterProvider } from "react-router";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthContext, type AuthContextProps } from "react-oidc-context";
import { HttpResponse, http } from "msw";
import { routes } from "@/app/routes";
import { ApiError } from "@/shared/api/ApiError";
import { publishAccessError, clearAccessError } from "@/shared/api/accessErrorStore";
import i18n, { configureI18n } from "@/shared/i18n";
import { server } from "@/test/mocks/server";
import { AppShell } from "./AppShell";

beforeAll(async () => {
  await configureI18n([
    { code: "es-AR", languageCode: "es", fallbackCulture: null, isEnabled: true, isDefault: true },
    { code: "en-US", languageCode: "en", fallbackCulture: "es-AR", isEnabled: true, isDefault: false },
  ]);
});

afterEach(() => { vi.restoreAllMocks(); clearAccessError(); });

function renderShell(onReload = vi.fn()) {
  render(
    <I18nextProvider i18n={i18n}>
      <AppShell onReload={onReload}><main>{"Contenido"}</main></AppShell>
    </I18nextProvider>,
  );
  return onReload;
}

describe("AppShell", () => {
  it("muestra la franja al perder conexión y la quita sola al volver", () => {
    renderShell();
    expect(screen.getByText("Contenido")).toBeInTheDocument();
    expect(screen.queryByText("Sin conexión")).not.toBeInTheDocument();

    act(() => window.dispatchEvent(new Event("offline")));
    expect(screen.getByRole("status", { name: "Sin conexión" })).toBeInTheDocument();

    act(() => window.dispatchEvent(new Event("online")));
    expect(screen.queryByText("Sin conexión")).not.toBeInTheDocument();
  });

  it("respeta el estado inicial sin conexión del navegador", () => {
    vi.spyOn(navigator, "onLine", "get").mockReturnValue(false);
    renderShell();
    expect(screen.getByRole("status", { name: "Sin conexión" })).toBeInTheDocument();
  });

  it("propaga el error de Vite y ofrece Actualizar sin recargar solo", async () => {
    const onReload = renderShell();
    const event = new CustomEvent("vite:preloadError", { cancelable: true, detail: new Error("chunk") });

    act(() => window.dispatchEvent(event));

    expect(event.defaultPrevented).toBe(false);
    expect(screen.getByRole("status", { name: /Hay una versión nueva/ })).toBeInTheDocument();
    expect(onReload).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole("button", { name: "Actualizar" }));
    expect(onReload).toHaveBeenCalledOnce();
  });

  it("contiene un fallo al pintar contenido con una acción manual traducida", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const onReload = vi.fn();
    function Broken(): never { throw new Error("chunk"); }
    const { container } = render(<I18nextProvider i18n={i18n}>
      <AppShell onReload={onReload}><Broken /></AppShell>
    </I18nextProvider>);

    expect(screen.getByRole("heading", { name: "No pudimos abrir esta pantalla" })).toBeInTheDocument();
    expect(await axe(container)).toHaveNoViolations();
    expect(onReload).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole("button", { name: "Actualizar" }));
    expect(onReload).toHaveBeenCalledOnce();
  });

  it("muestra la misma recuperación si falla la carga de una ruta", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const router = createMemoryRouter([{
      ...routes[0],
      loader: () => { throw new Error("chunk"); },
    }], { initialEntries: ["/"] });
    render(<I18nextProvider i18n={i18n}><RouterProvider router={router} /></I18nextProvider>);

    expect(await screen.findByRole("heading", { name: "No pudimos abrir esta pantalla" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Actualizar" })).toBeInTheDocument();
  });

  it("muestra la organización suspendida con su nombre del ProblemDetails", () => {
    const client = new QueryClient();
    const auth = { isAuthenticated: true, user: { profile: { access: "business" } } } as unknown as AuthContextProps;
    render(<I18nextProvider i18n={i18n}><AuthContext.Provider value={auth}><QueryClientProvider client={client}>
      <MemoryRouter><AppShell><main>{"Contenido"}</main></AppShell></MemoryRouter>
    </QueryClientProvider></AuthContext.Provider></I18nextProvider>);
    act(() => publishAccessError(new ApiError(403, { code: "Tenancy.Tenant.Suspended", organizationName: "Beta S.R.L.", tenantId: "beta" })));
    expect(screen.getByRole("heading", { name: "Beta S.R.L. está suspendida" })).toBeVisible();
    expect(screen.queryByText("Contenido")).not.toBeInTheDocument();
  });

  it("carga los otros perfiles desde /api/me pese al 403 de organización suspendida", async () => {
    server.use(http.get("/api/me", () => HttpResponse.json({
      id: "ana", displayName: "Ana", email: "ana@example.test", access: "business",
      activeTenantId: "beta", hasPersonalSpace: true, permissions: [], culture: "es-AR",
      timeZoneId: "America/Argentina/Buenos_Aires", currencyCode: "ARS",
      organizations: [
        { id: "beta", name: "Beta S.R.L.", roleName: null, status: "Suspended", memberStatus: "Active", isSelectable: false },
        { id: "delta", name: "Grupo Delta", roleName: null, status: "Active", memberStatus: "Active", isSelectable: true },
      ],
    })));
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const auth = { isAuthenticated: true, user: { profile: { access: "business" } } } as unknown as AuthContextProps;
    render(<I18nextProvider i18n={i18n}><AuthContext.Provider value={auth}><QueryClientProvider client={client}>
      <MemoryRouter><AppShell><main>{"Contenido"}</main></AppShell></MemoryRouter>
    </QueryClientProvider></AuthContext.Provider></I18nextProvider>);
    act(() => publishAccessError(new ApiError(403, { code: "Tenancy.Tenant.Suspended", organizationName: "Beta S.R.L.", tenantId: "beta" })));
    expect(await screen.findByRole("button", { name: /Grupo Delta/ })).toBeVisible();
    expect(screen.getByRole("button", { name: /Personal.*Tu perfil personal/ })).toBeVisible();
    expect(screen.queryByRole("button", { name: /Beta S.R.L./ })).not.toBeInTheDocument();
  });

  it("muestra un 403 genérico y limpia el bloqueo al volver al inicio", async () => {
    render(<I18nextProvider i18n={i18n}><MemoryRouter>
      <AppShell><main>{"Contenido"}</main></AppShell>
    </MemoryRouter></I18nextProvider>);
    act(() => publishAccessError(new ApiError(403, { code: "Authorization.Forbidden" })));
    expect(screen.getByRole("heading", { name: "No tenés permiso para ver esta página" })).toBeVisible();
    await userEvent.click(screen.getByRole("link", { name: "Ir al inicio" }));
    expect(screen.getByText("Contenido")).toBeVisible();
  });
});
