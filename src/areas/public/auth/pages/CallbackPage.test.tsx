import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { AuthContext, type AuthContextProps } from "react-oidc-context";
import { MemoryRouter, Route, Routes } from "react-router";
import { ErrorResponse } from "oidc-client-ts";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import { configureI18n } from "@/shared/i18n";
import { CallbackPage } from "./CallbackPage";
import { mainSiteUrl, publicSiteHost } from "@/tenancy/publicSite";
import { homeOf } from "@/tenancy/access";
import { PublicSiteHostContext } from "@/tenancy/usePublicSite";

beforeAll(async () => {
  await configureI18n([
    { code: "es-AR", languageCode: "es", fallbackCulture: null, isEnabled: true, isDefault: true },
    { code: "en-US", languageCode: "en", fallbackCulture: "es-AR", isEnabled: true, isDefault: false },
  ]);
});

function show(auth: Partial<AuthContextProps>, host?: string) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<PublicSiteHostContext.Provider value={host}><AuthContext.Provider value={auth as AuthContextProps}>
    <QueryClientProvider client={queryClient}>
    <MemoryRouter initialEntries={["/auth/callback"]}>
      <Routes>
        <Route path="/auth/callback" element={<CallbackPage />} />
        <Route path="/" element={<p>{"Destino personal"}</p>} />
        <Route path="/org" element={<p>{"Destino empresa"}</p>} />
        <Route path="/catalogo" element={<p>{"Destino catálogo"}</p>} />
        <Route path="/plataforma" element={<p>{"Destino Plataforma"}</p>} />
        <Route path="/login" element={<p>{"Otro ingreso personal"}</p>} />
        <Route path="/login/empresa" element={<p>{"Otro ingreso empresa"}</p>} />
      </Routes>
    </MemoryRouter>
    </QueryClientProvider>
  </AuthContext.Provider></PublicSiteHostContext.Provider>);
}

