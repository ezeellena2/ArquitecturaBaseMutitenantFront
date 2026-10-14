import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import type { CreateWhatsAppBroadcastRequest } from "../../api/types";
import { server } from "@/test/mocks/server";
import { asPhone } from "@/test/utils/phone";
import { mountWhatsApp, whatsappOwner } from "../../test/support";
import { frameHandlers, paged, promoTemplate, scheduled } from "../test/fixtures";

beforeAll(async () => { await import("./NewBroadcastPage"); await import("./BroadcastPage"); });
afterEach(() => vi.unstubAllGlobals());

let estimates: URL[] = [];
beforeEach(() => {
  frameHandlers();
  estimates = [];
  server.use(
    http.get("/api/organization/whatsapp/broadcasts/template-options", () => HttpResponse.json(paged([promoTemplate]))),
    http.get("/api/organization/whatsapp/broadcasts/tags", () => HttpResponse.json(paged(["Mayorista", "Minorista"]))),
    // El back dice cuántos aceptan y cuánto cuesta: 48 × 0,06 no es 2,97, y el front muestra lo que llega.
    http.get("/api/organization/whatsapp/broadcasts/estimate", ({ request }) => {
      const url = new URL(request.url);
      estimates.push(url);
      return HttpResponse.json(url.searchParams.get("kind") === "Tag"
        ? { recipients: 48, estimatedCost: { amount: 2.97, currency: "ARS" } }
        : { recipients: 312, estimatedCost: { amount: 19.28, currency: "ARS" } });
    }),
  );
});

