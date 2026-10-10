import { act, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HttpResponse, http } from "msw";
import { beforeEach, expect, it, vi } from "vitest";
import { configureI18n, changeCulture } from "@/shared/i18n";
import { referenceDataFixture } from "@/test/mocks/handlers";
import { server } from "@/test/mocks/server";
import { renderWithProviders } from "@/test/utils/renderWithProviders";
import { AddLoginMethodDialog } from "./AddLoginMethodDialog";
import type { AddLoginMethodRequest, LoginMethodCodeResponse, VerifyLoginMethodRequest } from "@/shared/api/types";
import type { ProblemDetails } from "@/shared/api/problemDetails";
import { axe } from "vitest-axe";

it("agrega WhatsApp con país/número nacional, un solo código y destino enmascarado", async () => {
  const user = userEvent.setup();
  const complete = vi.fn();
  server.use(
    http.get("/api/auth/methods", () => HttpResponse.json({ channels: [{ key: "email", countries: [] }, { key: "whatsapp", countries: ["AR"] }] })),
    http.post<never, AddLoginMethodRequest, LoginMethodCodeResponse>("/api/me/login-methods", async ({ request }) => {
      const body = await request.json();
      expect(body).toEqual({ phone: { country: "AR", number: "11 5555-4521" }, channel: "whatsapp" });
      return HttpResponse.json({ methodId: "phone", resendAfterSeconds: 60 });
    }),
    http.post<never, VerifyLoginMethodRequest>("/api/me/login-methods/phone/verify", async ({ request }) => {
      expect(await request.json()).toEqual({ code: "123456" });
      return new HttpResponse(null, { status: 204 });
    }),
  );
  renderWithProviders(<AddLoginMethodDialog open onOpenChange={() => {}} onComplete={complete} />);
  await user.click(await screen.findByRole("button", { name: "WhatsApp" }));
  await user.type(screen.getByRole("textbox", { name: "Número" }), "1155554521");
  await user.click(screen.getByRole("button", { name: "Enviar código" }));
  const dialog = await screen.findByRole("dialog", { name: "Verificar tu WhatsApp" });
  expect(dialog).toHaveTextContent("•••• 4521");
  expect(dialog).not.toHaveTextContent("5555");
  expect(dialog).toHaveAccessibleDescription("Te mandamos un código a •••• 4521.");
  expect(screen.getByRole("button", { name: "Reenviar en 60 s" })).toBeDisabled();
  await user.type(screen.getByRole("textbox", { name: "Código 1" }), "123456");
  await user.click(screen.getByRole("button", { name: "Verificar" }));
  await waitFor(() => expect(complete).toHaveBeenCalledOnce());
});

