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
import { asPhone } from "@/test/utils/phone";

const signinRedirect = vi.fn(() => Promise.resolve());
const signoutRedirect = vi.fn(async () => null);
const authorizeUrl = "/connect/authorize?client_id=web&response_type=code";
const loginUrl = `/login?returnUrl=${encodeURIComponent(authorizeUrl)}`;

it("ingresa por código o Google para volver a la invitación sin iniciar OIDC", async () => {
  const completeLogin = vi.fn();
  server.use(
    http.post("/api/auth/login-code", () => HttpResponse.json({ resendAfterSeconds: 60 }, { status: 202 })),
    http.post("/api/auth/login-code/verify", async ({ request }) => {
      expect(await request.json()).toEqual({ email: "ana@example.test", code: "123456", returnUrl: "/invitacion" });
      return HttpResponse.json({ returnUrl: "/invitacion" });
    }),
  );
  show("consumer", "/login?returnUrl=%2Finvitacion", completeLogin);
  expect(await screen.findByRole("link", { name: "Ingresar con Google" })).toHaveAttribute("href",
    "/api/auth/external/google?returnUrl=%2Finvitacion&access=consumer");
  expect(signinRedirect).not.toHaveBeenCalled();
  fireEvent.change(screen.getByRole("textbox", { name: "Correo electrónico" }), { target: { value: "ana@example.test" } });
  fireEvent.click(screen.getByRole("button", { name: "Enviar código" }));
  fireEvent.change(await screen.findByRole("textbox", { name: "Código 1" }), { target: { value: "123456" } });
  fireEvent.click(screen.getByRole("button", { name: "Verificar" }));
  await waitFor(() => expect(completeLogin).toHaveBeenCalledWith("/invitacion"));
  expect(signinRedirect).not.toHaveBeenCalled();
});

beforeAll(async () => {
  await configureI18n([
    { code: "es-AR", languageCode: "es", fallbackCulture: null, isEnabled: true, isDefault: true },
    { code: "en-US", languageCode: "en", fallbackCulture: "es-AR", isEnabled: true, isDefault: false },
  ]);
});
afterEach(async () => { signinRedirect.mockClear(); signoutRedirect.mockReset(); signoutRedirect.mockResolvedValue(null); await changeCulture("es-AR"); });
beforeEach(() => server.use(http.get("/api/auth/methods", () => HttpResponse.json({ channels: [{ key: "email", countries: [] }, { key: "google", countries: [] }] }))));

function show(access: "consumer" | "business", url: string, completeLogin = vi.fn()) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  const auth = { isAuthenticated: false, isLoading: false, signinRedirect, signoutRedirect } as unknown as AuthContextProps;
  const wrapper = ({ children }: { children: ReactNode }) => (
    <AuthContext.Provider value={auth}>
      <QueryClientProvider client={client}><MemoryRouter initialEntries={[url]}>{children}</MemoryRouter></QueryClientProvider>
    </AuthContext.Provider>
  );
  return { completeLogin, ...render(<LoginPage access={access} completeLogin={completeLogin} />, { wrapper }) };
}

