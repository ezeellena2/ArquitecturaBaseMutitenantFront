import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { HttpResponse, http } from "msw";
import type { ReactNode } from "react";
import { AuthContext, type AuthContextProps } from "react-oidc-context";
import { MemoryRouter } from "react-router";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import { changeCulture, configureI18n } from "@/shared/i18n";
import { server } from "@/test/mocks/server";
import { SignupPage } from "./SignupPage";

vi.mock("@/shared/time/browserTimeZone", () => ({ browserTimeZone: () => "America/Argentina/Buenos_Aires" }));

beforeAll(async () => {
  await configureI18n([
    { code: "es-AR", languageCode: "es", fallbackCulture: null, isEnabled: true, isDefault: true },
    { code: "en-US", languageCode: "en", fallbackCulture: "es-AR", isEnabled: true, isDefault: false },
  ]);
});

const signinRedirect = vi.fn(() => Promise.resolve());
beforeEach(() => server.use(
  http.get("/api/auth/methods", () => HttpResponse.json({ channels: [{ key: "email", countries: [] }, { key: "google", countries: [] }] })),
  http.get("/api/auth/external/google/antiforgery", () => HttpResponse.json({ requestToken: "test-form-token" })),
));

function show(url = "/registro") {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  const auth = { isAuthenticated: false, isLoading: false, signinRedirect } as unknown as AuthContextProps;
  const wrapper = ({ children }: { children: ReactNode }) => <AuthContext.Provider value={auth}><QueryClientProvider client={client}><MemoryRouter initialEntries={[url]}>{children}</MemoryRouter></QueryClientProvider></AuthContext.Provider>;
  return render(<SignupPage />, { wrapper });
}

