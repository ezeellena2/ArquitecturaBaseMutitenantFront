import { screen, waitFor, within } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import type { UpdateWhatsAppContactRequest, WhatsAppContactResponse } from "../../api/types";
import { server } from "@/test/mocks/server";
import { asPhone } from "@/test/utils/phone";
import { mountWhatsApp, whatsappOwner } from "../../test/support";
import { frameHandlers, martina, paged } from "../test/fixtures";

beforeAll(async () => { await import("./ContactPage"); });
afterEach(() => vi.unstubAllGlobals());

const conversations = paged([
  { conversationId: "conversation-2", startedAtUtc: "2026-10-01T12:00:00Z", team: { id: "team-sales", name: "Ventas" }, assignee: { id: "member-1", name: "Lucía Fernández" }, messageCount: 8 },
  { conversationId: "conversation-1", startedAtUtc: "2026-09-12T13:00:00Z", team: { id: "team-support", name: "Soporte" }, assignee: null, messageCount: 9 },
]);
const broadcasts = paged([{ broadcastId: "broadcast-1", name: "20 % en empanadas", sentAtUtc: "2026-09-25T12:00:00Z", status: "Read" }], 3);

function contactApi(contact: () => WhatsAppContactResponse) {
  server.use(
    http.get("/api/organization/whatsapp/contacts/contact-martina", () => HttpResponse.json(contact())),
    http.get("/api/organization/whatsapp/contacts/contact-martina/conversations", () => HttpResponse.json(conversations)),
    http.get("/api/organization/whatsapp/contacts/contact-martina/broadcasts", () => HttpResponse.json(broadcasts)),
  );
}

beforeEach(() => frameHandlers());