beforeEach(async () => { await configureI18n(referenceDataFixture().cultures); await changeCulture("es-AR"); });
// Tableros Cuenta-Agregar y Cuenta-Verificar (y sus M-*): el título dice el paso, «Agregar correo» (sin el módulo de
// WhatsApp) y después «Verificar tu correo»; el código incorrecto va debajo de los casilleros, en rojo, y no en una franja.
it("suma correo: el título dice el paso, el código incorrecto va debajo de los casilleros y verifica con claves idempotentes", async () => {
  const user = userEvent.setup();
  const complete = vi.fn();
  let attempts = 0;
  server.use(
    http.post("/api/me/login-methods", async ({ request }) => {
      expect(await request.json()).toEqual({ email: "nuevo@example.test" });
      expect(request.headers.get("Idempotency-Key")).toBeTruthy();
      return HttpResponse.json({ methodId: "new", resendAfterSeconds: 60 });
    }),
    http.post("/api/me/login-methods/new/verify", async ({ request }) => {
      expect(request.headers.get("Idempotency-Key")).toBeTruthy();
      const body = await request.json();
      if (attempts++ === 0) return HttpResponse.json({ status: 400, code: "Auth.LoginCode.Invalid", title: "Código", detail: "El código no es válido." }, { status: 400 });
      expect(body).toEqual({ code: "654321" });
      return new HttpResponse(null, { status: 204 });
    }),
  );
  renderWithProviders(<AddLoginMethodDialog open onOpenChange={() => {}} onComplete={complete} />);
  expect(screen.queryByRole("button", { name: "WhatsApp" })).not.toBeInTheDocument();

  const add = await screen.findByRole("dialog", { name: "Agregar correo" });
  // Cuenta-Agregar «Sin el módulo de WhatsApp»: el correo solo, sin el control de un único segmento.
  expect(within(add).queryByRole("group", { name: "Qué querés agregar" })).not.toBeInTheDocument();
  await user.type(within(add).getByRole("textbox", { name: "Correo" }), "nuevo@example.test");
  await user.click(within(add).getByRole("button", { name: "Enviar código" }));

  const verify = await screen.findByRole("dialog", { name: "Verificar tu correo" });
  // Cuenta-Verificar: el correo tapado, como lo tapa el back (`PersonalDataMask.Email`).
  expect(verify).toHaveTextContent("Te mandamos un código a nu•••@example.test.");
  expect(verify).not.toHaveTextContent("nuevo@example.test");
  const code = within(verify).getByRole("group", { name: "Código" });
  const first = within(verify).getByRole("textbox", { name: "Código 1" });
  expect(within(verify).getByRole("button", { name: "Verificar" })).toBeEnabled();
  // «Criterio · Botones»: «Verificar» no se apaga; con el código a medias, debajo de los casilleros dice qué falta y un
  // dígito nuevo lo saca.
  await user.click(within(verify).getByRole("button", { name: "Verificar" }));
  expect(await within(verify).findByText("Escribí los 6 números del código.")).toBeVisible();
  expect(attempts).toBe(0);
  await user.type(first, "123456");
  expect(within(verify).queryByText("Escribí los 6 números del código.")).not.toBeInTheDocument();
  await user.click(within(verify).getByRole("button", { name: "Verificar" }));

  const message = await within(verify).findByText("El código no es válido.");
  expect(message).toHaveAttribute("role", "alert");
  expect(code.nextElementSibling).toBe(message);
  expect(message).toHaveClass("text-[13px]", "text-[var(--peligro)]", "max-md:text-[13.5px]");
  expect(code).toHaveAccessibleDescription("Te mandamos un código a nu•••@example.test. El código no es válido.");
  expect(first).toHaveAttribute("aria-invalid", "true");
  expect(screen.getAllByRole("alert")).toEqual([message]);

  await user.click(first);
  await user.paste("654321");
  expect(within(verify).queryByText("El código no es válido.")).not.toBeInTheDocument();
  expect(first).not.toHaveAttribute("aria-invalid");
  await user.click(within(verify).getByRole("button", { name: "Verificar" }));
  await waitFor(() => expect(complete).toHaveBeenCalled());
});

// Cuenta-Agregar con el módulo de WhatsApp (el back suma el canal «whatsapp» a /api/auth/methods): «Agregar correo o
// teléfono», con el control para elegir qué agregar.
it("con el módulo de WhatsApp dice «Agregar correo o teléfono» y deja elegir qué agregar", async () => {
  server.use(
    http.get("/api/auth/methods", () => HttpResponse.json({ channels: [{ key: "email", countries: [] }, { key: "whatsapp", countries: ["AR"] }] })),
  );
  renderWithProviders(<AddLoginMethodDialog open onOpenChange={() => {}} onComplete={vi.fn()} />);

  expect(await screen.findByRole("dialog", { name: "Agregar correo o teléfono" })).toBeVisible();
  const add = await screen.findByRole("dialog", { name: "Agregar correo o teléfono" });
  expect(within(add).getByRole("group", { name: "Qué querés agregar" })).toBeVisible();
});

async function chooseWhatsApp(user: ReturnType<typeof userEvent.setup>) {
  await user.click(await screen.findByRole("button", { name: "WhatsApp" }));
  await user.type(screen.getByRole("textbox", { name: "Número" }), "1155554521");
}
function enableWhatsApp(countries = ["AR"]) {
  server.use(http.get("/api/auth/methods", () => HttpResponse.json({ channels: [{ key: "email", countries: [] }, { key: "whatsapp", countries }] })));
}

