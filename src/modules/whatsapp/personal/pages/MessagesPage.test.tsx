import { screen, waitFor, within } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import { server } from "@/test/mocks/server";
import { asPhone } from "@/test/utils/phone";
import type { PersonalWhatsAppConversationResponse, WhatsAppChatMessageResponse } from "../../api/types";
import { mountWhatsApp, whatsappPerson } from "../../test/support";

beforeAll(async () => { await import("./MessagesPage"); });
afterEach(() => { vi.unstubAllGlobals(); });

const base = "/api/me/whatsapp/conversations";
const clementina: PersonalWhatsAppConversationResponse = {
  id: "link-clementina", organizationName: "La Clementina", linkedAtUtc: "2026-09-20T15:00:00Z", lastMessageAtUtc: "2026-10-12T13:42:00Z",
  lastMessagePreview: "Vos: Gracias, paso a las 17.", displayNumber: "+5491155550300",
};
const messages: WhatsAppChatMessageResponse[] = [
  { id: "m-1", kind: "Text", direction: "Inbound", author: null, text: "Hola, ¿tienen empanadas de humita para hoy?", mediaKind: null, status: "Received", failureReason: null, createdAtUtc: "2026-10-12T13:30:00Z" },
  { id: "m-2", kind: "Text", direction: "Outbound", author: "Carla", text: "Hola Lucía, sí. ¿Cuántas querés?", mediaKind: null, status: "Read", failureReason: null, createdAtUtc: "2026-10-12T13:35:00Z" },
];
const paged = <T,>(items: T[]) => ({ items, page: 1, pageSize: 10, totalCount: items.length, totalPages: 1, hasPrevious: false, hasNext: false });
function slicePage<T>(all: readonly T[], requestUrl: string) {
  const params = new URL(requestUrl).searchParams;
  const page = Number(params.get("page") ?? "1");
  const pageSize = Number(params.get("pageSize") ?? "50");
  const start = (page - 1) * pageSize;
  const totalPages = Math.max(1, Math.ceil(all.length / pageSize));
  return { items: all.slice(start, start + pageSize), page, pageSize, totalCount: all.length, totalPages, hasPrevious: page > 1, hasNext: page < totalPages };
}
const isoMinute = (n: number) => `2026-10-12T${String(10 + Math.floor(n / 60)).padStart(2, "0")}:${String(n % 60).padStart(2, "0")}:00Z`;

function messagesHandlers(items = [clementina]) {
  server.use(
    http.get(base, () => HttpResponse.json(paged(items))),
    http.get(`${base}/:id`, () => HttpResponse.json({ conversation: clementina, messages: paged(messages) })),
  );
}

