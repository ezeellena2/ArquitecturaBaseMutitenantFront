import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { HttpResponse, http } from "msw";
import { type ReactNode } from "react";
import { AuthContext, type AuthContextProps } from "react-oidc-context";
import { MemoryRouter } from "react-router";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import { changeCulture, configureI18n } from "@/shared/i18n";
import { server } from "@/test/mocks/server";
import { LoginPage } from "./LoginPage";

const signinRedirect = vi.fn(() => Promise.resolve());
const authorizeUrl = "/connect/authorize?client_id=web&response_type=code";
const loginUrl = `/login?returnUrl=${encodeURIComponent(authorizeUrl)}`;

beforeAll(async () => {
  await configureI18n([
    { code: "es-AR", languageCode: "es", fallbackCulture: null, isEnabled: true, isDefault: true },
    { code: "en-US", languageCode: "en", fallbackCulture: "es-AR", isEnabled: true, isDefault: false },
  ]);
});
afterEach(async () => { signinRedirect.mockClear(); await changeCulture("es-AR"); });
beforeEach(() => server.use(http.get("/api/auth/methods", () => HttpResponse.json({ channels: [{ key: "email", countries: [] }, { key: "google", countries: [] }] }))));

function show(access: "consumer" | "business", url: string, completeLogin = vi.fn()) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  const auth = { isAuthenticated: false, isLoading: false, signinRedirect } as unknown as AuthContextProps;
  const wrapper = ({ children }: { children: ReactNode }) => (
    <AuthContext.Provider value={auth}>
      <QueryClientProvider client={client}><MemoryRouter initialEntries={[url]}>{children}</MemoryRouter></QueryClientProvider>
    </AuthContext.Provider>
  );
  return { completeLogin, ...render(<LoginPage access={access} completeLogin={completeLogin} />, { wrapper }) };
}