describe("CallbackPage", () => {
  it("la respuesta OIDC validada dentro del error del proveedor muestra la cuenta sin empresa y permite salir", async () => {
    const signoutRedirect = vi.fn(async () => null);
    const innerError = new ErrorResponse({ error: "access_denied", error_description: "Tenancy.Access.NotMember", userState: { returnTo: "/org/usuarios" } });
    show({ isLoading: false, isAuthenticated: false, signoutRedirect: signoutRedirect as unknown as AuthContextProps["signoutRedirect"],
      error: { name: innerError.name, message: innerError.message, source: "signinCallback", innerError } });
    expect(screen.getByRole("heading", { name: "Tu cuenta no está en ninguna empresa todavía" })).toBeVisible();
    expect(screen.queryByText("No pudimos iniciar tu sesión")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Salir", exact: true }));
    expect(await screen.findByText("Otro ingreso empresa")).toBeVisible(); expect(signoutRedirect).toHaveBeenCalledOnce();
    expect(screen.queryByText(/Tenancy\.Access/u)).not.toBeInTheDocument();
  });

  it.each([
    ["Tenancy.Tenant.PendingApproval", "Estamos revisando Grupo Delta"],
    ["Tenancy.Tenant.Suspended", "Grupo Delta está suspendida"],
    ["Tenancy.Tenant.Closed", "Grupo Delta está cerrada"],
  ])("el callback del proveedor muestra el estado empresarial %s sin emitir otra autorización", async (code, title) => {
    const signinRedirect = vi.fn(); const signoutRedirect = vi.fn(async () => null);
    const innerError = new ErrorResponse({ error: "access_denied", error_description: `${code}|Grupo%20Delta`, userState: { returnTo: "/org" } });
    const { container } = show({ isLoading: false, isAuthenticated: false, signinRedirect, signoutRedirect: signoutRedirect as unknown as AuthContextProps["signoutRedirect"],
      error: { name: innerError.name, message: innerError.message, source: "signinCallback", innerError } });
    expect(screen.getByRole("heading", { name: title })).toBeVisible();
    expect(screen.queryByText("No pudimos iniciar tu sesión")).not.toBeInTheDocument(); expect(signinRedirect).not.toHaveBeenCalled();
    expect(screen.getByRole("link", { name: "Ingresá como persona" })).toHaveAttribute("href", "/login");
    expect(await axe(container)).toHaveNoViolations();
    fireEvent.click(screen.getByRole("button", { name: "Salir", exact: true }));
    expect(await screen.findByText("Otro ingreso empresa")).toBeVisible(); expect(signoutRedirect).toHaveBeenCalledOnce();
  });

  it("el error normalizado conserva sólo el retorno validado de OIDC y no interpreta el error de la URL", () => {
    const innerError = new ErrorResponse({ error: "server_error", userState: { returnTo: "/org/usuarios" } });
    show({ isLoading: false, isAuthenticated: false, error: { name: innerError.name, message: innerError.message, source: "signinCallback", innerError } });
    expect(screen.getByRole("link", { name: "Volver a ingresar" })).toHaveAttribute("href", "/login/empresa?prompt=login&returnUrl=%2Forg%2Fusuarios");
  });

  it("el operador rechazado en el subdominio tiene su puerta en el principal y Salir vuelve a la raíz pública", async () => {
    const signoutRedirect = vi.fn(async () => null);
    const error = Object.assign(new ErrorResponse({ error: "access_denied", error_description: "Tenancy.Access.PlatformOnly", userState: { returnTo: "/" } }), { source: "unknown" as const });
    show({ isLoading: false, isAuthenticated: false, error, signoutRedirect: signoutRedirect as unknown as AuthContextProps["signoutRedirect"] }, publicSiteHost("grupo-delta"));
    expect(screen.getByRole("link", { name: "Ir a Plataforma" })).toHaveAttribute("href", mainSiteUrl(homeOf("platform")));
    fireEvent.click(screen.getByRole("button", { name: "Salir" }));
    expect(await screen.findByText("Destino personal")).toBeVisible();
    expect(signoutRedirect).toHaveBeenCalledOnce();
  });

  it("un error del callback público reintenta Consumer conservando el destino del state, sin navegar al login local", async () => {
    const signinRedirect = vi.fn(async () => {});
    const error = Object.assign(new ErrorResponse({ error: "server_error", userState: { returnTo: "/?from=directory#contacto" } }), { source: "unknown" as const });
    show({ isLoading: false, isAuthenticated: false, error, signinRedirect }, publicSiteHost("grupo-delta"));
    fireEvent.click(screen.getByRole("button", { name: "Volver a ingresar" }));
    await waitFor(() => expect(signinRedirect).toHaveBeenCalledExactlyOnceWith({ extraQueryParams: { access: "consumer", prompt: "login" },
      state: { returnTo: "/?from=directory#contacto" } }));
    expect(screen.queryByText("Otro ingreso personal")).not.toBeInTheDocument();
  });

  it.each([
    [undefined, "/login?prompt=login"],
    [{ returnTo: "/org" }, "/login/empresa?prompt=login&returnUrl=%2Forg"],
    [{ returnTo: "https://externo.test/org" }, "/login?prompt=login&returnUrl=%2F"],
  ])("el error genérico permite pedir otro ingreso sin reutilizar la sesión incompatible", (state, href) => {
    const error = state ? new ErrorResponse({ error: "server_error", userState: state }) : new Error("No matching state found in storage");
    show({ isLoading: false, isAuthenticated: false, error: Object.assign(error, { source: "unknown" as const }) });
    expect(screen.getByRole("link", { name: "Volver a ingresar" })).toHaveAttribute("href", href);
  });

  it.each([
    ["/", "Otro ingreso personal", "Sin contraseñas"],
    ["/org", "Otro ingreso empresa", "Para empresas"],
  ])("presenta la cuenta exclusiva de Plataforma y conserva la puerta de %s en el state OIDC", async (returnTo, nextLogin, panel) => {
    const signoutRedirect = vi.fn(async () => null);
    const { container } = show({ isLoading: false, isAuthenticated: false, signoutRedirect: signoutRedirect as unknown as AuthContextProps["signoutRedirect"],
      error: Object.assign(new ErrorResponse({ error: "access_denied", error_description: "Tenancy.Access.PlatformOnly", userState: { returnTo } }), { source: "unknown" as const }) });
    expect(screen.getByRole("heading", { name: "Esta cuenta es de un operador: solo entra a Plataforma" })).toBeVisible();
    expect(screen.queryByText("No pudimos iniciar tu sesión")).not.toBeInTheDocument();
    expect(screen.getByText(panel)).toBeInTheDocument();
    const primary = screen.getByRole("link", { name: "Ir a Plataforma" });
    expect(primary).toHaveAttribute("href", "/plataforma");
    expect(primary).toHaveAttribute("data-variant", "default");
    const leave = screen.getByRole("button", { name: "Salir" });
    expect(leave).toHaveAttribute("data-variant", "outline");
    expect(screen.getByRole("main").querySelector("span[aria-hidden='true'] svg path")).toHaveAttribute("d", "M4 21V5a1 1 0 0 1 1-1h9a1 1 0 0 1 1 1v16");
    expect(await axe(container)).toHaveNoViolations();
    fireEvent.click(leave);
    await waitFor(() => expect(signoutRedirect).toHaveBeenCalledOnce());
    expect(await screen.findByText(nextLogin)).toBeVisible();
  });

  it("Ir a Plataforma abre su inicio y un state externo no cambia la puerta pública", async () => {
    show({ isLoading: false, isAuthenticated: false,
      error: Object.assign(new ErrorResponse({ error: "access_denied", error_description: "Tenancy.Access.PlatformOnly", userState: { returnTo: "https://externo.test/org" } }), { source: "unknown" as const }) });
    fireEvent.click(screen.getByRole("link", { name: "Ir a Plataforma" }));
    expect(await screen.findByText("Destino Plataforma")).toBeVisible();
  });

  it("muestra el estado Sesión mientras OIDC canjea el código", async () => {
    const { container } = show({ isLoading: true, isAuthenticated: false });
    expect(screen.getByRole("heading", { name: "Iniciando sesión…" })).toBeVisible();
    expect(await axe(container)).toHaveNoViolations();
  });

  it("vuelve al destino interno conservado en state, una vez autenticada", async () => {
    show({ isLoading: false, isAuthenticated: true, user: { state: { returnTo: "/catalogo" } } as AuthContextProps["user"] });
    expect(await screen.findByText("Destino catálogo")).toBeVisible();
  });

  it("rechaza un destino externo recibido en state", async () => {
    show({ isLoading: false, isAuthenticated: true, user: { state: { returnTo: "https://evil.example" } } as AuthContextProps["user"] });
    expect(await screen.findByText("Destino personal")).toBeVisible();
    expect(globalThis.location.hostname).not.toBe("evil.example");
  });

  it("muestra el estado de error aprobado sin exponer el código en la interfaz", () => {
    show({ isLoading: false, isAuthenticated: false, error: { ...new Error("code=secret"), message: "code=secret", source: "unknown" } });
    expect(screen.getByRole("heading", { name: "No pudimos iniciar tu sesión" })).toBeVisible();
    expect(screen.queryByText(/code=secret/)).not.toBeInTheDocument();
  });

  it("muestra el estado sin empresa cuando authorize rechaza una cookie vigente", () => {
    show({ isLoading: false, isAuthenticated: false,
      error: Object.assign(new ErrorResponse({ error: "access_denied", error_description: "Tenancy.Access.NotMember" }),
        { source: "unknown" as const }) });

    expect(screen.getByRole("heading", { name: "Tu cuenta no está en ninguna empresa todavía" })).toBeVisible();
    expect(screen.getByRole("link", { name: "Ingresá como persona" })).toHaveAttribute("href", "/login");
    // Tablero Ingreso: el mismo estado que cuando lo dice el código, con «Registrá tu empresa» primero.
    expect(screen.getByRole("link", { name: "Registrá tu empresa" })).toHaveAttribute("data-variant", "default");
    expect(screen.getByRole("link", { name: "Ingresá como persona" })).toHaveAttribute("data-variant", "outline");
  });

  it("muestra la organización del acceso deshabilitado que vuelve de authorize", () => {
    show({ isLoading: false, isAuthenticated: false,
      error: Object.assign(new ErrorResponse({ error: "access_denied",
        error_description: "Tenancy.Member.Inactive|Grupo%20Delta" }), { source: "unknown" as const }) });

    expect(screen.getByRole("heading", { name: "Tu acceso a Grupo Delta está deshabilitado" })).toBeVisible();
    expect(screen.getByRole("link", { name: "Ingresá como persona" })).toHaveAttribute("href", "/login");
    expect(screen.getByRole("link", { name: "Registrá tu empresa" })).toHaveAttribute("data-variant", "outline");
  });
});
