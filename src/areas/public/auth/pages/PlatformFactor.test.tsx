import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HttpResponse, http } from "msw";
import { type ReactNode } from "react";
import { AuthContext, type AuthContextProps } from "react-oidc-context";
import { MemoryRouter, useLocation } from "react-router";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import { configureI18n } from "@/shared/i18n";
import { server } from "@/test/mocks/server";
import { Toaster } from "@/shared/ui/sonner";
import { LoginPage } from "./LoginPage";

// Tableros Ingreso y M-Ingreso, «Operador: …» (Etapa 9): el segundo factor del operador después del código o de Google.
const signinRedirect = vi.fn(() => Promise.resolve());
const authorizeUrl = "/connect/authorize?client_id=web&response_type=code&access=platform";
const loginUrl = `/login?returnUrl=${encodeURIComponent(authorizeUrl)}`;
const factorPath = "/api/auth/platform-factor";
const codes = ["7KQ2-M9XD", "P4TZ-8WNE", "H2RC-QA6V", "ZL9B-3YFK", "E5MU-T7JP", "W8GD-2NHS", "C3XV-R6LQ", "N9AF-K4PB"];
const verifyChallenge = { state: "verify", expiresAtUtc: "2999-01-01T00:00:00Z" };
const setupChallenge = { state: "setup", expiresAtUtc: "2999-01-01T00:00:00Z", secret: "JBSWY3DPEHPK3PXP", otpauthUri: "otpauth://totp/ArquitecturaBase:martin?secret=JBSWY3DPEHPK3PXP&issuer=ArquitecturaBase" };
const codesChallenge = { state: "recoveryCodes", expiresAtUtc: "2999-01-01T00:00:00Z", recoveryCodes: codes };