describe("LoginPage", () => {
  it("inicia OIDC una vez desde cada puerta y conserva el acceso elegido", async () => {
    const view = show("consumer", "/login");
    await waitFor(() => expect(signinRedirect).toHaveBeenCalledOnce());
    expect(signinRedirect).toHaveBeenCalledWith(expect.objectContaining({ extraQueryParams: { access: "consumer" } }));
    view.unmount();

    signinRedirect.mockClear();
    show("business", "/login/empresa");
    await waitFor(() => expect(signinRedirect).toHaveBeenCalledOnce());
    expect(signinRedirect).toHaveBeenCalledWith(expect.objectContaining({ extraQueryParams: { access: "business" } }));
  });

  it("presenta la puerta personal con los controles y enlaces en el orden del lienzo", async () => {
    const { container } = show("consumer", loginUrl);
    const main = screen.getByRole("main");
    const heading = within(main).getByRole("heading", { name: "Ingresá a tu cuenta" });
    const google = await within(main).findByRole("link", { name: "Ingresar con Google" });
    expect(google).toHaveAttribute("href", `/api/auth/external/google?returnUrl=${encodeURIComponent(authorizeUrl)}&access=consumer`);
    const email = within(main).getByRole("textbox", { name: "Correo electrónico" });
    const send = within(main).getByRole("button", { name: "Enviar código" });
    expect(heading.compareDocumentPosition(google) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(google.compareDocumentPosition(email) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(email.compareDocumentPosition(send) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(within(main).getByRole("link", { name: "Creá una" })).toHaveAttribute("href", "/registro");
    expect(within(main).getByRole("link", { name: "Ingresá como empresa" })).toHaveAttribute("href", "/login/empresa");
    expect(within(main).queryByText("Recuperá tu cuenta")).not.toBeInTheDocument();
    expect(within(main).queryByText("Registrala")).not.toBeInTheDocument();
    expect(await axe(container)).toHaveNoViolations();
  });

  it("presenta la puerta de empresa y conserva el orden y accesibilidad a 390 px", async () => {
    const originalWidth = window.innerWidth;
    Object.defineProperty(window, "innerWidth", { configurable: true, value: 390 });
    try {
      const { container } = show("business", `/login/empresa?returnUrl=${encodeURIComponent(authorizeUrl)}`);
      const main = screen.getByRole("main");
      expect(within(main).getByRole("heading", { name: "Ingresá como empresa" })).toBeVisible();
      expect(within(main).queryByText("¿Tu empresa no está registrada?")).not.toBeInTheDocument();
      expect(within(main).queryByText("Registrala")).not.toBeInTheDocument();
      expect(within(main).getByRole("link", { name: "Ingresá acá" })).toHaveAttribute("href", "/login");
      expect(await axe(container)).toHaveNoViolations();
    } finally {
      Object.defineProperty(window, "innerWidth", { configurable: true, value: originalWidth });
    }
  });

  it("muestra el aviso aprobado cuando falla Google sin crear una cuenta en Ingreso", async () => {
    show("consumer", `${loginUrl}&error=Auth.Google.AccountNotFound`);
    expect(await screen.findByText("No pudimos completar el ingreso con Google.")).toBeVisible();
    expect(screen.getByText("Probá de nuevo o entrá con tu correo.")).toBeVisible();
    expect(screen.getByRole("textbox", { name: "Correo electrónico" })).toBeVisible();
  });

  it("muestra el aviso del lienzo cuando vuelve de una sesión vencida", () => {
    sessionStorage.setItem("arquitecturabasemt.sessionExpired", "1");
    show("consumer", loginUrl);
    expect(screen.getByRole("status")).toHaveTextContent("Tu sesión venció. Ingresá de nuevo.");
    expect(sessionStorage.getItem("arquitecturabasemt.sessionExpired")).toBeNull();
  });

  it("mantiene el código en la misma pantalla, lo verifica y vuelve al authorize original", async () => {
    let verifyBody: unknown;
    server.use(
      http.post("/api/auth/login-code", () => HttpResponse.json({ resendAfterSeconds: 60 }, { status: 202 })),
      http.post("/api/auth/login-code/verify", async ({ request }) => {
        verifyBody = await request.json();
        return HttpResponse.json({ returnUrl: authorizeUrl });
      }),
    );
    const { completeLogin } = show("consumer", loginUrl);
    fireEvent.change(screen.getByRole("textbox", { name: "Correo electrónico" }), { target: { value: "ana@example.com" } });
    fireEvent.click(screen.getByRole("button", { name: "Enviar código" }));

    expect(await screen.findByRole("heading", { name: "Revisá tu correo" })).toBeVisible();
    expect(screen.queryByRole("heading", { name: "Ingresá a tu cuenta" })).not.toBeInTheDocument();
    expect(screen.getByText(/Te mandamos un código a/)).toHaveTextContent("ana@example.com");
    expect(screen.getByText("ana@example.com").tagName).toBe("STRONG");
    expect(screen.getByRole("heading", { name: "Revisá tu correo" })).toHaveClass("text-2xl");
    const group = screen.getByRole("group", { name: "Código" });
    expect(within(group).getAllByRole("textbox")).toHaveLength(6);
    expect(screen.getByRole("button", { name: "Reenviar en 60 s" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Verificar" })).toBeDisabled();
    fireEvent.paste(within(group).getByRole("textbox", { name: "Código 1" }), { clipboardData: { getData: () => "123456" } });
    fireEvent.click(screen.getByRole("button", { name: "Verificar" }));

    await waitFor(() => expect(completeLogin).toHaveBeenCalledWith(authorizeUrl));
    expect(verifyBody).toEqual({ email: "ana@example.com", code: "123456", returnUrl: authorizeUrl });
  });

  it("marca el código incorrecto y muestra intentos; luego permite usar otro correo", async () => {
    server.use(
      http.post("/api/auth/login-code", () => HttpResponse.json({ resendAfterSeconds: 60 }, { status: 202 })),
      http.post("/api/auth/login-code/verify", () => HttpResponse.json({ code: "Auth.LoginCode.Invalid", attemptsLeft: 3 }, { status: 400 })),
    );
    show("consumer", loginUrl);
    fireEvent.change(screen.getByRole("textbox", { name: "Correo electrónico" }), { target: { value: "ana@example.com" } });
    fireEvent.click(screen.getByRole("button", { name: "Enviar código" }));
    const first = await screen.findByRole("textbox", { name: "Código 1" });
    fireEvent.paste(first, { clipboardData: { getData: () => "999999" } });
    fireEvent.click(screen.getByRole("button", { name: "Verificar" }));

    expect(await screen.findByText("El código no es válido.")).toBeVisible();
    expect(screen.getByText("Te quedan 3 intentos.")).toBeVisible();
    expect(first).toHaveAttribute("aria-invalid", "true");
    fireEvent.click(screen.getByRole("button", { name: "Usar otro correo" }));
    expect(screen.getByRole("heading", { name: "Ingresá a tu cuenta" })).toBeVisible();
    expect(screen.queryByText("El código no es válido.")).not.toBeInTheDocument();
  });

  it.each([
    ["Tenancy.Access.NotMember", {}, "Tu cuenta no está en ninguna empresa todavía"],
    ["Tenancy.Member.Inactive", { organizationName: "Grupo Delta" }, "Tu acceso a Grupo Delta está deshabilitado"],
  ])("muestra el estado empresarial %s después del código", async (code, metadata, title) => {
    server.use(
      http.post("/api/auth/login-code", () => HttpResponse.json({ resendAfterSeconds: 60 }, { status: 202 })),
      http.post("/api/auth/login-code/verify", () => HttpResponse.json({ code, ...metadata }, { status: 403 })),
    );
    show("business", `/login/empresa?returnUrl=${encodeURIComponent(authorizeUrl)}`);
    fireEvent.change(screen.getByRole("textbox", { name: "Correo electrónico" }), { target: { value: "ana@example.com" } });
    fireEvent.click(screen.getByRole("button", { name: "Enviar código" }));
    const first = await screen.findByRole("textbox", { name: "Código 1" });
    fireEvent.paste(first, { clipboardData: { getData: () => "123456" } });
    fireEvent.click(screen.getByRole("button", { name: "Verificar" }));

    expect(await screen.findByRole("heading", { name: title })).toBeVisible();
    const icon = screen.getByRole("main").querySelector("svg");
    expect(icon?.getAttribute("class")).toContain(code === "Tenancy.Access.NotMember" ? "lucide-building" : "lucide-ban");
    expect(screen.queryByText("Registrá tu empresa")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Ingresá como persona" })).toHaveAttribute("href", "/login");
  });

  it.each([
    ["Auth.LoginCode.Expired", "El código venció. Pedí uno nuevo."],
    ["Auth.LoginCode.TooManyAttempts", "Superaste los intentos para este código."],
    ["Identity.Account.LockedOut", "Tu cuenta está bloqueada por unos minutos por demasiados intentos fallidos."],
    ["Identity.Account.Suspended", "Tu cuenta está suspendida."],
  ])("respeta el estado %s que devuelve el código", async (code, message) => {
    server.use(
      http.post("/api/auth/login-code", () => HttpResponse.json({ resendAfterSeconds: 60 }, { status: 202 })),
      http.post("/api/auth/login-code/verify", () => HttpResponse.json({ code }, { status: code.startsWith("Identity") ? 403 : 400 })),
    );
    show("consumer", loginUrl);
    fireEvent.change(screen.getByRole("textbox", { name: "Correo electrónico" }), { target: { value: "ana@example.com" } });
    fireEvent.click(screen.getByRole("button", { name: "Enviar código" }));
    const first = await screen.findByRole("textbox", { name: "Código 1" });
    fireEvent.paste(first, { clipboardData: { getData: () => "123456" } });
    fireEvent.click(screen.getByRole("button", { name: "Verificar" }));

    expect(await screen.findByText(message)).toBeVisible();
    if (code === "Auth.LoginCode.TooManyAttempts" || code === "Identity.Account.LockedOut" || code === "Identity.Account.Suspended") {
      expect(screen.getByRole("button", { name: "Verificar" })).toBeDisabled();
    }
    if (code === "Auth.LoginCode.Expired" || code === "Auth.LoginCode.TooManyAttempts" || code === "Identity.Account.LockedOut") {
      expect(screen.getByRole("button", { name: "Reenviar código" })).toBeEnabled();
    }
    if (code === "Auth.LoginCode.TooManyAttempts" || code === "Identity.Account.LockedOut") {
      expect(screen.getByRole("textbox", { name: "Código 1" })).toBeDisabled();
    }
    if (code === "Identity.Account.LockedOut") {
      expect(screen.getByRole("textbox", { name: "Código 1" })).toHaveValue("");
    }
    if (code === "Identity.Account.Suspended") {
      expect(screen.getByRole("button", { name: "Reenviar código" })).toBeDisabled();
    }
  });
});
