import { screen, waitFor, within } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
import { changeCulture, configureI18n } from "@/shared/i18n";
import { referenceDataFixture } from "@/test/mocks/handlers";
import { server } from "@/test/mocks/server";
import { asPhone } from "@/test/utils/phone";
import type { UpdateWhatsAppBotRequest, WhatsAppBotMenuOption, WhatsAppBotResponse, WhatsAppNumberResponse, WhatsAppTeamResponse } from "../../api/types";
import { mountWhatsApp, whatsappMember, whatsappOwner } from "../../test/support";

const central: WhatsAppNumberResponse = { id: "11111111-1111-4111-8111-111111111111", displayNumber: "+5491155550100", verifiedName: "Grupo Delta",
  company: null, status: "Connected", coexistence: false, serviceMessagesThisMonth: 640, freeServiceMessages: 1000, chargedServiceMessagesThisMonth: 0,
  connectedAtUtc: "2026-01-12T13:00:00Z", version: 3 };
const south: WhatsAppNumberResponse = { ...central, id: "22222222-2222-4222-8222-222222222222", displayNumber: "+5493515550200",
  company: { id: "company-2", name: "Delta Sur S.R.L." }, status: "PaymentMissing" };
const gone: WhatsAppNumberResponse = { ...central, id: "33333333-3333-4333-8333-333333333333", displayNumber: "+5491155550999", status: "Disconnected" };
const team = (id: string, name: string, inbox: WhatsAppTeamResponse["inbox"] = "Customers"): WhatsAppTeamResponse => ({ id, name, inbox, memberCount: 2, memberPreview: [], version: 1 });
const teams = [team("t-sales", "Ventas"), team("t-support", "Soporte"), team("t-general", "Atención general"), team("t-orders", "Carga de pedidos", "Internal")];
const option = (id: string, label: string, patch: Partial<WhatsAppBotMenuOption> = {}): WhatsAppBotMenuOption => ({ id, label, action: "Team", teamId: "t-sales", isSystem: false, ...patch });
const menu = [option("o1", "Hacer un pedido"), option("o2", "Consultar un pedido", { teamId: "t-support" }),
  option("o3", "Horarios y dirección", { action: "Reply", teamId: null, reply: "Estamos en Av. Corrientes 1234, de 9 a 18" }),
  option("o4", "Hablar con alguien", { teamId: "t-general" })];
const weekdays = (["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"] as const).map((day) => ({ day, from: "09:00:00", to: "18:00:00" }));
const bot = (patch: Partial<WhatsAppBotResponse> = {}): WhatsAppBotResponse => ({ numberId: central.id, welcome: "Hola, gracias por escribir a Grupo Delta.",
  outOfHours: "Ahora estamos cerrados.", schedule: { timeZoneId: "America/Argentina/Buenos_Aires", days: weekdays }, menu, askPromotions: true,
  offerAccountLink: true, employeesTeamId: "t-orders", version: 5, ...patch });
const paged = <T,>(items: T[]) => ({ items, page: 1, pageSize: 100, totalCount: items.length, totalPages: 1, hasPrevious: false, hasNext: false });

function handlers(numbers = [central], current = bot()) {
  const reads: string[] = [];
  server.use(
    http.get("/api/organization/whatsapp/untaken", () => HttpResponse.json({ customers: 0, internal: 0 })),
    http.get("/api/organization/whatsapp/numbers", () => HttpResponse.json({ numbers: paged(numbers), paymentMissing: 0, signup: null })),
    http.get("/api/organization/whatsapp/teams", () => HttpResponse.json(paged(teams))),
    http.get("/api/organization/whatsapp/numbers/:id/bot", ({ params }) => { reads.push(String(params.id)); return HttpResponse.json({ ...current, numberId: String(params.id) }); }),
  );
  return reads;
}

function saving(response: (body: UpdateWhatsAppBotRequest) => Response) {
  const sent: UpdateWhatsAppBotRequest[] = [];
  server.use(http.put("/api/organization/whatsapp/numbers/:id/bot", async ({ request }) => {
    const body = await request.json() as UpdateWhatsAppBotRequest;
    sent.push(body);
    return response(body);
  }));
  return sent;
}

async function openMenu(user: ReturnType<typeof mountWhatsApp>["user"], name: string) {
  (await screen.findByRole("button", { name: `Acciones de ${name}` })).focus();
  await user.keyboard("{Enter}");
  return screen.findByRole("menu");
}

beforeAll(async () => { await import("./BotPage"); });
beforeEach(async () => {
  await configureI18n(referenceDataFixture().cultures);
  await changeCulture("es-AR");
});

