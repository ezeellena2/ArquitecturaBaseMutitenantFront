import { screen, waitFor, within } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import { server } from "@/test/mocks/server";
import { asPhone } from "@/test/utils/phone";
import type { WhatsAppTemplateResponse } from "../../api/types";
import { mountWhatsApp, whatsappMember, whatsappOperator, whatsappOwner } from "../../test/support";

const page = <T,>(items: T[]) => ({ items, page: 1, pageSize: 10, totalCount: items.length, totalPages: 1, hasPrevious: false, hasNext: false });
const template = (values: Partial<WhatsAppTemplateResponse>): WhatsAppTemplateResponse => ({
  id: "template-1", name: "Pedido listo", category: "Utility", languages: [{ culture: "es-AR", category: "Utility" }], body: "Hola {{1}}", variables: [{ label: "nombre", example: "Ana" }], status: "Approved",
  isSystem: false, updatedAtUtc: "2026-09-20T15:00:00Z", version: 2, ...values,
});
const ready = template({});
const promo = template({ id: "template-2", name: "Promo semanal", category: "Marketing", status: "Rejected", rejectionReason: "El formato no cumple las reglas de Meta", updatedAtUtc: "2026-09-29T15:00:00Z" });
const news = template({ id: "template-3", name: "Novedades", category: "Marketing", status: "Pending" });

beforeAll(async () => { await import("./TemplatesPage"); });
beforeEach(() => {
  server.use(
    http.get("/api/organization/whatsapp/untaken", () => HttpResponse.json({ customers: 0, internal: 0 })),
    http.get("/api/platform/whatsapp/conversations", () => HttpResponse.json({ conversations: page([]), counts: { customers: 0, internal: 0, untaken: 0 } })),
    http.get("/api/organization/whatsapp/templates", () => HttpResponse.json({ templates: page([ready, news, promo]), approved: 1 })),
  );
});
afterEach(() => vi.unstubAllGlobals());

async function openActions(user: ReturnType<typeof mountWhatsApp>["user"], name: string) {
  (await screen.findByRole("button", { name: `Acciones de ${name}` })).focus();
  await user.keyboard("{Enter}");
}

