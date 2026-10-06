import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
import { configureI18n, changeCulture } from "@/shared/i18n";
import { referenceDataFixture } from "@/test/mocks/handlers";
import { server } from "@/test/mocks/server";
import { renderRouteWithProviders } from "@/test/utils/renderWithProviders";
import { asPhone } from "@/test/utils/phone";

// La carga lazy queda fuera del límite de cada recorrido, como en las fichas de Empresa y Organización.
beforeAll(async () => { await import("../pages/OrganizationsPage"); });

beforeEach(async () => {
  await configureI18n(referenceDataFixture().cultures); await changeCulture("es-AR");
  server.use(http.get("/api/platform/tenants/paged", () => HttpResponse.json({ items: [], page: 1, pageSize: 10, totalCount: 0, totalPages: 0, hasPrevious: false, hasNext: false })), http.get("/api/platform/tenants/filter-counts", () => HttpResponse.json({ total: 0, statuses: [], sources: [] })));
});
const created = { id: "delta", name: "Grupo Delta", slug: "delta", firstCompanyId: "company", invitationId: "invite" };
async function open(user: ReturnType<typeof userEvent.setup>) {
  await user.click(await screen.findByRole("button", { name: "Crear organización" })); return screen.getByRole("dialog");
}
async function fill(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("textbox", { name: "Nombre de la organización" })); await user.paste(" Grupo Delta ");
  await user.click(screen.getByRole("textbox", { name: "Primera empresa" })); await user.paste(" Delta S.A. ");
  await user.click(screen.getByRole("textbox", { name: "Correo del Dueño" })); await user.paste("LUCIA@EXAMPLE.COM");
}
describe("Crear organización", () => {
  it("ofrece cinco campos accesibles con defaults del operador y Crear habilitado", async () => {
    const user = userEvent.setup();
    const { container } = renderRouteWithProviders("/plataforma", { as: "platform-operator" }); const dialog = await open(user);
    expect(within(dialog).getAllByRole("textbox")).toHaveLength(3); expect(within(dialog).getAllByRole("combobox")).toHaveLength(2);
    expect(within(dialog).getByRole("combobox", { name: "Zona horaria" })).toHaveTextContent("Buenos Aires");
    expect(within(dialog).getByRole("combobox", { name: "Idioma y región" })).toHaveTextContent("Español");
    expect(within(dialog).getByRole("button", { name: "Crear organización" })).toBeEnabled();
    expect(await axe(container)).toHaveNoViolations();
  });
  it("valida sin enviar, restaura foco al cancelar y reabre el alta limpia", async () => {
    const user = userEvent.setup(); let calls = 0;
    server.use(http.post("/api/platform/tenants", () => { calls++; return HttpResponse.json(created, { status: 201 }); }));
    renderRouteWithProviders("/plataforma", { as: "platform-operator" }); const dialog = await open(user);
    await user.click(within(dialog).getByRole("button", { name: "Crear organización" }));
    expect(await screen.findByText("Escribí el nombre de la organización.")).toBeVisible(); expect(screen.getByText("Escribí el nombre de la primera empresa.")).toBeVisible(); expect(screen.getByText("Escribí el correo.")).toBeVisible(); expect(calls).toBe(0);
    await user.type(screen.getByRole("textbox", { name: "Correo del Dueño" }), "incorrecto"); await user.click(within(dialog).getByRole("button", { name: "Crear organización" })); expect(await screen.findByText("Revisá el correo: no parece válido.")).toBeVisible();
    await user.click(within(dialog).getByRole("button", { name: "Cancelar" })); await waitFor(() => expect(screen.getByRole("button", { name: "Crear organización" })).toHaveFocus());
    await open(user); expect(screen.getByRole("textbox", { name: "Correo del Dueño" })).toHaveValue(""); expect(screen.queryByText("Revisá el correo: no parece válido.")).not.toBeInTheDocument();
  });
  it("crea con los cinco valores normalizados, muestra correo enmascarado y relee al cerrar", async () => {
    const user = userEvent.setup(); let body: unknown; let key: string | null = null; let reads = 0;
    server.use(http.get("/api/platform/tenants/paged", () => { reads++; return HttpResponse.json({ items: [], page: 1, pageSize: 10, totalCount: 0, totalPages: 0, hasPrevious: false, hasNext: false }); }), http.post("/api/platform/tenants", async ({ request }) => { body = await request.json(); key = request.headers.get("Idempotency-Key"); return HttpResponse.json(created, { status: 201 }); }));
    renderRouteWithProviders("/plataforma", { as: "platform-operator" }); await open(user); await fill(user); await user.click(screen.getByRole("button", { name: "Crear organización" }));
    expect(await screen.findByText("Creamos Grupo Delta e invitamos a lu•••@example.com como Dueño.")).toBeVisible(); expect(body).toEqual({ name: "Grupo Delta", firstCompanyName: "Delta S.A.", ownerEmail: "lucia@example.com", culture: "es-AR", timeZoneId: "America/Argentina/Buenos_Aires" }); expect(key).toMatch(/^[a-f\d-]{36}$/u);
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument()); await waitFor(() => expect(reads).toBe(2));
  });
  it.each(["name", "firstCompanyName", "ownerEmail", "culture", "timeZoneId"] as const)("el 400 de %s queda en su campo", async (field) => {
    const user = userEvent.setup(); server.use(http.post("/api/platform/tenants", () => HttpResponse.json({ code: "General.Validation", detail: "Revisá los datos.", errors: { [field]: ["Dato rechazado."] } }, { status: 400 })));
    renderRouteWithProviders("/plataforma", { as: "platform-operator" }); await open(user); await fill(user); await user.click(screen.getByRole("button", { name: "Crear organización" })); expect(await screen.findByText("Dato rechazado.")).toBeVisible(); expect(screen.queryByText("Revisá los datos.")).not.toBeInTheDocument();
    const labels = { name: "Nombre de la organización", firstCompanyName: "Primera empresa", ownerEmail: "Correo del Dueño", culture: "Idioma y región", timeZoneId: "Zona horaria" };
    expect(screen.getByRole(field === "culture" || field === "timeZoneId" ? "combobox" : "textbox", { name: labels[field] })).toHaveAttribute("aria-invalid", "true");
  });
  it.each([["Tenancy.Tenant.NameTooLong", "Nombre de la organización"], ["Tenancy.Company.NameTooLong", "Primera empresa"], ["Users.Email.Invalid", "Correo del Dueño"]])("el código %s va debajo del dato", async (code, label) => {
    const user = userEvent.setup(); server.use(http.post("/api/platform/tenants", () => HttpResponse.json({ code, detail: "Dato rechazado." }, { status: 400 })));
    renderRouteWithProviders("/plataforma", { as: "platform-operator" }); await open(user); await fill(user); await user.click(screen.getByRole("button", { name: "Crear organización" })); expect(await screen.findByText("Dato rechazado.")).toBeVisible(); expect(screen.getByRole("textbox", { name: label })).toHaveAttribute("aria-invalid", "true");
  });
  it("lo no mapeado queda en la franja encima de los botones", async () => {
    const user = userEvent.setup(); server.use(http.post("/api/platform/tenants", () => HttpResponse.json({ code: "Platform.Creation.Failed", detail: "No se pudo crear la organización." }, { status: 409 })));
    renderRouteWithProviders("/plataforma", { as: "platform-operator" }); await open(user); await fill(user); await user.click(screen.getByRole("button", { name: "Crear organización" })); expect(await screen.findByText("No se pudo crear la organización.")).toBeVisible(); expect(screen.getByRole("button", { name: "Crear organización" })).toBeEnabled();
  });
  it("el reintento global conserva cuerpo y clave y ejecuta cierre, aviso e invalidación", async () => {
    const user = userEvent.setup(); const keys: (string | null)[] = []; const bodies: unknown[] = []; let reads = 0;
    server.use(http.get("/api/platform/tenants/paged", () => { reads++; return HttpResponse.json({ items: [], page: 1, pageSize: 10, totalCount: 0, totalPages: 0, hasPrevious: false, hasNext: false }); }), http.post("/api/platform/tenants", async ({ request }) => { keys.push(request.headers.get("Idempotency-Key")); bodies.push(await request.json()); return keys.length === 1 ? HttpResponse.error() : HttpResponse.json(created, { status: 201 }); }));
    renderRouteWithProviders("/plataforma", { as: "platform-operator" }); await open(user); await fill(user); await user.click(screen.getByRole("button", { name: "Crear organización" })); await user.click(await screen.findByRole("button", { name: "Reintentar" })); expect(await screen.findByText("Creamos Grupo Delta e invitamos a lu•••@example.com como Dueño.")).toBeVisible();
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument()); expect(keys).toHaveLength(2); expect(keys[0]).toBe(keys[1]); expect(bodies[0]).toEqual(bodies[1]); await waitFor(() => expect(reads).toBe(2));
  });
  it("corregir un cuerpo con respuesta perdida y reabrir el alta generan claves nuevas", async () => {
    const user = userEvent.setup(); const keys: (string | null)[] = [];
    server.use(http.post("/api/platform/tenants", ({ request }) => { keys.push(request.headers.get("Idempotency-Key")); return keys.length === 1 ? HttpResponse.error() : HttpResponse.json(created, { status: 201 }); }));
    renderRouteWithProviders("/plataforma", { as: "platform-operator" }); await open(user); await fill(user); await user.click(screen.getByRole("button", { name: "Crear organización" })); await screen.findByRole("button", { name: "Reintentar" }); await user.type(screen.getByRole("textbox", { name: "Nombre de la organización" }), " II"); await user.click(screen.getByRole("button", { name: "Crear organización" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument()); await open(user); await fill(user); await user.click(screen.getByRole("button", { name: "Crear organización" })); await waitFor(() => expect(keys).toHaveLength(3)); expect(new Set(keys).size).toBe(3);
  });
  it("en el teléfono el alta conserva los cinco campos y los selectores de referencia", async () => {
    const restore = asPhone(); const user = userEvent.setup();
    try { const { container } = renderRouteWithProviders("/plataforma", { as: "platform-operator" }); const dialog = await open(user); expect(within(dialog).getAllByRole("textbox")).toHaveLength(3); expect(within(dialog).getAllByRole("combobox")).toHaveLength(2); expect(await axe(container)).toHaveNoViolations(); await user.keyboard("{Escape}"); await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument()); } finally { restore(); }
  });
});