describe("Bot de la organización", () => {
  it("muestra la configuración del número y el recorrido con el segmentado", async () => {
    handlers();
    const page = mountWhatsApp(whatsappOwner, "/org/whatsapp/bot");
    expect(await screen.findByText("Pasa a Ventas")).toBeVisible();
    expect(screen.getByText("Contesta: «Estamos en Av. Corrientes 1234, de 9 a 18»")).toBeVisible();
    expect(screen.getByText("Lunes a viernes, de 09:00 a 18:00")).toBeVisible();
    expect(screen.getByText("Pasan a Carga de pedidos, sin menú")).toBeVisible();
    expect(screen.getByText("4 opciones en el menú")).toBeVisible();
    // D9: el bot no se apaga; Bienvenida y Fuera de horario no tienen interruptor.
    expect(screen.getAllByRole("switch").map((item) => item.getAttribute("aria-label"))).toEqual(["Preguntar por promociones", "Ofrecer vincular su cuenta"]);
    expect(await axe(page.container)).toHaveNoViolations();

    await page.user.click(screen.getByRole("button", { name: "Recorrido" }));
    expect(await screen.findByText("¿Es un empleado?")).toBeVisible();
    expect(screen.getByRole("button", { name: "Recorrido" })).toHaveAttribute("aria-pressed", "true");
    expect(page.router.state.location.search).toBe("?vista=recorrido");
    expect(await axe(page.container)).toHaveNoViolations();
  });

  it("edita la bienvenida con todo el bot y la versión leída", async () => {
    handlers();
    const sent = saving((body) => HttpResponse.json(bot({ welcome: body.welcome ?? "", version: 6 })));
    const page = mountWhatsApp(whatsappOwner, "/org/whatsapp/bot");
    await page.user.click(within(await openMenu(page.user, "Bienvenida")).getByRole("menuitem", { name: "Editar" }));
    const dialog = await screen.findByRole("dialog", { name: "Bienvenida" });
    const text = within(dialog).getByRole("textbox", { name: "Texto" });
    await page.user.clear(text);
    await page.user.paste("¡Hola! ¿En qué te ayudamos?");
    await page.user.click(within(dialog).getByRole("button", { name: "Guardar cambios" }));
    expect(await screen.findByText("Cambios guardados")).toBeVisible();
    expect(sent).toHaveLength(1);
    expect(sent[0]).toMatchObject({ welcome: "¡Hola! ¿En qué te ayudamos?", outOfHours: "Ahora estamos cerrados.", askPromotions: true, employeesTeamId: "t-orders", version: 5 });
    expect(sent[0].menu).toHaveLength(4);
  });

  it("con 10 opciones, «Agregar opción» explica el tope; si el back lo rechaza, va en el diálogo", async () => {
    const nine = Array.from({ length: 9 }, (_, index) => option(`n${index}`, `Opción ${index + 1}`));
    handlers([central], bot({ menu: [...nine, option("n9", "Opción 10")] }));
    const page = mountWhatsApp(whatsappOwner, "/org/whatsapp/bot");
    await page.user.click(await screen.findByRole("button", { name: "Agregar opción" }));
    const notice = await screen.findByRole("dialog", { name: "El menú ya tiene 10 opciones" });
    expect(within(notice).getByText("WhatsApp muestra hasta 10 opciones")).toBeVisible();
    expect(within(notice).getByText("Quitá una opción para sumar otra")).toBeVisible();
    page.unmount();

    handlers([central], bot({ menu: nine }));
    saving(() => HttpResponse.json({ code: "WhatsApp.Bot.TooManyOptions", detail: "El menú admite hasta 10 opciones.", errors: { menu: ["WhatsApp.Bot.TooManyOptions"] } }, { status: 400 }));
    const second = mountWhatsApp(whatsappOwner, "/org/whatsapp/bot");
    await second.user.click(await screen.findByRole("button", { name: "Agregar opción" }));
    const dialog = await screen.findByRole("dialog", { name: "Agregar opción" });
    await second.user.type(within(dialog).getByRole("textbox", { name: "Texto de la opción" }), "Reclamos");
    await second.user.click(within(dialog).getByRole("radio", { name: "Contesta un texto" }));
    await second.user.type(within(dialog).getByRole("textbox", { name: "Texto" }), "Escribinos");
    await second.user.click(within(dialog).getByRole("button", { name: "Guardar" }));
    expect(await within(dialog).findByText("El menú admite hasta 10 opciones.")).toBeVisible();
  });

  it("editar una opción con un 409 deja el aviso en el diálogo y relee el bot al cerrar", async () => {
    const reads = handlers();
    saving(() => HttpResponse.json({ code: "General.ConcurrencyConflict", detail: "Alguien cambió esto mientras lo editabas." }, { status: 409 }));
    const page = mountWhatsApp(whatsappOwner, "/org/whatsapp/bot");
    await page.user.click(within(await openMenu(page.user, "Hacer un pedido")).getByRole("menuitem", { name: "Editar" }));
    const dialog = await screen.findByRole("dialog", { name: "Editar opción 1" });
    const label = within(dialog).getByRole("textbox", { name: "Texto de la opción" });
    await page.user.clear(label);
    await page.user.type(label, "Pedidos");
    await page.user.click(within(dialog).getByRole("button", { name: "Guardar" }));
    expect(await within(dialog).findByText("Alguien cambió esto mientras lo editabas.")).toBeVisible();
    const before = reads.length;
    await page.user.click(within(dialog).getByRole("button", { name: "Cancelar" }));
    await waitFor(() => expect(reads.length).toBeGreaterThan(before));
  });

  it("apaga «Preguntar por promociones» al momento y quita una opción", async () => {
    handlers();
    const sent = saving((body) => HttpResponse.json(bot({ askPromotions: body.askPromotions ?? true, version: 6 })));
    const page = mountWhatsApp(whatsappOwner, "/org/whatsapp/bot");
    await page.user.click(await screen.findByRole("switch", { name: "Preguntar por promociones" }));
    await waitFor(() => expect(sent).toHaveLength(1));
    expect(sent[0]).toMatchObject({ askPromotions: false, version: 5 });

    await page.user.click(within(await openMenu(page.user, "Horarios y dirección")).getByRole("menuitem", { name: "Quitar" }));
    await waitFor(() => expect(sent).toHaveLength(2));
    expect(sent[1].menu?.map((item) => item.label)).toEqual(["Hacer un pedido", "Consultar un pedido", "Hablar con alguien"]);
  });

  it("con varios números se elige cuál; el desconectado no está", async () => {
    const reads = handlers([central, south, gone]);
    const page = mountWhatsApp(whatsappOwner, "/org/whatsapp/bot");
    const pill = await screen.findByRole("button", { name: /Número: .*555-0100 · Toda la organización/ });
    pill.focus();
    await page.user.keyboard("{Enter}");
    const options = await screen.findAllByRole("menuitemradio");
    expect(options).toHaveLength(2);
    await page.user.click(options[1]);
    await waitFor(() => expect(reads).toContain(south.id));
    expect(page.router.state.location.search).toBe(`?numero=${south.id}`);
  });

  it("sin números no hay bot que configurar", async () => {
    handlers([]);
    mountWhatsApp(whatsappOwner, "/org/whatsapp/bot");
    expect(await screen.findByText("Todavía no hay números conectados.")).toBeVisible();
  });

  it("sin el permiso de administrar no se ve", async () => {
    handlers();
    mountWhatsApp(whatsappMember("whatsapp.customers"), "/org/whatsapp/bot");
    expect(await screen.findByRole("heading", { name: "No tenés permiso para ver esta página" })).toBeVisible();
  });

  it("en el teléfono la opción se quita desde su diálogo, con el menú sin ella; con 409 relee el bot", async () => {
    const restore = asPhone();
    try {
      const reads = handlers();
      let conflict = false;
      const sent = saving((body) => conflict
        ? HttpResponse.json({ code: "General.ConcurrencyConflict", detail: "Alguien cambió esto mientras lo editabas." }, { status: 409 })
        : HttpResponse.json(bot({ menu: (body.menu ?? []).map((item, index) => option(item.id ?? `n${index}`, item.label ?? "")), version: 6 })));
      const page = mountWhatsApp(whatsappOwner, "/org/whatsapp/bot");
      await page.user.click(await screen.findByRole("button", { name: /Horarios y dirección/ }));
      const dialog = await screen.findByRole("dialog", { name: "Editar opción 3" });
      await page.user.click(within(dialog).getByRole("button", { name: "Quitar opción" }));
      await waitFor(() => expect(sent).toHaveLength(1));
      expect(sent[0]).toMatchObject({ version: 5 });
      expect(sent[0].menu?.map((item) => item.label)).toEqual(["Hacer un pedido", "Consultar un pedido", "Hablar con alguien"]);
      await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());

      conflict = true;
      const before = reads.length;
      await page.user.click(await screen.findByRole("button", { name: /Hacer un pedido/ }));
      await page.user.click(within(await screen.findByRole("dialog", { name: "Editar opción 1" })).getByRole("button", { name: "Quitar opción" }));
      await waitFor(() => expect(reads.length).toBeGreaterThan(before));
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    } finally { restore(); }
  });

  it("en la compu el diálogo de una opción no lleva «Quitar opción»: va en el ⋮", async () => {
    handlers();
    const page = mountWhatsApp(whatsappOwner, "/org/whatsapp/bot");
    await page.user.click(within(await openMenu(page.user, "Hacer un pedido")).getByRole("menuitem", { name: "Editar" }));
    const dialog = await screen.findByRole("dialog", { name: "Editar opción 1" });
    expect(within(dialog).queryByRole("button", { name: "Quitar opción" })).not.toBeInTheDocument();
  });

  it("en el teléfono: el número arriba, el segmentado y filas que se tocan", async () => {
    const restore = asPhone();
    try {
      handlers([central, south]);
      const page = mountWhatsApp(whatsappOwner, "/org/whatsapp/bot");
      expect(await screen.findByText("Pasa a Ventas")).toBeVisible();
      expect(screen.getByRole("button", { name: "Configuración" })).toHaveAttribute("aria-pressed", "true");
      expect(await axe(page.container)).toHaveNoViolations();
      await page.user.click(screen.getByRole("button", { name: /Fuera de horario/ }));
      const dialog = await screen.findByRole("dialog", { name: "Fuera de horario" });
      expect(within(dialog).getByRole("checkbox", { name: "Sábado" })).not.toBeChecked();
      expect(within(dialog).getAllByText("Cerrado")).toHaveLength(2);
      expect(await axe(page.container)).toHaveNoViolations();
    } finally { restore(); }
  });
});