describe("Mensajes de la persona", () => {
  it("muestra la conversación de solo lectura, con lo suyo a la derecha y lo de la organización con su nombre", async () => {
    messagesHandlers();
    const { container } = mountWhatsApp(whatsappPerson, "/mensajes");
    expect(await screen.findByRole("heading", { level: 2, name: "La Clementina" })).toBeVisible();
    expect(screen.getByText(/Vinculada desde el 20\/09\/2026/)).toBeVisible();
    expect(screen.getByText("La Clementina · 10:35")).toBeVisible();
    expect(screen.getByRole("link", { name: "Seguir en WhatsApp" })).toHaveAttribute("href", "https://wa.me/5491155550300");
    expect(screen.queryByRole("textbox", { name: "Mensaje" })).not.toBeInTheDocument();
    expect(await axe(container)).toHaveNoViolations();
  });

  it("sin conversaciones lo dice", async () => {
    messagesHandlers([]);
    mountWhatsApp(whatsappPerson, "/mensajes");
    expect(await screen.findByText("Todavía no tenés mensajes con organizaciones")).toBeVisible();
    expect(screen.getByText("Ninguna organización")).toBeVisible();
  });

  it("desvincular se confirma, borra el vínculo y vuelve a la lista", async () => {
    messagesHandlers();
    let unlinked = "";
    server.use(http.delete(`${base}/:id/link`, ({ params }) => { unlinked = String(params.id); return new HttpResponse(null, { status: 204 }); }));
    const { user, router } = mountWhatsApp(whatsappPerson, "/mensajes/link-clementina");
    (await screen.findByRole("button", { name: "Acciones de La Clementina" })).focus();
    await user.keyboard("{Enter}");
    await user.click(await screen.findByRole("menuitem", { name: "Desvincular" }));
    const dialog = await screen.findByRole("dialog", { name: "¿Desvincular la conversación con La Clementina?" });
    expect(within(dialog).queryByRole("button", { name: "Cerrar" })).not.toBeInTheDocument();
    await user.click(within(dialog).getByRole("button", { name: "Desvincular" }));
    await waitFor(() => expect(unlinked).toBe("link-clementina"));
    await waitFor(() => expect(router.state.location.pathname).toBe("/mensajes"));
  });

  it("en el teléfono la lista lleva a la conversación, con «Seguir en WhatsApp» abajo", async () => {
    asPhone();
    messagesHandlers();
    const { container, user } = mountWhatsApp(whatsappPerson, "/mensajes");
    const row = await screen.findByRole("link", { name: /La Clementina/ });
    expect(await axe(container)).toHaveNoViolations();
    await user.click(row);
    expect(await screen.findByRole("log", { name: "Mensajes con La Clementina" })).toBeVisible();
    expect(screen.getByRole("link", { name: "Seguir en WhatsApp" })).toBeVisible();
    expect(screen.getByRole("link", { name: "Volver a Mensajes" })).toBeVisible();
  });

  // KAN-28: «Cargar más» en Mensajes de la persona acumula páginas sin reemplazar las primeras 100.
  it("cargar más acumula las 150 conversaciones personales sin reemplazar las primeras", async () => {
    const allConversations: PersonalWhatsAppConversationResponse[] = Array.from({ length: 150 }, (_, index) => {
      const number = index + 1;
      return { ...clementina, id: `link-${number}`, organizationName: `Organización ${number}`, lastMessageAtUtc: isoMinute(150 - number) };
    });
    server.use(
      http.get(base, ({ request }) => HttpResponse.json(slicePage(allConversations, request.url))),
      http.get(`${base}/:id`, ({ params }) => {
        const found = allConversations.find((item) => item.id === params.id) ?? allConversations[0];
        return HttpResponse.json({ conversation: found, messages: paged(messages) });
      }),
    );
    const { user } = mountWhatsApp(whatsappPerson, "/mensajes");
    const ul = await screen.findByRole("list", { name: "Conversaciones con organizaciones" });
    await waitFor(() => expect(within(ul).getAllByRole("listitem")).toHaveLength(50));

    await user.click(screen.getByRole("button", { name: "Cargar más" }));
    await waitFor(() => expect(within(ul).getAllByRole("listitem")).toHaveLength(100));
    await user.click(screen.getByRole("button", { name: "Cargar más" }));
    await waitFor(() => expect(within(ul).getAllByRole("listitem")).toHaveLength(150));
    expect(within(ul).getByText("Organización 1")).toBeVisible();
    expect(within(ul).getByText("Organización 150")).toBeVisible();
    expect(screen.queryByRole("button", { name: "Cargar más" })).not.toBeInTheDocument();
  });

  // KAN-28: el hilo de Mensajes personales también acumula más allá de 100 mensajes.
  it("ver mensajes anteriores en Mensajes personales llega a los 150 mensajes sin tope en 100", async () => {
    const allMessages: WhatsAppChatMessageResponse[] = Array.from({ length: 150 }, (_, index) => {
      const number = 150 - index;
      return { ...messages[0], id: `pm-${number}`, text: `Mensaje ${number}`, createdAtUtc: isoMinute(number - 1) };
    });
    server.use(
      http.get(base, () => HttpResponse.json(paged([clementina]))),
      http.get(`${base}/:id`, ({ request }) =>
        HttpResponse.json({ conversation: clementina, messages: slicePage(allMessages, request.url) })),
    );
    const { user } = mountWhatsApp(whatsappPerson, "/mensajes");
    const log = await screen.findByRole("log", { name: "Mensajes con La Clementina" });
    expect(await within(log).findByText("Mensaje 150")).toBeVisible();
    expect(within(log).queryByText("Mensaje 1")).not.toBeInTheDocument();

    await user.click(within(log).getByRole("button", { name: "Ver mensajes anteriores" }));
    expect(await within(log).findByText("Mensaje 51")).toBeVisible();
    await user.click(within(log).getByRole("button", { name: "Ver mensajes anteriores" }));
    const oldest = await within(log).findByText("Mensaje 1");
    const newest = within(log).getByText("Mensaje 150");
    expect(oldest.compareDocumentPosition(newest) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(within(log).queryByRole("button", { name: "Ver mensajes anteriores" })).not.toBeInTheDocument();
  });
});
