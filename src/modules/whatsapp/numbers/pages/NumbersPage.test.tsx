import { screen, waitFor, within } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import { changeCulture, configureI18n } from "@/shared/i18n";
import { referenceDataFixture } from "@/test/mocks/handlers";
import { server } from "@/test/mocks/server";
import { asPhone } from "@/test/utils/phone";
import type { ConnectWhatsAppNumberRequest, WhatsAppNumberListResponse, WhatsAppNumberResponse } from "../../api/types";
import type { FacebookSdk } from "../signup/embeddedSignup";
import { mountWhatsApp, whatsappMember, whatsappOwner } from "../../test/support";

const central: WhatsAppNumberResponse = { id: "11111111-1111-4111-8111-111111111111", displayNumber: "+5491155550100", verifiedName: "Grupo Delta",
  company: null, status: "Connected", coexistence: true, serviceMessagesThisMonth: 1240, freeServiceMessages: 1000, chargedServiceMessagesThisMonth: 240,
  connectedAtUtc: "2026-01-12T13:00:00Z", version: 3 };
const south: WhatsAppNumberResponse = { ...central, id: "22222222-2222-4222-8222-222222222222", displayNumber: "+5493515550200", verifiedName: "Delta Sur",
  company: { id: "company-2", name: "Delta Sur S.R.L." }, status: "PaymentMissing", coexistence: false, serviceMessagesThisMonth: 310,
  chargedServiceMessagesThisMonth: 0, version: 7 };
const signup = { appId: "1105469744", configId: "cfg-42", sdkVersion: "v26.0" };
const list = (items: WhatsAppNumberResponse[] = [central, south], paymentMissing = 1): WhatsAppNumberListResponse => ({
  numbers: { items, page: 1, pageSize: 10, totalCount: items.length, totalPages: 1, hasPrevious: false, hasNext: false }, paymentMissing, signup });
const companies = { items: [{ id: "company-2", name: "Delta Sur S.R.L." }], page: 1, pageSize: 10, totalCount: 1, totalPages: 1, hasPrevious: false, hasNext: false };

function handlers(response = list()) {
  server.use(
    http.get("/api/organization/whatsapp/untaken", () => HttpResponse.json({ customers: 0, internal: 0 })),
    http.get("/api/organization/whatsapp/numbers", () => HttpResponse.json(response)),
    http.get("/api/organization/whatsapp/numbers/company-options", () => HttpResponse.json(companies)),
    http.get("/api/contact", () => HttpResponse.json({ supportEmail: "soporte@delta.ejemplo.com" })),
  );
}

/** El SDK de Facebook simulado: el script de verdad nunca se carga en los tests. */
function fakeFacebook() {
  const logins: Parameters<FacebookSdk["login"]>[] = [];
  const sdk: FacebookSdk = { init: vi.fn(), login: (callback, options) => { logins.push([callback, options]); } };
  Object.assign(window, { FB: sdk });
  return {
    logins,
    post: (data: object) => window.dispatchEvent(new MessageEvent("message", { origin: "https://www.facebook.com", data: JSON.stringify({ type: "WA_EMBEDDED_SIGNUP", ...data }) })),
    respond: (code: string | null) => logins[0][0]({ authResponse: code ? { code } : null }),
  };
}

beforeAll(async () => { await import("./NumbersPage"); });
beforeEach(async () => {
  await configureI18n(referenceDataFixture().cultures);
  await changeCulture("es-AR");
});
afterEach(() => { Reflect.deleteProperty(window, "FB"); });

async function openMeta(me = whatsappOwner, company?: string) {
  const page = mountWhatsApp(me, "/org/whatsapp/numeros");
  await page.user.click(await screen.findByRole("button", { name: "Conectar número" }));
  const dialog = await screen.findByRole("dialog", { name: "Conectar número" });
  if (company) {
    within(dialog).getByRole("combobox", { name: "Atiende a" }).focus();
    await page.user.keyboard("{Enter}");
    await page.user.click(await screen.findByRole("option", { name: company }));
  }
  await page.user.click(within(dialog).getByRole("button", { name: "Seguir en Meta" }));
  return page;
}

