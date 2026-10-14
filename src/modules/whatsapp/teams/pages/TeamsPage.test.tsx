import { screen, waitFor, within } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import { server } from "@/test/mocks/server";
import { asPhone } from "@/test/utils/phone";
import type { WhatsAppTeamResponse } from "../../api/types";
import { mountWhatsApp, whatsappMember, whatsappOperator, whatsappOwner } from "../../test/support";

const page = <T,>(items: T[]) => ({ items, page: 1, pageSize: 10, totalCount: items.length, totalPages: 1, hasPrevious: false, hasNext: false });
const sales: WhatsAppTeamResponse = { id: "team-1", name: "Ventas", inbox: "Customers", memberCount: 2, notifyAfterMinutes: 10, version: 3 };
const orders: WhatsAppTeamResponse = { id: "team-2", name: "Carga de pedidos", inbox: "Internal", memberCount: 1, notifyAfterMinutes: null, version: 1 };
const users = page([
  { memberId: "member-1", displayName: "Carolina Vega", state: "Active", hasManagedEmail: false, roles: [], companies: [], version: 1, createdAtUtc: "2026-09-01T12:00:00Z" },
  { memberId: "member-2", displayName: "Paula Méndez", state: "Active", hasManagedEmail: false, roles: [], companies: [], version: 1, createdAtUtc: "2026-09-01T12:00:00Z" },
]);

beforeAll(async () => { await import("./TeamsPage"); });
beforeEach(() => {
  server.use(
    http.get("/api/organization/whatsapp/untaken", () => HttpResponse.json({ customers: 0, internal: 0 })),
    http.get("/api/platform/whatsapp/conversations", () => HttpResponse.json({ conversations: page([]), counts: { customers: 0, internal: 0, untaken: 0 } })),
    http.get("/api/organization/whatsapp/teams", () => HttpResponse.json(page([sales, orders]))),
    http.get("/api/users/paged", () => HttpResponse.json(users)),
  );
});
afterEach(() => vi.unstubAllGlobals());

