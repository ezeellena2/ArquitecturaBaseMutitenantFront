import { act, fireEvent, screen, waitFor, within } from "@testing-library/react";
import { HttpResponse, http } from "msw";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import { changeCulture, configureI18n } from "@/shared/i18n";
import { server } from "@/test/mocks/server";
import { asPhone } from "@/test/utils/phone";
import { renderRouteWithProviders } from "@/test/utils/renderWithProviders";
import "./RecoverAccountPage";

beforeAll(async () => {
  await configureI18n([
    { code: "es-AR", languageCode: "es", fallbackCulture: null, isEnabled: true, isDefault: true },
    { code: "en-US", languageCode: "en", fallbackCulture: "es-AR", isEnabled: true, isDefault: false },
  ]);
});
afterEach(async () => { vi.useRealTimers(); vi.unstubAllGlobals(); await changeCulture("es-AR"); });
beforeEach(() => server.use(http.post("/api/account-recovery/preview", () => new HttpResponse(null, { status: 204 }))));

const previousEmail = "ana@old.example.test";
const email = "ana@new.example.test";

async function showNewEmail(lostEmail = previousEmail) {
  const view = renderRouteWithProviders("/recuperar");
  fireEvent.change(await screen.findByRole("textbox", { name: "Correo electrónico" }), { target: { value: lostEmail } });
  fireEvent.click(screen.getByRole("button", { name: "Seguir" }));
  await screen.findByRole("heading", { name: "¿Dónde te escribimos?" });
  return view;
}

async function showCode(lostEmail = previousEmail) {
  const view = await showNewEmail(lostEmail);
  fireEvent.change(screen.getByRole("textbox", { name: "Correo electrónico nuevo" }), { target: { value: email } });
  fireEvent.click(screen.getByRole("button", { name: "Enviar código" }));
  await screen.findByRole("textbox", { name: "Código 1" });
  return view;
}

function verifyCode() {
  fireEvent.change(screen.getByRole("textbox", { name: "Código 1" }), { target: { value: "123456" } });
  fireEvent.click(screen.getByRole("button", { name: "Verificar" }));
}

