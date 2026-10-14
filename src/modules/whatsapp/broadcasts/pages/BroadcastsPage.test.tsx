import { screen, waitFor, within } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import { server } from "@/test/mocks/server";
import { asPhone } from "@/test/utils/phone";
import { mountWhatsApp, whatsappMember, whatsappOwner } from "../../test/support";
import { frameHandlers, paged, scheduled, sent } from "../test/fixtures";

beforeAll(async () => { await import("./BroadcastsPage"); await import("./BroadcastPage"); });
beforeEach(() => frameHandlers());
afterEach(() => vi.unstubAllGlobals());

const list = (items = [sent, scheduled], programmed = 1) => ({ broadcasts: paged(items), scheduled: programmed });

describe("Difusiones", () => {
  it("muestra cuántas hay y cuántas están programadas, con la plantilla, a quiénes y sus resultados", async () => {
    server.use(http.get("/api/organization/whatsapp/broadcasts", () => HttpResponse.json(list())));
    const { container } = mountWhatsApp(whatsappOwner, "/org/whatsapp/difusiones");
    expect(await screen.findByRole("heading", { level: 1, name: "Difusiones" })).toBeVisible();
    expect(await screen.findByText("2 difusiones")).toBeVisible();
    expect(screen.getByText("1 programada")).toBeVisible();
    expect(screen.getByRole("link", { name: "20 % en empanadas" })).toHaveAttribute("href", "/org/whatsapp/difusiones/broadcast-sent");
    expect(screen.getByText("Plantilla «Promo semanal»")).toBeVisible();
    expect(screen.getByText("Todos los que aceptan")).toBeVisible();
    expect(screen.getByText("118 entregados · 86 leídos")).toBeVisible();
    expect(screen.getByRole("link", { name: "Nueva difusión" })).toHaveAttribute("href", "/org/whatsapp/difusiones/nueva");
    expect(await axe(container)).toHaveNoViolations();
  });

  it("el filtro «Estado» va a la URL y a la consulta", async () => {
    const requests: URL[] = [];
    server.use(http.get("/api/organization/whatsapp/broadcasts", ({ request }) => { requests.push(new URL(request.url)); return HttpResponse.json(list()); }));
    const { router, user } = mountWhatsApp(whatsappOwner, "/org/whatsapp/difusiones");
    (await screen.findByRole("button", { name: "Estado: todos" })).focus();
    await user.keyboard("{Enter}");
    await user.click(await screen.findByRole("menuitemradio", { name: "Programada" }));
    await waitFor(() => expect(router.state.location.search).toContain("status=Scheduled"));
    await waitFor(() => expect(requests.at(-1)?.searchParams.get("status")).toBe("Scheduled"));
    expect(requests.at(-1)?.searchParams.has("sort")).toBe(false);
  });

  it("sin «Mandar difusiones» no se ve", async () => {
    const broadcasts = vi.fn(() => HttpResponse.json(list()));
    server.use(http.get("/api/organization/whatsapp/broadcasts", broadcasts));
    mountWhatsApp(whatsappMember("whatsapp.customers"), "/org/whatsapp/difusiones");
    expect(await screen.findByRole("heading", { name: "No tenés permiso para ver esta página" })).toBeVisible();
    expect(broadcasts).not.toHaveBeenCalled();
  });

  it("cancelar una programada manda su versión y un 409 se avisa con el texto del back", async () => {
    const sentBodies: unknown[] = [];
    server.use(
      http.get("/api/organization/whatsapp/broadcasts", () => HttpResponse.json(list())),
      http.post("/api/organization/whatsapp/broadcasts/broadcast-scheduled/cancel", async ({ request }) => {
        sentBodies.push(await request.json());
        return HttpResponse.json({ status: 409, code: "WhatsApp.Broadcast.NotCancellable", detail: "Esta difusión ya empezó a salir y no se puede cancelar." }, { status: 409 });
      }),
    );
    const { user } = mountWhatsApp(whatsappOwner, "/org/whatsapp/difusiones");
    // La enviada no se cancela: su ⋮ solo duplica.
    (await screen.findByRole("button", { name: "Acciones de 20 % en empanadas" })).focus();
    await user.keyboard("{Enter}");
    expect(await screen.findByRole("menuitem", { name: "Duplicar" })).toBeVisible();
    expect(screen.queryByRole("menuitem", { name: "Cancelar difusión" })).not.toBeInTheDocument();
    await user.keyboard("{Escape}");

    screen.getByRole("button", { name: "Acciones de Horario de fiestas" }).focus();
    await user.keyboard("{Enter}");
    await user.click(await screen.findByRole("menuitem", { name: "Cancelar difusión" }));
    const dialog = await screen.findByRole("dialog", { name: "¿Cancelar «Horario de fiestas»?" });
    expect(within(dialog).getByText("No se va a mandar a los 48 contactos. Podés duplicarla para programarla de nuevo.")).toBeVisible();
    await user.click(within(dialog).getByRole("button", { name: "Cancelar difusión" }));
    expect(await screen.findByText("Esta difusión ya empezó a salir y no se puede cancelar.")).toBeVisible();
    expect(sentBodies).toEqual([{ version: 7 }]);
  });

  it("a 390 px es la lista de la app con el «+» para crear", async () => {
    asPhone();
    server.use(http.get("/api/organization/whatsapp/broadcasts", () => HttpResponse.json(list([sent], 0))));
    const { container } = mountWhatsApp(whatsappOwner, "/org/whatsapp/difusiones");
    const row = await screen.findByRole("link", { name: /20 % en empanadas/ });
    expect(row).toHaveAttribute("href", "/org/whatsapp/difusiones/broadcast-sent");
    expect(within(row).getByText("Promo semanal · Minorista · 124 contactos")).toBeVisible();
    expect(screen.getByRole("link", { name: "Nueva difusión" })).toHaveAttribute("href", "/org/whatsapp/difusiones/nueva");
    await waitFor(() => expect(screen.queryByText(/programada/)).not.toBeInTheDocument());
    expect(await axe(container)).toHaveNoViolations();
  });
});