beforeAll(async () => {
  await configureI18n([{ code: "es-AR", languageCode: "es", fallbackCulture: null, isEnabled: true, isDefault: true }]);
});
beforeEach(() => server.use(http.get("/api/auth/methods", () => HttpResponse.json({ channels: [{ key: "email", countries: [] }, { key: "google", countries: [] }] }))));
afterEach(() => { signinRedirect.mockClear(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

function Location() {
  const location = useLocation();
  return <output data-testid="location">{location.pathname + location.search}</output>;
}

function show(url: string) {
  const completeLogin = vi.fn();
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  const auth = { isAuthenticated: false, isLoading: false, signinRedirect, signoutRedirect: vi.fn() } as unknown as AuthContextProps;
  const wrapper = ({ children }: { children: ReactNode }) => (
    <AuthContext.Provider value={auth}>
      <QueryClientProvider client={client}><MemoryRouter initialEntries={[url]}>{children}<Location /><Toaster /></MemoryRouter></QueryClientProvider>
    </AuthContext.Provider>
  );
  return { completeLogin, ...render(<LoginPage access="consumer" completeLogin={completeLogin} />, { wrapper }) };
}

/** Las lecturas del desafío y los pedidos de verificar y completar, con su clave y su encabezado de sesión. */
function factorApi(challenges: readonly Record<string, unknown>[], verify: (body: { method: string; code: string }, call: number) => Response) {
  const calls = { reads: 0, verify: [] as { body: unknown; key: string | null; authorization: string | null }[], complete: [] as { body: unknown; key: string | null }[] };
  server.use(
    http.get(factorPath, () => { const challenge = challenges[Math.min(calls.reads, challenges.length - 1)]; calls.reads++; return HttpResponse.json(challenge); }),
    http.post(`${factorPath}/verify`, async ({ request }) => {
      const body = await request.json() as { method: string; code: string };
      calls.verify.push({ body, key: request.headers.get("Idempotency-Key"), authorization: request.headers.get("authorization") });
      return verify(body, calls.verify.length);
    }),
    http.post(`${factorPath}/complete`, async ({ request }) => {
      calls.complete.push({ body: await request.json(), key: request.headers.get("Idempotency-Key") });
      return HttpResponse.json({ returnUrl: authorizeUrl });
    }),
  );
  return calls;
}

const typeCode = (value: string) => fireEvent.change(screen.getByRole("textbox", { name: "Código 1" }), { target: { value } });

describe("Segundo factor del operador", () => {
  it("después del código consulta el desafío, verifica la app y abre el authorize; recargar vuelve a consultarlo", async () => {
    server.use(
      http.post("/api/auth/login-code", () => HttpResponse.json({ resendAfterSeconds: 60 }, { status: 202 })),
      http.post("/api/auth/login-code/verify", () => HttpResponse.json({ returnUrl: authorizeUrl, next: "platformFactor" })),
    );
    const calls = factorApi([verifyChallenge], () => HttpResponse.json({ next: "authorize", returnUrl: authorizeUrl }));
    const { completeLogin, container } = show(loginUrl);
    // ADR 0043: antes de probar el primer factor nada lo menciona ni consulta el desafío.
    fireEvent.change(await screen.findByRole("textbox", { name: "Correo electrónico" }), { target: { value: "martin@arquitecturabase.test" } });
    fireEvent.click(screen.getByRole("button", { name: "Enviar código" }));
    await screen.findByRole("textbox", { name: "Código 1" });
    typeCode("123456");
    expect(calls.reads).toBe(0);
    fireEvent.click(screen.getByRole("button", { name: "Verificar" }));

    expect(await screen.findByRole("heading", { level: 1, name: "Verificación en dos pasos" })).toBeVisible();
    expect(screen.getByText("Escribí el código de 6 números de tu app de autenticación.")).toBeVisible();
    expect(screen.getByTestId("location")).toHaveTextContent("factor=pending");
    expect(screen.getByTestId("location")).not.toHaveTextContent(/secret|otpauth/u);
    expect(completeLogin).not.toHaveBeenCalled();
    expect(await axe(container)).toHaveNoViolations();

    fireEvent.click(screen.getByRole("button", { name: "Verificar" }));
    expect(await screen.findByText("Escribí los 6 números del código.")).toBeVisible();
    typeCode("654321");
    fireEvent.click(screen.getByRole("button", { name: "Verificar" }));
    await waitFor(() => expect(completeLogin).toHaveBeenCalledWith(authorizeUrl));
    expect(calls.verify).toEqual([{ body: { method: "authenticator", code: "654321" }, key: expect.stringMatching(/^[0-9a-f-]{36}$/iu), authorization: null }]);
    expect(signinRedirect).not.toHaveBeenCalled();
    expect(localStorage.length + sessionStorage.length).toBe(0);
  });

  it("Google vuelve con factor=pending: consulta el desafío sin iniciar OIDC", async () => {
    const calls = factorApi([verifyChallenge], () => HttpResponse.json({ next: "authorize", returnUrl: authorizeUrl }));
    show("/login?factor=pending");
    expect(await screen.findByRole("heading", { level: 1, name: "Verificación en dos pasos" })).toBeVisible();
    expect(calls.reads).toBe(1);
    expect(signinRedirect).not.toHaveBeenCalled();
  });

  it("el código incorrecto marca el código y dice que revise la hora; con red cortada repite la misma clave", async () => {
    const calls = factorApi([verifyChallenge], (_body, call) => call === 1 ? HttpResponse.json({ code: "Auth.TwoFactor.Invalid", errors: { code: ["El código no es válido."] } }, { status: 400 })
      : call === 2 ? HttpResponse.error() : HttpResponse.json({ next: "authorize", returnUrl: authorizeUrl }));
    const { completeLogin } = show(`${loginUrl}&factor=pending`);
    await screen.findByRole("heading", { level: 1, name: "Verificación en dos pasos" });
    typeCode("120934");
    fireEvent.click(screen.getByRole("button", { name: "Verificar" }));
    expect(await screen.findByText("El código no es válido.")).toBeVisible();
    expect(screen.getByText("Revisá que la hora de tu celular esté bien.")).toBeVisible();
    expect(screen.getByRole("textbox", { name: "Código 1" })).toHaveAttribute("aria-invalid", "true");

    typeCode("654321");
    fireEvent.click(screen.getByRole("button", { name: "Verificar" }));
    await waitFor(() => expect(calls.verify).toHaveLength(2));
    await waitFor(() => expect(screen.getByRole("button", { name: "Verificar" })).toBeEnabled());
    fireEvent.click(screen.getByRole("button", { name: "Verificar" }));
    await waitFor(() => expect(completeLogin).toHaveBeenCalledWith(authorizeUrl));
    expect(calls.verify[2].key).toBe(calls.verify[1].key);
    expect(calls.verify[1].key).not.toBe(calls.verify[0].key);
  });

  it("con un código de recuperación: completo, inválido o usado, y vuelve a la app", async () => {
    const calls = factorApi([verifyChallenge], () => HttpResponse.json({ code: "Auth.TwoFactor.RecoveryInvalid" }, { status: 400 }));
    const { container } = show(`${loginUrl}&factor=pending`);
    await screen.findByRole("heading", { level: 1, name: "Verificación en dos pasos" });
    fireEvent.click(screen.getByRole("button", { name: "Usar un código de recuperación" }));
    expect(screen.getByText("Escribí uno de los códigos de recuperación que guardaste.")).toBeVisible();
    const field = screen.getByRole("textbox", { name: "Código de recuperación" });
    expect(field).toHaveAttribute("placeholder", "XXXX-XXXX");
    fireEvent.change(field, { target: { value: "P4TZ" } });
    fireEvent.click(screen.getByRole("button", { name: "Verificar" }));
    expect(await screen.findByText("Escribí el código de recuperación completo.")).toBeVisible();
    fireEvent.change(field, { target: { value: "p4tz-8wne" } });
    fireEvent.click(screen.getByRole("button", { name: "Verificar" }));
    expect(await screen.findByText("Ese código no es válido o ya lo usaste.")).toBeVisible();
    expect(field).toHaveAttribute("aria-invalid", "true");
    expect(calls.verify.map((call) => call.body)).toEqual([{ method: "recoveryCode", code: "P4TZ-8WNE" }]);
    expect(await axe(container)).toHaveNoViolations();
    fireEvent.click(screen.getByRole("button", { name: "Usar la app de autenticación" }));
    expect(screen.getByRole("textbox", { name: "Código 1" })).toBeVisible();
    expect(screen.queryByText("Ese código no es válido o ya lo usaste.")).not.toBeInTheDocument();
  });

  it("el bloqueo de la cuenta traba el código y el botón mientras dura", async () => {
    factorApi([verifyChallenge], () => HttpResponse.json({ code: "Identity.Account.LockedOut", retryAfter: 900 }, { status: 429, headers: { "Retry-After": "900" } }));
    show(`${loginUrl}&factor=pending`);
    await screen.findByRole("heading", { level: 1, name: "Verificación en dos pasos" });
    typeCode("774201");
    fireEvent.click(screen.getByRole("button", { name: "Verificar" }));
    expect(await screen.findByText("Tu cuenta está bloqueada por unos minutos por demasiados intentos fallidos.")).toBeVisible();
    expect(screen.getByText("Probá de nuevo en 15 minutos.")).toBeVisible();
    expect(screen.getByRole("textbox", { name: "Código 1" })).toBeDisabled();
    // Tablero Ingreso: con la cuenta bloqueada, las casillas van marcadas en rojo.
    expect(screen.getByRole("textbox", { name: "Código 1" })).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByRole("button", { name: "Verificar" })).toBeDisabled();
  });

  it("si el desafío venció pide volver a ingresar y vuelve al primer paso", async () => {
    server.use(http.get(factorPath, () => HttpResponse.json({ code: "Auth.TwoFactor.ChallengeExpired" }, { status: 401 })));
    show(`${loginUrl}&factor=pending`);
    expect(await screen.findByText("Volvé a ingresar para continuar.")).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Volver a ingresar" }));
    expect(await screen.findByRole("textbox", { name: "Correo electrónico" })).toBeVisible();
    expect(screen.getByTestId("location")).not.toHaveTextContent("factor=pending");
  });

  it("si vence mientras escribe, verificar también vuelve a pedir el ingreso", async () => {
    factorApi([verifyChallenge], () => HttpResponse.json({ code: "Auth.TwoFactor.ChallengeExpired" }, { status: 401 }));
    show(`${loginUrl}&factor=pending`);
    await screen.findByRole("heading", { level: 1, name: "Verificación en dos pasos" });
    typeCode("123456");
    fireEvent.click(screen.getByRole("button", { name: "Verificar" }));
    expect(await screen.findByText("Volvé a ingresar para continuar.")).toBeVisible();
  });

  it("alta: QR del navegador, clave en grupos, código que no activa, códigos para descargar o copiar y entrar solo después de guardarlos", async () => {
    const user = userEvent.setup();
    const createObjectURL = vi.fn(() => "blob:codigos");
    vi.stubGlobal("URL", Object.assign(URL, { createObjectURL, revokeObjectURL: vi.fn() }));
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    const calls = factorApi([setupChallenge, codesChallenge], (_body, call) => call === 1
      ? HttpResponse.json({ code: "Auth.TwoFactor.Invalid" }, { status: 400 }) : HttpResponse.json({ next: "recoveryCodes" }));
    const { completeLogin, container } = show(`${loginUrl}&factor=pending`);

    expect(await screen.findByRole("heading", { level: 1, name: "Protegé tu cuenta de operador" })).toBeVisible();
    const qr = screen.getByRole("img", { name: "Código QR para la app de autenticación" });
    expect(qr.querySelector("path")?.getAttribute("d")).toMatch(/^M\d+ \d+h1v1h-1z/u);
    expect(screen.getByText("JBSW Y3DP EHPK 3PXP")).toBeVisible();
    expect(await axe(container)).toHaveNoViolations();
    await user.click(screen.getByRole("button", { name: "Activar" }));
    expect(await screen.findByText("Escribí los 6 números que muestra la app.")).toBeVisible();
    typeCode("551203");
    await user.click(screen.getByRole("button", { name: "Activar" }));
    expect(await screen.findByText("El código no es válido.")).toBeVisible();
    typeCode("551204");
    await user.click(screen.getByRole("button", { name: "Activar" }));

    expect(await screen.findByRole("heading", { level: 1, name: "Guardá tus códigos de recuperación" })).toBeVisible();
    expect(within(screen.getByRole("list", { name: "Códigos de recuperación" })).getAllByRole("listitem").map((item) => item.textContent)).toEqual(codes);
    const enter = screen.getByRole("button", { name: "Entrar a la plataforma" });
    expect(enter).toBeDisabled();
    await user.click(screen.getByRole("button", { name: "Copiar" }));
    expect(await navigator.clipboard.readText()).toBe(codes.join("\n") + "\n");
    expect(await screen.findByText("Copiamos los códigos.")).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Descargar" }));
    expect(createObjectURL).toHaveBeenCalledOnce();
    expect(click).toHaveBeenCalledOnce();
    expect(await screen.findByText("Bajamos los códigos en un archivo de texto.")).toBeVisible();
    expect(calls.complete).toHaveLength(0);
    expect(await axe(container)).toHaveNoViolations();

    await user.click(screen.getByRole("checkbox", { name: "Los guardé en un lugar seguro" }));
    await user.click(enter);
    await waitFor(() => expect(completeLogin).toHaveBeenCalledWith(authorizeUrl));
    expect(calls.complete).toEqual([{ body: { savedRecoveryCodes: true }, key: expect.stringMatching(/^[0-9a-f-]{36}$/iu) }]);
    expect(calls.verify.map((call) => call.body)).toEqual([{ method: "authenticator", code: "551203" }, { method: "authenticator", code: "551204" }]);
    expect(localStorage.length + sessionStorage.length).toBe(0);
  });

  it("un paso fuera de orden vuelve a consultar el desafío", async () => {
    const calls = factorApi([verifyChallenge, setupChallenge], () => HttpResponse.json({ code: "Auth.TwoFactor.InvalidState" }, { status: 409 }));
    show(`${loginUrl}&factor=pending`);
    await screen.findByRole("heading", { level: 1, name: "Verificación en dos pasos" });
    typeCode("123456");
    fireEvent.click(screen.getByRole("button", { name: "Verificar" }));
    expect(await screen.findByRole("heading", { level: 1, name: "Protegé tu cuenta de operador" })).toBeVisible();
    expect(calls.reads).toBe(2);
  });
});
