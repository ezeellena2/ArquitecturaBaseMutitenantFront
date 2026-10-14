import { screen, waitFor, within } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import { changeCulture, configureI18n } from "@/shared/i18n";
import { referenceDataFixture } from "@/test/mocks/handlers";
import { server } from "@/test/mocks/server";
import { asPhone } from "@/test/utils/phone";
import type { PlatformWhatsAppNumberResponse, WhatsAppNumberResponse } from "../../api/types";
import type { FacebookSdk } from "../signup/embeddedSignup";
import { mountWhatsApp, whatsappOperator } from "../../test/support";

const number: WhatsAppNumberResponse = { id: "33333333-3333-4333-8333-333333333333", displayNumber: "+5491140001000", verifiedName: "ArquitecturaBase",
  company: null, status: "Connected", coexistence: false, serviceMessagesThisMonth: 580, freeServiceMessages: 1000, chargedServiceMessagesThisMonth: 0,
  connectedAtUtc: "2026-01-12T13:00:00Z", version: 4 };
const signup = { appId: "1105469744", configId: "cfg-42", sdkVersion: "v26.0" };
const platform = (patch: Partial<PlatformWhatsAppNumberResponse> = {}): PlatformWhatsAppNumberResponse => ({ number, consultationsEnabled: true, systemMessagesThisMonth: 11900, signup, ...patch });

function handlers(response = platform()) {
  server.use(
    http.get("/api/platform/whatsapp/conversations", () => HttpResponse.json({
      conversations: { items: [], page: 1, pageSize: 10, totalCount: 0, totalPages: 0, hasPrevious: false, hasNext: false }, counts: { customers: 0, internal: 0, untaken: 0 } })),
    http.get("/api/platform/whatsapp/number", () => HttpResponse.json(response)),
  );
}

beforeAll(async () => { await import("./PlatformNumberPage"); });
beforeEach(async () => {
  await configureI18n(referenceDataFixture().cultures);
  await changeCulture("es-AR");
});
afterEach(() => { Reflect.deleteProperty(window, "FB"); });

const operator = whatsappOperator("platform.whatsapp.manage");

describe("Número de Plataforma", () => {
  it("muestra qué hace con los contadores del back y apaga las consultas con la versión", async () => {
    handlers();
    const sent: unknown[] = [];
    server.use(http.put("/api/platform/whatsapp/number", async ({ request }) => {
      sent.push(await request.json());
      return HttpResponse.json(platform({ consultationsEnabled: false }));
    }));
    const page = mountWhatsApp(operator, "/plataforma/whatsapp/numero");
    expect(await screen.findByText("ArquitecturaBase · desde el 12/01/2026")).toBeVisible();
    expect(screen.getByText("11.900 mensajes este mes")).toBeVisible();
    expect(screen.getByText("580 de 1.000 gratis este mes")).toBeVisible();
    expect(screen.getByText("Siempre")).toBeVisible();
    expect(await axe(page.container)).toHaveNoViolations();
    await page.user.click(screen.getByRole("switch", { name: "Atiende consultas" }));
    expect(await screen.findByText("Consultas apagadas")).toBeVisible();
    expect(sent).toEqual([{ consultationsEnabled: false, version: 4 }]);
    await waitFor(() => expect(screen.getByRole("switch", { name: "Atiende consultas" })).not.toBeChecked());
  });

  it("sin número conecta por el alta de Meta, sin empresa", async () => {
    handlers(platform({ number: null, systemMessagesThisMonth: 0 }));
    const logins: Parameters<FacebookSdk["login"]>[] = [];
    Object.assign(window, { FB: { init: vi.fn(), login: (callback, options) => { logins.push([callback, options]); } } satisfies FacebookSdk });
    const sent: unknown[] = [];
    server.use(http.post("/api/platform/whatsapp/number", async ({ request }) => { sent.push(await request.json()); return HttpResponse.json(platform(), { status: 201 }); }));
    const page = mountWhatsApp(operator, "/plataforma/whatsapp/numero");
    expect(await screen.findByText("Todavía no hay un número conectado")).toBeVisible();
    await page.user.click(screen.getByRole("button", { name: "Conectar número" }));
    expect(await screen.findByText("Ventana de Meta abierta")).toBeVisible();
    window.dispatchEvent(new MessageEvent("message", { origin: "https://business.facebook.com",
      data: JSON.stringify({ type: "WA_EMBEDDED_SIGNUP", event: "FINISH", data: { phone_number_id: "10", waba_id: "20" } }) }));
    logins[0][0]({ authResponse: { code: "code-plat" } });
    expect(await screen.findByText("Número conectado")).toBeVisible();
    expect(sent).toEqual([{ code: "code-plat", phoneNumberId: "10", wabaId: "20", coexistence: false }]);
  });

  it("sin medio de pago, el aviso de Plataforma", async () => {
    handlers(platform({ number: { ...number, status: "PaymentMissing" } }));
    const page = mountWhatsApp(operator, "/plataforma/whatsapp/numero");
    await page.user.click(await screen.findByRole("button", { name: "Por qué no puede mandar mensajes" }));
    const notice = await screen.findByRole("dialog", { name: /no puede mandar mensajes/ });
    expect(within(notice).getByText("Los códigos y los avisos salen solo por correo. Las consultas siguen hasta 1.000 por mes")).toBeVisible();
  });

  it("sin el permiso de administrar no se ve", async () => {
    handlers();
    mountWhatsApp(whatsappOperator("platform.whatsapp.attend"), "/plataforma/whatsapp/numero");
    expect(await screen.findByRole("heading", { name: "No tenés permiso para ver esta página" })).toBeVisible();
  });

  it("en el teléfono son grupos de la app", async () => {
    const restore = asPhone();
    try {
      handlers();
      const { container } = mountWhatsApp(operator, "/plataforma/whatsapp/numero");
      expect(await screen.findByText("Conectado · desde el 12/01/2026")).toBeVisible();
      expect(screen.getByRole("switch", { name: "Atiende consultas" })).toBeChecked();
      expect(await axe(container)).toHaveNoViolations();
    } finally { restore(); }
  });
});