describe("SignupPage", () => {
  it("reproduce Correo a 390: la aceptación bloquea ambos caminos y no pide nombre", async () => {
    const originalWidth = window.innerWidth;
    Object.defineProperty(window, "innerWidth", { configurable: true, value: 390 });
    try {
      const { container } = show();
      expect(screen.getByRole("heading", { name: "Creá tu cuenta" })).toBeVisible();
      expect(screen.getByRole("checkbox", { name: /Acepto los Términos y la Política de privacidad/ })).not.toBeChecked();
      expect(await screen.findByRole("button", { name: "Registrarte con Google" })).toBeDisabled();
      expect(screen.getByRole("button", { name: "Crear cuenta" })).toBeDisabled();
      expect(screen.getByRole("textbox", { name: "Correo electrónico" })).toBeVisible();
      expect(screen.queryByRole("textbox", { name: /Nombre/ })).not.toBeInTheDocument();
      expect(screen.queryByText("Registrala")).not.toBeInTheDocument();
      const acceptance = screen.getByRole("checkbox", { name: /Acepto los Términos/ }).closest("label")!;
      expect(within(acceptance).getByRole("link", { name: "Términos" })).toHaveAttribute("href", "/terminos");
      expect(screen.getByRole("link", { name: "Política de privacidad" })).toHaveAttribute("href", "/privacidad");
      expect(await axe(container)).toHaveNoViolations();
    } finally {
      Object.defineProperty(window, "innerWidth", { configurable: true, value: originalWidth });
    }
  });

  it("valida correo; al aceptar envía signup y muestra el código en la misma pantalla", async () => {
    let requests = 0;
    let body: unknown;
    server.use(http.post("/api/auth/signup", async ({ request }) => {
      requests++;
      body = await request.json();
      return HttpResponse.json({ resendAfterSeconds: 60 }, { status: 202 });
    }));
    show();
    fireEvent.click(screen.getByRole("checkbox", { name: /Acepto los Términos/ }));
    fireEvent.change(screen.getByRole("textbox", { name: "Correo electrónico" }), { target: { value: "mariana.lopez@gmail" } });
    fireEvent.click(screen.getByRole("button", { name: "Crear cuenta" }));
    expect(await screen.findByText("Ingresá un correo electrónico válido.")).toBeVisible();
    expect(requests).toBe(0);

    fireEvent.change(screen.getByRole("textbox", { name: "Correo electrónico" }), { target: { value: " MARIANA@Example.com " } });
    fireEvent.click(screen.getByRole("button", { name: "Crear cuenta" }));
    expect(await screen.findByRole("heading", { name: "Revisá tu correo" })).toBeVisible();
    expect(screen.getByText("mariana@example.com").tagName).toBe("STRONG");
    expect(body).toEqual({ email: "mariana@example.com", acceptedTerms: true, culture: "es-AR", timeZoneId: "America/Argentina/Buenos_Aires" });
    expect(screen.getByRole("group", { name: "Código" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Reenviar en 60 s" })).toHaveClass("bg-[var(--lado-activo)]");
    expect(screen.getByRole("button", { name: "Reenviar en 60 s" })).not.toHaveClass("bg-background");
    expect(screen.getByRole("button", { name: "Verificar y crear la cuenta" })).toBeDisabled();
  });

  it("verifica el código, muestra error con intentos y luego permite entrar", async () => {
    let verifies = 0;
    let lastVerify: unknown;
    server.use(
      http.post("/api/auth/signup", () => HttpResponse.json({ resendAfterSeconds: 60 }, { status: 202 })),
      http.post("/api/auth/signup/verify", async ({ request }) => {
        verifies++;
        lastVerify = await request.json();
        return verifies === 1
          ? HttpResponse.json({ code: "Auth.LoginCode.Invalid", attemptsLeft: 4 }, { status: 400 })
          : new HttpResponse(null, { status: 204 });
      }),
    );
    signinRedirect.mockClear();
    show("/registro?returnUrl=%2Fcatalogo");
    fireEvent.click(screen.getByRole("checkbox", { name: /Acepto los Términos/ }));
    fireEvent.change(screen.getByRole("textbox", { name: "Correo electrónico" }), { target: { value: "mariana@example.com" } });
    fireEvent.click(screen.getByRole("button", { name: "Crear cuenta" }));
    const group = await screen.findByRole("group", { name: "Código" });
    expect(screen.getByRole("button", { name: "Usar otro correo" }).querySelector("svg")).not.toBeNull();
    fireEvent.paste(within(group).getByRole("textbox", { name: "Código 1" }), { clipboardData: { getData: () => "999999" } });
    fireEvent.click(screen.getByRole("button", { name: "Verificar y crear la cuenta" }));
    expect(await screen.findByText("El código no es válido.")).toBeVisible();
    expect(screen.getByText("Te quedan 4 intentos.")).toBeVisible();

    fireEvent.paste(within(group).getByRole("textbox", { name: "Código 1" }), { clipboardData: { getData: () => "123456" } });
    fireEvent.click(screen.getByRole("button", { name: "Verificar y crear la cuenta" }));
    await waitFor(() => expect(signinRedirect).toHaveBeenCalledWith({ extraQueryParams: { access: "consumer" }, state: { returnTo: "/catalogo" } }));
    expect(lastVerify).toEqual({ email: "mariana@example.com", code: "123456", acceptedTerms: true, culture: "es-AR", timeZoneId: "America/Argentina/Buenos_Aires" });
  });

  it("envía la cultura activa al registro sin agregar controles", async () => {
    await act(async () => { await changeCulture("en-US"); });
    let body: unknown;
    server.use(http.post("/api/auth/signup", async ({ request }) => {
      body = await request.json();
      return HttpResponse.json({ resendAfterSeconds: 60 }, { status: 202 });
    }));
    try {
      show();
      fireEvent.click(screen.getByRole("checkbox", { name: /I accept the Terms/ }));
      fireEvent.change(screen.getByRole("textbox", { name: "Email address" }), { target: { value: "ana@example.test" } });
      fireEvent.click(screen.getByRole("button", { name: "Create account" }));
      await waitFor(() => expect(body).toMatchObject({ culture: "en-US" }));
    } finally {
      await act(async () => { await changeCulture("es-AR"); });
    }
  });

  it("muestra Registro cerrado sin formulario ni Google cuando responde Auth.Signup.Closed", async () => {
    server.use(http.post("/api/auth/signup", () => HttpResponse.json({ code: "Auth.Signup.Closed" }, { status: 403 })));
    show();
    fireEvent.click(screen.getByRole("checkbox", { name: /Acepto los Términos/ }));
    fireEvent.change(screen.getByRole("textbox", { name: "Correo electrónico" }), { target: { value: "mariana@example.com" } });
    fireEvent.click(screen.getByRole("button", { name: "Crear cuenta" }));

    expect(await screen.findByRole("heading", { name: "Por ahora no se pueden crear cuentas" })).toBeVisible();
    expect(screen.getByRole("heading", { name: "Por ahora no se pueden crear cuentas" }).parentElement?.previousElementSibling?.querySelector("svg")).not.toBeNull();
    expect(screen.getByText("Si te invitaron a una organización, entrá con el enlace de la invitación.")).toBeVisible();
    expect(screen.getByRole("link", { name: "Ir al ingreso" })).toHaveAttribute("href", "/login");
    expect(screen.queryByRole("button", { name: "Registrarte con Google" })).not.toBeInTheDocument();
  });

  it("habilita el challenge Google con aceptación y retorno interno, sin pedir nombre", async () => {
    show("/registro?returnUrl=%2Fcatalogo");
    expect(await screen.findByRole("button", { name: "Registrarte con Google" })).toBeDisabled();
    fireEvent.click(screen.getByRole("checkbox", { name: /Acepto los Términos/ }));
    const google = await screen.findByRole("button", { name: "Registrarte con Google" });
    await waitFor(() => expect(google).toBeEnabled());
    const form = (google as HTMLButtonElement).form!;
    expect(form).toHaveAttribute("method", "post");
    expect(form).toHaveAttribute("action", "/api/auth/external/google");
    expect(new FormData(form).get("__RequestVerificationToken")).toBe("test-form-token");
    expect(new FormData(form).get("returnTo")).toBe("/catalogo");
  });

  it("tras el callback técnico Google inicia OIDC sin nueva pantalla", async () => {
    signinRedirect.mockClear();
    show("/registro?google=complete&returnTo=%2Fcatalogo");
    await waitFor(() => expect(signinRedirect).toHaveBeenCalledWith({ extraQueryParams: { access: "consumer" }, state: { returnTo: "/catalogo" } }));
    expect(screen.getByRole("heading", { name: "Iniciando sesión…" })).toBeVisible();
  });

  it("muestra el estado cerrado del lienzo si Google vuelve con Auth.Signup.Closed", () => {
    show("/registro?error=Auth.Signup.Closed");
    expect(screen.getByRole("heading", { name: "Por ahora no se pueden crear cuentas" })).toBeVisible();
  });
});
