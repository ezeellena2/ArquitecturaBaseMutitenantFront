import { fireEvent, screen, waitFor } from "@testing-library/react";
import { HttpResponse, delay, http } from "msw";
import type { AuthContextProps } from "react-oidc-context";
import { RouterProvider, createMemoryRouter } from "react-router";
import { afterEach, beforeAll, beforeEach, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import { AppProviders } from "@/app/providers";
import { createQueryClient } from "@/shared/api/queryClient";
import type { BusinessSignupResponse, RequestLoginCodeRequest, SignupRequest, VerifyLoginCodeRequest, VerifySignupRequest } from "@/shared/api/types";
import { changeCulture, configureI18n } from "@/shared/i18n";
import { server } from "@/test/mocks/server";
import { asPhone } from "@/test/utils/phone";
import { render } from "@testing-library/react";
import { LoginPage } from "./LoginPage";
import { SignupPage } from "./SignupPage";
import { BusinessSignupPage } from "./BusinessSignupPage";

const authorize = "/connect/authorize?client_id=web&state=original-state&code_challenge=original-pkce";
const phone = { country: "AR", number: "011 15-2345-6789" };
const signinRedirect = vi.fn(async () => {});
const completeLogin = vi.fn();
let restorePhone: () => void;

beforeAll(async () => configureI18n([
  { code: "es-AR", languageCode: "es", fallbackCulture: null, isEnabled: true, isDefault: true },
  { code: "en-US", languageCode: "en", fallbackCulture: "es-AR", isEnabled: true, isDefault: false },
]));
beforeEach(() => {
  restorePhone = asPhone();
  server.use(http.get("/api/auth/methods", () => HttpResponse.json({ channels: [{ key: "email", countries: [] }, { key: "whatsapp", countries: ["AR", "UY"] }] })));
  server.use(http.get("/api/auth/external/google/antiforgery", () => HttpResponse.json({ requestToken: "phone-test-form-token" })));
  signinRedirect.mockClear(); completeLogin.mockClear();
});
afterEach(async () => { restorePhone(); await changeCulture("es-AR"); });

function show(path: string, state?: unknown) {
  const client = createQueryClient({ queries: { retry: false }, mutations: { retry: false } });
  const auth = { isAuthenticated: false, isLoading: false, signinRedirect, signoutRedirect: vi.fn(async () => {}) } as unknown as AuthContextProps;
  const router = createMemoryRouter([
    { path: "/login", element: <LoginPage access="consumer" completeLogin={completeLogin} /> },
    { path: "/login/empresa", element: <LoginPage access="business" completeLogin={completeLogin} /> },
    { path: "/registro", element: <SignupPage completeAuthorization={completeLogin} /> },
    { path: "/registro/empresa", element: <BusinessSignupPage /> },
  ], { initialEntries: [{ pathname: path.split("?")[0], search: path.includes("?") ? `?${path.split("?")[1]}` : "", state }] });
  return { router, client, ...render(<AppProviders client={client} authContext={auth}><RouterProvider router={router} /></AppProviders>) };
}

async function fillPhone() {
  fireEvent.click(await screen.findByRole("button", { name: "WhatsApp" }));
  const input = screen.getByRole("textbox", { name: /^(Tu )?número de WhatsApp$/i });
  await waitFor(() => expect(input).toBeEnabled());
  fireEvent.change(input, { target: { value: phone.number } });
  return input;
}

async function verify(label = "Verificar") {
  fireEvent.change(await screen.findByRole("textbox", { name: "Código 1" }), { target: { value: "123456" } });
  fireEvent.click(screen.getByRole("button", { name: label }));
}

it.each(["consumer", "business"] as const)("ingreso Phone %s conserva contrato, autorización y privacidad del operador hasta posesión", async (access) => {
  const requests: RequestLoginCodeRequest[] = [];
  const verifications: VerifyLoginCodeRequest[] = [];
  server.use(
    http.post<never, RequestLoginCodeRequest>("/api/auth/login-code", async ({ request }) => {
      requests.push(await request.json());
      expect(request.headers.get("Idempotency-Key")).toBeTruthy();
      return HttpResponse.json({ resendAfterSeconds: 0 }, { status: 202 });
    }),
    http.post<never, VerifyLoginCodeRequest>("/api/auth/login-code/verify", async ({ request }) => {
      verifications.push(await request.json());
      return HttpResponse.json({ code: "Tenancy.Access.PlatformOnly" }, { status: 403 });
    }),
  );
  const { container } = show(`${access === "consumer" ? "/login" : "/login/empresa"}?${new URLSearchParams({ returnUrl: authorize })}`);
  await fillPhone();
  expect(await axe(container)).toHaveNoViolations();
  expect(screen.queryByText(/Esta cuenta es de un operador/)).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Enviar código" }));
  expect(await screen.findByRole("heading", { name: "Revisá tu WhatsApp" })).toBeVisible();
  expect(requests).toEqual([{ phone, channel: "whatsapp" }]);
  expect(screen.getByRole("button", { name: "Usar otro número" })).toBeVisible();
  expect(await axe(container)).toHaveNoViolations();
  await verify();
  expect(await screen.findByRole("heading", { name: "Esta cuenta es de un operador: solo entra a Plataforma" })).toBeVisible();
  expect(verifications).toEqual([{ phone, channel: "whatsapp", code: "123456", returnUrl: authorize }]);
  expect(completeLogin).not.toHaveBeenCalled();
});

it.each(["consumer", "business"] as const)("número desconocido en %s va debajo del campo y continúa registro en navigation state", async (access) => {
  server.use(http.post("/api/auth/login-code", () => HttpResponse.json({ code: "Auth.LoginCode.PhoneAccountNotFound", detail: "No hay una cuenta con ese número." }, { status: 400 })));
  const { router } = show(`${access === "consumer" ? "/login" : "/login/empresa"}?${new URLSearchParams({ returnUrl: authorize })}`);
  const input = await fillPhone();
  fireEvent.click(screen.getByRole("button", { name: "Enviar código" }));
  await waitFor(() => expect(input).toHaveAccessibleDescription("No hay una cuenta con ese número."));
  fireEvent.click(screen.getByRole("link", { name: access === "consumer" ? "Crear mi cuenta" : "Registrá tu empresa" }));
  const nextInput = await screen.findByRole("textbox", { name: /^(Tu )?número de WhatsApp$/i });
  expect(nextInput).toHaveValue(phone.number);
  expect(router.state.location.state).toEqual({ phone });
  expect(router.state.location.search).not.toContain("phone");
  if (access === "consumer") expect(router.state.location.search).toBe(`?${new URLSearchParams({ returnUrl: authorize })}`);
});

it("Phone ocupado no simula código; conserva número hacia Login directo y sólo inicia OIDC tras verificar", async () => {
  const storageWrite = vi.spyOn(Storage.prototype, "setItem");
  server.use(
    http.post("/api/auth/signup", () => HttpResponse.json({ code: "Auth.Signup.PhoneTaken", detail: "Ese número ya tiene una cuenta." }, { status: 409 })),
    http.post("/api/auth/login-code", () => HttpResponse.json({ resendAfterSeconds: 0 }, { status: 202 })),
    http.post<never, VerifyLoginCodeRequest>("/api/auth/login-code/verify", async ({ request }) => {
      expect(await request.json()).toEqual({ phone, channel: "whatsapp", code: "123456", returnUrl: "/" });
      return HttpResponse.json({ returnUrl: "/" });
    }),
  );
  const { router } = show("/registro");
  const input = await fillPhone();
  fireEvent.click(screen.getByRole("checkbox"));
  fireEvent.click(screen.getByRole("button", { name: "Crear cuenta" }));
  await waitFor(() => expect(input).toHaveAccessibleDescription("Ese número ya tiene una cuenta."));
  expect(screen.queryByRole("textbox", { name: "Código 1" })).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("link", { name: "Ingresar" }));
  expect(await screen.findByRole("textbox", { name: /^(Tu )?número de WhatsApp$/i })).toHaveValue(phone.number);
  expect(signinRedirect).not.toHaveBeenCalled();
  expect(router.state.location.search).toBe("");
  fireEvent.click(screen.getByRole("button", { name: "Enviar código" }));
  await verify();
  await waitFor(() => expect(signinRedirect).toHaveBeenCalledExactlyOnceWith({ extraQueryParams: { access: "consumer" }, state: { returnTo: "/" } }));
  expect(completeLogin).not.toHaveBeenCalled();
  expect(storageWrite.mock.calls.some((call) => String(call[1]).includes("2345"))).toBe(false);
  storageWrite.mockRestore();
});

