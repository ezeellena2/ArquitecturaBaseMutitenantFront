import { screen, waitFor, within } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
import { server } from "@/test/mocks/server";
import { choose, pickerName } from "@/test/picker";
import { asPhone } from "@/test/utils/phone";
import type {
  CreateFormCatalogRequest,
  FormCatalogPreviewRequest,
  FormCatalogPreviewResponse,
  FormCatalogResponse,
  FormCatalogSourceResponse,
  UpdateFormCatalogRequest,
} from "../api/types";
import { formsOwner, mountForms } from "../test/support";

const base = "/api/organization/forms/catalogs";
const paged = <T,>(items: T[]) => ({ items, page: 1, pageSize: 10, totalCount: items.length, totalPages: 1, hasPrevious: false, hasNext: false });

const membersSource: FormCatalogSourceResponse = { version: 1, columns: [
  { key: "name", type: "Text", operators: ["contains", "equals"], canDetail: false, canSort: true },
  { key: "role", type: "List", operators: ["hasAny", "hasNone"], canDetail: true, canSort: false },
  { key: "company", type: "List", operators: ["hasAny", "hasNone"], canDetail: true, canSort: false },
  { key: "active", type: "Boolean", operators: ["is"], canDetail: false, canSort: false },
] };
// Tablero FRM-Catalogo-Filtros, «Sin cambios»: «Supervisores», con dos condiciones y Tomás Acosta de ejemplo.
const supervisores = (extra: Partial<FormCatalogResponse> = {}): FormCatalogResponse => ({
  id: "c-sup", name: "Supervisores", description: "Quienes pueden aprobar una visita.", source: "Members", valueType: "Text",
  filters: { sourceVersion: 1, excludeRecipient: true, detail: "company", sort: { column: "name", descending: false }, conditions: [
    { column: "role", operator: "hasAny", values: ["r-sup", "r-jefe"] },
    { column: "active", operator: "is", values: ["true"] },
  ] },
  roles: [{ id: "r-sup", name: "Supervisor" }, { id: "r-jefe", name: "Jefe de obra" }], companies: [],
  sample: { id: "m-tomas", name: "Tomás Acosta", detail: "Delta S.A." },
  isActive: true, usable: true, canManage: true, itemCounts: { total: 0, active: 0 }, modifiedAtUtc: "2026-11-20T13:00:00Z", version: 4, ...extra,
});
const three: FormCatalogPreviewResponse = { total: 3, exceedsLimit: false, options: [
  { text: "Florencia Fernández de la Fue…", detail: "Florencia Fernández de la Fuente · Delta Norte" },
  { text: "Martín Paz", detail: "Delta S.A." },
  { text: "Paula Méndez", detail: "Delta S.A." },
] };

let previews: FormCatalogPreviewRequest[] = [];
let puts: UpdateFormCatalogRequest[] = [];
let posts: CreateFormCatalogRequest[] = [];
function serve({ detail = supervisores(), preview = () => three, rejectPut }: {
  detail?: FormCatalogResponse; preview?: (request: FormCatalogPreviewRequest) => FormCatalogPreviewResponse; rejectPut?: Response;
} = {}) {
  previews = [];
  puts = [];
  posts = [];
  // Lo que guarda el `PUT` es lo que devuelve la relectura, como en el servidor.
  let current = detail;
  server.use(
    http.get(`${base}/${detail.id}`, () => HttpResponse.json(current)),
    http.get(`${base}/sources/members`, () => HttpResponse.json(membersSource)),
    http.get(`${base}/sources/members/roles`, () => HttpResponse.json(paged([{ id: "r-aud", name: "Auditor" }, { id: "r-jefe", name: "Jefe de obra" }, { id: "r-sup", name: "Supervisor" }]))),
    http.get(`${base}/sources/contacts/tags`, () => HttpResponse.json(paged([{ name: "Mayorista", contacts: 4 }, { name: "Minorista", contacts: 7 }]))),
    http.get(`${base}/sample-members`, () => HttpResponse.json(paged([
      { memberId: "m-tomas", name: "Tomás Acosta", roles: ["Vendedor"], companies: ["Delta S.A."] },
      { memberId: "m-martin", name: "Martín Paz", roles: ["Supervisor"], companies: ["Delta S.A."] },
    ]))),
    http.post(`${base}/previews`, async ({ request }) => {
      const body = await request.json() as FormCatalogPreviewRequest;
      previews.push(body);
      return HttpResponse.json(preview(body));
    }),
    http.put(`${base}/${detail.id}`, async ({ request }) => {
      const body = await request.json() as UpdateFormCatalogRequest;
      puts.push(body);
      if (rejectPut) return rejectPut;
      current = { ...current, version: 5, filters: (body.filters as FormCatalogResponse["filters"]) ?? current.filters,
        sample: body.sampleMemberId === "m-martin" ? { id: "m-martin", name: "Martín Paz", detail: "Delta S.A." } : current.sample };
      return HttpResponse.json({ version: 5, itemIdentityMap: [] });
    }),
    http.post(base, async ({ request }) => { posts.push(await request.json() as CreateFormCatalogRequest); return HttpResponse.json({}, { status: 500 }); }),
  );
}