describe("Nueva difusión", () => {
  it("pide la estimación con la audiencia elegida y muestra el costo tal como llega, sin calcularlo", async () => {
    const { user, container } = mountWhatsApp(whatsappOwner, "/org/whatsapp/difusiones/nueva");
    expect(await screen.findByRole("heading", { level: 1, name: "Nueva difusión" })).toBeVisible();
    await user.type(await screen.findByLabelText(/^Nombre/, { selector: "input[name=name]" }), "Horario de fiestas");
    await user.click(screen.getByRole("combobox", { name: /Plantilla/ }));
    await user.click(await screen.findByRole("option", { name: "Aviso de horario · Marketing" }));
    await user.type(await screen.findByLabelText(/^Nombre/, { selector: "input[name='variables.0']" }), "Martina");
    expect(await screen.findByText(/Hola Martina, el 24 y el 31 atendemos de 9 a 13\./)).toBeVisible();
    expect(await screen.findByText("312 contactos")).toBeVisible();
    expect(estimates.at(-1)?.searchParams.get("kind")).toBe("AllAccepting");
    expect(estimates.at(-1)?.searchParams.has("tag")).toBe(false);

    await user.click(screen.getByRole("radio", { name: "Una etiqueta" }));
    await user.click(screen.getByRole("combobox", { name: /Etiqueta/ }));
    await user.click(await screen.findByRole("option", { name: "Mayorista" }));
    expect(await screen.findByText("48 contactos")).toBeVisible();
    expect(screen.getByText("Tienen la etiqueta «Mayorista» y aceptan promociones")).toBeVisible();
    expect(screen.getByText("$ 2,97")).toBeVisible();
    expect(estimates.at(-1)?.searchParams.get("templateId")).toBe("template-hours");
    expect(estimates.at(-1)?.searchParams.get("tag")).toBe("Mayorista");
    expect(await axe(container)).toHaveNoViolations();
  });

  it("programar confirma con la zona de la cuenta y un reintento sin conexión manda la misma clave", async () => {
    const bodies: CreateWhatsAppBroadcastRequest[] = [];
    const keys: (string | null)[] = [];
    server.use(
      http.post("/api/organization/whatsapp/broadcasts", async ({ request }) => {
        bodies.push(await request.json() as CreateWhatsAppBroadcastRequest);
        keys.push(request.headers.get("Idempotency-Key"));
        return bodies.length === 1 ? HttpResponse.error() : HttpResponse.json({ ...scheduled, id: "broadcast-new" }, { status: 201 });
      }),
      http.get("/api/organization/whatsapp/broadcasts/broadcast-new", () => HttpResponse.json({ broadcast: { ...scheduled, id: "broadcast-new" }, recipients: paged([]) })),
    );
    const app = mountWhatsApp(whatsappOwner, "/org/whatsapp/difusiones/nueva");
    const { user } = app;
    fireEvent.change(await screen.findByLabelText(/^Nombre/, { selector: "input[name=name]" }), { target: { value: "Horario de fiestas" } });
    await user.click(screen.getByRole("combobox", { name: /Plantilla/ }));
    await user.click(await screen.findByRole("option", { name: "Aviso de horario · Marketing" }));
    fireEvent.change(await screen.findByLabelText(/^Nombre/, { selector: "input[name='variables.0']" }), { target: { value: "Martina" } });
    await user.click(screen.getByRole("radio", { name: "Programar" }));
    fireEvent.change(await screen.findByRole("textbox", { name: /Fecha y hora/ }), { target: { value: "20/12/2026 09:00" } });
    await screen.findByText("312 contactos");
    await user.click(screen.getByRole("button", { name: "Programar" }));

    const dialog = await screen.findByRole("dialog", { name: "¿Programar «Horario de fiestas»?" });
    expect(within(dialog).getByText("20/12/2026 a las 09:00, hora de Buenos Aires (GMT−3)")).toBeVisible();
    expect(within(dialog).getByText("312 contactos que aceptan promociones")).toBeVisible();
    expect(within(dialog).getByText("$ 19,28")).toBeVisible();
    await user.click(within(dialog).getByRole("button", { name: "Programar" }));
    fireEvent.click(await screen.findByRole("button", { name: "Reintentar" }));
    await waitFor(() => expect(app.router.state.location.pathname).toBe("/org/whatsapp/difusiones/broadcast-new"));
    expect(bodies).toHaveLength(2);
    expect(bodies[0]).toEqual({ name: "Horario de fiestas", templateId: "template-hours", variables: ["Martina"],
      audience: { kind: "AllAccepting", tag: null }, scheduledAtUtc: "2026-12-20T12:00:00Z" });
    expect(keys[1]).toBe(keys[0]);
  });

  it("si nadie acepta, el rechazo del back queda en «Destinatarios»", async () => {
    server.use(http.post("/api/organization/whatsapp/broadcasts", () => HttpResponse.json(
      { status: 400, code: "WhatsApp.Broadcast.NoRecipients", detail: "Ningún contacto con esa etiqueta acepta promociones." }, { status: 400 })));
    const { user } = mountWhatsApp(whatsappOwner, "/org/whatsapp/difusiones/nueva");
    fireEvent.change(await screen.findByLabelText(/^Nombre/, { selector: "input[name=name]" }), { target: { value: "Horario de fiestas" } });
    await user.click(screen.getByRole("combobox", { name: /Plantilla/ }));
    await user.click(await screen.findByRole("option", { name: "Aviso de horario · Marketing" }));
    fireEvent.change(await screen.findByLabelText(/^Nombre/, { selector: "input[name='variables.0']" }), { target: { value: "Martina" } });
    await user.click(screen.getByRole("button", { name: "Mandar" }));
    const dialog = await screen.findByRole("dialog", { name: "¿Mandar «Horario de fiestas»?" });
    expect(within(dialog).getByText("Ahora")).toBeVisible();
    await user.click(within(dialog).getByRole("button", { name: "Mandar" }));
    expect(await screen.findByText("Ningún contacto con esa etiqueta acepta promociones.")).toBeVisible();
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(screen.getByRole("radiogroup", { name: "Destinatarios" })).toHaveAttribute("aria-invalid", "true");
  });

  it("a 390 px el costo va abajo, junto a «Mandar»", async () => {
    asPhone();
    const { container, user } = mountWhatsApp(whatsappOwner, "/org/whatsapp/difusiones/nueva");
    await user.click(await screen.findByRole("combobox", { name: /Plantilla/ }));
    await user.click(await screen.findByRole("option", { name: "Aviso de horario · Marketing" }));
    expect(await screen.findByText(/312 contactos/)).toBeVisible();
    expect(screen.getByRole("radio", { name: "Los que aceptan" })).toBeChecked();
    expect(screen.getByRole("button", { name: "Mandar" })).toBeVisible();
    expect(await axe(container)).toHaveNoViolations();
  });
});