it("registro Phone pide términos y envía consentimiento/cultura/zona sin email ni nombre; continúa autorización original", async () => {
  const calls: SignupRequest[] = [];
  server.use(
    http.post<never, SignupRequest>("/api/auth/signup", async ({ request }) => { calls.push(await request.json()); return HttpResponse.json({ resendAfterSeconds: 0 }, { status: 202 }); }),
    http.post<never, VerifySignupRequest>("/api/auth/signup/verify", async ({ request }) => { expect(await request.json()).toEqual({ ...calls[0], code: "123456" }); return new HttpResponse(null, { status: 204 }); }),
  );
  show(`/registro?${new URLSearchParams({ returnUrl: authorize })}`);
  await fillPhone();
  fireEvent.click(screen.getByRole("button", { name: "Crear cuenta" }));
  expect(await screen.findByText("Aceptá los Términos y la Política de privacidad.")).toBeVisible();
  expect(calls).toHaveLength(0);
  fireEvent.click(screen.getByRole("checkbox"));
  fireEvent.click(screen.getByRole("button", { name: "Crear cuenta" }));
  await verify("Verificar y crear la cuenta");
  expect(calls).toEqual([{ phone, channel: "whatsapp", acceptedTerms: true, culture: "es-AR", timeZoneId: expect.any(String) }]);
  await waitFor(() => expect(completeLogin).toHaveBeenCalledExactlyOnceWith(authorize));
});