describe("LoginPage", () => {
  it("Creá una y Crear mi cuenta conservan la autorización del subdominio y el correo desconocido", async () => {
    const original = "/connect/authorize?client_id=web&redirect_uri=https%3A%2F%2Fgrupo-delta.localtest.me%3A5174%2Fauth%2Fcallback&state=public-state&code_challenge=pkce&access=consumer";
    server.use(http.post("/api/auth/login-code", () => HttpResponse.json({ code: "Auth.LoginCode.AccountNotFound", errors: { email: ["No existe esta cuenta."] } }, { status: 400 })));
    show("consumer", `/login?${new URLSearchParams({ returnUrl: original })}`);
    const expected = `/registro?${new URLSearchParams({ returnUrl: original })}`;
    expect(screen.getByRole("link", { name: "Creá una" })).toHaveAttribute("href", expected);
    fireEvent.change(screen.getByRole("textbox", { name: "Correo electrónico" }), { target: { value: "nueva@example.test" } });
    fireEvent.click(screen.getByRole("button", { name: "Enviar código" }));
    expect(await screen.findByRole("link", { name: "Crear mi cuenta" })).toHaveAttribute("href", expected);
    expect(signinRedirect).not.toHaveBeenCalled();
  });

  it.each([
    ["consumer", "es-AR", "Esta cuenta es de un operador: solo entra a Plataforma", "Ir a Plataforma", "Salir"],
    ["business", "es-AR", "Esta cuenta es de un operador: solo entra a Plataforma", "Ir a Plataforma", "Salir"],
    ["consumer", "en-US", "This is an operator account: it can only access Platform", "Go to Platform", "Log out"],
    ["business", "en-US", "This is an operator account: it can only access Platform", "Go to Platform", "Log out"],
  ] as const)("muestra el estado de operador sólo después del código, puerta %s e idioma %s a 390", async (access, culture, title, go, leave) => {
    const restore = asPhone();
    try {
      await changeCulture(culture);
      server.use(
        http.post("/api/auth/login-code", () => HttpResponse.json({ resendAfterSeconds: 60 }, { status: 202 })),
        http.post("/api/auth/login-code/verify", () => HttpResponse.json({ code: "Tenancy.Access.PlatformOnly" }, { status: 403 })),
      );
      const { container, completeLogin } = show(access, loginUrl);
      expect(screen.queryByText(title)).not.toBeInTheDocument();
      expect(screen.queryByRole("link", { name: go })).not.toBeInTheDocument();
      fireEvent.change(screen.getByRole("textbox", { name: /Correo electrónico|Email address/ }), { target: { value: "operator@example.test" } });
      fireEvent.click(screen.getByRole("button", { name: /Enviar código|Send code/ }));
      const first = await screen.findByRole("textbox", { name: /Código 1|Code 1/ });
      expect(screen.queryByText(title)).not.toBeInTheDocument();
      fireEvent.paste(first, { clipboardData: { getData: () => "123456" } });
      fireEvent.click(screen.getByRole("button", { name: /Verificar|Verify/ }));
      expect(await screen.findByRole("heading", { name: title })).toBeVisible();
      const primary = screen.getByRole("link", { name: go });
      expect(primary).toHaveAttribute("href", "/plataforma");
      expect(primary).toHaveAttribute("data-variant", "default");
      const secondary = screen.getByRole("button", { name: leave });
      expect(secondary).toHaveAttribute("data-variant", "outline");
      expect(primary.compareDocumentPosition(secondary) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
      expect(screen.queryByRole("textbox", { name: /Código 1|Code 1/ })).not.toBeInTheDocument();
      expect(completeLogin).not.toHaveBeenCalled();
      expect(await axe(container)).toHaveNoViolations();
      fireEvent.click(secondary);
      expect(await screen.findByRole("textbox", { name: /Correo electrónico|Email address/ })).toHaveValue("");
      expect(signoutRedirect).toHaveBeenCalledOnce();
      expect(screen.queryByText(title)).not.toBeInTheDocument();
    } finally { restore(); }
  });

  it("si falla Salir conserva el estado privado y permite repetir el cierre público", async () => {
    signoutRedirect.mockRejectedValueOnce(new Error("sin conexión"));
    server.use(
      http.post("/api/auth/login-code", () => HttpResponse.json({ resendAfterSeconds: 60 }, { status: 202 })),
      http.post("/api/auth/login-code/verify", () => HttpResponse.json({ code: "Tenancy.Access.PlatformOnly" }, { status: 403 })),
    );
    show("consumer", loginUrl);
    fireEvent.change(screen.getByRole("textbox", { name: "Correo electrónico" }), { target: { value: "operator@example.test" } });
    fireEvent.click(screen.getByRole("button", { name: "Enviar código" }));
    fireEvent.paste(await screen.findByRole("textbox", { name: "Código 1" }), { clipboardData: { getData: () => "123456" } });
    fireEvent.click(screen.getByRole("button", { name: "Verificar" }));
    fireEvent.click(await screen.findByRole("button", { name: "Salir" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Algo salió mal. Probá de nuevo en un rato.");
    expect(screen.getByRole("heading", { name: "Esta cuenta es de un operador: solo entra a Plataforma" })).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Salir" }));
    expect(await screen.findByRole("textbox", { name: "Correo electrónico" })).toHaveValue("");
    expect(signoutRedirect).toHaveBeenCalledTimes(2);
  });

  it.each(["consumer", "business"] as const)("ofrece recuperar la cuenta desde la puerta %s", async (access) => {
    show(access, loginUrl);
    expect(await screen.findByText("¿No podés entrar?")).toBeVisible();
    expect(screen.getByRole("link", { name: "Recuperá tu cuenta" })).toHaveAttribute("href", "/recuperar");
  });

  it("prueba el correo pendiente sin iniciar sesión y cancela antes de continuar", async () => {
    const completeLogin = vi.fn();
    let finishCancellation!: () => void;
    const cancellation = new Promise<void>((resolve) => { finishCancellation = resolve; });
    server.use(
      http.post("/api/auth/login-code", () => HttpResponse.json({ resendAfterSeconds: 60 })),
      http.post("/api/auth/login-code/verify", () => HttpResponse.json({ code: "Identity.Account.PendingDeletion", scheduledForUtc: "2026-10-30T12:00:00Z", cancelTicket: "opaque-cancel", timeZoneId: "America/Argentina/Buenos_Aires", returnUrl: authorizeUrl, cancelTicketExpiresAtUtc: "2026-09-30T13:00:00Z" }, { status: 403 })),
      http.post("/api/auth/deletion/cancel", async ({ request }) => {
        await cancellation;
        expect(await request.json()).toEqual({ cancelTicket: "opaque-cancel" });
        expect(request.headers.get("Idempotency-Key")).toBeTruthy();
        return HttpResponse.json({ returnUrl: authorizeUrl });
      }),
    );
    show("consumer", loginUrl, completeLogin);
    fireEvent.change(screen.getByRole("textbox", { name: "Correo electrónico" }), { target: { value: "ana@example.test" } });
    fireEvent.click(screen.getByRole("button", { name: "Enviar código" }));
    const code = await screen.findByRole("textbox", { name: "Código 1" });
    fireEvent.change(code, { target: { value: "123456" } });
    fireEvent.click(screen.getByRole("button", { name: "Verificar" }));
    expect(await screen.findByRole("heading", { name: "Tu cuenta tiene la baja pedida" })).toBeVisible();
    // El reloj del tablero Ingreso («Cuenta con la baja pedida»).
    expect(screen.getByRole("main").querySelector("span[aria-hidden='true'] svg circle")).toHaveAttribute("r", "8.5");
    expect(completeLogin).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Cancelar la baja y entrar" }));
    try {
      await waitFor(() => expect(screen.getByRole("button", { name: "Cancelar la baja y entrar" })).toBeDisabled());
      expect(screen.getByRole("button", { name: "Salir" })).toBeDisabled();
      expect(completeLogin).not.toHaveBeenCalled();
    } finally { finishCancellation(); }
    await waitFor(() => expect(completeLogin).toHaveBeenCalledWith(authorizeUrl));
  });

  it("lee prueba de Google desde cookie segura sin iniciar OIDC antes de cancelar", async () => {
    server.use(http.post("/api/auth/deletion/pending", () => HttpResponse.json({ scheduledForUtc: "2026-10-30T12:00:00Z", cancelTicket: "cookie-proof", timeZoneId: "America/Argentina/Buenos_Aires", returnUrl: authorizeUrl, expiresAtUtc: "2026-09-30T13:00:00Z" })));
    show("business", "/login/empresa?error=Identity.Account.PendingDeletion");
    expect(await screen.findByRole("heading", { name: "Tu cuenta tiene la baja pedida" })).toBeVisible();
    expect(signinRedirect).not.toHaveBeenCalled();
  });
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

  it.each([
    ["consumer", "/login", "/"],
    ["business", "/login/empresa", "/org"],
  ] as const)("el reintento de %s pide el formulario aunque haya una cookie guardada", async (access, door, returnTo) => {
    show(access, `${door}?prompt=login`);
    await waitFor(() => expect(signinRedirect).toHaveBeenCalledOnce());
    expect(signinRedirect).toHaveBeenCalledWith({ state: { returnTo }, extraQueryParams: { access, prompt: "login" } });
  });

  it.each(["/plataforma", "/plataforma?estado=Active", "/plataforma/cuentas#detalle"])("pide Plataforma para volver a %s desde la puerta compartida", async (returnTo) => {
    show("consumer", `/login?returnUrl=${encodeURIComponent(returnTo)}&session=expired`);
    await waitFor(() => expect(signinRedirect).toHaveBeenCalledOnce());
    expect(signinRedirect).toHaveBeenCalledWith({ state: { returnTo }, extraQueryParams: { access: "platform", prompt: "login" } });
  });

  it.each(["//externo.test/plataforma", "https://externo.test/plataforma", "/plataformax"])("no pide Plataforma para un retorno externo o ajeno: %s", async (returnTo) => {
    show("consumer", `/login?returnUrl=${encodeURIComponent(returnTo)}`);
    await waitFor(() => expect(signinRedirect).toHaveBeenCalledOnce());
    expect(signinRedirect).toHaveBeenCalledWith(expect.objectContaining({ extraQueryParams: { access: "consumer" } }));
  });

  it("presenta la puerta personal con los controles y enlaces en el orden del lienzo", async () => {
    const { container } = show("consumer", loginUrl);
    const main = screen.getByRole("main");
    const heading = within(main).getByRole("heading", { name: "Ingresá a tu cuenta" });
    const google = await within(main).findByRole("link", { name: "Ingresar con Google" });
    expect(google).toHaveAttribute("href", `/api/auth/external/google?returnUrl=${encodeURIComponent(authorizeUrl)}&access=consumer`);
    const email = within(main).getByRole("textbox", { name: "Correo electrónico" });
    const send = within(main).getByRole("button", { name: "Enviar código" });
    // Tableros Ingreso y M-Ingreso: título de 24 con interletra cerrada y Google de 14.
    expect(heading).toHaveClass("text-[24px]", "leading-[1.2]", "tracking-[-0.02em]");
    expect(google).toHaveClass("text-[14px]!", "gap-2.5!");
    expect(heading.compareDocumentPosition(google) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(google.compareDocumentPosition(email) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(email.compareDocumentPosition(send) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    const signupLink = within(main).getByRole("link", { name: "Creá una" });
    expect(signupLink).toHaveAttribute("href", `/registro?${new URLSearchParams({ returnUrl: authorizeUrl })}`);
    // .fila-links del tablero: el renglón centrado, con 6 entre el texto y el enlace (AuthLinkRow).
    expect(signupLink.parentElement).toHaveClass("flex", "justify-center", "gap-1.5");
    // Los enlaces de texto son la variante link de Button, en --marca-tx (como .lnk del tablero).
    expect(signupLink).toHaveAttribute("data-variant", "link");
    expect(signupLink).toHaveClass("text-[var(--marca-tx)]");
    expect(within(main).getByRole("link", { name: "Ingresá como empresa" })).toHaveAttribute("href", "/login/empresa");
    const recoverLink = within(main).getByRole("link", { name: "Recuperá tu cuenta" });
    expect(recoverLink).toHaveAttribute("href", "/recuperar");
    expect(within(main).getByRole("link", { name: "Ingresá como empresa" }).compareDocumentPosition(recoverLink) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
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
      expect(within(main).getByText("¿Tu empresa no está registrada?")).toBeVisible();
      const registerLink = within(main).getByRole("link", { name: "Registrala" });
      expect(registerLink).toHaveAttribute("href", "/registro/empresa");
      const personalLink = within(main).getByRole("link", { name: "Ingresá acá" });
      expect(personalLink).toHaveAttribute("href", "/login");
      expect(registerLink.compareDocumentPosition(personalLink) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
      expect(personalLink.parentElement).toHaveClass("flex", "justify-center", "gap-1.5");
      expect(await axe(container)).toHaveNoViolations();
    } finally {
      Object.defineProperty(window, "innerWidth", { configurable: true, value: originalWidth });
    }
  });

  it("muestra el aviso aprobado cuando falla Google sin crear una cuenta en Ingreso", async () => {
    show("consumer", `${loginUrl}&error=Auth.Google.AccountNotFound`);
    expect(await screen.findByText("No pudimos completar el ingreso con Google.")).toBeVisible();
    expect(screen.getByText("Probá de nuevo o entrá con tu correo.")).toBeVisible();
    // Tablero Ingreso: la franja de error con su segunda línea más clara.
    expect(screen.getByText("Probá de nuevo o entrá con tu correo.")).toHaveClass("block", "opacity-85");
    expect(screen.getByRole("textbox", { name: "Correo electrónico" })).toBeVisible();
  });

  it("muestra el aviso del lienzo cuando vuelve de una sesión vencida", () => {
    sessionStorage.setItem("arquitecturabasemt.sessionExpired", "1");
    show("consumer", loginUrl);
    expect(screen.getByRole("status")).toHaveTextContent("Tu sesión venció. Ingresá de nuevo.");
    // Tableros Ingreso y M-Ingreso («Tu sesión venció», .msj.info): la franja de los mensajes del ingreso, en petróleo,
    // con el reloj; no el cartel de los avisos.
    expect(screen.getByRole("status")).toHaveClass("rounded-[8px]", "px-3", "py-2.5", "max-md:text-[14.5px]", "bg-[var(--marca-t)]", "text-[var(--marca-tx)]");
    expect(screen.getByRole("status")).not.toHaveClass("min-h-11");
    expect(screen.getByRole("status").querySelector("svg circle")).toHaveAttribute("r", "8.5");
    expect(sessionStorage.getItem("arquitecturabasemt.sessionExpired")).toBeNull();
  });

  it("fuerza ingreso nuevo con cookie viva y conserva la ruta empresarial después de una sesión vencida", async () => {
    show("business", "/login/empresa?returnUrl=%2Forg%3Ftab%3D1&session=expired");

    await waitFor(() => expect(signinRedirect).toHaveBeenCalledOnce());
    expect(signinRedirect).toHaveBeenCalledWith({
      state: { returnTo: "/org?tab=1" },
      extraQueryParams: { access: "business", prompt: "login" },
    });
  });

  it("muestra el aviso al volver al formulario empresarial tras el authorize forzado", () => {
    sessionStorage.setItem("arquitecturabasemt.sessionExpired", "1");
    show("business", `/login/empresa?returnUrl=${encodeURIComponent(authorizeUrl)}`);

    expect(screen.getByRole("status")).toHaveTextContent("Tu sesión venció. Ingresá de nuevo.");
    expect(screen.getByRole("textbox", { name: "Correo electrónico" })).toBeVisible();
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
    expect(screen.getByRole("heading", { name: "Revisá tu correo" })).toHaveClass("text-[24px]", "tracking-[-0.02em]");
    const group = screen.getByRole("group", { name: "Código" });
    expect(within(group).getAllByRole("textbox")).toHaveLength(6);
    expect(screen.getByRole("button", { name: "Reenviar en 60 s" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Reenviar en 60 s" })).toHaveClass("bg-[var(--lado-activo)]");
    expect(screen.getByRole("button", { name: "Reenviar en 60 s" })).not.toHaveClass("bg-background");
    // Tablero Ingreso y «Criterio · Botones»: «Verificar» está activo con los casilleros vacíos; si falta el código, la
    // franja dice qué falta, en vez de apagar el botón. Un dígito nuevo la saca.
    expect(screen.getByRole("button", { name: "Verificar" })).toBeEnabled();
    fireEvent.click(screen.getByRole("button", { name: "Verificar" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Escribí los 6 números del código.");
    expect(verifyBody).toBeUndefined();
    fireEvent.change(within(group).getByRole("textbox", { name: "Código 1" }), { target: { value: "1" } });
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
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
    // Tablero Ingreso: «Te quedan 3 intentos.» es la segunda línea, más clara.
    expect(screen.getByText("Te quedan 3 intentos.")).toHaveClass("block", "opacity-85");
    expect(first).toHaveAttribute("aria-invalid", "true");
    fireEvent.click(screen.getByRole("button", { name: "Usar otro correo" }));
    expect(screen.getByRole("heading", { name: "Ingresá a tu cuenta" })).toBeVisible();
    expect(screen.queryByText("El código no es válido.")).not.toBeInTheDocument();
  });

  it("cuenta el Retry-After también al verificar y bloquea otro intento mientras corre", async () => {
    let verifies = 0;
    server.use(
      http.post("/api/auth/login-code", () => HttpResponse.json({ resendAfterSeconds: 60 }, { status: 202 })),
      http.post("/api/auth/login-code/verify", () => { verifies++; return HttpResponse.json({ code: "Http.TooManyRequests", retryAfter: 30 }, { status: 429 }); }),
    );
    show("consumer", loginUrl);
    fireEvent.change(screen.getByRole("textbox", { name: "Correo electrónico" }), { target: { value: "ana@example.com" } });
    fireEvent.click(screen.getByRole("button", { name: "Enviar código" }));
    const first = await screen.findByRole("textbox", { name: "Código 1" });
    fireEvent.paste(first, { clipboardData: { getData: () => "123456" } });
    fireEvent.click(screen.getByRole("button", { name: "Verificar" }));

    expect(await screen.findByText("Demasiadas solicitudes desde esta red.")).toBeVisible();
    expect(screen.getByRole("button", { name: "Reintentá en 0:30" })).toBeDisabled();
    expect(verifies).toBe(1);
  });

  it.each([
    ["Tenancy.Access.NotMember", {}, "Tu cuenta no está en ninguna empresa todavía", ["Registrá tu empresa", "Ingresá como persona"]],
    ["Tenancy.Member.Inactive", { organizationName: "Grupo Delta" }, "Tu acceso a Grupo Delta está deshabilitado", ["Ingresá como persona", "Registrá tu empresa"]],
  ])("muestra el estado empresarial %s después del código", async (code, metadata, title, links) => {
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
    // El edificio del tablero Ingreso (shared/ui/icons), no el de lucide; el acceso deshabilitado sigue con su círculo tachado.
    if (code === "Tenancy.Access.NotMember") expect(icon?.querySelector("path")).toHaveAttribute("d", "M4 21V5a1 1 0 0 1 1-1h9a1 1 0 0 1 1 1v16");
    else expect(icon?.getAttribute("class")).toContain("lucide-ban");
    // Como el tablero Ingreso: la acción principal primero, rellena; la otra, con borde. Son los botones de 44 y letra de
    // 15 del ingreso y el registro (Button lg), no enlaces con medidas propias.
    const actions = within(screen.getByRole("main")).getAllByRole("link").filter((link) => link.textContent !== "ArquitecturaBase");
    expect(actions.map((link) => link.textContent)).toEqual(links);
    expect(actions[0]).toHaveAttribute("data-variant", "default");
    expect(actions[1]).toHaveAttribute("data-variant", "outline");
    for (const action of actions) expect(action).toHaveClass("h-11", "text-[15px]");
    expect(screen.getByRole("link", { name: "Registrá tu empresa" })).toHaveAttribute("href", "/registro/empresa");
    expect(screen.getByRole("link", { name: "Ingresá como persona" })).toHaveAttribute("href", "/login");
  });

  it.each([
    ["Tenancy.Tenant.Suspended", "Empresa A está suspendida", "Nadie de la organización puede entrar por ahora. Tus otros perfiles siguen funcionando."],
    ["Tenancy.Tenant.PendingApproval", "Estamos revisando Empresa A", "Te avisamos por correo cuando esté aprobada."],
    ["Tenancy.Tenant.Closed", "Empresa A está cerrada", "La organización ya no está disponible. Tus otros perfiles siguen funcionando."],
  ])("muestra el estado terminal %s de la organización sin permitir gastar otra vez el código", async (code, title, description) => {
    server.use(
      http.post("/api/auth/login-code", () => HttpResponse.json({ resendAfterSeconds: 60 }, { status: 202 })),
      http.post("/api/auth/login-code/verify", () => HttpResponse.json({ code, organizationName: "Empresa A", tenantId: "empresa-a" }, { status: 403 })),
    );
    show("business", `/login/empresa?returnUrl=${encodeURIComponent(authorizeUrl)}`);
    fireEvent.change(screen.getByRole("textbox", { name: "Correo electrónico" }), { target: { value: "ana@example.com" } });
    fireEvent.click(screen.getByRole("button", { name: "Enviar código" }));
    const first = await screen.findByRole("textbox", { name: "Código 1" });
    fireEvent.paste(first, { clipboardData: { getData: () => "123456" } });
    fireEvent.click(screen.getByRole("button", { name: "Verificar" }));

    expect(await screen.findByRole("heading", { name: title })).toBeVisible();
    expect(screen.getByText(description)).toBeVisible();
    // En revisión, el reloj; cerrada, el candado: los del tablero (shared/ui/icons).
    const circle = screen.getByRole("main").querySelector("span[aria-hidden='true'] svg");
    if (code === "Tenancy.Tenant.PendingApproval") expect(circle?.querySelector("circle")).toHaveAttribute("r", "8.5");
    if (code === "Tenancy.Tenant.Closed") expect(circle?.querySelector("rect")).toHaveAttribute("y", "10.5");
    expect(screen.getByRole("link", { name: "Ingresá como persona" })).toHaveAttribute("href", "/login");
    expect(screen.queryByRole("button", { name: "Verificar" })).not.toBeInTheDocument();
    expect(screen.queryByText("Algo salió mal. Probá de nuevo en un rato.")).not.toBeInTheDocument();
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
      // Tablero Ingreso: «Volver a ingresar» es un enlace de texto de 13, centrado debajo de los botones, con la altura
      // normal de su letra (.fila-links .lnk): queda a 22 de «Reenviar código», no 4 más abajo.
      const back = screen.getByRole("button", { name: "Volver a ingresar" });
      expect(back).toHaveAttribute("data-variant", "link");
      expect(back).toHaveClass("text-[var(--marca-tx)]", "text-[13px]", "leading-[normal]");
      expect(back.parentElement).toHaveClass("flex", "justify-center");
    }
  });
});