describe("Equipos de la organización", () => {
  it("lista cada equipo con su bandeja, cuántos son y el aviso, y «Sin aviso» si no avisa", async () => {
    const { container } = mountWhatsApp(whatsappOwner, "/org/whatsapp/equipos");
    expect(await screen.findByRole("heading", { name: "Equipos" })).toBeVisible();
    expect(await screen.findByText("Ventas")).toBeVisible();
    expect(screen.getByText("2 equipos")).toBeVisible();
    expect(screen.getByText("Bandeja Clientes")).toBeVisible();
    expect(screen.getByText("A los 10 minutos")).toBeVisible();
    expect(screen.getByText("Sin aviso")).toBeVisible();
    expect(screen.getByText("1 persona")).toBeVisible();
    expect(await axe(container)).toHaveNoViolations();
  });

  it("sin «Administrar WhatsApp» no se abre, y con el módulo apagado no existe", async () => {
    const reads = vi.fn();
    server.use(http.get("/api/organization/whatsapp/teams", () => { reads(); return HttpResponse.json(page([])); }));
    const first = mountWhatsApp(whatsappMember("whatsapp.customers"), "/org/whatsapp/equipos");
    expect(await screen.findByRole("heading", { name: "No tenés permiso para ver esta página" })).toBeVisible();
    first.unmount();
    mountWhatsApp({ ...whatsappOwner, features: [] }, "/org/whatsapp/equipos");
    expect(await screen.findByRole("heading", { name: "No encontramos esta página" })).toBeVisible();
    expect(reads).not.toHaveBeenCalled();
  });

  it("crea un equipo: el reintento manda la misma clave, el nombre repetido va en su campo y «No avisar» va como null", async () => {
    const bodies: unknown[] = [];
    const keys: (string | null)[] = [];
    server.use(http.post("/api/organization/whatsapp/teams", async ({ request }) => {
      bodies.push(await request.json());
      keys.push(request.headers.get("Idempotency-Key"));
      return keys.length === 1 ? HttpResponse.error()
        : HttpResponse.json({ code: "WhatsApp.Team.NameTaken", detail: "Ya hay un equipo con ese nombre." }, { status: 409 });
    }));
    const { user } = mountWhatsApp(whatsappOwner, "/org/whatsapp/equipos");
    await user.click(await screen.findByRole("button", { name: "Crear equipo" }));
    const dialog = await screen.findByRole("dialog", { name: "Crear equipo" });
    await user.click(within(dialog).getByRole("button", { name: "Crear equipo" }));
    expect(await within(dialog).findByText("Escribí el nombre del equipo.")).toBeVisible();
    expect(within(dialog).getByText("Elegí al menos una persona.")).toBeVisible();
    expect(bodies).toHaveLength(0);

    await user.click(within(dialog).getByRole("textbox", { name: "Nombre" }));
    await user.paste("Ventas");
    await user.click(within(dialog).getByRole("radio", { name: "Internos" }));
    await user.click(within(dialog).getByRole("button", { name: "Personas" }));
    await user.click(await screen.findByRole("menuitemcheckbox", { name: "Carolina Vega" }));
    await user.keyboard("{Escape}");
    await user.click(within(dialog).getByRole("combobox", { name: "Aviso por correo si nadie lo toma" }));
    await user.click(await screen.findByRole("option", { name: "No avisar" }));
    await user.click(within(dialog).getByRole("button", { name: "Crear equipo" }));
    await waitFor(() => expect(bodies).toHaveLength(1));
    expect(bodies[0]).toEqual({ name: "Ventas", inbox: "Internal", memberIds: ["member-1"], notifyAfterMinutes: null });

    await user.click(within(dialog).getByRole("button", { name: "Crear equipo" }));
    expect(await within(dialog).findByText("Ya hay un equipo con ese nombre.")).toBeVisible();
    expect(within(dialog).getByRole("textbox", { name: "Nombre" })).toHaveAttribute("aria-invalid", "true");
    expect(keys[1]).toBe(keys[0]);
  });

  it("edita con la versión de su lectura, sin cambiar la bandeja", async () => {
    const puts: unknown[] = [];
    server.use(
      http.get("/api/organization/whatsapp/teams/team-1", () => HttpResponse.json({ ...sales, members: page([{ id: "member-1", name: "Carolina Vega" }]) })),
      http.put("/api/organization/whatsapp/teams/team-1", async ({ request }) => { puts.push(await request.json()); return HttpResponse.json({ ...sales, notifyAfterMinutes: 30, version: 4 }); }),
    );
    const { user } = mountWhatsApp(whatsappOwner, "/org/whatsapp/equipos");
    (await screen.findByRole("button", { name: "Acciones de Ventas" })).focus();
    await user.keyboard("{Enter}");
    await user.click(await screen.findByRole("menuitem", { name: "Editar" }));
    const dialog = await screen.findByRole("dialog", { name: "Editar equipo" });
    expect(await within(dialog).findByRole("button", { name: "Personas" })).toHaveTextContent("Carolina Vega");
    expect(within(dialog).queryByRole("radio")).not.toBeInTheDocument();
    expect(within(dialog).getByRole("button", { name: "Guardar cambios" })).toBeDisabled();
    await user.click(within(dialog).getByRole("combobox", { name: "Aviso por correo si nadie lo toma" }));
    await user.click(await screen.findByRole("option", { name: "A los 30 minutos" }));
    await user.click(within(dialog).getByRole("button", { name: "Guardar cambios" }));
    await waitFor(() => expect(puts).toEqual([{ name: "Ventas", memberIds: ["member-1"], notifyAfterMinutes: 30, version: 3 }]));
  });

  it("en el teléfono cada equipo es una fila con el aviso a la derecha y crear es el «+»", async () => {
    asPhone();
    const { container } = mountWhatsApp(whatsappOwner, "/org/whatsapp/equipos");
    expect(await screen.findByText("Ventas")).toBeVisible();
    expect(screen.getByText("Aviso a los 10 min")).toBeVisible();
    expect(screen.getByText("Bandeja Clientes · 2 personas")).toBeVisible();
    expect(screen.getByRole("button", { name: "Crear equipo" })).toBeVisible();
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe("Equipos de Plataforma", () => {
  it("son de operadores y se crean sin bandeja", async () => {
    const bodies: unknown[] = [];
    server.use(
      http.get("/api/platform/whatsapp/teams", () => HttpResponse.json(page([{ ...sales, name: "Soporte", inbox: null }]))),
      http.get("/api/platform/accounts/paged", () => HttpResponse.json(page([{ id: "operator-1", displayName: "Martín Sosa", kind: "Operator", state: "Active", hasPersonalSpace: false, organizationCount: 0 }]))),
      http.post("/api/platform/whatsapp/teams", async ({ request }) => { bodies.push(await request.json()); return HttpResponse.json({ ...sales, id: "team-9", name: "Cuentas", inbox: null }, { status: 201 }); }),
    );
    const { user, container } = mountWhatsApp(whatsappOperator(), "/plataforma/whatsapp/equipos");
    expect(await screen.findByText("Soporte")).toBeVisible();
    expect(screen.getByRole("columnheader", { name: "Operadores" })).toBeVisible();
    expect(screen.getByText("2 operadores")).toBeVisible();
    expect(screen.queryByText("Bandeja Clientes")).not.toBeInTheDocument();
    expect(await axe(container)).toHaveNoViolations();

    await user.click(screen.getByRole("button", { name: "Crear equipo" }));
    const dialog = await screen.findByRole("dialog", { name: "Crear equipo" });
    expect(within(dialog).queryByRole("radio")).not.toBeInTheDocument();
    await user.click(within(dialog).getByRole("textbox", { name: "Nombre" }));
    await user.paste("Cuentas");
    await user.click(within(dialog).getByRole("button", { name: "Operadores" }));
    await user.click(await screen.findByRole("menuitemcheckbox", { name: "Martín Sosa" }));
    await user.keyboard("{Escape}");
    await user.click(within(dialog).getByRole("button", { name: "Crear equipo" }));
    await waitFor(() => expect(bodies).toEqual([{ name: "Cuentas", inbox: null, memberIds: ["operator-1"], notifyAfterMinutes: 10 }]));
  });
});
