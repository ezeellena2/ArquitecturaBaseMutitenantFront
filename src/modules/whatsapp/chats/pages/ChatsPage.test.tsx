import { screen, waitFor, within } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import { referenceDataFixture } from "@/test/mocks/handlers";
import { server } from "@/test/mocks/server";
import { asPhone } from "@/test/utils/phone";
import type {
  WhatsAppChatMessageResponse, WhatsAppConversationListResponse, WhatsAppConversationResponse, WhatsAppConversationRowResponse, WhatsAppTemplateOptionResponse,
} from "../../api/types";
import { mountWhatsApp, whatsappMember, whatsappOperator, whatsappOwner } from "../../test/support";

beforeAll(async () => { await import("./ChatsPage"); });
afterEach(() => { vi.unstubAllGlobals(); });

const open = "2999-01-01T00:00:00Z";
const closed = "2020-01-01T00:00:00Z";
const org = "/api/organization/whatsapp";

function row(overrides: Partial<WhatsAppConversationRowResponse> = {}): WhatsAppConversationRowResponse {
  return {
    id: "c-martina", inbox: "Customers", contactId: "contact-martina", contactName: "Martina López", displayNumber: "+5491155556203", tags: ["Mayorista"],
    lastMessagePreview: "2 cajas de tornillos. ¿Atienden hasta las 18?", lastMessageAtUtc: "2026-10-12T13:42:00Z", unread: false,
    team: { id: "team-ventas", name: "Ventas" }, assignee: { id: whatsappOwner.id, name: "Lucía Fernández" }, linkedToAccount: true,
    windowOpenUntilUtc: open, readOnly: false, accountId: null, version: 3, ...overrides,
  };
}
function message(overrides: Partial<WhatsAppChatMessageResponse> = {}): WhatsAppChatMessageResponse {
  return { id: "m-1", kind: "Text", direction: "Inbound", author: null, text: "Hola, buen día. Quiero hacer un pedido.", mediaKind: null, status: "Received",
    failureReason: null, createdAtUtc: "2026-10-12T13:39:00Z", ...overrides };
}
const paged = <T,>(items: T[]) => ({ items, page: 1, pageSize: 10, totalCount: items.length, totalPages: 1, hasPrevious: false, hasNext: false });
function list(rows: WhatsAppConversationRowResponse[], counts = { customers: 5, internal: 2, untaken: 2 }): WhatsAppConversationListResponse {
  return { conversations: paged(rows), counts };
}
const detail = (conversation: WhatsAppConversationRowResponse, messages = [message()]): WhatsAppConversationResponse => ({ conversation, messages: paged(messages) });

/** La bandeja y su conversación, con el contador del menú. Devuelve las bandejas pedidas. */
function inbox(conversation: WhatsAppConversationRowResponse, messages?: WhatsAppChatMessageResponse[]) {
  const requested: string[] = [];
  server.use(
    http.get(`${org}/untaken`, () => HttpResponse.json({ customers: 2, internal: 0 })),
    http.get(`${org}/teams`, () => HttpResponse.json(paged([{ id: "team-ventas", name: "Ventas", inbox: "Customers", memberCount: 3, notifyAfterMinutes: null, version: 1 }]))),
    http.get(`${org}/:inbox/conversations`, ({ params }) => { requested.push(String(params.inbox)); return HttpResponse.json(list([conversation])); }),
    http.get(`${org}/:inbox/conversations/:id`, () => HttpResponse.json(detail(conversation, messages))),
  );
  return requested;
}