it.each([
  ["Identity.LoginMethod.PhoneAlreadyUsed", "Ese número ya está asociado a otra cuenta."],
  ["WhatsApp.Phone.CountryNotAllowed", "Todavía no mandamos códigos a números de ese país."],
  ["Users.Phone.Invalid", "Revisá el número."],
  ["Users.Phone.NotMobile", "Necesitás un celular."],
])("ubica %s bajo Número y conserva el destino antes de OTP", async (code, detail) => {
  const user = userEvent.setup();
  enableWhatsApp();
  server.use(http.post<never, AddLoginMethodRequest>("/api/me/login-methods", () => HttpResponse.json({ code, detail }, { status: 400 })));
  renderWithProviders(<AddLoginMethodDialog open onOpenChange={() => {}} onComplete={vi.fn()} />);
  await chooseWhatsApp(user);
  await user.click(screen.getByRole("button", { name: "Enviar código" }));
  const message = await screen.findByRole("alert");
  expect(message).toHaveTextContent(detail);
  expect(screen.getByRole("textbox", { name: "Número" })).toHaveAccessibleDescription(detail);
  expect(screen.getByRole("textbox", { name: "Número" })).toHaveValue("11 5555-4521");
  expect(screen.queryByRole("group", { name: "Código" })).not.toBeInTheDocument();
});

it("prefiere errors.phone[0] al detail y lo limpia al editar", async () => {
  const user = userEvent.setup();
  enableWhatsApp();
  server.use(http.post("/api/me/login-methods", () => HttpResponse.json({ code: "WhatsApp.Phone.CountryNotAllowed", detail: "Texto general", errors: { phone: ["Mensaje específico", "Otro"] } }, { status: 400 })));
  renderWithProviders(<AddLoginMethodDialog open onOpenChange={() => {}} onComplete={vi.fn()} />);
  await chooseWhatsApp(user);
  await user.click(screen.getByRole("button", { name: "Enviar código" }));
  expect(await screen.findByRole("alert")).toHaveTextContent(/^Mensaje específico$/);
  expect(screen.queryByText("Texto general")).not.toBeInTheDocument();
  await user.type(screen.getByRole("textbox", { name: "Número" }), "2");
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
});