it("registro empresarial Phone funciona con ConsumerSignup cerrado, usa sus rutas propias y abre Tu organización", async () => {
  let consumerCalls = 0;
  let requested: SignupRequest | undefined;
  server.use(
    http.post("/api/auth/signup", () => { consumerCalls++; return HttpResponse.json({ code: "Auth.Signup.Closed" }, { status: 403 }); }),
    http.post<never, SignupRequest>("/api/auth/business-signup/code", async ({ request }) => { requested = await request.json(); return HttpResponse.json({ resendAfterSeconds: 0 }, { status: 202 }); }),
    http.post<never, VerifySignupRequest>("/api/auth/business-signup/verify", async ({ request }) => { expect(await request.json()).toEqual({ ...requested, code: "123456" }); return new HttpResponse(null, { status: 204 }); }),
  );
  show("/registro/empresa", { phone });
  const input = await screen.findByRole("textbox", { name: /^(Tu )?número de WhatsApp$/i });
  expect(input).toHaveValue(phone.number);
  fireEvent.click(screen.getByRole("checkbox"));
  fireEvent.click(screen.getByRole("button", { name: "Continuar" }));
  await verify();
  expect(await screen.findByRole("heading", { name: "Tu organización" })).toBeVisible();
  expect(requested).toEqual({ phone, channel: "whatsapp", acceptedTerms: true, culture: "es-AR", timeZoneId: expect.any(String) });
  expect(consumerCalls).toBe(0);
});