describe("Plantillas de la organización", () => {
  it("lista el estado en Meta con el resumen del back, y el motivo del rechazo va detrás del ⓘ", async () => {
    const { user, container } = mountWhatsApp(whatsappOwner, "/org/whatsapp/plantillas");
    expect(await screen.findByText("Pedido listo")).toBeVisible();
    expect(screen.getByText("3 plantillas · 1 aprobada")).toBeVisible();
    expect(screen.getByText("En revisión")).toBeVisible();
    expect(screen.getAllByText("Español (Argentina)")).toHaveLength(3);
    expect(screen.queryByText("El formato no cumple las reglas de Meta")).not.toBeInTheDocument();
    expect(await axe(container)).toHaveNoViolations();

    await user.click(screen.getByRole("button", { name: "Por qué la rechazó Meta" }));
    const notice = await screen.findByRole("dialog", { name: "Meta rechazó «Promo semanal»" });
    expect(within(notice).getByText("El formato no cumple las reglas de Meta")).toBeVisible();
    expect(within(notice).getByText("Revisada el 29/09/2026")).toBeVisible();
    expect(within(notice).getByText("Duplicala y corregí el texto")).toBeVisible();
  });

  it("una aprobada no se edita: «Duplicar» abre «Nueva plantilla» con sus datos y crea otra", async () => {
    const bodies: unknown[] = [];
    const keys: (string | null)[] = [];
    server.use(http.post("/api/organization/whatsapp/templates", async ({ request }) => {
      bodies.push(await request.json());
      keys.push(request.headers.get("Idempotency-Key"));
      return HttpResponse.json(template({ id: "template-9", name: "Pedido listo_2", status: "Pending" }), { status: 201 });
    }));
    const { user } = mountWhatsApp(whatsappOwner, "/org/whatsapp/plantillas");
    await openActions(user, "Pedido listo");
    const menu = await screen.findByRole("menu");
    expect(within(menu).queryByRole("menuitem", { name: /Editar/ })).not.toBeInTheDocument();
    await user.click(within(menu).getByRole("menuitem", { name: "Duplicar" }));
    const dialog = await screen.findByRole("dialog", { name: "Nueva plantilla" });
    // El nombre propuesto lleva «_2»; si ya terminara en «_N», el número siguiente.
    expect(within(dialog).getByRole("textbox", { name: "Nombre" })).toHaveValue("Pedido listo_2");
    expect(within(dialog).getByRole("textbox", { name: "Texto" })).toHaveValue("Hola {{1}}");
    // CC23: cada dato llega con su nombre y su ejemplo, el mismo par del alta.
    expect(within(dialog).getByRole("textbox", { name: "Dato 1" })).toHaveValue("nombre");
    expect(within(dialog).getByRole("textbox", { name: "Ejemplo del dato 1" })).toHaveValue("Ana");
    await user.click(within(dialog).getByRole("button", { name: "Mandar a Meta" }));
    await waitFor(() => expect(bodies).toEqual([{ name: "Pedido listo_2", category: "Utility", language: "es-AR", body: "Hola {{1}}", variables: [{ label: "nombre", example: "Ana" }] }]));
    expect(keys[0]).toMatch(/^[0-9a-f-]{36}$/i);
    expect(await screen.findByText("Mandamos «Pedido listo_2» a Meta para que la revise.")).toBeVisible();

    // Una en revisión no se duplica: solo se borra.
    await openActions(user, "Novedades");
    const pending = await screen.findByRole("menu");
    expect(within(pending).queryByRole("menuitem", { name: "Duplicar" })).not.toBeInTheDocument();
    expect(within(pending).getByRole("menuitem", { name: "Borrar" })).toBeVisible();
  });

  it("«Nueva plantilla» numera los datos como Meta y, si Meta no la recibe, lo dice con su texto", async () => {
    const bodies: unknown[] = [];
    server.use(http.post("/api/organization/whatsapp/templates", async ({ request }) => {
      bodies.push(await request.json());
      return HttpResponse.json({ code: "WhatsApp.Number.MetaRejected", detail: "Meta no aceptó la plantilla (código 100)." }, { status: 503 });
    }));
    const { user } = mountWhatsApp(whatsappOwner, "/org/whatsapp/plantillas");
    await user.click(await screen.findByRole("button", { name: "Nueva plantilla" }));
    const dialog = await screen.findByRole("dialog", { name: "Nueva plantilla" });
    await user.click(within(dialog).getByRole("textbox", { name: "Nombre" }));
    await user.paste("Pedido listo");
    await user.click(within(dialog).getByRole("radio", { name: "Marketing" }));
    await user.click(within(dialog).getByRole("textbox", { name: "Texto" }));
    await user.paste("Hola ");
    await user.click(within(dialog).getByRole("button", { name: "Nombre del contacto" }));
    expect(within(dialog).getByRole("textbox", { name: "Texto" })).toHaveValue("Hola {{1}}");
    expect(within(dialog).getByRole("textbox", { name: "Dato 1" })).toHaveValue("nombre");
    await user.click(within(dialog).getByRole("button", { name: "Mandar a Meta" }));
    expect(await within(dialog).findByText("Escribí un ejemplo: Meta lo pide para revisarla.")).toBeVisible();
    expect(bodies).toHaveLength(0);

    await user.click(within(dialog).getByRole("textbox", { name: "Ejemplo del dato 1" }));
    await user.paste("Ana");
    await user.click(within(dialog).getByRole("button", { name: "Mandar a Meta" }));
    expect(await within(dialog).findByText("Meta no aceptó la plantilla (código 100).")).toBeVisible();
    expect(bodies).toEqual([{ name: "Pedido listo", category: "Marketing", language: "es-AR", body: "Hola {{1}}", variables: [{ label: "nombre", example: "Ana" }] }]);
    expect(screen.queryByText("Algo salió mal. Probá de nuevo en un rato.")).not.toBeInTheDocument();
  });

  // CC27: sin un número conectado, el alta responde 409 con su texto, que va en la franja del diálogo como los demás.
  it("sin número conectado, el 409 NumberRequired queda en la franja del diálogo", async () => {
    server.use(http.post("/api/organization/whatsapp/templates", () => HttpResponse.json(
      { status: 409, code: "WhatsApp.Template.NumberRequired", detail: "Conectá un número de WhatsApp antes de crear una plantilla." }, { status: 409 })));
    const { user } = mountWhatsApp(whatsappOwner, "/org/whatsapp/plantillas");
    await user.click(await screen.findByRole("button", { name: "Nueva plantilla" }));
    const dialog = await screen.findByRole("dialog", { name: "Nueva plantilla" });
    await user.click(within(dialog).getByRole("textbox", { name: "Nombre" }));
    await user.paste("Pedido listo");
    await user.click(within(dialog).getByRole("textbox", { name: "Texto" }));
    await user.paste("Tu pedido está listo");
    await user.click(within(dialog).getByRole("button", { name: "Mandar a Meta" }));
    expect(await within(dialog).findByText("Conectá un número de WhatsApp antes de crear una plantilla.")).toBeVisible();
  });

  it("sin «Administrar WhatsApp» no se abre", async () => {
    mountWhatsApp(whatsappMember("whatsapp.broadcasts"), "/org/whatsapp/plantillas");
    expect(await screen.findByRole("heading", { name: "No tenés permiso para ver esta página" })).toBeVisible();
  });

  it("en el teléfono cada plantilla es una fila con su tipo, su idioma y su estado", async () => {
    asPhone();
    const { container } = mountWhatsApp(whatsappOwner, "/org/whatsapp/plantillas");
    expect(await screen.findByText("Pedido listo")).toBeVisible();
    expect(screen.getAllByText("Utilidad")).not.toHaveLength(0);
    expect(screen.getByRole("button", { name: "Nueva plantilla" })).toBeVisible();
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe("Plantillas de Plataforma", () => {
  const consultation = template({ id: "p-1", name: "Seguimos tu consulta" });
  const invitation = template({ id: "s-1", name: "invitacion_organizacion", title: "Invitación a una organización", category: "Marketing",
    languages: [{ culture: "es-AR", category: "Marketing" }, { culture: "en-US", category: "Utility" }], isSystem: true });
  const code = template({ id: "s-2", name: "codigo_ingreso", title: "Código de ingreso", category: "Authentication",
    languages: [{ culture: "es-AR", category: "Authentication" }, { culture: "en-US", category: "Authentication" }], isSystem: true });

  it("«Para consultas | Del sistema» va en la URL, y las del sistema son de solo lectura con la categoría del back", async () => {
    const groups: (string | null)[] = [];
    server.use(http.get("/api/platform/whatsapp/templates", ({ request }) => {
      const group = new URL(request.url).searchParams.get("group");
      groups.push(group);
      return HttpResponse.json({ templates: page(group === "System" ? [invitation, code] : [consultation]), approved: 3, consultations: 1, system: 2 });
    }));
    const { user, router, container } = mountWhatsApp(whatsappOperator(), "/plataforma/whatsapp/plantillas");
    expect(await screen.findByText("Seguimos tu consulta")).toBeVisible();
    const view = screen.getByRole("group", { name: "Ver" });
    expect(within(view).getByRole("button", { name: /Para consultas/ })).toHaveAttribute("aria-pressed", "true");
    await waitFor(() => expect(within(view).getByRole("button", { name: /Del sistema/ })).toHaveTextContent("Del sistema2"));
    expect(screen.getByText("3 plantillas · 3 aprobadas")).toBeVisible();
    expect(screen.getByRole("button", { name: "Acciones de Seguimos tu consulta" })).toBeVisible();
    expect(await axe(container)).toHaveNoViolations();

    await user.click(within(view).getByRole("button", { name: /Del sistema/ }));
    expect(await screen.findByText("Invitación a una organización")).toBeVisible();
    expect(router.state.location.search).toBe("?grupo=sistema");
    expect(groups).toEqual(["Consultations", "System"]);
    const row = screen.getByText("Invitación a una organización").closest("tr");
    expect(row).not.toBeNull();
    expect(row).toHaveTextContent("invitacion_organizacion · Español (Argentina), Inglés (Estados Unidos)");
    expect(within(row as HTMLElement).getByText("Marketing")).toBeVisible();
    // CC24: cada idioma trae su categoría; la invitación es Marketing en español y Utility en inglés.
    expect(within(row as HTMLElement).getByText("Utilidad en Inglés (Estados Unidos)")).toBeVisible();
    const login = screen.getByText("Código de ingreso").closest("tr") as HTMLElement;
    expect(within(login).queryByText(/ en /)).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Acciones de Invitación a una organización" })).not.toBeInTheDocument();
  });
});