describe("Ficha del contacto", () => {
  it("muestra el número, el vínculo y el consentimiento en la banda y sus dos grupos con la cantidad", async () => {
    contactApi(() => martina);
    const { container, user } = mountWhatsApp(whatsappOwner, "/org/whatsapp/contactos/contact-martina");
    expect(await screen.findByRole("heading", { level: 1, name: "Martina López" })).toBeVisible();
    expect(screen.getByText(/Vinculado a su cuenta/)).toBeVisible();
    expect(screen.getByText(/Acepta promociones/)).toBeVisible();
    const tabs = screen.getByRole("tablist", { name: "Datos del contacto" });
    expect(await within(tabs).findByRole("tab", { name: /Conversaciones\s*2/ })).toBeVisible();
    expect(within(tabs).getByRole("tab", { name: /Difusiones\s*3/ })).toBeVisible();
    expect(await screen.findByRole("link", { name: "Abrir chat" })).toHaveAttribute("href", "/org/whatsapp/chats/conversation-2");
    expect(screen.getByText("Ventas")).toBeVisible();
    expect(await axe(container)).toHaveNoViolations();
    await user.click(within(tabs).getByRole("tab", { name: /Difusiones/ }));
    expect(await screen.findByRole("link", { name: "20 % en empanadas" })).toHaveAttribute("href", "/org/whatsapp/difusiones/broadcast-1");
  });

  it("al editar manda la versión y un 409 queda en el diálogo; al cerrarlo se relee la ficha", async () => {
    const sent: UpdateWhatsAppContactRequest[] = [];
    let reads = 0;
    contactApi(() => { reads++; return martina; });
    server.use(http.put("/api/organization/whatsapp/contacts/contact-martina", async ({ request }) => {
      sent.push(await request.json() as UpdateWhatsAppContactRequest);
      return HttpResponse.json({ status: 409, code: "General.ConcurrencyConflict", detail: "Alguien cambió este contacto mientras lo editabas." }, { status: 409 });
    }));
    const { user } = mountWhatsApp(whatsappOwner, "/org/whatsapp/contactos/contact-martina");
    await user.click(await screen.findByRole("button", { name: "Editar contacto" }));
    const dialog = await screen.findByRole("dialog", { name: "Editar contacto" });
    const save = within(dialog).getByRole("button", { name: "Guardar cambios" });
    expect(save).toBeDisabled();
    await user.clear(within(dialog).getByRole("textbox", { name: /Nombre/ }));
    await user.type(within(dialog).getByRole("textbox", { name: /Nombre/ }), "Martina L.");
    await user.click(within(dialog).getByRole("radio", { name: "No acepta" }));
    expect(await axe(dialog)).toHaveNoViolations();
    await user.click(save);

    expect(await within(dialog).findByText("Alguien cambió este contacto mientras lo editabas.")).toBeVisible();
    expect(sent).toEqual([{ name: "Martina L.", tags: ["Mayorista"], consent: "Declined", version: 4 }]);
    const before = reads;
    await user.click(within(dialog).getByRole("button", { name: "Cancelar" }));
    await waitFor(() => expect(reads).toBeGreaterThan(before));
  });

  // Decisión del usuario (E11): una etiqueta nueva se crea al editar el contacto; si ya existe sin distinguir mayúsculas,
  // se elige la que existe.
  it("crea una etiqueta nueva que va en el PUT; con «VIP» existente, «vip» no ofrece crear", async () => {
    const sent: UpdateWhatsAppContactRequest[] = [];
    contactApi(() => martina);
    server.use(
      http.get("/api/organization/whatsapp/contacts/tags", ({ request }) => {
        const search = (new URL(request.url).searchParams.get("search") ?? "").toLowerCase();
        return HttpResponse.json(paged(["Mayorista", "VIP"].filter((tag) => tag.toLowerCase().includes(search))));
      }),
      http.put("/api/organization/whatsapp/contacts/contact-martina", async ({ request }) => {
        sent.push(await request.json() as UpdateWhatsAppContactRequest);
        return HttpResponse.json({ ...martina, tags: ["Mayorista", "VIP Oro"], version: 5 });
      }),
    );
    const { user } = mountWhatsApp(whatsappOwner, "/org/whatsapp/contactos/contact-martina");
    await user.click(await screen.findByRole("button", { name: "Editar contacto" }));
    const dialog = await screen.findByRole("dialog", { name: "Editar contacto" });
    await user.click(within(dialog).getByRole("button", { name: /Etiquetas/ }));
    const search = await screen.findByRole("searchbox", { name: "Buscar" });

    await user.type(search, "vip");
    expect(await screen.findByRole("menuitemcheckbox", { name: "VIP" })).toBeVisible();
    expect(screen.queryByRole("menuitem", { name: /^Crear/ })).not.toBeInTheDocument();

    await user.clear(search);
    await user.type(search, "VIP Oro");
    await user.click(await screen.findByRole("menuitem", { name: "Crear «VIP Oro»" }));
    expect(screen.getByRole("menuitemcheckbox", { name: "VIP Oro" })).toHaveAttribute("aria-checked", "true");
    await user.keyboard("{Escape}");
    await user.click(within(dialog).getByRole("button", { name: "Guardar cambios" }));
    await waitFor(() => expect(sent).toHaveLength(1));
    expect(sent[0]).toMatchObject({ tags: ["Mayorista", "VIP Oro"], version: 4 });
  });

  it("a 390 px «Abrir chat» va abajo y «Editar contacto», en el ⋮ de la barra", async () => {
    asPhone();
    contactApi(() => ({ ...martina, linkedToAccount: false }));
    const { container, user } = mountWhatsApp(whatsappOwner, "/org/whatsapp/contactos/contact-martina");
    expect(await screen.findByRole("link", { name: "Abrir chat" })).toBeVisible();
    expect(screen.queryByText(/Vinculado a su cuenta/)).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Editar contacto" })).not.toBeInTheDocument();
    expect(await axe(container)).toHaveNoViolations();
    screen.getByRole("button", { name: "Acciones de Martina López" }).focus();
    await user.keyboard("{Enter}");
    await user.click(await screen.findByRole("menuitem", { name: "Editar contacto" }));
    expect(await screen.findByRole("dialog", { name: "Editar contacto" })).toBeVisible();
  });
});
