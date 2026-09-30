import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { AuthContext, type AuthContextProps } from "react-oidc-context";
import { MemoryRouter, Route, Routes } from "react-router";
import { ErrorResponse } from "oidc-client-ts";
import { beforeAll, describe, expect, it } from "vitest";
import { configureI18n } from "@/shared/i18n";
import { CallbackPage } from "./CallbackPage";

beforeAll(async () => {
  await configureI18n([
    { code: "es-AR", languageCode: "es", fallbackCulture: null, isEnabled: true, isDefault: true },
    { code: "en-US", languageCode: "en", fallbackCulture: "es-AR", isEnabled: true, isDefault: false },
  ]);
});

function show(auth: Partial<AuthContextProps>) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<AuthContext.Provider value={auth as AuthContextProps}>
    <QueryClientProvider client={queryClient}>
    <MemoryRouter initialEntries={["/auth/callback"]}>
      <Routes>
        <Route path="/auth/callback" element={<CallbackPage />} />
        <Route path="/" element={<p>{"Destino personal"}</p>} />
        <Route path="/org" element={<p>{"Destino empresa"}</p>} />
        <Route path="/catalogo" element={<p>{"Destino catálogo"}</p>} />
      </Routes>
    </MemoryRouter>
    </QueryClientProvider>
  </AuthContext.Provider>);
}

describe("CallbackPage", () => {
  it("muestra el estado Sesión mientras OIDC canjea el código", () => {
    show({ isLoading: true, isAuthenticated: false });
    expect(screen.getByRole("heading", { name: "Iniciando sesión…" })).toBeVisible();
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
  });

  it("muestra la organización del acceso deshabilitado que vuelve de authorize", () => {
    show({ isLoading: false, isAuthenticated: false,
      error: Object.assign(new ErrorResponse({ error: "access_denied",
        error_description: "Tenancy.Member.Inactive|Grupo%20Delta" }), { source: "unknown" as const }) });

    expect(screen.getByRole("heading", { name: "Tu acceso a Grupo Delta está deshabilitado" })).toBeVisible();
    expect(screen.getByRole("link", { name: "Ingresá como persona" })).toHaveAttribute("href", "/login");
  });
});
