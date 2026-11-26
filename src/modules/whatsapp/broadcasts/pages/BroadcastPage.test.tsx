import { screen, waitFor, within } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import type { CreateWhatsAppBroadcastRequest } from "../../api/types";
import { server } from "@/test/mocks/server";
import { asPhone, cardData } from "@/test/utils/phone";
import { mountWhatsApp, whatsappMember, whatsappOwner } from "../../test/support";
import { sendFailures } from "../../test/sendFailures";
import { frameHandlers, paged, recipients, scheduled, sent } from "../test/fixtures";
import { pickerName } from "@/test/picker";

beforeAll(async () => { await import("./BroadcastPage"); await import("./NewBroadcastPage"); });
beforeEach(() => frameHandlers());
afterEach(() => vi.unstubAllGlobals());

describe("Resultados de una difusión", () => {
  // M-WA-Difusion-Resultados-Base2 (263): en el teléfono cada destinatario es una tarjeta con el número, el estado y el último
  // cambio, cada dato con su nombre; sin nombre, el número es el título y no se repite.
  it("390: cada destinatario es una tarjeta con sus datos nombrados", async () => {
    asPhone();
    server.use(http.get("/api/organization/whatsapp/broadcasts/broadcast-sent", () => HttpResponse.json({ broadcast: sent, recipients: paged(recipients) })));
    mountWhatsApp(whatsappOwner, "/org/whatsapp/difusiones/broadcast-sent");
    const laura = (await screen.findByText("Laura Méndez")).closest("li")!;
    expect(cardData(laura)).toEqual([["Número", "011 15-5555-3378"], ["Estado", "Respondió"], ["Último cambio", "25/09/2026, 10:12"]]);
    const unknown = screen.getByText("011 15-5555-6650").closest("li")!;
    expect(cardData(unknown)).toEqual([["Estado", "No llegó"], ["Último cambio", "25/09/2026, 09:30"]]);
    expect(within(unknown).getByRole("button", { name: "Por qué no llegó" })).toBeVisible();
  });
  it("muestra la banda y los contadores; «No llegó» dice por qué", async () => {
    const requests: URL[] = [];
    server.use(http.get("/api/organization/whatsapp/broadcasts/broadcast-sent", ({ request }) => {
      requests.push(new URL(request.url));
      return HttpResponse.json({ broadcast: sent, recipients: paged(recipients, 124) });
    }));
    const { container, user } = mountWhatsApp(whatsappOwner, "/org/whatsapp/difusiones/broadcast-sent");
    expect(await screen.findByRole("heading", { level: 1, name: "20 % en empanadas" })).toBeVisible();
    // WA-Difusion-Resultados-Base2: «Enviada el 25/09/2026, 09:30», con la hora.
    expect(screen.getByText(/Enviada el 25\/09\/2026, 09:00/)).toBeVisible();
    const counters = screen.getByRole("region", { name: "Resultados" });
    expect(within(counters).getByText("124")).toBeVisible();
    expect(within(counters).getByText("Se dieron de baja")).toBeVisible();
    // Sin destinatarios dudosos, «Sin confirmar» no está entre las cifras (tablero WA-Difusion-Resultados).
    expect(within(counters).queryByText("Sin confirmar")).not.toBeInTheDocument();
    expect(screen.getByText("Laura Méndez")).toBeVisible();
    // Una enviada no se cancela: solo se duplica.
    expect(screen.getByRole("button", { name: "Duplicar" })).toBeVisible();
    expect(screen.queryByRole("button", { name: "Más acciones" })).not.toBeInTheDocument();
    expect(await axe(container)).toHaveNoViolations();

    await user.click(screen.getByRole("button", { name: "Por qué no llegó" }));
    const notice = await screen.findByRole("dialog", { name: "No le llegó a 011 15-5555-6650" });
    expect(within(notice).getByText("WhatsApp no pudo entregarlo a ese número.")).toBeVisible();
    expect(within(notice).getByText("Meta lo informó el 25/09/2026 a las 09:30")).toBeVisible();
    await user.click(within(notice).getByRole("button", { name: "Entendido" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(requests).toHaveLength(1);
  });

  // 0066 §3: «Por qué no llegó» dice el motivo con el texto que manda el back, uno de los ocho.
  it.each(sendFailures)("«Por qué no llegó» dice su motivo: %s", async (_code, reason) => {
    server.use(http.get("/api/organization/whatsapp/broadcasts/broadcast-sent", () =>
      HttpResponse.json({ broadcast: sent, recipients: paged([{ ...recipients[1], failureReason: reason }]) })));
    const { user } = mountWhatsApp(whatsappOwner, "/org/whatsapp/difusiones/broadcast-sent");
    await user.click(await screen.findByRole("button", { name: "Por qué no llegó" }));
    const notice = await screen.findByRole("dialog", { name: "No le llegó a 011 15-5555-6650" });
    expect(within(notice).getByText(reason)).toBeVisible();
  });

  // WA-Difusion-Resultados-Base2 (255): un destinatario «Sin confirmar» lleva su (i), sin «Por qué no llegó».
  it("un destinatario «Sin confirmar» lleva su (i)", async () => {
    server.use(http.get("/api/organization/whatsapp/broadcasts/broadcast-sent", () =>
      HttpResponse.json({ broadcast: sent, recipients: paged([{ ...recipients[0], status: "Uncertain", failureReason: null }]) })));
    const { container, user } = mountWhatsApp(whatsappOwner, "/org/whatsapp/difusiones/broadcast-sent");
    const info = await screen.findByRole("button", { name: "Más información sobre Sin confirmar" });
    expect(screen.getAllByText("Sin confirmar").length).toBeGreaterThan(0);
    expect(screen.queryByRole("button", { name: "Por qué no llegó" })).not.toBeInTheDocument();
    await user.click(info);
    expect(await screen.findByRole("tooltip")).toHaveTextContent("No sabemos si le llegó: WhatsApp no confirmó el envío. No se repite solo, y no cuenta como mandado ni como «No llegó».");
    expect(await axe(container)).toHaveNoViolations();
  });

  // WA-Difusion-Resultados-Base2 y su M- (255): con un destinatario dudoso, «Resultados» suma «Sin confirmar» con su cifra al
  // final; no cuenta como entregado ni como «No llegaron».
  it("«Resultados» suma «Sin confirmar» con su cifra después de «Se dieron de baja»", async () => {
    server.use(http.get("/api/organization/whatsapp/broadcasts/broadcast-sent", () =>
      HttpResponse.json({ broadcast: { ...sent, uncertain: 1 }, recipients: paged(recipients) })));
    const { container } = mountWhatsApp(whatsappOwner, "/org/whatsapp/difusiones/broadcast-sent");
    const counters = await screen.findByRole("region", { name: "Resultados" });
    expect(within(counters).getAllByRole("term").map((term) => term.textContent))
      .toEqual(["Mandados", "Entregados", "Leídos", "Respondieron", "Se dieron de baja", "Sin confirmar"]);
    expect(within(counters).getAllByRole("definition").map((value) => value.textContent)).toEqual(["124", "118", "86", "12", "2", "1"]);
    expect(await axe(container)).toHaveNoViolations();
  });
  it("390: «Sin confirmar» va con su cifra después de «No llegaron»", async () => {
    asPhone();
    server.use(http.get("/api/organization/whatsapp/broadcasts/broadcast-sent", () =>
      HttpResponse.json({ broadcast: { ...sent, uncertain: 1 }, recipients: paged(recipients) })));
    mountWhatsApp(whatsappOwner, "/org/whatsapp/difusiones/broadcast-sent");
    const counters = await screen.findByRole("list", { name: "Resultados" });
    expect(within(counters).getAllByRole("listitem").map((item) => item.textContent))
      .toEqual(["124Mandados", "118Entregados", "86Leídos", "12Respondieron", "2Se dieron de baja", "6No llegaron", "1Sin confirmar"]);
  });

  it("la búsqueda y el filtro de estado van a la URL y a la consulta de los destinatarios", async () => {
    const requests: URL[] = [];
    server.use(http.get("/api/organization/whatsapp/broadcasts/broadcast-sent", ({ request }) => {
      requests.push(new URL(request.url));
      return HttpResponse.json({ broadcast: sent, recipients: paged(recipients, 124) });
    }));
    const { router, user } = mountWhatsApp(whatsappOwner, "/org/whatsapp/difusiones/broadcast-sent");
    (await screen.findByRole("button", { name: "Estado: todos" })).focus();
    await user.keyboard("{Enter}");
    await user.click(await screen.findByRole("option", { name: "No llegó" }));
    await waitFor(() => expect(router.state.location.search).toContain("status=Failed"));
    await waitFor(() => expect(requests.at(-1)?.searchParams.get("status")).toBe("Failed"));
    // CC16: el buscador ya filtra en el back.
    await user.type(screen.getByRole("searchbox", { name: "Buscar por nombre o número" }), "Laura");
    await waitFor(() => expect(requests.at(-1)?.searchParams.get("search")).toBe("Laura"));
    expect(requests.at(-1)?.searchParams.get("status")).toBe("Failed");
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
    expect(await screen.findByText(/Programada para el 20\/12\/2026, 09:00/)).toBeVisible();
    screen.getByRole("button", { name: "Más acciones" }).focus();
    await user.keyboard("{Enter}");
    await user.click(await screen.findByRole("menuitem", { name: "Cancelar difusión" }));
    const dialog = await screen.findByRole("dialog", { name: "¿Cancelar «Horario de fiestas»?" });
    await user.click(within(dialog).getByRole("button", { name: "Cancelar difusión" }));
    expect(await screen.findByText("Esta difusión ya empezó a salir y no se puede cancelar.")).toBeVisible();
    expect(bodies).toEqual([{ version: 7 }]);
  });

  it("duplicar abre Nueva difusión con los datos de la original y crea con el alta de siempre; a 390 px va en el ⋮", async () => {
    asPhone();
    const bodies: CreateWhatsAppBroadcastRequest[] = [];
    const keys: (string | null)[] = [];
    const promo = { templateId: "template-promo", name: "Promo semanal", category: "Marketing", body: "Esta semana, 20 % en empanadas.", variables: [], estimatedCost: { amount: 0.06, currency: "ARS" } };
    server.use(
      http.get("/api/organization/whatsapp/broadcasts/broadcast-sent", () => HttpResponse.json({ broadcast: sent, recipients: paged(recipients) })),
      http.get("/api/organization/whatsapp/broadcasts/template-options", ({ request }) =>
        HttpResponse.json(paged(new URL(request.url).searchParams.get("search") === "Promo semanal" ? [promo] : []))),
      http.get("/api/organization/whatsapp/broadcasts/tags", () => HttpResponse.json(paged(["Minorista"]))),
      http.get("/api/organization/whatsapp/broadcasts/estimate", () => HttpResponse.json({ recipients: 124, estimatedCost: { amount: 7.66, currency: "ARS" }, country: "AR" })),
      http.post("/api/organization/whatsapp/broadcasts", async ({ request }) => {
        bodies.push(await request.json() as CreateWhatsAppBroadcastRequest);
        keys.push(request.headers.get("Idempotency-Key"));
        return HttpResponse.json({ ...sent, id: "broadcast-copy", status: "Sending" }, { status: 201 });
      }),
      http.get("/api/organization/whatsapp/broadcasts/broadcast-copy", () => HttpResponse.json({ broadcast: { ...sent, id: "broadcast-copy" }, recipients: paged([]) })),
    );
    const { container, router, user } = mountWhatsApp(whatsappOwner, "/org/whatsapp/difusiones/broadcast-sent");
    expect(await screen.findByRole("list", { name: "Resultados" })).toBeVisible();
    expect(screen.getByText("No llegaron")).toBeVisible();
    expect(await axe(container)).toHaveNoViolations();
    screen.getByRole("button", { name: "Acciones de la difusión" }).focus();
    await user.keyboard("{Enter}");
    await user.click(await screen.findByRole("menuitem", { name: "Duplicar" }));

    await waitFor(() => expect(`${router.state.location.pathname}${router.state.location.search}`).toBe("/org/whatsapp/difusiones/nueva?desde=broadcast-sent"));
    expect(await screen.findByDisplayValue("20 % en empanadas")).toBeVisible();
    expect(screen.getByRole("button", { name: pickerName("Plantilla") })).toHaveTextContent("Promo semanal · Marketing");
    expect(screen.getByRole("button", { name: pickerName("Destinatarios") })).toHaveAccessibleName("Destinatarios Una etiqueta");
    expect(screen.getByRole("button", { name: pickerName("Etiqueta") })).toHaveTextContent("Minorista");
    await user.click(screen.getByRole("button", { name: "Mandar" }));
    const dialog = await screen.findByRole("dialog", { name: "¿Mandar «20 % en empanadas»?" });
    await user.click(within(dialog).getByRole("button", { name: "Mandar" }));
    await waitFor(() => expect(router.state.location.pathname).toBe("/org/whatsapp/difusiones/broadcast-copy"));
    expect(bodies).toEqual([{ name: "20 % en empanadas", templateId: "template-promo", variables: [], audience: { kind: "Tag", tag: "Minorista" }, scheduledAtUtc: null }]);
    expect(keys[0]).toBeTruthy();
  });
});