it("tras error 5xx conserva clave al reintentar número, pero corregirlo cambia la operación", async () => {
  const keys: Array<string | null> = [];
  server.use(http.post("/api/auth/login-code", ({ request }) => { keys.push(request.headers.get("Idempotency-Key")); return HttpResponse.json({}, { status: 500 }); }));
  show(`/login?${new URLSearchParams({ returnUrl: authorize })}`);
  const input = await fillPhone();
  fireEvent.click(screen.getByRole("button", { name: "Enviar código" }));
  await waitFor(() => expect(keys).toHaveLength(1));
  await screen.findByText("Algo salió mal. Probá de nuevo en un rato.");
  fireEvent.click(screen.getByRole("button", { name: "Enviar código" }));
  await waitFor(() => expect(keys).toHaveLength(2));
  fireEvent.change(input, { target: { value: "011 15-2345-6788" } });
  fireEvent.click(screen.getByRole("button", { name: "Enviar código" }));
  await waitFor(() => expect(keys).toHaveLength(3));
  expect(keys[1]).toBe(keys[0]); expect(keys[2]).not.toBe(keys[0]);
  fireEvent.click(screen.getByRole("button", { name: "Correo" }));
  fireEvent.click(screen.getByRole("button", { name: "WhatsApp" }));
  fireEvent.click(screen.getByRole("button", { name: "Enviar código" }));
  await waitFor(() => expect(keys).toHaveLength(4));
  expect(keys[3]).not.toBe(keys[2]);
});

it("código Phone vencido permite reenviar, seis dígitos son obligatorios y Usar otro número conserva destino", async () => {
  let sends = 0;
  let checks = 0;
  server.use(
    http.post("/api/auth/login-code", () => { sends++; return HttpResponse.json({ resendAfterSeconds: 60 }, { status: 202 }); }),
    http.post("/api/auth/login-code/verify", () => { checks++; return HttpResponse.json({ code: "Auth.LoginCode.Expired" }, { status: 400 }); }),
  );
  show(`/login?${new URLSearchParams({ returnUrl: authorize })}`);
  await fillPhone(); fireEvent.click(screen.getByRole("button", { name: "Enviar código" }));
  fireEvent.click(await screen.findByRole("button", { name: "Verificar" }));
  expect(await screen.findByText("Escribí los 6 números del código.")).toBeVisible();
  expect(checks).toBe(0);
  await verify();
  expect(await screen.findByText("El código venció. Pedí uno nuevo.")).toBeVisible();
  fireEvent.click(screen.getByRole("button", { name: "Reenviar código" }));
  await waitFor(() => expect(sends).toBe(2));
  fireEvent.click(screen.getByRole("button", { name: "Usar otro número" }));
  expect(await screen.findByRole("textbox", { name: /^(Tu )?número de WhatsApp$/i })).toHaveValue(phone.number);
});

it.each(["cargando", "apagado"])("no ofrece WhatsApp con capacidad %s", async (status) => {
  server.use(http.get("/api/auth/methods", async () => { if (status === "cargando") await delay("infinite"); return HttpResponse.json({ channels: [{ key: "email", countries: [] }] }); }));
  const { container } = show(`/login?${new URLSearchParams({ returnUrl: authorize })}`);
  expect(await screen.findByRole("textbox", { name: "Correo electrónico" })).toBeVisible();
  expect(screen.queryByRole("button", { name: "WhatsApp" })).not.toBeInTheDocument();
  expect(await axe(container)).toHaveNoViolations();
});