describe("Chats de la organización", () => {
  it("la Dueña ve las dos bandejas con su cantidad y la conversación abierta al lado", async () => {
    const requested = inbox(row());
    const { container, user, router } = mountWhatsApp(whatsappOwner, "/org/whatsapp/chats");
    const inboxes = await screen.findByRole("group", { name: "Bandeja" });
    expect(await within(inboxes).findByRole("button", { name: /Clientes\s*5/ })).toHaveAttribute("aria-pressed", "true");
    expect(within(inboxes).getByRole("button", { name: /Internos\s*2/ })).toHaveAttribute("aria-pressed", "false");
    expect(await screen.findByRole("heading", { level: 2, name: "Martina López" })).toBeVisible();
    expect(screen.getByText(/Vinculada a su cuenta · Mayorista/)).toBeVisible();
    expect(screen.getByText("Hola, buen día. Quiero hacer un pedido.")).toBeVisible();
    expect(screen.getByText(/5 conversaciones/)).toBeVisible();
    expect(await axe(container)).toHaveNoViolations();
    await user.click(within(inboxes).getByRole("button", { name: /Internos/ }));
    await waitFor(() => expect(requested).toContain("internal"));
    expect(router.state.location.search).toBe("?inbox=internal");
  });

  it("quien atiende solo internos no ve el segmentado y lee solo esa bandeja", async () => {
    const requested = inbox(row({ inbox: "Internal", tags: [], linkedToAccount: false }));
    mountWhatsApp(whatsappMember("whatsapp.internal"), "/org/whatsapp/chats");
    expect(await screen.findByRole("heading", { level: 2, name: "Martina López" })).toBeVisible();
    expect(screen.getByText(/Empleado/)).toBeVisible();
    expect(screen.queryByRole("group", { name: "Bandeja" })).not.toBeInTheDocument();
    expect(new Set(requested)).toEqual(new Set(["internal"]));
    // Sin «Atender clientes» no hay ficha de contacto que abrir.
    expect(screen.queryByRole("button", { name: "Acciones de Martina López" })).not.toBeInTheDocument();
  });

  it("tomar un chat que otra persona tomó antes avisa quién y relee la conversación", async () => {
    let reads = 0;
    const untaken = row({ id: "c-nuevo", contactName: null, contactId: null, displayNumber: "+5493515550192", assignee: null, tags: [], linkedToAccount: false });
    inbox(untaken);
    server.use(http.get(`${org}/customers/conversations/c-nuevo`, () => { reads++; return HttpResponse.json(detail(reads > 1 ? { ...untaken, assignee: { id: "tomas", name: "Tomás Acosta" } } : untaken)); }),
      http.post(`${org}/customers/conversations/c-nuevo/take`, () => HttpResponse.json(
        { code: "WhatsApp.Conversation.TakenByOther", detail: "Otra persona tomó esta conversación y tu mensaje no salió.", takenBy: "Tomás Acosta" }, { status: 409 })));
    const { user } = mountWhatsApp(whatsappOwner, "/org/whatsapp/chats");
    await user.click(await screen.findByRole("button", { name: "Tomar" }));
    expect(await screen.findByText("No pudimos tomar el chat: Tomás Acosta lo tomó antes.")).toBeVisible();
    expect(await screen.findByText("Lo atiende Tomás Acosta")).toBeVisible();
    expect(screen.queryByRole("textbox", { name: "Mensaje" })).not.toBeInTheDocument();
  });

  it("si otra persona lo tomó mientras escribía, el mensaje no sale y lo dice", async () => {
    const untaken = row({ assignee: null });
    inbox(untaken);
    let sent = 0;
    server.use(http.post(`${org}/customers/conversations/c-martina/messages`, ({ request }) => {
      sent++;
      expect(request.headers.get("Idempotency-Key")).toBeTruthy();
      return HttpResponse.json({ code: "WhatsApp.Conversation.TakenByOther", takenBy: "Tomás Acosta" }, { status: 409 });
    }));
    const { user } = mountWhatsApp(whatsappOwner, "/org/whatsapp/chats");
    await user.type(await screen.findByRole("textbox", { name: "Mensaje" }), "Hola, Martina");
    await user.click(screen.getByRole("button", { name: "Enviar" }));
    expect(await screen.findByText("No pudimos mandar tu mensaje: Tomás Acosta tomó el chat antes.")).toBeVisible();
    expect(sent).toBe(1);
  });

  it("mandar un mensaje con la ventana cerrada pasa a «Pasaron 24 horas» con su explicación", async () => {
    inbox(row());
    server.use(http.post(`${org}/customers/conversations/c-martina/messages`, () => HttpResponse.json({ code: "WhatsApp.Conversation.WindowClosed" }, { status: 409 })));
    const { user } = mountWhatsApp(whatsappOwner, "/org/whatsapp/chats");
    await user.type(await screen.findByRole("textbox", { name: "Mensaje" }), "Hola{Enter}");
    expect(await screen.findByText("Pasaron 24 horas")).toBeVisible();
    expect(screen.queryByRole("textbox", { name: "Mensaje" })).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Qué significa" }));
    const notice = await screen.findByRole("dialog", { name: "Pasaron 24 horas" });
    expect(within(notice).getByText(/Martina López escribió por última vez/)).toBeVisible();
    expect(within(notice).getByText("Tocá «Elegir plantilla» y mandale una")).toBeVisible();
  });

  it("pasadas las 24 h solo deja mandar una plantilla, con la vista previa y el costo que manda el back", async () => {
    inbox(row({ windowOpenUntilUtc: closed }));
    const option: WhatsAppTemplateOptionResponse = { templateId: "t-pedido", name: "Pedido listo", category: "Utility",
      body: "Hola {{1}}, tu pedido {{2}} está listo.", variables: ["Nombre", "Número de pedido"], estimatedCost: { amount: 0.0312, currency: "USD" } };
    let body: unknown;
    const reference = referenceDataFixture();
    server.use(
      http.get("/api/reference-data", () => HttpResponse.json({ ...reference, currencies: [...reference.currencies,
        { ...reference.currencies[0], code: "USD", name: "Dólar estadounidense", displaySymbol: "US$", symbol: "US$", minorUnits: 2 }] })),
      http.get(`${org}/customers/conversations/c-martina/template-options`, () => HttpResponse.json(paged([option]))),
      http.post(`${org}/customers/conversations/c-martina/templates`, async ({ request }) => {
        body = await request.json();
        return HttpResponse.json(message({ id: "m-t", kind: "Template", direction: "Outbound", text: "Hola Martina", status: "Pending" }), { status: 201 });
      }),
    );
    const { user } = mountWhatsApp(whatsappOwner, "/org/whatsapp/chats");
    expect(await screen.findByText("Pasaron 24 horas")).toBeVisible();
    expect(screen.queryByRole("textbox", { name: "Mensaje" })).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Elegir plantilla" }));
    const dialog = await screen.findByRole("dialog", { name: "Mandar plantilla a Martina López" });
    await user.click(within(dialog).getByRole("combobox", { name: "Plantilla" }));
    await user.click(await screen.findByRole("option", { name: /Pedido listo/ }));
    await user.type(within(dialog).getByRole("textbox", { name: "Nombre" }), "Martina");
    await user.type(within(dialog).getByRole("textbox", { name: "Número de pedido" }), "1043");
    expect(within(dialog).getByLabelText("Vista previa")).toHaveTextContent("Hola Martina, tu pedido 1043 está listo.");
    // El costo es el que calculó el back, con su moneda: el front no lo redondea ni lo multiplica.
    expect(within(dialog).getByText(/Costo estimado:/)).toHaveTextContent(/US\$\s?0,03/);
    await user.click(within(dialog).getByRole("button", { name: "Mandar" }));
    await waitFor(() => expect(body).toEqual({ templateId: "t-pedido", variables: ["Martina", "1043"] }));
    await waitFor(() => expect(screen.queryByRole("dialog", { name: "Mandar plantilla a Martina López" })).not.toBeInTheDocument());
    expect(await axe(document.body)).toHaveNoViolations();
  });

  it("la nota interna va a notas y nunca sale como mensaje", async () => {
    inbox(row());
    let note: unknown; let messages = 0;
    server.use(
      http.post(`${org}/customers/conversations/c-martina/notes`, async ({ request }) => {
        note = await request.json();
        return HttpResponse.json(message({ id: "m-n", kind: "Note", direction: "Outbound", author: "Lucía Fernández", text: "Confirmar precio" }), { status: 201 });
      }),
      http.post(`${org}/customers/conversations/c-martina/messages`, () => { messages++; return HttpResponse.json({}, { status: 500 }); }),
    );
    const { user } = mountWhatsApp(whatsappOwner, "/org/whatsapp/chats");
    await user.click(await screen.findByRole("button", { name: "Nota interna" }));
    await user.type(screen.getByRole("textbox", { name: "Nota interna" }), "Confirmar precio");
    await user.click(screen.getByRole("button", { name: "Guardar nota" }));
    await waitFor(() => expect(note).toEqual({ text: "Confirmar precio" }));
    expect(messages).toBe(0);
  });

  it("con el número desconectado solo se lee: sin escribir, sin nota, sin tomar ni pasar", async () => {
    inbox(row({ readOnly: true, assignee: null }), [message(), message({ id: "m-2", kind: "Media", mediaKind: "Audio", text: null })]);
    const { user } = mountWhatsApp(whatsappOwner, "/org/whatsapp/chats");
    expect(await screen.findByText("Número desconectado")).toBeVisible();
    expect(screen.getByText("Mandó un audio")).toBeVisible();
    expect(screen.queryByRole("textbox", { name: "Mensaje" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Nota interna" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Tomar" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Pasar" })).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Qué significa" }));
    expect(await screen.findByRole("dialog", { name: "Martina López escribió a un número desconectado" })).toBeVisible();
  });

  it("pasar a otro equipo manda la versión de la fila y relee la bandeja", async () => {
    inbox(row());
    let body: unknown;
    server.use(
      http.get(`${org}/customers/conversations/c-martina/transfer-options/teams`, () => HttpResponse.json(paged([{ id: "team-soporte", name: "Soporte", memberCount: 2 }]))),
      http.get(`${org}/customers/conversations/c-martina/transfer-options/people`, () => HttpResponse.json(paged([{ id: "carolina", name: "Carolina Vega", takenCount: 3 }]))),
      http.post(`${org}/customers/conversations/c-martina/transfer`, async ({ request }) => { body = await request.json(); return HttpResponse.json(row({ team: { id: "team-soporte", name: "Soporte" } })); }),
    );
    const { user } = mountWhatsApp(whatsappOwner, "/org/whatsapp/chats");
    // Los desplegables de Radix se abren con el teclado (tests.md).
    (await screen.findByRole("button", { name: "Pasar" })).focus();
    await user.keyboard("{Enter}");
    const menu = await screen.findByRole("menu");
    expect(within(menu).getByText("Personas de Ventas")).toBeVisible();
    expect(within(menu).getByText("3 chats tomados")).toBeVisible();
    await user.click(within(menu).getByRole("menuitem", { name: /Soporte/ }));
    await waitFor(() => expect(body).toEqual({ teamId: "team-soporte", version: 3 }));
  });

  it("en el teléfono la bandeja es una lista y la conversación, otra pantalla", async () => {
    asPhone();
    inbox(row());
    const { container, user } = mountWhatsApp(whatsappOwner, "/org/whatsapp/chats");
    const link = await screen.findByRole("link", { name: /Martina López/ });
    expect(screen.queryByRole("log")).not.toBeInTheDocument();
    expect(await axe(container)).toHaveNoViolations();
    await user.click(link);
    expect(await screen.findByRole("log", { name: "Mensajes con Martina López" })).toBeVisible();
    expect(screen.getByRole("link", { name: "Volver a Chats" })).toBeVisible();
    expect(screen.getByRole("textbox", { name: "Mensaje" })).toBeVisible();
  });
});

