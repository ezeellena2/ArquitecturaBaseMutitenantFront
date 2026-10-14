import { screen, waitFor, within } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import { server } from "@/test/mocks/server";
import { asPhone } from "@/test/utils/phone";
import { mountWhatsApp, whatsappMember, whatsappOwner } from "../../test/support";
import { frameHandlers, paged, recipients, scheduled, sent } from "../test/fixtures";

beforeAll(async () => { await import("./BroadcastPage"); });
beforeEach(() => frameHandlers());
afterEach(() => vi.unstubAllGlobals());

describe("Resultados de una difusión", () => {
  it("muestra la banda y los contadores; «No llegó» dice por qué", async () => {
    const requests: URL[] = [];
    server.use(http.get("/api/organization/whatsapp/broadcasts/broadcast-sent", ({ request }) => {
      requests.push(new URL(request.url));
      return HttpResponse.json({ broadcast: sent, recipients: paged(recipients, 124) });
    }));
    const { container, user } = mountWhatsApp(whatsappOwner, "/org/whatsapp/difusiones/broadcast-sent");
    expect(await screen.findByRole("heading", { level: 1, name: "20 % en empanadas" })).toBeVisible();
    expect(screen.getByText(/Enviada el 25\/09\/2026/)).toBeVisible();
    const counters = screen.getByRole("region", { name: "Resultados" });
    expect(within(counters).getByText("124")).toBeVisible();
    expect(within(counters).getByText("Se dieron de baja")).toBeVisible();
    expect(screen.getByText("Laura Méndez")).toBeVisible();
    // Una enviada no se cancela: solo se duplica.
    expect(screen.getByRole("button", { name: "Duplicar" })).toBeVisible();
    expect(screen.queryByRole("button", { name: "Más acciones" })).not.toBeInTheDocument();
    expect(await axe(container)).toHaveNoViolations();

    await user.click(screen.getByRole("button", { name: "Por qué no llegó" }));
    const notice = await screen.findByRole("dialog", { name: "No le llegó a 011 15-5555-6650" });
    expect(within(notice).getByText("Ese número no tiene WhatsApp")).toBeVisible();
    expect(within(notice).getByText("Meta lo informó el 25/09/2026 a las 09:30")).toBeVisible();
    await user.click(within(notice).getByRole("button", { name: "Entendido" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(requests).toHaveLength(1);
  });

  it("el filtro de estado va a la URL y a la consulta", async () => {
    const requests: URL[] = [];
    server.use(http.get("/api/organization/whatsapp/broadcasts/broadcast-sent", ({ request }) => {
      requests.push(new URL(request.url));
      return HttpResponse.json({ broadcast: sent, recipients: paged(recipients, 124) });
    }));
    const { router, user } = mountWhatsApp(whatsappOwner, "/org/whatsapp/difusiones/broadcast-sent");
    (await screen.findByRole("button", { name: "Estado: todos" })).focus();
    await user.keyboard("{Enter}");
    await user.click(await screen.findByRole("menuitemradio", { name: "No llegó" }));
    await waitFor(() => expect(router.state.location.search).toContain("status=Failed"));
    await waitFor(() => expect(requests.at(-1)?.searchParams.get("status")).toBe("Failed"));
  });

  it("cancelar una programada desde el ⋮ manda su versión y un 409 se avisa", async () => {
    const bodies: unknown[] = [];
    server.use(
      http.get("/api/organization/whatsapp/broadcasts/broadcast-scheduled", () => HttpResponse.json({ broadcast: scheduled, recipients: paged([]) })),
      http.post("/api/organization/whatsapp/broadcasts/broadcast-scheduled/cancel", async ({ request }) => {
        bodies.push(await request.json());
        return HttpResponse.json({ status: 409, code: "WhatsApp.Broadcast.NotCancellable", detail: "Esta difusión ya empezó a salir y no se puede cancelar." }, { status: 409 });
      }),
    );
    const { user } = mountWhatsApp(whatsappMember("whatsapp.broadcasts"), "/org/whatsapp/difusiones/broadcast-scheduled");
    expect(await screen.findByText(/Programada para el 20\/12\/2026 09:00/)).toBeVisible();
    screen.getByRole("button", { name: "Más acciones" }).focus();
    await user.keyboard("{Enter}");
    await user.click(await screen.findByRole("menuitem", { name: "Cancelar difusión" }));
    const dialog = await screen.findByRole("dialog", { name: "¿Cancelar «Horario de fiestas»?" });
    await user.click(within(dialog).getByRole("button", { name: "Cancelar difusión" }));
    expect(await screen.findByText("Esta difusión ya empezó a salir y no se puede cancelar.")).toBeVisible();
    expect(bodies).toEqual([{ version: 7 }]);
  });

  it("duplicar es un alta idempotente que lleva a la copia; a 390 px va en el ⋮ de la barra", async () => {
    asPhone();
    const keys: (string | null)[] = [];
    const copy = { ...scheduled, id: "broadcast-copy", name: "Horario de fiestas (copia)" };
    server.use(
      http.get("/api/organization/whatsapp/broadcasts/broadcast-sent", () => HttpResponse.json({ broadcast: sent, recipients: paged(recipients) })),
      http.get("/api/organization/whatsapp/broadcasts/broadcast-copy", () => HttpResponse.json({ broadcast: copy, recipients: paged([]) })),
      http.get("/api/organization/whatsapp/broadcasts", () => HttpResponse.json({ broadcasts: paged([sent, copy]), scheduled: 1 })),
      http.post("/api/organization/whatsapp/broadcasts/broadcast-sent/duplicate", ({ request }) => {
        keys.push(request.headers.get("Idempotency-Key"));
        return HttpResponse.json(copy, { status: 201 });
      }),
    );
    const { container, router, user } = mountWhatsApp(whatsappOwner, "/org/whatsapp/difusiones/broadcast-sent");
    expect(await screen.findByRole("list", { name: "Resultados" })).toBeVisible();
    expect(screen.getByText("No llegaron")).toBeVisible();
    expect(await axe(container)).toHaveNoViolations();
    screen.getByRole("button", { name: "Acciones de la difusión" }).focus();
    await user.keyboard("{Enter}");
    await user.click(await screen.findByRole("menuitem", { name: "Duplicar" }));
    await waitFor(() => expect(router.state.location.pathname).toBe("/org/whatsapp/difusiones/broadcast-copy"));
    expect(keys).toHaveLength(1);
    expect(keys[0]).toBeTruthy();
  });
});