it("ingreso WhatsApp en inglés muestra destino con PhoneText y acciones traducidas", async () => {
  await changeCulture("en-US");
  server.use(http.post("/api/auth/login-code", () => HttpResponse.json({ resendAfterSeconds: 0 }, { status: 202 })));
  const { container } = show(`/login?${new URLSearchParams({ returnUrl: authorize })}`, { phone });
  expect(await screen.findByRole("textbox", { name: "Your WhatsApp number" })).toHaveValue(phone.number);
  fireEvent.click(screen.getByRole("button", { name: "Send code" }));
  expect(await screen.findByRole("heading", { name: "Check your WhatsApp" })).toBeVisible();
  expect(screen.getByRole("button", { name: "Use another number" })).toBeVisible();
  expect(container).toHaveTextContent("+54 9 11 2345 6789");
  expect(container).toHaveTextContent("It expires in 10 minutes.");
  expect(screen.getByText("It arrives on WhatsApp on your phone. It doesn't show up on WhatsApp Web.")).toBeVisible();
  expect(await axe(container)).toHaveNoViolations();
});

it.each(["/login", "/registro", "/registro/empresa"])("%s anuncia vencimiento Phone y reserva la nota de WhatsApp Web para ingreso", async (path) => {
  const endpoint = path === "/login" ? "/api/auth/login-code" : path === "/registro" ? "/api/auth/signup" : "/api/auth/business-signup/code";
  server.use(http.post(endpoint, () => HttpResponse.json({ resendAfterSeconds: 0 }, { status: 202 })));
  const { container } = show(path === "/login" ? `${path}?${new URLSearchParams({ returnUrl: authorize })}` : path);
  await fillPhone();
  if (path !== "/login") fireEvent.click(screen.getByRole("checkbox"));
  fireEvent.click(screen.getByRole("button", { name: path === "/login" ? "Enviar código" : path === "/registro" ? "Crear cuenta" : "Continuar" }));
  await screen.findByRole("heading", { name: "Revisá tu WhatsApp" });
  expect(container).toHaveTextContent("Vence en 10 minutos.");
  const notice = screen.queryByText("Llega al WhatsApp de tu celular. En WhatsApp Web no se muestra.");
  if (path === "/login") expect(notice).toBeVisible();
  else expect(notice).not.toBeInTheDocument();
});

it.each(["/registro", "/registro/empresa"])("%s conserva clave ante 5xx, distingue destino y abandono del recorrido", async (path) => {
  const keys: Array<string | null> = [];
  const endpoint = path === "/registro" ? "/api/auth/signup" : "/api/auth/business-signup/code";
  server.use(http.post(endpoint, ({ request }) => { keys.push(request.headers.get("Idempotency-Key")); return HttpResponse.json({}, { status: 500 }); }));
  show(path);
  const input = await fillPhone();
  fireEvent.click(screen.getByRole("checkbox"));
  const submit = () => fireEvent.click(screen.getByRole("button", { name: path === "/registro" ? "Crear cuenta" : "Continuar" }));
  submit();
  await screen.findByText("Algo salió mal. Probá de nuevo en un rato.");
  submit(); await waitFor(() => expect(keys).toHaveLength(2));
  expect(keys[1]).toBe(keys[0]);
  fireEvent.change(input, { target: { value: "011 15-2345-6788" } });
  submit(); await waitFor(() => expect(keys).toHaveLength(3));
  expect(keys[2]).not.toBe(keys[1]);
  fireEvent.click(screen.getByRole("button", { name: "Correo" }));
  fireEvent.click(screen.getByRole("button", { name: "WhatsApp" }));
  submit(); await waitFor(() => expect(keys).toHaveLength(4));
  expect(keys[3]).not.toBe(keys[2]);
});