describe("Consultas de Plataforma", () => {
  const platform = "/api/platform/whatsapp/conversations";
  function consultations(conversation: WhatsAppConversationRowResponse) {
    server.use(
      // Plataforma tiene una sola bandeja: el total es `customers`, aunque `internal` llegara con algo.
      http.get(platform, () => HttpResponse.json(list([conversation], { customers: 4, internal: 3, untaken: 2 }))),
      http.get(`${platform}/:id`, () => HttpResponse.json(detail(conversation))),
      http.get("/api/platform/whatsapp/teams", () => HttpResponse.json(paged([]))),
    );
  }

  it("sin bandejas y con «Ver la cuenta» para quien lee cuentas", async () => {
    consultations(row({ inbox: null, accountId: "account-lucia", contactName: "Lucía Fernández", tags: [], contactId: null }));
    const { container } = mountWhatsApp(whatsappOperator(), "/plataforma/whatsapp");
    expect(await screen.findByRole("heading", { level: 2, name: "Lucía Fernández" })).toBeVisible();
    expect(screen.getByRole("link", { name: "Ver la cuenta" })).toHaveAttribute("href", "/plataforma/cuentas/account-lucia");
    expect(screen.queryByRole("group", { name: "Bandeja" })).not.toBeInTheDocument();
    expect(screen.getByText(/4 conversaciones/)).toBeVisible();
    expect(await axe(container)).toHaveNoViolations();
  });

  it("sin permiso para leer cuentas no ofrece la ficha", async () => {
    consultations(row({ inbox: null, accountId: "account-lucia", contactName: "Lucía Fernández", tags: [], contactId: null }));
    const operator = whatsappOperator("platform.whatsapp.attend");
    mountWhatsApp({ ...operator, effectivePermissions: { ...operator.effectivePermissions, platform: ["platform.whatsapp.attend"] } }, "/plataforma/whatsapp");
    expect(await screen.findByRole("heading", { level: 2, name: "Lucía Fernández" })).toBeVisible();
    expect(screen.queryByRole("link", { name: "Ver la cuenta" })).not.toBeInTheDocument();
  });
});