const phone = () => screen.getByRole("group", { name: "Así lo ve quien lo recibe" });

beforeAll(async () => { await import("./CatalogEditorPage"); });
beforeEach(() => serve());

describe("Catálogo con filtros (FRM-Catalogo-Filtros y FRM-Catalogo-Contactos)", () => {
  it("abre con sus condiciones en la pieza, varias por su nombre, y la vista previa se pide sola con la persona de ejemplo", async () => {
    const { container } = mountForms(formsOwner, "/org/formularios/catalogos/c-sup");
    expect(await screen.findByRole("button", { name: pickerName("Roles") })).toHaveAccessibleName(/Supervisor, Jefe de obra/);
    expect(screen.getByRole("button", { name: pickerName("Persona") })).toHaveAccessibleName(/Tomás Acosta/);
    expect(await within(phone()).findByText("Martín Paz")).toBeInTheDocument();
    // La (i) de la casilla es su descripción (pantallas-y-ui).
    expect(screen.getByRole("checkbox", { name: "Sin incluir a quien lo recibe" })).toHaveAccessibleDescription("Nadie se elige a sí mismo.");
    expect(previews[0]).toMatchObject({ source: "Members", sampleMemberId: "m-tomas",
      filters: { sourceVersion: 1, excludeRecipient: true, detail: "company", conditions: [{ column: "role", operator: "hasAny", values: ["r-sup", "r-jefe"] }, { column: "active", operator: "is", values: ["true"] }] } });
    expect(screen.queryByRole("button", { name: /Probar/ })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Guardar cambios" })).toBeDisabled();
    expect(await axe(container)).toHaveNoViolations();
  });

  it("al cambiar una condición o la persona, la vista previa se vuelve a pedir sola, y guardar manda los filtros y la persona", async () => {
    const { user } = mountForms(formsOwner, "/org/formularios/catalogos/c-sup");
    await within(await screen.findByRole("group", { name: "Así lo ve quien lo recibe" })).findByText("Martín Paz");
    await user.click(screen.getAllByRole("button", { name: pickerName("Comparación") })[0]!);
    await user.click(await screen.findByRole("option", { name: "no tiene ninguno de" }));
    await waitFor(() => expect(previews.at(-1)?.filters?.conditions?.[0]).toMatchObject({ operator: "hasNone" }));
    await choose(user, "Persona", /Martín Paz/);
    await waitFor(() => expect(previews.at(-1)).toMatchObject({ sampleMemberId: "m-martin" }));
    await user.click(screen.getByRole("button", { name: "Guardar cambios" }));
    await waitFor(() => expect(puts).toHaveLength(1));
    expect(puts[0]).toMatchObject({ version: 4, sampleMemberId: "m-martin", filters: { conditions: [{ column: "role", operator: "hasNone" }, { column: "active" }] } });
    expect(await screen.findByText("Guardamos el catálogo.")).toBeInTheDocument();
    await waitFor(() => expect(screen.getByRole("button", { name: "Guardar cambios" })).toBeDisabled());
  });

  it("un rechazo de una condición se ve debajo de ella, en la fila que se mandó", async () => {
    serve({ rejectPut: HttpResponse.json({ type: "about:blank", code: "Forms.Catalog.FiltersInvalid", status: 400, title: "Bad Request", traceId: "t-1",
      errors: { "conditions.1": ["Revisá esta condición."] } }, { status: 400 }) });
    const { user } = mountForms(formsOwner, "/org/formularios/catalogos/c-sup");
    await choose(user, "Detalle", "Sin detalle");
    await user.click(screen.getByRole("button", { name: "Guardar cambios" }));
    expect(await screen.findByText("Revisá esta condición.")).toBeInTheDocument();
    expect(puts[0]?.filters).toMatchObject({ detail: null });
  });

  it("en el teléfono, cada condición es una tarjeta que se edita en «Editar condición», y la vista previa se abre desde la barra", async () => {
    const restore = asPhone();
    try {
      const { user } = mountForms(formsOwner, "/org/formularios/catalogos/c-sup");
      expect(await screen.findByText("Supervisor, Jefe de obra")).toBeInTheDocument();
      expect(screen.getByText("Otras opciones")).toBeInTheDocument();
      // Cada ⋮ dice de qué condición es (accesibilidad).
      expect(screen.getByRole("button", { name: "Acciones de la condición Rol" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Acciones de la condición Activo" })).toBeInTheDocument();
      await user.click(screen.getByText("Supervisor, Jefe de obra"));
      const dialog = await screen.findByRole("dialog", { name: "Editar condición" });
      await user.click(within(dialog).getByRole("button", { name: pickerName("Comparación") }));
      await user.click(await screen.findByRole("option", { name: "no tiene ninguno de" }));
      await user.click(within(screen.getByRole("dialog", { name: "Editar condición" })).getByRole("button", { name: "Listo" }));
      expect(await screen.findByText("no tiene ninguno de")).toBeInTheDocument();
      await user.click(screen.getByRole("button", { name: "Así lo ve quien lo recibe" }));
      const preview = await screen.findByRole("dialog", { name: "Así lo ve quien lo recibe" });
      expect(within(preview).getByRole("button", { name: pickerName("Persona") })).toHaveAccessibleName(/Tomás Acosta/);
      expect(await within(preview).findByText("Martín Paz")).toBeInTheDocument();
    } finally { restore(); }
  });

  it("con más de 200, la vista previa termina en «y N opciones más» con su ⓘ", async () => {
    serve({ preview: () => ({ ...three, total: 215, exceedsLimit: true }) });
    mountForms(formsOwner, "/org/formularios/catalogos/c-sup");
    expect(await screen.findByText("y 212 opciones más")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Más información sobre y 212 opciones más" }))
      .toHaveAccessibleDescription("Con estos filtros hay 215 opciones, y WhatsApp muestra hasta 200.");
  });

  it("sin opciones, el teléfono dice «Ninguna opción»", async () => {
    serve({ preview: () => ({ options: [], total: 0, exceedsLimit: false }) });
    mountForms(formsOwner, "/org/formularios/catalogos/c-sup");
    expect(await within(await screen.findByRole("group", { name: "Así lo ve quien lo recibe" })).findByText("Ninguna opción")).toBeInTheDocument();
  });

  it("un rol que ya no existe deja el catálogo en «No se puede usar» y la condición dice «Rol no disponible» con su error", async () => {
    serve({ detail: supervisores({ id: "c-resp", name: "Responsables de obra", usable: false, unusableReason: "RoleMissing",
      roles: [], filters: { ...supervisores().filters!, conditions: [{ column: "role", operator: "hasAny", values: ["r-borrado"] }] } }) });
    mountForms(formsOwner, "/org/formularios/catalogos/c-resp");
    expect(await screen.findByRole("button", { name: pickerName("Roles") })).toHaveAccessibleName(/Rol no disponible/);
    expect(screen.getByText("Ese rol ya no existe. Elegí otro.")).toBeInTheDocument();
    expect(screen.getByText("No se puede usar")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Más información sobre No se puede usar" })).toHaveAccessibleDescription("Un rol de los filtros ya no existe.");
    // La vista previa no manda la condición rota: el servidor la rechazaría.
    await waitFor(() => expect(previews.at(-1)?.filters?.conditions).toEqual([]));
  });

  it("sin persona de ejemplo, un catálogo de los miembros con condiciones no se crea (SampleRequired) ni pide la vista previa", async () => {
    const { user } = mountForms(formsOwner, "/org/formularios/catalogos/nuevo");
    await choose(user, "De dónde salen las opciones", /De los miembros/);
    await user.type(screen.getByRole("textbox", { name: /Nombre del catálogo/ }), "Responsables de depósito");
    await user.click(await screen.findByRole("button", { name: "Agregar condición" }));
    await choose(user, "Roles", "Supervisor");
    await user.keyboard("{Escape}");
    await user.click(screen.getByRole("button", { name: "Crear catálogo" }));
    expect(await screen.findByText("Elegí una persona.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: pickerName("Persona") })).toHaveAccessibleName(/Elegí a quién/);
    expect(posts).toEqual([]);
    expect(previews.every((request) => (request.filters?.conditions ?? []).length === 0)).toBe(true);
  });

  it("cambiar la columna de una condición con valores pregunta con lo que se va (162): «Cancelar» los conserva y «Cambiar» los quita", async () => {
    const { user } = mountForms(formsOwner, "/org/formularios/catalogos/c-sup");
    expect(await screen.findByRole("button", { name: pickerName("Roles") })).toHaveAccessibleName(/Supervisor, Jefe de obra/);
    await choose(user, "Columna Rol", "Empresa");
    let dialog = await screen.findByRole("dialog", { name: "¿Cambiar a Empresa?" });
    expect(dialog).toHaveTextContent("Se quitan los 2 valores elegidos.");
    await user.click(within(dialog).getByRole("button", { name: "Cancelar" }));
    expect(screen.getByRole("button", { name: pickerName("Roles") })).toHaveAccessibleName(/Supervisor, Jefe de obra/);
    await choose(user, "Columna Rol", "Empresa");
    dialog = await screen.findByRole("dialog", { name: "¿Cambiar a Empresa?" });
    await user.click(within(dialog).getByRole("button", { name: "Cambiar" }));
    expect(await screen.findByRole("button", { name: pickerName("Empresas") })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: pickerName("Roles") })).not.toBeInTheDocument();
    // Un sí o no no tiene valores elegidos que perder: cambia sin preguntar.
    await choose(user, "Columna Activo", "Nombre");
    expect(screen.queryByRole("dialog", { name: /¿Cambiar a/ })).not.toBeInTheDocument();
  });

  it("si la vista previa o las columnas no se pueden leer, lo dicen en su lugar, con «Reintentar»", async () => {
    let previewsFailing = true, sourceFailing = true;
    server.use(
      http.post(`${base}/previews`, () => previewsFailing ? HttpResponse.json({ status: 500, title: "Error" }, { status: 500 }) : HttpResponse.json(three)),
      http.get(`${base}/sources/members`, () => sourceFailing ? HttpResponse.json({ status: 500, title: "Error" }, { status: 500 }) : HttpResponse.json(membersSource)),
    );
    const { user } = mountForms(formsOwner, "/org/formularios/catalogos/c-sup");
    const columnsError = "No pudimos leer las columnas para filtrar.";
    expect((await screen.findAllByRole("alert")).some((alert) => alert.textContent?.startsWith(columnsError))).toBe(true);
    expect(screen.getByRole("button", { name: "Agregar condición" })).toHaveAccessibleDescription(columnsError);
    sourceFailing = false;
    await user.click(screen.getAllByRole("button", { name: "Reintentar" })[0]);
    await waitFor(() => expect(screen.queryAllByText(columnsError)).toHaveLength(0));
    expect(await within(phone()).findByText("No pudimos actualizar la vista previa.")).toBeVisible();
    // Debajo, el motivo: acá el común de un 5xx (errores).
    expect(within(phone()).getByText("Algo salió mal. Probá de nuevo en un rato.")).toBeVisible();
    previewsFailing = false;
    await user.click(within(phone()).getByRole("button", { name: "Reintentar" }));
    expect(await within(phone()).findByText("Martín Paz")).toBeInTheDocument();
  });

  it("cambiar el origen de un catálogo nuevo con condiciones pregunta antes, con lo que se va (162)", async () => {
    const { user } = mountForms(formsOwner, "/org/formularios/catalogos/nuevo");
    await choose(user, "De dónde salen las opciones", /De los miembros/);
    await user.click(await screen.findByRole("button", { name: "Agregar condición" }));
    await choose(user, "Roles", "Supervisor");
    await user.keyboard("{Escape}");
    await choose(user, "De dónde salen las opciones", /De los contactos/);
    let dialog = await screen.findByRole("dialog", { name: "¿Cambiar a De los contactos de WhatsApp?" });
    expect(dialog).toHaveTextContent("Se quita la condición.");
    await user.click(within(dialog).getByRole("button", { name: "Cancelar" }));
    expect(screen.getByRole("button", { name: pickerName("Roles") })).toHaveAccessibleName(/Supervisor/);
    await choose(user, "De dónde salen las opciones", /De los contactos/);
    dialog = await screen.findByRole("dialog", { name: "¿Cambiar a De los contactos de WhatsApp?" });
    await user.click(within(dialog).getByRole("button", { name: "Cambiar" }));
    expect(await screen.findByRole("heading", { name: "Qué contactos entran" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: pickerName("Roles") })).not.toBeInTheDocument();
  });

  it("de los contactos: el cliente puede quedar «Sin cliente», y la condición elige etiquetas por su nombre", async () => {
    serve({ detail: supervisores({ id: "c-cli", name: "Clientes", source: "Contacts", roles: null, companies: null, sample: null,
      filters: { sourceVersion: 1, excludeRecipient: false, detail: "tags", sort: { column: "name", descending: false }, conditions: [{ column: "tags", operator: "hasAny", values: ["Mayorista"] }] } }) });
    const { user } = mountForms(formsOwner, "/org/formularios/catalogos/c-cli");
    expect(await screen.findByRole("button", { name: pickerName("Cliente") })).toHaveAccessibleName(/Sin cliente/);
    expect(screen.getByRole("button", { name: pickerName("Comparación") })).toHaveAccessibleName(/tiene alguna de/);
    expect(screen.queryByText("Sin incluir a quien lo recibe")).not.toBeInTheDocument();
    await waitFor(() => expect(previews[0]).toMatchObject({ source: "Contacts", sampleContactId: null }));
    await choose(user, "Etiquetas", "Minorista");
    await waitFor(() => expect(previews.at(-1)?.filters?.conditions?.[0]?.values).toEqual(["Mayorista", "Minorista"]));
  });
});