it.each(["/registro", "/registro/empresa"])("%s conserva clave de verificación sólo mientras destino y código coinciden", async (path) => {
  const keys: Array<string | null> = [];
  const endpoint = path === "/registro" ? "/api/auth/signup" : "/api/auth/business-signup/code";
  server.use(
    http.post(endpoint, () => HttpResponse.json({ resendAfterSeconds: 0 }, { status: 202 })),
    http.post(`${path === "/registro" ? "/api/auth/signup" : "/api/auth/business-signup"}/verify`, ({ request }) => { keys.push(request.headers.get("Idempotency-Key")); return HttpResponse.json({}, { status: 500 }); }),
  );
  show(path); await fillPhone(); fireEvent.click(screen.getByRole("checkbox"));
  fireEvent.click(screen.getByRole("button", { name: path === "/registro" ? "Crear cuenta" : "Continuar" }));
  await verify(path === "/registro" ? "Verificar y crear la cuenta" : "Verificar");
  await screen.findByText("Algo salió mal. Probá de nuevo en un rato.");
  fireEvent.click(screen.getByRole("button", { name: path === "/registro" ? "Verificar y crear la cuenta" : "Verificar" }));
  await waitFor(() => expect(keys).toHaveLength(2)); expect(keys[1]).toBe(keys[0]);
  fireEvent.change(screen.getByRole("textbox", { name: "Código 1" }), { target: { value: "654321" } });
  fireEvent.click(screen.getByRole("button", { name: path === "/registro" ? "Verificar y crear la cuenta" : "Verificar" }));
  await waitFor(() => expect(keys).toHaveLength(3)); expect(keys[2]).not.toBe(keys[1]);
});

it("si WhatsApp se apaga con un número conservado, permite correo y no envía Phone", async () => {
  server.use(http.get("/api/auth/methods", () => HttpResponse.json({ channels: [{ key: "email", countries: [] }] })));
  let requestBody: RequestLoginCodeRequest | undefined;
  server.use(http.post<never, RequestLoginCodeRequest>("/api/auth/login-code", async ({ request }) => { requestBody = await request.json(); return HttpResponse.json({ resendAfterSeconds: 0 }, { status: 202 }); }));
  show(`/login?${new URLSearchParams({ returnUrl: authorize })}`, { phone });
  const input = await screen.findByRole("textbox", { name: "Correo electrónico" });
  fireEvent.change(input, { target: { value: "ana@example.test" } });
  fireEvent.click(screen.getByRole("button", { name: "Enviar código" }));
  expect(await screen.findByRole("heading", { name: "Revisá tu correo" })).toBeVisible();
  expect(requestBody).toEqual({ email: "ana@example.test" });
});

it("país Phone rechazado queda bajo el campo y canal no disponible muestra detail sin exponer código técnico", async () => {
  let sends = 0;
  server.use(http.post("/api/auth/login-code", () => {
    sends++;
    return HttpResponse.json(sends === 1 ? { code: "WhatsApp.Phone.CountryNotAllowed", detail: "WhatsApp no está habilitado para este país." }
      : { code: "Auth.LoginMethod.ChannelUnavailable", detail: "WhatsApp no está disponible por ahora." }, { status: 400 });
  }));
  show(`/login?${new URLSearchParams({ returnUrl: authorize })}`);
  const input = await fillPhone(); fireEvent.click(screen.getByRole("button", { name: "Enviar código" }));
  await waitFor(() => expect(input).toHaveAccessibleDescription("WhatsApp no está habilitado para este país."));
  fireEvent.change(input, { target: { value: "011 15-2345-6788" } });
  fireEvent.click(screen.getByRole("button", { name: "Enviar código" }));
  expect(await screen.findByText("WhatsApp no está disponible por ahora.")).toBeVisible();
  expect(screen.queryByText("Auth.LoginMethod.ChannelUnavailable")).not.toBeInTheDocument();
});

it("Login con Phone conservado y sin autorización devuelve Google a su puerta para recuperar tokens por OIDC", async () => {
  server.use(http.get("/api/auth/methods", () => HttpResponse.json({ channels: [{ key: "email", countries: [] }, { key: "google", countries: [] }, { key: "whatsapp", countries: ["AR"] }] })));
  show("/login/empresa", { phone });
  expect(await screen.findByRole("link", { name: "Ingresar con Google" })).toHaveAttribute("href", "/api/auth/external/google?returnUrl=%2Flogin%2Fempresa&access=business");
  expect(signinRedirect).not.toHaveBeenCalled();
});