describe("Números", () => {
  it("lista cada número con el contador del mes tal como llega del back (D1) y el resumen", async () => {
    handlers();
    const { container } = mountWhatsApp(whatsappOwner, "/org/whatsapp/numeros");
    expect(await screen.findByText("1.240 ·", { exact: false })).toBeVisible();
    expect(screen.getByText("240 se cobran")).toBeVisible();
    expect(screen.getByText("310 de 1.000 gratis")).toBeVisible();
    expect(screen.getByText("Grupo Delta · también en la app")).toBeVisible();
    expect(screen.getByText("Toda la organización")).toBeVisible();
    expect(document.querySelector("[data-slot=page-subline]")).toHaveTextContent("2 números·1 sin medio de pago");
    // El SDK de Facebook no se pide al abrir la pantalla.
    expect(document.querySelector("script[src*='connect.facebook.net']")).toBeNull();
    expect(await axe(container)).toHaveNoViolations();
  });

  it("sin el permiso de administrar no se ve, y con el módulo apagado no existe", async () => {
    handlers();
    mountWhatsApp(whatsappMember("whatsapp.customers"), "/org/whatsapp/numeros");
    expect(await screen.findByRole("heading", { name: "No tenés permiso para ver esta página" })).toBeVisible();
  });

  it("con el módulo apagado es un 404", async () => {
    handlers();
    mountWhatsApp({ ...whatsappOwner, features: [] }, "/org/whatsapp/numeros");
    expect(await screen.findByRole("heading", { name: "No encontramos esta página" })).toBeVisible();
  });

  // CC21: las empresas salen de Números; alcanza con «Administrar WhatsApp», sin permisos de Empresas.
  it("conectado: con el code y los ids de FINISH manda el alta idempotente con a quién atiende", async () => {
    handlers();
    const meta = fakeFacebook();
    const sent: { body: ConnectWhatsAppNumberRequest; key: string | null }[] = [];
    server.use(http.post("/api/organization/whatsapp/numbers", async ({ request }) => {
      sent.push({ body: await request.json() as ConnectWhatsAppNumberRequest, key: request.headers.get("Idempotency-Key") });
      return HttpResponse.json(central, { status: 201 });
    }));
    await openMeta(whatsappMember("whatsapp.manage"), "Delta Sur S.R.L.");
    expect(await screen.findByText("Ventana de Meta abierta")).toBeVisible();
    meta.post({ event: "FINISH", data: { phone_number_id: "106540352242922", waba_id: "524126980791429" } });
    meta.respond("AQBx-code");
    expect(await screen.findByText("Número conectado")).toBeVisible();
    expect(sent).toEqual([{ body: { code: "AQBx-code", phoneNumberId: "106540352242922", wabaId: "524126980791429", coexistence: false, companyId: "company-2" },
      key: expect.any(String) as string }]);
    expect(screen.queryByText("Ventana de Meta abierta")).toBeNull();
  });

  it("cancelado: avisa que no se conectó y no manda nada", async () => {
    handlers();
    const meta = fakeFacebook();
    let posts = 0;
    server.use(http.post("/api/organization/whatsapp/numbers", () => { posts += 1; return HttpResponse.json(central, { status: 201 }); }));
    await openMeta();
    meta.post({ event: "CANCEL", data: { current_step: "PHONE_NUMBER_SETUP" } });
    expect(await screen.findByText("No se conectó el número")).toBeVisible();
    expect(posts).toBe(0);
  });

  it("error de Meta: el aviso con su código y el correo de soporte", async () => {
    handlers();
    const meta = fakeFacebook();
    const page = await openMeta();
    meta.post({ event: "ERROR", data: { error_message: "Falló", error_id: "524126" } });
    const notice = await screen.findByRole("dialog", { name: "No se pudo conectar el número" });
    expect(within(notice).getByText("Meta informó un error")).toBeVisible();
    expect(within(notice).getByText("Código 524126")).toBeVisible();
    expect(await within(notice).findByText("Si vuelve a pasar, escribí a soporte@delta.ejemplo.com")).toBeVisible();
    expect(await axe(page.container)).toHaveNoViolations();
  });

  it("el code vencido va al aviso con el texto del back; un número ya conectado, al aviso rojo", async () => {
    handlers();
    let meta = fakeFacebook();
    const responses = [
      HttpResponse.json({ code: "WhatsApp.Number.SignupExpired", detail: "El alta de Meta venció. Volvé a conectar el número.", errors: { code: ["WhatsApp.Number.SignupExpired"] } }, { status: 400 }),
      HttpResponse.json({ code: "WhatsApp.Number.AlreadyConnected", detail: "Ese número ya está conectado." }, { status: 409 }),
    ];
    server.use(http.post("/api/organization/whatsapp/numbers", () => responses.shift()));
    const page = await openMeta();
    meta.post({ event: "FINISH", data: { phone_number_id: "1", waba_id: "2" } });
    meta.respond("viejo");
    const notice = await screen.findByRole("dialog", { name: "No se pudo conectar el número" });
    expect(within(notice).getByText("El alta de Meta venció. Volvé a conectar el número.")).toBeVisible();
    await page.user.click(within(notice).getByRole("button", { name: "Entendido" }));

    meta = fakeFacebook();
    await page.user.click(screen.getByRole("button", { name: "Conectar número" }));
    await page.user.click(within(await screen.findByRole("dialog", { name: "Conectar número" })).getByRole("button", { name: "Seguir en Meta" }));
    meta.post({ event: "FINISH", data: { phone_number_id: "1", waba_id: "2" } });
    meta.respond("nuevo");
    expect(await screen.findByText("Ese número ya está conectado.")).toBeVisible();
  });

  it("desconectar confirma en rojo y manda la versión", async () => {
    handlers();
    const deleted: string[] = [];
    server.use(http.delete("/api/organization/whatsapp/numbers/:id", ({ request }) => { deleted.push(request.url); return new HttpResponse(null, { status: 204 }); }));
    const page = mountWhatsApp(whatsappOwner, "/org/whatsapp/numeros");
    (await screen.findByRole("button", { name: /Acciones de .*555-0200/ })).focus();
    await page.user.keyboard("{Enter}");
    const menu = await screen.findByRole("menu");
    expect(within(menu).getAllByRole("menuitem").map((item) => item.textContent)).toEqual(["Cambiar a quién atiende", "Comprobar medio de pago", "Desconectar"]);
    await page.user.click(within(menu).getByRole("menuitem", { name: "Desconectar" }));
    const confirm = await screen.findByRole("dialog", { name: /¿Desconectar .*555-0200\?/ });
    expect(within(confirm).getByText("Sus chats quedan para leer, sin responder. Para volver a atender, conectalo de nuevo.")).toBeVisible();
    expect(within(confirm).queryByRole("button", { name: "Cerrar" })).toBeNull();
    await page.user.click(within(confirm).getByRole("button", { name: "Desconectar" }));
    await waitFor(() => expect(deleted).toHaveLength(1));
    expect(new URL(deleted[0]).pathname).toBe(`/api/organization/whatsapp/numbers/${south.id}`);
    expect(new URL(deleted[0]).searchParams.get("version")).toBe("7");
  });

  it("desde «Para resolver» abre el aviso de sin medio de pago y «Comprobar» manda la versión", async () => {
    handlers();
    const checks: unknown[] = [];
    server.use(
      http.get("/api/organization/whatsapp/numbers/:id", () => HttpResponse.json(south)),
      http.post("/api/organization/whatsapp/numbers/:id/check", async ({ request }) => { checks.push(await request.json()); return HttpResponse.json({ ...south, status: "Connected", version: 8 }); }),
    );
    const page = mountWhatsApp(whatsappOwner, `/org/whatsapp/numeros?numero=${south.id}`);
    const notice = await screen.findByRole("dialog", { name: /no tiene medio de pago/ });
    expect(within(notice).getByText("Responde hasta 1.000 mensajes por mes. Sin medio de pago no manda plantillas ni difusiones")).toBeVisible();
    expect(within(notice).getByRole("link", { name: "Ir a Meta" })).toHaveAttribute("target", "_blank");
    await page.user.click(within(notice).getByRole("button", { name: "Comprobar" }));
    expect(await screen.findByText("El número ya tiene medio de pago")).toBeVisible();
    expect(checks).toEqual([{ version: 7 }]);
    await waitFor(() => expect(page.router.state.location.search).toBe(""));
  });

  it("en el teléfono cada número es una fila y conectar es el «+»", async () => {
    const restore = asPhone();
    try {
      handlers();
      const { container } = mountWhatsApp(whatsappOwner, "/org/whatsapp/numeros");
      expect(await screen.findByText("310 de 1.000 gratis")).toBeVisible();
      expect(screen.getByRole("button", { name: "Conectar número" })).toBeVisible();
      expect(await axe(container)).toHaveNoViolations();
    } finally { restore(); }
  });

  it("sin números, el vacío del tablero", async () => {
    handlers(list([], 0));
    mountWhatsApp(whatsappOwner, "/org/whatsapp/numeros");
    expect(await screen.findByText("Todavía no hay números conectados.")).toBeVisible();
    expect(screen.getByText("Sin números")).toBeVisible();
  });
});