it("valida Número vacío en el campo sin mandar un código", async () => {
  const user = userEvent.setup(); enableWhatsApp();
  const send = vi.fn(); server.use(http.post("/api/me/login-methods", () => { send(); return new HttpResponse(null, { status: 202 }); }));
  renderWithProviders(<AddLoginMethodDialog open onOpenChange={() => {}} onComplete={vi.fn()} />);
  await user.click(await screen.findByRole("button", { name: "WhatsApp" }));
  await user.click(screen.getByRole("button", { name: "Enviar código" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("Ingresá un número de celular válido.");
  expect(send).not.toHaveBeenCalled();
});

it("conserva la clave tras 5xx idéntico y la renueva tras cambiar y volver al mismo destino", async () => {
  const user = userEvent.setup(); enableWhatsApp();
  const keys: string[] = [];
  server.use(http.post<never, AddLoginMethodRequest>("/api/me/login-methods", ({ request }) => {
    keys.push(request.headers.get("Idempotency-Key")!);
    return HttpResponse.json({ code: "General.Unexpected" }, { status: 500 });
  }));
  renderWithProviders(<AddLoginMethodDialog open onOpenChange={() => {}} onComplete={vi.fn()} />);
  await chooseWhatsApp(user);
  for (let index = 0; index < 2; index++) { await user.click(screen.getByRole("button", { name: "Enviar código" })); await screen.findByRole("alert"); }
  expect(keys[0]).toBe(keys[1]);
  await user.click(screen.getByRole("button", { name: "Correo" }));
  await chooseWhatsApp(user);
  await user.click(screen.getByRole("button", { name: "Enviar código" })); await screen.findByRole("alert");
  expect(keys[2]).not.toBe(keys[1]);
});

it("verifica Phone previo por id aunque el país ya no se habilite para alta y reenvía con código limpio", async () => {
  const user = userEvent.setup(); enableWhatsApp(["US"]);
  const keys: string[] = [];
  const complete = vi.fn();
  server.use(http.post<never, never, LoginMethodCodeResponse>("/api/me/login-methods/pending/code", ({ request }) => {
    keys.push(request.headers.get("Idempotency-Key")!);
    return HttpResponse.json({ methodId: "pending", resendAfterSeconds: 0 });
  }));
  renderWithProviders(<AddLoginMethodDialog open onOpenChange={() => {}} onComplete={complete} method={{ id: "pending", type: "Phone", value: "+5491155554521", isVerified: false, isPrimary: false, canRemove: true, canMakePrimary: false }} />);
  expect(await screen.findByRole("dialog", { name: "Verificar tu WhatsApp" })).toHaveTextContent("•••• 4521");
  await user.type(await screen.findByRole("textbox", { name: "Código 1" }), "123456");
  await user.click(screen.getByRole("button", { name: "Reenviar código" }));
  await waitFor(() => expect(keys).toHaveLength(2));
  expect(keys[0]).not.toBe(keys[1]);
  await waitFor(() => expect(screen.getByRole("textbox", { name: "Código 1" })).toHaveValue(""));
  expect(screen.getAllByRole("dialog")).toHaveLength(1);
});

it("Phone OTP conserva clave en 5xx, cambia con código nuevo y ubica el vencido en la franja", async () => {
  const user = userEvent.setup(); enableWhatsApp();
  const keys: string[] = [];
  server.use(http.post("/api/me/login-methods", () => HttpResponse.json({ methodId: "phone", resendAfterSeconds: 0 })),
    http.post<never, VerifyLoginMethodRequest>("/api/me/login-methods/phone/verify", async ({ request }) => {
      keys.push(request.headers.get("Idempotency-Key")!);
      const body = await request.json();
      return body.code === "123456" ? HttpResponse.json({ code: "General.Unexpected" }, { status: 500 })
        : HttpResponse.json({ code: "Auth.LoginCode.Expired", detail: "El código venció." }, { status: 400 });
    }));
  renderWithProviders(<AddLoginMethodDialog open onOpenChange={() => {}} onComplete={vi.fn()} />);
  await chooseWhatsApp(user); await user.click(screen.getByRole("button", { name: "Enviar código" }));
  const first = await screen.findByRole("textbox", { name: "Código 1" }); await user.type(first, "123456");
  for (let index = 0; index < 2; index++) { await user.click(screen.getByRole("button", { name: "Verificar" })); await screen.findByRole("alert"); }
  expect(keys[0]).toBe(keys[1]);
  await user.click(first); await user.paste("654321"); await user.click(screen.getByRole("button", { name: "Verificar" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("El código venció.");
  expect(first).not.toHaveAttribute("aria-invalid");
  expect(keys[2]).not.toBe(keys[1]);
});

it.each(["Email", "Phone"] as const)("verifica %s después de once minutos locales si la API acepta, sin reenviar automáticamente", async (type) => {
  const user = userEvent.setup(); enableWhatsApp();
  const resend = vi.fn();
  const verify = vi.fn();
  const complete = vi.fn(); const close = vi.fn();
  server.use(http.post<never, never, LoginMethodCodeResponse>("/api/me/login-methods/pending/code", () => { resend(); return HttpResponse.json({ methodId: "pending", resendAfterSeconds: 60 }); }),
    http.post<never, VerifyLoginMethodRequest>("/api/me/login-methods/pending/verify", async ({ request }) => {
      verify(await request.json(), request.headers.get("Idempotency-Key"));
      return new HttpResponse(null, { status: 204 });
    }));
  renderWithProviders(<AddLoginMethodDialog open onOpenChange={close} onComplete={complete} method={{ id: "pending", type, value: type === "Phone" ? "+5491155554521" : "nuevo@example.test", isVerified: false, isPrimary: false, canRemove: true, canMakePrimary: false }} />);
  await screen.findByRole("textbox", { name: "Código 1" });
  await user.type(screen.getByRole("textbox", { name: "Código 1" }), "123456");
  const now = Date.now(); const clock = vi.spyOn(Date, "now").mockReturnValue(now + 660_000);
  try {
    act(() => window.dispatchEvent(new Event("focus")));
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Código 1" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Verificar" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Reenviar código" })).toBeEnabled();
    await user.click(screen.getByRole("button", { name: "Verificar" }));
    await waitFor(() => expect(complete).toHaveBeenCalledOnce());
    expect(close).toHaveBeenCalledExactlyOnceWith(false);
    expect(resend).toHaveBeenCalledOnce();
    expect(verify).toHaveBeenCalledExactlyOnceWith({ code: "123456" }, expect.any(String));
  } finally { clock.mockRestore(); }
});

it.each([0, 660_000])("muestra Expired de la API tras %i ms locales y conserva el reenvío manual con su espera", async (elapsed) => {
  const user = userEvent.setup(); enableWhatsApp();
  const verifies: VerifyLoginMethodRequest[] = []; const sends: string[] = []; const complete = vi.fn();
  server.use(http.post<never, never, LoginMethodCodeResponse>("/api/me/login-methods/pending/code", ({ request }) => {
    sends.push(request.headers.get("Idempotency-Key")!);
    return HttpResponse.json({ methodId: "pending", resendAfterSeconds: 60 });
  }), http.post<never, VerifyLoginMethodRequest>("/api/me/login-methods/pending/verify", async ({ request }) => {
    verifies.push(await request.json());
    return HttpResponse.json({ code: "Auth.LoginCode.Expired", detail: "El código venció." }, { status: 400 });
  }));
  renderWithProviders(<AddLoginMethodDialog open onOpenChange={() => {}} onComplete={complete} method={{ id: "pending", type: "Phone", value: "+5491155554521", isVerified: false, isPrimary: false, canRemove: true, canMakePrimary: false }} />);
  const first = await screen.findByRole("textbox", { name: "Código 1" }); await user.type(first, "123456");
  const now = Date.now(); const clock = vi.spyOn(Date, "now").mockReturnValue(now + elapsed);
  try {
    act(() => window.dispatchEvent(new Event("focus")));
    await user.click(screen.getByRole("button", { name: "Verificar" }));
    const error = await screen.findByRole("alert");
    expect(error).toHaveTextContent(/^El código venció\.$/);
    expect(screen.getAllByRole("alert")).toEqual([error]);
    expect(screen.getByRole("group", { name: "Código" }).nextElementSibling).not.toBe(error);
    expect(verifies).toEqual([{ code: "123456" }]); expect(complete).not.toHaveBeenCalled();
    expect(first).toBeEnabled(); expect(first).toHaveValue("1"); expect(first).not.toHaveAttribute("aria-invalid");
    if (elapsed === 0) expect(screen.getByRole("button", { name: "Reenviar en 60 s" })).toBeDisabled();
    clock.mockReturnValue(now + elapsed + 60_000);
    act(() => window.dispatchEvent(new Event("focus")));
    expect(sends).toHaveLength(1);
    await user.click(screen.getByRole("button", { name: "Reenviar código" }));
    await waitFor(() => expect(first).toHaveValue(""));
    expect(sends).toHaveLength(2); expect(sends[0]).not.toBe(sends[1]);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Reenviar en 60 s" })).toBeDisabled();
  } finally { clock.mockRestore(); }
});

it("describe el código WhatsApp en inglés sin prometer duración ni revelar el destino", async () => {
  await changeCulture("en-US");
  server.use(http.post<never, never, LoginMethodCodeResponse>("/api/me/login-methods/pending/code", () => HttpResponse.json({ methodId: "pending", resendAfterSeconds: 60 })));
  renderWithProviders(<AddLoginMethodDialog open onOpenChange={() => {}} onComplete={vi.fn()} method={{ id: "pending", type: "Phone", value: "+5491155554521", isVerified: false, isPrimary: false, canRemove: true, canMakePrimary: false }} />);
  const code = await screen.findByRole("group", { name: "Code" });
  expect(code).toHaveAccessibleDescription("We sent a code to •••• 4521.");
  expect(screen.getByRole("dialog")).toHaveAccessibleDescription("We sent a code to •••• 4521.");
  expect(screen.getByRole("dialog")).not.toHaveTextContent("5555");
});

it("respeta Retry-After tras once minutos sin reenviar solo, conserva OTP y bloquea mientras envía", async () => {
  const user = userEvent.setup(); const keys: string[] = []; let release!: () => void;
  server.use(http.post<never, never, LoginMethodCodeResponse | ProblemDetails>("/api/me/login-methods/pending/code", async ({ request }) => {
    keys.push(request.headers.get("Idempotency-Key")!);
    if (keys.length === 2) return HttpResponse.json({ code: "Auth.LoginCode.ResendTooSoon", detail: "Esperá antes de pedir otro código." }, { status: 429, headers: { "Retry-After": "90" } });
    if (keys.length === 3) await new Promise<void>((done) => { release = done; });
    return HttpResponse.json({ methodId: "pending", resendAfterSeconds: 60 });
  }));
  renderWithProviders(<AddLoginMethodDialog open onOpenChange={() => {}} onComplete={vi.fn()} method={{ id: "pending", type: "Phone", value: "+5491155554521", isVerified: false, isPrimary: false, canRemove: true, canMakePrimary: false }} />);
  const first = await screen.findByRole("textbox", { name: "Código 1" }); await user.type(first, "123456");
  const now = Date.now(); const clock = vi.spyOn(Date, "now").mockReturnValue(now + 660_000);
  try {
    act(() => window.dispatchEvent(new Event("focus")));
    await user.click(screen.getByRole("button", { name: "Reenviar código" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Esperá antes de pedir otro código.");
    expect(screen.getAllByRole("alert")).toHaveLength(1);
    expect(screen.getAllByRole("button", { name: "Reintentá en 1:30" })).toHaveLength(2);
    for (const button of screen.getAllByRole("button", { name: "Reintentá en 1:30" })) expect(button).toBeDisabled();
    expect(first).toBeEnabled(); expect(first).toHaveValue("1");
    clock.mockReturnValue(now + 750_000); act(() => window.dispatchEvent(new Event("focus")));
    expect(keys).toHaveLength(2);
    await user.click(screen.getByRole("button", { name: "Reenviar código" }));
    await waitFor(() => expect(keys).toHaveLength(3));
    expect(first).toBeDisabled(); expect(first).toHaveValue("1");
    expect(screen.getByRole("button", { name: "Verificando…" })).toBeDisabled();
    expect(keys[2]).not.toBe(keys[1]);
    await act(async () => { release(); });
    await waitFor(() => expect(first).toBeEnabled());
    expect(first).toHaveValue(""); expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Reenviar en 60 s" })).toBeDisabled();
  } finally { clock.mockRestore(); }
});

it("cerrar abandona una respuesta tardía sin reabrir OTP ni completar", async () => {
  const user = userEvent.setup(); enableWhatsApp();
  let resolve!: () => void;
  const sent = vi.fn(); const complete = vi.fn();
  server.use(http.post("/api/me/login-methods", async () => { sent(); await new Promise<void>((done) => { resolve = done; }); return HttpResponse.json({ methodId: "phone", resendAfterSeconds: 0 }); }));
  const { rerender } = renderWithProviders(<AddLoginMethodDialog open onOpenChange={() => {}} onComplete={complete} />);
  await chooseWhatsApp(user); await user.click(screen.getByRole("button", { name: "Enviar código" }));
  await waitFor(() => expect(sent).toHaveBeenCalledOnce());
  await user.click(screen.getByRole("button", { name: "Cancelar" }));
  rerender(<AddLoginMethodDialog open={false} onOpenChange={() => {}} onComplete={complete} />);
  await act(async () => { resolve(); });
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  expect(complete).not.toHaveBeenCalled();
});

it("el selector WhatsApp y OTP tienen semántica accesible", async () => {
  const user = userEvent.setup(); enableWhatsApp();
  server.use(http.post("/api/me/login-methods", () => HttpResponse.json({ methodId: "phone", resendAfterSeconds: 60 })));
  renderWithProviders(<AddLoginMethodDialog open onOpenChange={() => {}} onComplete={vi.fn()} />);
  await chooseWhatsApp(user);
  expect(await axe(screen.getByRole("dialog"))).toHaveNoViolations();
  await user.click(screen.getByRole("button", { name: "Enviar código" }));
  expect(await screen.findByRole("textbox", { name: "Código 1" })).toHaveFocus();
  expect(await axe(screen.getByRole("dialog"))).toHaveNoViolations();
});

it("Phone pendiente reintenta el envío inicial tras 5xx con la misma clave", async () => {
  const user = userEvent.setup(); const keys: string[] = [];
  server.use(http.post("/api/me/login-methods/pending/code", ({ request }) => {
    keys.push(request.headers.get("Idempotency-Key")!);
    return keys.length === 1 ? HttpResponse.json({ code: "General.Unexpected" }, { status: 500 }) : HttpResponse.json({ methodId: "pending", resendAfterSeconds: 0 });
  }));
  renderWithProviders(<AddLoginMethodDialog open onOpenChange={() => {}} onComplete={vi.fn()} method={{ id: "pending", type: "Phone", value: "•••• 4521", isVerified: false, isPrimary: false, canRemove: true, canMakePrimary: false }} />);
  await screen.findByRole("alert");
  await user.click(screen.getByRole("button", { name: "Enviar código" }));
  expect(await screen.findByRole("textbox", { name: "Código 1" })).toBeVisible();
  expect(keys).toHaveLength(2); expect(keys[1]).toBe(keys[0]);
  expect(screen.getByRole("dialog")).toHaveTextContent("•••• 4521");
});

it("Phone OTP inválido conserva la máscara y el error sólo bajo el código", async () => {
  const user = userEvent.setup(); enableWhatsApp();
  server.use(http.post("/api/me/login-methods", () => HttpResponse.json({ methodId: "phone", resendAfterSeconds: 60 })),
    http.post("/api/me/login-methods/phone/verify", () => HttpResponse.json({ code: "Auth.LoginCode.Invalid", detail: "El código no es válido." }, { status: 400 })));
  renderWithProviders(<AddLoginMethodDialog open onOpenChange={() => {}} onComplete={vi.fn()} />);
  await chooseWhatsApp(user); await user.click(screen.getByRole("button", { name: "Enviar código" }));
  const first = await screen.findByRole("textbox", { name: "Código 1" }); await user.type(first, "123456");
  await user.click(screen.getByRole("button", { name: "Verificar" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("El código no es válido.");
  expect(first).toHaveAttribute("aria-invalid", "true");
  expect(screen.getByRole("group", { name: "Código" })).toHaveAccessibleDescription("Te mandamos un código a •••• 4521. El código no es válido.");
});

it("un error de campo mixto conserva phone específico antes del fallback por código", async () => {
  const user = userEvent.setup(); enableWhatsApp();
  server.use(http.post("/api/me/login-methods", () => HttpResponse.json({ code: "WhatsApp.Phone.CountryNotAllowed", detail: "Revisá el pedido.", errors: { phone: ["Mensaje específico"], request: ["Revisá el pedido."] } }, { status: 400 })));
  renderWithProviders(<AddLoginMethodDialog open onOpenChange={() => {}} onComplete={vi.fn()} />);
  await chooseWhatsApp(user); await user.click(screen.getByRole("button", { name: "Enviar código" }));
  await screen.findByText("Mensaje específico");
  expect(screen.getByRole("textbox", { name: "Número" })).toHaveAccessibleDescription("Mensaje específico");
  expect(screen.getByText("Revisá el pedido.")).toBeVisible();
});

it.each([
  { kind: "5xx", message: "Algo salió mal. Probá de nuevo en un rato.", failure: () => HttpResponse.json({ code: "General.Unexpected" }, { status: 500 }), sameKey: true },
  { kind: "red", message: "No pudimos conectarnos. Revisá tu conexión.", failure: () => HttpResponse.error(), sameKey: true },
  { kind: "negocio", message: "El canal no está disponible.", failure: () => HttpResponse.json({ code: "Auth.LoginMethod.ChannelUnavailable", detail: "El canal no está disponible." }, { status: 400 }), sameKey: false },
])("muestra el fallo de reenvío %s después de once minutos locales sin perder OTP ni operación", async ({ message, failure, sameKey }) => {
  const user = userEvent.setup(); enableWhatsApp(); const keys: string[] = [];
  server.use(http.post("/api/me/login-methods", () => HttpResponse.json({ methodId: "phone", resendAfterSeconds: 60 })),
    http.post("/api/me/login-methods/phone/code", ({ request }) => {
      keys.push(request.headers.get("Idempotency-Key")!);
      return keys.length <= 2 ? failure() : HttpResponse.json({ methodId: "phone", resendAfterSeconds: 60 });
    }));
  renderWithProviders(<AddLoginMethodDialog open onOpenChange={() => {}} onComplete={vi.fn()} />);
  await chooseWhatsApp(user); await user.click(screen.getByRole("button", { name: "Enviar código" }));
  const first = await screen.findByRole("textbox", { name: "Código 1" }); await user.type(first, "123456");
  const clock = vi.spyOn(Date, "now").mockReturnValue(Date.now() + 660_000);
  try {
    act(() => window.dispatchEvent(new Event("focus")));
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    for (let index = 0; index < 2; index++) {
      await user.click(screen.getByRole("button", { name: "Reenviar código" }));
      await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent(message));
      expect(screen.getAllByRole("alert")).toHaveLength(1);
      expect(screen.getByRole("button", { name: "Verificar" })).toBeEnabled();
      expect(first).toBeEnabled(); expect(first).toHaveValue("1");
      expect(screen.getByRole("dialog")).toHaveTextContent("•••• 4521");
    }
    expect(keys[0] === keys[1]).toBe(sameKey);
    await user.click(screen.getByRole("button", { name: "Reenviar código" }));
    await waitFor(() => expect(screen.getByRole("button", { name: "Verificar" })).toBeEnabled());
    expect(first).toBeEnabled(); expect(first).toHaveValue("");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  } finally { clock.mockRestore(); }
});