it("cancelar baja tras código Phone sin autorización original inicia OIDC y no abre Personal sin tokens", async () => {
  server.use(
    http.post("/api/auth/login-code", () => HttpResponse.json({ resendAfterSeconds: 0 }, { status: 202 })),
    http.post("/api/auth/login-code/verify", () => HttpResponse.json({ code: "Identity.Account.PendingDeletion", scheduledForUtc: "2026-10-30T12:00:00Z", cancelTicket: "opaque-cancel", timeZoneId: "America/Argentina/Buenos_Aires", returnUrl: "/", cancelTicketExpiresAtUtc: "2026-10-30T13:00:00Z" }, { status: 403 })),
    http.post("/api/auth/deletion/cancel", () => HttpResponse.json({ returnUrl: "/" })),
  );
  show("/login", { phone });
  expect(await screen.findByRole("textbox", { name: "Tu número de WhatsApp" })).toHaveValue(phone.number);
  fireEvent.click(screen.getByRole("button", { name: "Enviar código" })); await verify();
  fireEvent.click(await screen.findByRole("button", { name: "Cancelar la baja y entrar" }));
  await waitFor(() => expect(signinRedirect).toHaveBeenCalledExactlyOnceWith({ extraQueryParams: { access: "consumer" }, state: { returnTo: "/" } }));
  expect(completeLogin).not.toHaveBeenCalled();
});

it("alta empresarial Phone completa con aprobación y sin correo conserva aviso y no inventa destinatario", async () => {
  server.use(
    http.post("/api/auth/business-signup/code", () => HttpResponse.json({ resendAfterSeconds: 0 }, { status: 202 })),
    http.post("/api/auth/business-signup/verify", () => new HttpResponse(null, { status: 204 })),
    http.get("/api/public-site/slug-availability", () => HttpResponse.json({ slug: "grupo-phone", availability: "Available" })),
    http.post("/api/auth/business-signup", async ({ request }) => {
      expect(request.headers.get("Idempotency-Key")).toBeTruthy();
      expect(request.headers.get("RequestVerificationToken")).toBe("phone-test-form-token");
      expect(await request.json()).toEqual({ organizationName: "Grupo Phone", slug: "grupo-phone", firstCompanyName: "Empresa Phone", taxId: null, acceptedTerms: true });
      return HttpResponse.json({ tenantId: "phone-org", organizationName: "Grupo Phone", slug: "grupo-phone", requiresApproval: true, firstCompanyId: "phone-company", notificationEmail: null, status: "PendingApproval" } satisfies BusinessSignupResponse);
    }),
  );
  const { container } = show("/registro/empresa", { phone });
  expect(await screen.findByRole("textbox", { name: "Tu número de WhatsApp" })).toHaveValue(phone.number);
  fireEvent.click(screen.getByRole("checkbox")); fireEvent.click(screen.getByRole("button", { name: "Continuar" })); await verify();
  fireEvent.change(await screen.findByRole("textbox", { name: "Nombre de la organización" }), { target: { value: "Grupo Phone" } });
  fireEvent.change(screen.getByRole("textbox", { name: "Dirección de tu página" }), { target: { value: "grupo-phone" } });
  fireEvent.change(screen.getByRole("textbox", { name: "Primera empresa" }), { target: { value: "Empresa Phone" } });
  await screen.findByText("Disponible");
  const create = screen.getByRole("button", { name: "Crear organización" }); await waitFor(() => expect(create).toBeEnabled()); fireEvent.click(create);
  expect(await screen.findByText("Revisamos Grupo Phone y te avisamos cuando esté aprobada.")).toBeVisible();
  expect(screen.getByRole("link", { name: "Volver al inicio" })).toHaveAttribute("href", "/");
  expect(await axe(container)).toHaveNoViolations();
});