describe("RecoverAccountPage", () => {
  it.each(["", "correo-mal"])("no avanza con el correo anterior inválido (%s) y lo permite corregir", async (value) => {
    const { container } = renderRouteWithProviders("/recuperar");
    const input = await screen.findByRole("textbox", { name: "Correo electrónico" });
    fireEvent.change(input, { target: { value } });
    const next = screen.getByRole("button", { name: "Seguir" });
    expect(next).toBeEnabled();
    fireEvent.click(next);
    expect(await screen.findByText("Ingresá un correo electrónico válido.")).toBeVisible();
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(screen.queryByRole("heading", { name: "¿Dónde te escribimos?" })).not.toBeInTheDocument();
    fireEvent.change(input, { target: { value: previousEmail } });
    await waitFor(() => expect(screen.queryByText("Ingresá un correo electrónico válido.")).not.toBeInTheDocument());
    expect(await axe(container)).toHaveNoViolations();
  });

  it.each(["", "correo-mal", previousEmail])("rechaza el correo nuevo inválido o repetido (%s) en su campo", async (value) => {
    const requested = vi.fn();
    server.use(http.post("/api/account-recovery/code", () => { requested(); return HttpResponse.json({ resendAfterSeconds: 60 }, { status: 202 }); }));
    await showNewEmail();
    const input = screen.getByRole("textbox", { name: "Correo electrónico nuevo" });
    fireEvent.change(input, { target: { value } });
    fireEvent.click(screen.getByRole("button", { name: "Enviar código" }));
    expect(await screen.findByText(value === previousEmail ? "Tiene que ser un correo distinto del de antes." : "Ingresá un correo electrónico válido.")).toBeVisible();
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(requested).not.toHaveBeenCalled();
    expect(screen.queryByRole("button", { name: "Correo" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "WhatsApp" })).not.toBeInTheDocument();
  });

  it.each([previousEmail, "otra@old.example.test"])("usa el mismo nonce y tres claves idempotentes con una cuenta existente (%s)", async (lostEmail) => {
    const requests: { path: string; body: Record<string, string>; key: string | null }[] = [];
    for (const path of ["/api/account-recovery/code", "/api/account-recovery/verify", "/api/account-recovery"]) {
      server.use(http.post(path, async ({ request }) => {
        requests.push({ path, body: await request.json() as Record<string, string>, key: request.headers.get("Idempotency-Key") });
        return path.endsWith("/code") ? HttpResponse.json({ resendAfterSeconds: 60 }, { status: 202 }) : new HttpResponse(null, { status: path.endsWith("/verify") ? 204 : 202 });
      }));
    }
    const { container, router } = await showCode(lostEmail);
    verifyCode();
    expect(await screen.findByRole("heading", { name: "Recibimos tu pedido" })).toBeVisible();
    const nonce = requests[0].body.nonce;
    expect(nonce).toMatch(/^[A-Za-z0-9_-]{43}$/u);
    expect(requests.map((request) => request.body)).toEqual([
      { email, nonce }, { email, nonce, code: "123456" }, { email, nonce, previousEmail: lostEmail },
    ]);
    expect(requests.map((request) => request.path)).toEqual(["/api/account-recovery/code", "/api/account-recovery/verify", "/api/account-recovery"]);
    expect(new Set(requests.map((request) => request.key)).size).toBe(3);
    for (const request of requests) expect(request.key).toMatch(/^[\da-f-]{36}$/u);
    expect(screen.getByText(email)).toBeVisible();
    expect(await axe(container)).toHaveNoViolations();
    fireEvent.click(screen.getByRole("link", { name: "Volver a ingresar" }));
    await waitFor(() => expect(router.state.location.pathname).toBe("/login"));
  });

  it("el código incompleto no llama al back y un dígito nuevo retira el aviso", async () => {
    const verified = vi.fn();
    server.use(http.post("/api/account-recovery/code", () => HttpResponse.json({ resendAfterSeconds: 0 }, { status: 202 })),
      http.post("/api/account-recovery/verify", () => { verified(); return new HttpResponse(null, { status: 204 }); }));
    await showCode();
    fireEvent.click(screen.getByRole("button", { name: "Verificar" }));
    expect(screen.getByRole("alert")).toHaveTextContent("Escribí los 6 números del código.");
    expect(verified).not.toHaveBeenCalled();
    fireEvent.change(screen.getByRole("textbox", { name: "Código 1" }), { target: { value: "1" } });
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it.each([
    ["Auth.LoginCode.Invalid", "El código no es válido."],
    ["Auth.LoginCode.Expired", "El código venció. Pedí uno nuevo."],
    ["Auth.LoginCode.AlreadyUsed", "El código ya se usó. Pedí uno nuevo."],
    ["Auth.LoginCode.TooManyAttempts", "Superaste los intentos para este código. Pedí uno nuevo."],
  ])("muestra %s debajo del código y permite pedir otro", async (code, message) => {
    server.use(http.post("/api/account-recovery/code", () => HttpResponse.json({ resendAfterSeconds: 60 }, { status: 202 })),
      http.post("/api/account-recovery/verify", () => HttpResponse.json({ code, detail: message, ...(code === "Auth.LoginCode.Invalid" ? { attemptsLeft: 3 } : {}) }, { status: 400 })));
    await showCode();
    verifyCode();
    expect(await screen.findByRole("alert")).toHaveTextContent(message);
    const group = screen.getByRole("group", { name: "Código" });
    expect(group.compareDocumentPosition(screen.getByRole("alert")) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    if (code === "Auth.LoginCode.Invalid") {
      expect(screen.getByRole("alert")).toHaveTextContent("Te quedan 3 intentos.");
      expect(within(group).getByRole("textbox", { name: "Código 1" })).toHaveAttribute("aria-invalid", "true");
      fireEvent.change(within(group).getByRole("textbox", { name: "Código 1" }), { target: { value: "2" } });
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    } else expect(screen.getByRole("button", { name: "Reenviar código" })).toBeEnabled();
  });

  it("conserva la clave al reintentar pedir código después de una falla de red", async () => {
    const keys: (string | null)[] = [];
    server.use(http.post("/api/account-recovery/code", ({ request }) => {
      keys.push(request.headers.get("Idempotency-Key"));
      return keys.length === 1 ? HttpResponse.error() : HttpResponse.json({ resendAfterSeconds: 60 }, { status: 202 });
    }));
    await showNewEmail();
    fireEvent.change(screen.getByRole("textbox", { name: "Correo electrónico nuevo" }), { target: { value: email } });
    fireEvent.click(screen.getByRole("button", { name: "Enviar código" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("No pudimos conectarnos");
    fireEvent.click(screen.getByRole("button", { name: "Enviar código" }));
    await screen.findByRole("heading", { name: "Revisá tu correo" });
    expect(keys).toHaveLength(2);
    expect(keys[1]).toBe(keys[0]);
  });

  it("cambiar el correo tras una respuesta perdida manda una clave nueva y evita el 422", async () => {
    const requests: { key: string | null; body: Record<string, string> }[] = [];
    server.use(http.post("/api/account-recovery/code", async ({ request }) => {
      const current = { key: request.headers.get("Idempotency-Key"), body: await request.json() as Record<string, string> };
      requests.push(current);
      if (requests.length === 1) return HttpResponse.error();
      if (current.key === requests[0].key && current.body.email !== requests[0].body.email) {
        return HttpResponse.json({ code: "Request.IdempotencyKeyReused", detail: "La clave corresponde a otro pedido." }, { status: 422 });
      }
      return HttpResponse.json({ resendAfterSeconds: 60 }, { status: 202 });
    }));
    await showNewEmail();
    const input = screen.getByRole("textbox", { name: "Correo electrónico nuevo" });
    fireEvent.change(input, { target: { value: email } });
    fireEvent.click(screen.getByRole("button", { name: "Enviar código" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("No pudimos conectarnos");
    fireEvent.change(input, { target: { value: "changed@new.example.test" } });
    fireEvent.click(screen.getByRole("button", { name: "Enviar código" }));
    await screen.findByRole("heading", { name: "Revisá tu correo" });
    expect(requests).toHaveLength(2);
    expect(requests[1].key).not.toBe(requests[0].key);
    expect(requests[1].body.nonce).toBe(requests[0].body.nonce);
  });

  it("cambiar el código tras una respuesta perdida manda una clave nueva y evita el 422", async () => {
    const requests: { key: string | null; body: Record<string, string> }[] = [];
    server.use(http.post("/api/account-recovery/code", () => HttpResponse.json({ resendAfterSeconds: 60 }, { status: 202 })),
      http.post("/api/account-recovery/verify", async ({ request }) => {
        const current = { key: request.headers.get("Idempotency-Key"), body: await request.json() as Record<string, string> };
        requests.push(current);
        if (requests.length === 1) return HttpResponse.error();
        if (current.key === requests[0].key && current.body.code !== requests[0].body.code) {
          return HttpResponse.json({ code: "Request.IdempotencyKeyReused", detail: "La clave corresponde a otro pedido." }, { status: 422 });
        }
        return new HttpResponse(null, { status: 204 });
      }), http.post("/api/account-recovery", () => new HttpResponse(null, { status: 202 })));
    await showCode();
    verifyCode();
    expect(await screen.findByRole("alert")).toHaveTextContent("No pudimos conectarnos");
    fireEvent.change(screen.getByRole("textbox", { name: "Código 1" }), { target: { value: "654321" } });
    fireEvent.click(screen.getByRole("button", { name: "Verificar" }));
    await screen.findByRole("heading", { name: "Recibimos tu pedido" });
    expect(requests).toHaveLength(2);
    expect(requests[1].key).not.toBe(requests[0].key);
    expect(requests[1].body).toEqual({ ...requests[0].body, code: "654321" });
  });

  it("cambiar el correo anterior tras perder el pedido inicia una operación nueva", async () => {
    const requests: { key: string | null; body: Record<string, string> }[] = [];
    server.use(http.post("/api/account-recovery/code", () => HttpResponse.json({ resendAfterSeconds: 0 }, { status: 202 })),
      http.post("/api/account-recovery/verify", () => new HttpResponse(null, { status: 204 })),
      http.post("/api/account-recovery", async ({ request }) => {
        const current = { key: request.headers.get("Idempotency-Key"), body: await request.json() as Record<string, string> };
        requests.push(current);
        if (requests.length === 1) return HttpResponse.error();
        if (current.key === requests[0].key && current.body.previousEmail !== requests[0].body.previousEmail) {
          return HttpResponse.json({ code: "Request.IdempotencyKeyReused", detail: "La clave corresponde a otro pedido." }, { status: 422 });
        }
        return new HttpResponse(null, { status: 202 });
      }));
    await showCode();
    verifyCode();
    expect(await screen.findByRole("alert")).toHaveTextContent("No pudimos conectarnos");
    fireEvent.click(screen.getByRole("button", { name: "Usar otro correo" }));
    fireEvent.click(screen.getByRole("button", { name: "Atrás" }));
    fireEvent.change(screen.getByRole("textbox", { name: "Correo electrónico" }), { target: { value: "changed@old.example.test" } });
    fireEvent.click(screen.getByRole("button", { name: "Seguir" }));
    fireEvent.click(await screen.findByRole("button", { name: "Enviar código" }));
    await screen.findByRole("textbox", { name: "Código 1" });
    verifyCode();
    await screen.findByRole("heading", { name: "Recibimos tu pedido" });
    expect(requests).toHaveLength(2);
    expect(requests[1].key).not.toBe(requests[0].key);
    expect(requests[1].body).toEqual({ ...requests[0].body, previousEmail: "changed@old.example.test" });
  });

  it("abandonar una verificación perdida y pedir otro código renueva su operación", async () => {
    const keys: (string | null)[] = [];
    server.use(http.post("/api/account-recovery/code", () => HttpResponse.json({ resendAfterSeconds: 0 }, { status: 202 })),
      http.post("/api/account-recovery/verify", ({ request }) => {
        keys.push(request.headers.get("Idempotency-Key"));
        return keys.length === 1 ? HttpResponse.error() : new HttpResponse(null, { status: 204 });
      }), http.post("/api/account-recovery", () => new HttpResponse(null, { status: 202 })));
    await showCode();
    verifyCode();
    expect(await screen.findByRole("alert")).toHaveTextContent("No pudimos conectarnos");
    fireEvent.click(screen.getByRole("button", { name: "Usar otro correo" }));
    fireEvent.click(screen.getByRole("button", { name: "Enviar código" }));
    await screen.findByRole("textbox", { name: "Código 1" });
    verifyCode();
    await screen.findByRole("heading", { name: "Recibimos tu pedido" });
    expect(keys).toHaveLength(2);
    expect(keys[1]).not.toBe(keys[0]);
  });

  it("reintenta solo el pedido después de verificar si falla la red", async () => {
    const verified = vi.fn();
    const keys: (string | null)[] = [];
    server.use(http.post("/api/account-recovery/code", () => HttpResponse.json({ resendAfterSeconds: 60 }, { status: 202 })),
      http.post("/api/account-recovery/verify", () => { verified(); return new HttpResponse(null, { status: 204 }); }),
      http.post("/api/account-recovery", ({ request }) => {
        keys.push(request.headers.get("Idempotency-Key"));
        return keys.length === 1 ? HttpResponse.error() : new HttpResponse(null, { status: 202 });
      }));
    await showCode();
    verifyCode();
    expect(await screen.findByRole("alert")).toHaveTextContent("No pudimos conectarnos");
    fireEvent.click(screen.getByRole("button", { name: "Verificar" }));
    await screen.findByRole("heading", { name: "Recibimos tu pedido" });
    expect(verified).toHaveBeenCalledTimes(1);
    expect(keys).toHaveLength(2);
    expect(keys[1]).toBe(keys[0]);
  });

  it("conserva la clave de verificar si se pierde su respuesta", async () => {
    const keys: (string | null)[] = [];
    server.use(http.post("/api/account-recovery/code", () => HttpResponse.json({ resendAfterSeconds: 60 }, { status: 202 })),
      http.post("/api/account-recovery/verify", ({ request }) => {
        keys.push(request.headers.get("Idempotency-Key"));
        return keys.length === 1 ? HttpResponse.error() : new HttpResponse(null, { status: 204 });
      }), http.post("/api/account-recovery", () => new HttpResponse(null, { status: 202 })));
    await showCode();
    verifyCode();
    expect(await screen.findByRole("alert")).toHaveTextContent("No pudimos conectarnos");
    fireEvent.click(screen.getByRole("button", { name: "Verificar" }));
    await screen.findByRole("heading", { name: "Recibimos tu pedido" });
    expect(keys).toHaveLength(2);
    expect(keys[1]).toBe(keys[0]);
  });

  it("volver mientras pide el código ignora la respuesta del paso abandonado", async () => {
    let finish!: () => void;
    const pending = new Promise<void>((resolve) => { finish = resolve; });
    const requested = vi.fn();
    server.use(http.post("/api/account-recovery/code", async () => {
      requested(); await pending;
      return HttpResponse.json({ resendAfterSeconds: 60 }, { status: 202 });
    }));
    await showNewEmail();
    fireEvent.change(screen.getByRole("textbox", { name: "Correo electrónico nuevo" }), { target: { value: email } });
    fireEvent.click(screen.getByRole("button", { name: "Enviar código" }));
    await waitFor(() => expect(requested).toHaveBeenCalledOnce());
    fireEvent.click(screen.getByRole("button", { name: "Atrás" }));
    await act(async () => { finish(); await pending; });
    await waitFor(() => expect(screen.queryByRole("button", { name: "Enviando…" })).not.toBeInTheDocument());
    expect(screen.getByRole("heading", { name: "Recuperar mi cuenta" })).toBeVisible();
    expect(screen.queryByRole("textbox", { name: "Código 1" })).not.toBeInTheDocument();
  });

  it("salir durante un envío cancela su continuación sin rechazos sin manejar", async () => {
    let finish!: () => void;
    const pending = new Promise<void>((resolve) => { finish = resolve; });
    const requested = vi.fn();
    const completed = vi.fn();
    server.use(http.post("/api/account-recovery/code", async () => {
      requested(); await pending; completed();
      return HttpResponse.json({ resendAfterSeconds: 60 }, { status: 202 });
    }));
    const view = await showNewEmail();
    fireEvent.change(screen.getByRole("textbox", { name: "Correo electrónico nuevo" }), { target: { value: email } });
    fireEvent.click(screen.getByRole("button", { name: "Enviar código" }));
    await waitFor(() => expect(requested).toHaveBeenCalledOnce());
    view.unmount();
    await act(async () => { finish(); await pending; });
    await waitFor(() => expect(completed).toHaveBeenCalledOnce());
    expect(screen.queryByRole("textbox", { name: "Código 1" })).not.toBeInTheDocument();
  });

  it("una prueba vencida vuelve al código y un método repetido vuelve al correo nuevo", async () => {
    let repeated = false;
    server.use(http.post("/api/account-recovery/code", () => HttpResponse.json({ resendAfterSeconds: 60 }, { status: 202 })),
      http.post("/api/account-recovery/verify", () => new HttpResponse(null, { status: 204 })),
      http.post("/api/account-recovery", () => HttpResponse.json(repeated
        ? { code: "Validation.Failed", errors: { previousEmail: ["Tiene que ser un correo distinto del de antes."] } }
        : { code: "Platform.AccountRecovery.VerificationRequired", detail: "Pedí un código nuevo y verificalo." }, { status: 400 })));
    await showCode();
    verifyCode();
    expect(await screen.findByRole("alert")).toHaveTextContent("Pedí un código nuevo y verificalo.");
    expect(screen.getByRole("textbox", { name: "Código 1" })).toHaveValue("");
    expect(screen.getByRole("button", { name: "Reenviar código" })).toBeEnabled();
    repeated = true;
    verifyCode();
    expect(await screen.findByText("Tiene que ser un correo distinto del de antes.")).toBeVisible();
    expect(screen.getByRole("textbox", { name: "Correo electrónico nuevo" })).toHaveAttribute("aria-invalid", "true");
  });

  it("ubica en el correo nuevo el rechazo de validación real del servidor al crear el pedido", async () => {
    server.use(http.post("/api/account-recovery/code", () => HttpResponse.json({ resendAfterSeconds: 60 }, { status: 202 })),
      http.post("/api/account-recovery/verify", () => new HttpResponse(null, { status: 204 })),
      http.post("/api/account-recovery", () => HttpResponse.json({ code: "Validation.Failed", errors: { previousEmail: ["Tiene que ser un correo distinto del de antes."] } }, { status: 400 })));
    await showCode();
    verifyCode();
    expect(await screen.findByText("Tiene que ser un correo distinto del de antes.")).toBeVisible();
    expect(screen.getByRole("textbox", { name: "Correo electrónico nuevo" })).toHaveAttribute("aria-invalid", "true");
    expect(screen.queryByRole("textbox", { name: "Código 1" })).not.toBeInTheDocument();
  });

  it("usa la espera del servidor, reenvía con el mismo nonce y borra el código", async () => {
    const bodies: unknown[] = [];
    server.use(http.post("/api/account-recovery/code", async ({ request }) => {
      bodies.push(await request.json());
      return HttpResponse.json({ resendAfterSeconds: 2 }, { status: 202 });
    }));
    await showNewEmail();
    fireEvent.change(screen.getByRole("textbox", { name: "Correo electrónico nuevo" }), { target: { value: email } });
    vi.useFakeTimers();
    fireEvent.click(screen.getByRole("button", { name: "Enviar código" }));
    await act(async () => { await vi.waitFor(() => expect(screen.getByRole("textbox", { name: "Código 1" })).toBeVisible()); });
    fireEvent.change(screen.getByRole("textbox", { name: "Código 1" }), { target: { value: "123" } });
    expect(screen.getByRole("button", { name: "Reenviar en 2 s" })).toBeDisabled();
    await act(async () => { await vi.advanceTimersByTimeAsync(1000); });
    await act(async () => { await vi.advanceTimersByTimeAsync(1000); });
    vi.useRealTimers();
    fireEvent.click(screen.getByRole("button", { name: "Reenviar código" }));
    expect(await screen.findByText("Te mandamos un código nuevo.")).toBeVisible();
    expect(screen.getByRole("textbox", { name: "Código 1" })).toHaveValue("");
    expect(bodies).toHaveLength(2);
    expect(bodies[1]).toEqual(bodies[0]);
  });

  it.each([
    ["Auth.LoginCode.ResendTooSoon", "Esperá un momento antes de pedir otro código."],
    ["Auth.LoginCode.TooManyRequests", "Pediste demasiados códigos. Probá de nuevo más tarde."],
  ])("el 429 %s muestra el detail del back y la cuenta regresiva en Enviar código", async (code, detail) => {
    server.use(http.post("/api/account-recovery/code", () => HttpResponse.json({ code, detail, retryAfter: 42 }, { status: 429 })));
    await showNewEmail();
    fireEvent.change(screen.getByRole("textbox", { name: "Correo electrónico nuevo" }), { target: { value: email } });
    fireEvent.click(screen.getByRole("button", { name: "Enviar código" }));
    expect(await screen.findByRole("button", { name: "Reintentá en 0:42" })).toBeDisabled();
    expect(screen.getByRole("alert")).toHaveTextContent(detail);
  });

  it("un 429 sin detail usa el texto común mientras cuenta la espera", async () => {
    server.use(http.post("/api/account-recovery/code", () => HttpResponse.json({ code: "Auth.LoginCode.TooManyRequests", retryAfter: 42 }, { status: 429 })));
    await showNewEmail();
    fireEvent.change(screen.getByRole("textbox", { name: "Correo electrónico nuevo" }), { target: { value: email } });
    fireEvent.click(screen.getByRole("button", { name: "Enviar código" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Hiciste muchos pedidos seguidos. Probá de nuevo en unos segundos.");
    expect(screen.getByRole("button", { name: "Reintentá en 0:42" })).toBeDisabled();
  });

  it("un 5xx usa el texto común y no muestra el detail interno", async () => {
    server.use(http.post("/api/account-recovery/code", () => HttpResponse.json({ detail: "Detalle interno del servidor", traceId: "hidden-trace" }, { status: 503 })));
    await showNewEmail();
    fireEvent.change(screen.getByRole("textbox", { name: "Correo electrónico nuevo" }), { target: { value: email } });
    fireEvent.click(screen.getByRole("button", { name: "Enviar código" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Algo salió mal. Probá de nuevo en un rato.");
    expect(screen.queryByText("Detalle interno del servidor")).not.toBeInTheDocument();
    expect(screen.queryByText("hidden-trace")).not.toBeInTheDocument();
  });

  it("Usar otro correo y Atrás conservan los datos para corregirlos", async () => {
    server.use(http.post("/api/account-recovery/code", () => HttpResponse.json({ resendAfterSeconds: 60 }, { status: 202 })));
    await showCode();
    fireEvent.click(screen.getByRole("button", { name: "Usar otro correo" }));
    expect(screen.getByRole("textbox", { name: "Correo electrónico nuevo" })).toHaveValue(email);
    fireEvent.click(screen.getByRole("button", { name: "Atrás" }));
    expect(screen.getByRole("textbox", { name: "Correo electrónico" })).toHaveValue(previousEmail);
  });

  it("a 390 mantiene los campos de auth y el recorrido sin selector", async () => {
    asPhone();
    const { container } = await showNewEmail();
    expect(screen.getByRole("textbox", { name: "Correo electrónico nuevo" })).toHaveClass("h-11");
    expect(screen.queryByRole("button", { name: "WhatsApp" })).not.toBeInTheDocument();
    expect(await axe(container)).toHaveNoViolations();
  });

  it("traduce el recorrido en inglés", async () => {
    await changeCulture("en-US");
    const { container } = renderRouteWithProviders("/recuperar");
    expect(await screen.findByRole("heading", { name: "Recover my account" })).toBeVisible();
    expect(screen.getByRole("link", { name: "Back to sign in" })).toHaveAttribute("href", "/login");
    expect(await axe(container)).toHaveNoViolations();
  });
});
