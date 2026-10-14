import { screen, waitFor, within } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
import { changeCulture, configureI18n } from "@/shared/i18n";
import { referenceDataFixture } from "@/test/mocks/handlers";
import { server } from "@/test/mocks/server";
import { asPhone } from "@/test/utils/phone";
import type { PlatformWhatsAppBotResponse, UpdatePlatformWhatsAppBotRequest } from "../../api/types";
import { mountWhatsApp, whatsappOperator } from "../../test/support";

const bot: PlatformWhatsAppBotResponse = { welcome: "Hola, somos ArquitecturaBase.", outOfHours: "Ahora no atendemos.", version: 2,
  schedule: { timeZoneId: "America/Argentina/Buenos_Aires", days: [{ day: "Monday", from: "09:00:00", to: "18:00:00" }] },
  menu: [
    { id: "s1", label: "Entrar a mi cuenta", action: "Reply", reply: null, isSystem: true },
    { id: "o2", label: "No me llega el código", action: "Team", teamId: "t-support", isSystem: false },
  ] };
const teams = { items: [{ id: "t-support", name: "Soporte", inbox: "Customers", memberCount: 3, version: 1 }], page: 1, pageSize: 100, totalCount: 1, totalPages: 1, hasPrevious: false, hasNext: false };

function handlers() {
  const sent: UpdatePlatformWhatsAppBotRequest[] = [];
  server.use(
    http.get("/api/platform/whatsapp/conversations", () => HttpResponse.json({
      conversations: { items: [], page: 1, pageSize: 10, totalCount: 0, totalPages: 0, hasPrevious: false, hasNext: false }, counts: { customers: 0, internal: 0, untaken: 0 } })),
    http.get("/api/platform/whatsapp/bot", () => HttpResponse.json(bot)),
    http.get("/api/platform/whatsapp/teams", () => HttpResponse.json(teams)),
    http.put("/api/platform/whatsapp/bot", async ({ request }) => { sent.push(await request.json() as UpdatePlatformWhatsAppBotRequest); return HttpResponse.json({ ...bot, version: 3 }); }),
  );
  return sent;
}

beforeAll(async () => { await import("./PlatformBotPage"); });
beforeEach(async () => {
  await configureI18n(referenceDataFixture().cultures);
  await changeCulture("es-AR");
});

const operator = whatsappOperator("platform.whatsapp.manage");

describe("Bot de Plataforma", () => {
  it("la opción del sistema se ve y no se edita; sin «Además»; guardar no la manda", async () => {
    const sent = handlers();
    const page = mountWhatsApp(operator, "/plataforma/whatsapp/bot");
    expect(await screen.findByText("Manda el enlace para entrar o registrarse")).toBeVisible();
    expect(screen.getByText("Del sistema")).toBeVisible();
    expect(screen.queryByRole("button", { name: "Acciones de Entrar a mi cuenta" })).toBeNull();
    expect(screen.queryByText("Además")).toBeNull();
    expect(screen.queryAllByRole("switch")).toEqual([]);
    expect(await axe(page.container)).toHaveNoViolations();

    (screen.getByRole("button", { name: "Acciones de No me llega el código" })).focus();
    await page.user.keyboard("{Enter}");
    await page.user.click(within(await screen.findByRole("menu")).getByRole("menuitem", { name: "Quitar" }));
    await waitFor(() => expect(sent).toHaveLength(1));
    expect(sent[0]).toEqual({ welcome: bot.welcome, outOfHours: bot.outOfHours, schedule: bot.schedule, menu: [], version: 2 });
  });

  it("el recorrido de Plataforma no pregunta si es un empleado", async () => {
    handlers();
    const page = mountWhatsApp(operator, "/plataforma/whatsapp/bot?vista=recorrido");
    expect(await screen.findByText("Enlace para entrar o registrarse")).toBeVisible();
    expect(screen.getByText("Soporte")).toBeVisible();
    expect(screen.queryByText("¿Es un empleado?")).toBeNull();
    expect(await axe(page.container)).toHaveNoViolations();
  });

  it("sin el permiso de administrar no se ve", async () => {
    handlers();
    mountWhatsApp(whatsappOperator("platform.whatsapp.attend"), "/plataforma/whatsapp/bot");
    expect(await screen.findByRole("heading", { name: "No tenés permiso para ver esta página" })).toBeVisible();
  });

  it("en el teléfono se quita una opción propia desde su diálogo; la del sistema no se abre", async () => {
    const restore = asPhone();
    try {
      const sent = handlers();
      const page = mountWhatsApp(operator, "/plataforma/whatsapp/bot");
      await page.user.click(await screen.findByRole("button", { name: /No me llega el código/ }));
      await page.user.click(within(await screen.findByRole("dialog", { name: "Editar opción 2" })).getByRole("button", { name: "Quitar opción" }));
      await waitFor(() => expect(sent).toHaveLength(1));
      expect(sent[0].menu?.map((item) => item.label)).toEqual([]);
      expect(screen.queryByRole("button", { name: /Entrar a mi cuenta/ })).not.toBeInTheDocument();
    } finally { restore(); }
  });

  it("en el teléfono, el segmentado y los grupos de la app", async () => {
    const restore = asPhone();
    try {
      handlers();
      const page = mountWhatsApp(operator, "/plataforma/whatsapp/bot");
      expect(await screen.findByText("Pasa a Soporte")).toBeVisible();
      await page.user.click(screen.getByRole("button", { name: "Recorrido" }));
      expect(await screen.findByText("Lo manda el bot")).toBeVisible();
      expect(await axe(page.container)).toHaveNoViolations();
    } finally { restore(); }
  });
});
