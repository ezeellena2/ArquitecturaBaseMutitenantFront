import { screen, waitFor, within } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
import { server } from "@/test/mocks/server";
import { choose, pickerName } from "@/test/picker";
import { asPhone } from "@/test/utils/phone";
import type { FormCatalogFieldDetail, FormCatalogItemRow, FormCatalogResponse, UpdateFormCatalogRequest } from "../../api/types";
import { catalogLimits } from "../../lib/catalogLimits";
import { formsOwner, mountForms, withoutFields } from "../../test/support";

const base = "/api/organization/forms/catalogs";
const path = "/org/formularios/catalogos/c-motivos";
const catalog: FormCatalogResponse = {
  id: "c-motivos", name: "Motivos de visita", description: "Por qué se visita a un cliente.", source: "Manual", valueType: "Text",
  isActive: true, usable: true, canManage: true, itemCounts: { total: 4, active: 3 }, modifiedAtUtc: "2026-11-20T13:00:00Z", version: 7, ...withoutFields(),
};
const item = (id: string, position: number, text: string, code: string, extra: Partial<FormCatalogItemRow> = {}): FormCatalogItemRow =>
  ({ id, position, text, code, detail: null, value: null, isActive: true, textRepeated: false, fields: {}, ...extra });
// Tablero FRM-Catalogo-Opciones: cuatro opciones, «Cobranza» dada de baja.
const motivos = [
  item("i-seg", 1, "Seguimiento", "SEG", { detail: "Visita programada a un cliente actual" }),
  item("i-ven", 2, "Venta nueva", "VEN", { detail: "Primera visita a un cliente" }),
  item("i-rec", 3, "Reclamo", "REC", { detail: "Hay un problema para resolver" }),
  item("i-cob", 4, "Cobranza", "COB", { detail: "Cobrar un pago pendiente", isActive: false }),
];

let puts: UpdateFormCatalogRequest[] = [];
function serve(put: () => Response = () => HttpResponse.json({ version: 8, itemIdentityMap: [] })) {
  puts = [];
  server.use(
    http.get(`${base}/c-motivos`, () => HttpResponse.json(catalog)),
    http.get(`${base}/c-motivos/items`, () => HttpResponse.json({ items: motivos, page: 1, pageSize: 10, totalCount: 4, totalPages: 1, hasPrevious: false, hasNext: false })),
    http.put(`${base}/c-motivos`, async ({ request }) => { puts.push(await request.json() as UpdateFormCatalogRequest); return put(); }),
  );
}

async function openEditor() {
  const mounted = mountForms(formsOwner, path);
  await screen.findByRole("textbox", { name: "Texto de Seguimiento" });
  return mounted;
}

const textbox = (name: string) => screen.getByRole("textbox", { name });
const saveButton = () => screen.getByRole("button", { name: "Guardar cambios" });
const optionsOf = (dialog: HTMLElement, name = "Opciones") => within(within(dialog).getByRole("list", { name })).getAllByRole("button");

beforeAll(async () => { await import("../../pages/CatalogEditorPage"); });
beforeEach(() => serve());

describe("OptionsDialog (FRM-Catalogo-Opciones)", () => {
  it("el código y el detalle llevan el tope del contrato, en la tabla y en el modal: al llegar, no se escribe más (269 y O13)", async () => {
    const { user } = await openEditor();
    expect(textbox("Código de Seguimiento")).toHaveAttribute("maxlength", String(catalogLimits.itemCode));
    expect(textbox("Detalle de Seguimiento")).toHaveAttribute("maxlength", String(catalogLimits.itemDetail));
    await user.click(screen.getByRole("button", { name: "Editar Seguimiento" }));
    const dialog = await screen.findByRole("dialog", { name: "Opciones de «Motivos de visita»" });
    expect(within(dialog).getByRole("textbox", { name: "Código" })).toHaveAttribute("maxlength", String(catalogLimits.itemCode));
    expect(within(dialog).getByRole("textbox", { name: "Detalle" })).toHaveAttribute("maxlength", String(catalogLimits.itemDetail));
  });

  it("«Agregar opción» abre «Opciones nuevas» con una nueva; «Listo» conserva lo escrito y quita la nueva sin nada escrito", async () => {
    const { user } = await openEditor();
    await user.click(screen.getByRole("button", { name: "Agregar opción" }));
    const dialog = await screen.findByRole("dialog", { name: "Opciones nuevas de «Motivos de visita»" });
    expect(within(dialog).getByRole("region", { name: "Nueva opción" })).toBeInTheDocument();
    // El Estado va solo en una guardada.
    expect(within(dialog).queryByRole("button", { name: /^Estado/ })).not.toBeInTheDocument();
    // Pegado y no tipeado letra por letra: cada test entra en 5 s (tests).
    await user.click(within(dialog).getByRole("textbox", { name: "Texto" }));
    await user.paste("Garantía");
    expect(within(dialog).getByText("8/30")).toBeInTheDocument();
    await user.click(within(dialog).getByRole("button", { name: "Generar desde el texto" }));
    expect(within(dialog).getByRole("textbox", { name: "Código" })).toHaveValue("GAR");
    await user.click(within(dialog).getByRole("button", { name: "Agregar opción" }));
    expect(optionsOf(dialog, "Opciones nuevas")).toHaveLength(2);
    expect(await axe(dialog)).toHaveNoViolations();
    await user.click(within(dialog).getByRole("button", { name: "Listo" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(textbox("Código de Garantía")).toHaveValue("GAR");
    expect(screen.queryByRole("textbox", { name: "Texto de Opción nueva" })).not.toBeInTheDocument();
  });

  it("«Cancelar» y Esc devuelven todo como estaba al abrirlo, también lo cambiado antes en la tabla", async () => {
    const { user } = await openEditor();
    await user.click(screen.getByRole("button", { name: "Editar Venta nueva" }));
    let dialog = await screen.findByRole("dialog", { name: "Opciones de «Motivos de visita»" });
    expect(within(dialog).getByRole("region", { name: "Opción 2 de 4" })).toBeInTheDocument();
    expect(within(dialog).getByText("1–4 de 4")).toBeInTheDocument();
    const text = within(dialog).getByRole("textbox", { name: "Texto" });
    await user.clear(text);
    await user.paste("Venta");
    await user.click(within(dialog).getByRole("button", { name: "Agregar opción" }));
    await user.click(within(dialog).getByRole("button", { name: "Cancelar" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(textbox("Texto de Venta nueva")).toHaveValue("Venta nueva");
    expect(screen.queryByRole("textbox", { name: "Texto de Opción nueva" })).not.toBeInTheDocument();
    expect(saveButton()).toBeDisabled();

    // Pegado y no tipeado: cada letra cambia el nombre de la fila y vuelve a dibujar la tabla; cada test entra en 5 s (tests).
    await user.click(textbox("Texto de Reclamo"));
    await user.paste(" urgente");
    await user.click(screen.getByRole("button", { name: "Editar Reclamo urgente" }));
    dialog = await screen.findByRole("dialog", { name: "Opciones de «Motivos de visita»" });
    await user.click(within(dialog).getByRole("textbox", { name: "Texto" }));
    await user.paste(" y grave");
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(textbox("Texto de Reclamo urgente")).toHaveValue("Reclamo urgente");
  });

  it("la lista lleva cada dato en su columna (263) y el Estado se elige en la pieza (262)", async () => {
    const { user } = await openEditor();
    await user.click(screen.getByRole("button", { name: "Editar Cobranza" }));
    const dialog = await screen.findByRole("dialog", { name: "Opciones de «Motivos de visita»" });
    const cobranza = optionsOf(dialog)[3];
    expect(cobranza).toHaveAttribute("aria-current", "true");
    // El número, el texto, «Nueva», «Se borra al guardar» o «De baja» y el código, cada uno en su columna, ninguno debajo de
    // otro. Una de baja lo dice con su palabra, no solo con el gris del texto (accesibilidad).
    expect([...cobranza.children].map((cell) => cell.textContent)).toEqual(["4", "Cobranza", "De baja", "COB"]);
    expect(optionsOf(dialog)[0].children[2]).toHaveTextContent(/^$/);
    expect(within(dialog).getByRole("button", { name: /^Estado/ })).toHaveTextContent("De baja");
    await choose(user, "Estado", "Activa");
    await user.click(within(dialog).getByRole("button", { name: "Listo" }));
    expect(screen.getByRole("checkbox", { name: "Activa: Cobranza" })).toBeChecked();
    expect(saveButton()).toBeEnabled();
  });

  it("«Quitar opción» en una guardada pregunta en el mismo diálogo y la deja «Se borra al guardar» con «Restaurar»; en una nueva, no pregunta", async () => {
    const { user } = await openEditor();
    await user.click(screen.getByRole("button", { name: "Editar Reclamo" }));
    const dialog = await screen.findByRole("dialog", { name: "Opciones de «Motivos de visita»" });
    await user.click(within(dialog).getByRole("button", { name: "Quitar opción" }));
    const question = await screen.findByRole("alertdialog", { name: "¿Borrar «Reclamo»?" });
    // Nunca un diálogo sobre otro: la pregunta ocupa el mismo.
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    await user.click(within(question).getByRole("button", { name: "Borrar opción" }));
    const back = await screen.findByRole("dialog", { name: "Opciones de «Motivos de visita»" });
    expect(optionsOf(back)[2]).toHaveTextContent("Se borra al guardar");
    expect(within(within(back).getByRole("region", { name: "Opción 3 de 4" })).getByText("Se borra al guardar")).toBeInTheDocument();
    await user.click(within(back).getByRole("button", { name: "Restaurar" }));
    expect(within(back).queryByText("Se borra al guardar")).not.toBeInTheDocument();

    await user.click(within(back).getByRole("button", { name: "Agregar opción" }));
    expect(optionsOf(back)).toHaveLength(5);
    await user.click(within(back).getByRole("button", { name: "Quitar opción" }));
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    expect(optionsOf(back)).toHaveLength(4);
  });

  it("si «Guardar cambios» encuentra un error, el modal se abre en la primera opción con problemas y la lista la marca con el triángulo", async () => {
    serve(() => HttpResponse.json({
      code: "Forms.Catalog.DuplicateCode", status: 400, title: "Bad Request", errors: { "items.0.code": ["Ya está en la opción 1."] }, n: 1,
    }, { status: 400 }));
    const { user } = await openEditor();
    await user.clear(textbox("Código de Venta nueva"));
    await user.paste("VTA");
    await user.click(saveButton());
    await waitFor(() => expect(puts).toHaveLength(1));
    const dialog = await screen.findByRole("dialog", { name: "Opciones de «Motivos de visita»" });
    const option = within(dialog).getByRole("region", { name: "Opción 2 de 4" });
    expect(within(option).getByText("Ya está en la opción 1.")).toBeInTheDocument();
    const [seguimiento, venta] = optionsOf(dialog);
    expect(within(venta).getByTitle("Tiene un error")).toBeInTheDocument();
    expect(within(seguimiento).queryByTitle("Tiene un error")).not.toBeInTheDocument();
  });

  it("un código repetido a la vista frena «Guardar cambios» sin mandar nada: el modal se abre en la opción que lo escribió, y la guardada que ya lo tenía no se marca", async () => {
    const { user } = await openEditor();
    await user.clear(textbox("Código de Venta nueva"));
    await user.paste("SEG");
    await user.click(saveButton());
    const dialog = await screen.findByRole("dialog", { name: "Opciones de «Motivos de visita»" });
    expect(within(within(dialog).getByRole("region", { name: "Opción 2 de 4" })).getByText("Ya está en la opción 1.")).toBeInTheDocument();
    const [seguimiento, venta] = optionsOf(dialog);
    expect(within(venta).getByTitle("Tiene un error")).toBeInTheDocument();
    expect(within(seguimiento).queryByTitle("Tiene un error")).not.toBeInTheDocument();
    expect(puts).toHaveLength(0);
  });

  it("un texto de más de 30 frena «Guardar cambios» sin mandar nada: el modal se abre en esa opción con su tope", async () => {
    const { user } = await openEditor();
    await user.clear(textbox("Texto de Reclamo"));
    await user.paste("Reclamo por un equipo que no enciende");
    await user.click(saveButton());
    const dialog = await screen.findByRole("dialog", { name: "Opciones de «Motivos de visita»" });
    expect(within(within(dialog).getByRole("region", { name: "Opción 3 de 4" })).getByText("Puede tener hasta 30 caracteres.")).toBeInTheDocument();
    expect(puts).toHaveLength(0);
  });

  it("en el teléfono, un código repetido frena «Guardar cambios» y abre la lista con la opción marcada", async () => {
    const restore = asPhone();
    try {
      const { user } = mountForms(formsOwner, path);
      await user.click(await screen.findByRole("button", { name: "Editar Venta nueva" }));
      const option = await screen.findByRole("dialog", { name: "Opción 2 de 4" });
      await user.clear(within(option).getByRole("textbox", { name: "Código" }));
      await user.paste("SEG");
      await user.click(within(option).getByRole("button", { name: "Volver a la lista" }));
      await user.click(within(await screen.findByRole("dialog", { name: "Opciones" })).getByRole("button", { name: "Listo" }));
      await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
      await user.click(saveButton());
      const list = await screen.findByRole("dialog", { name: "Opciones" });
      const [seguimiento, venta] = optionsOf(list);
      expect(within(venta).getByTitle("Tiene un error")).toBeInTheDocument();
      expect(within(seguimiento).queryByTitle("Tiene un error")).not.toBeInTheDocument();
      expect(puts).toHaveLength(0);
    } finally { restore(); }
  });

  it("el error de una celda describe su campo, y una nueva va con «—» sin número, tenue y «Sin dato» para el lector", async () => {
    serve(() => HttpResponse.json({
      code: "Forms.Catalog.DuplicateCode", status: 400, title: "Bad Request", errors: { "items.0.code": ["Ya está en la opción 1."] }, n: 1,
    }, { status: 400 }));
    const { user } = await openEditor();
    await user.clear(textbox("Código de Venta nueva"));
    await user.paste("VTA");
    await user.click(saveButton());
    await screen.findByRole("dialog", { name: "Opciones de «Motivos de visita»" });
    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(textbox("Código de Venta nueva")).toHaveAccessibleDescription("Ya está en la opción 1.");
    await user.click(screen.getByRole("button", { name: "Agregar opción" }));
    const dialog = await screen.findByRole("dialog", { name: "Opciones nuevas de «Motivos de visita»" });
    await user.click(within(dialog).getByRole("textbox", { name: "Texto" }));
    await user.paste("Garantía");
    await user.click(within(dialog).getByRole("button", { name: "Listo" }));
    const row = textbox("Texto de Garantía").closest("tr")!;
    expect(within(row).getByRole("img", { name: "Sin dato" })).toHaveTextContent("—");
  });

  it("a 390 px ocupa la pantalla: ✎ abre la opción con «Volver a la lista», y la lista cierra con «Listo»", async () => {
    const restore = asPhone();
    try {
      const { user } = mountForms(formsOwner, path);
      await user.click(await screen.findByRole("button", { name: "Editar Venta nueva" }));
      const dialog = await screen.findByRole("dialog", { name: "Opción 2 de 4" });
      expect(within(dialog).getByText("Motivos de visita")).toBeInTheDocument();
      await user.click(within(dialog).getByRole("textbox", { name: "Texto" }));
      await user.keyboard("{End}");
      await user.paste(" al interior");
      await user.click(within(dialog).getByRole("button", { name: "Volver a la lista" }));
      expect(await screen.findByRole("dialog", { name: "Opciones" })).toBe(dialog);
      expect(optionsOf(dialog)).toHaveLength(4);
      await user.click(optionsOf(dialog)[3]);
      expect(screen.getByRole("dialog", { name: "Opción 4 de 4" })).toBe(dialog);
      await user.click(within(dialog).getByRole("button", { name: "Volver a la lista" }));
      await user.click(within(dialog).getByRole("button", { name: "Listo" }));
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      expect(screen.getByText("Venta nueva al interior")).toBeInTheDocument();
    } finally { restore(); }
  });
});

// E13 · F3 (FRM-Catalogo-13, FRM-Catalogo-Opciones-13 y sus teléfonos): «Proveedores» con CUIT (texto, obligatorio), Zona (de
// «Zonas», obligatorio) y Plazo de pago (número entero); «Aislantes Norte» apunta a «Cuyo», que en «Zonas» está dada de baja.
describe("Una columna por campo (E13)", () => {
  const provPath = "/org/formularios/catalogos/c-proveedores";
  const field = (id: string, name: string, type: FormCatalogFieldDetail["type"], extra: Partial<FormCatalogFieldDetail> = {}): FormCatalogFieldDetail =>
    ({ id, key: name.toLowerCase().replace(/ /g, "_"), name, type, required: false, unique: false, isActive: true, valuesCount: 4, ...extra });
  const fields = [
    field("f-cuit", "CUIT", "Text", { required: true, maxLength: 13 }),
    field("f-zona", "Zona", "Catalog", { required: true, sourceCatalogId: "c-zonas", sourceCatalogName: "Zonas" }),
    field("f-plazo", "Plazo de pago", "WholeNumber", { valuesCount: 1 }),
  ];
  const proveedores: FormCatalogResponse = { ...catalog, id: "c-proveedores", name: "Proveedores", description: null, itemCounts: { total: 4, active: 3 },
    ...withoutFields(), fields, presentation: { title: ["text"], description: ["field:f-cuit", "field:f-zona"] } };
  const rows = [
    item("i-abr", 1, "Abrasivos del Sur", "PRV-0001", { fields: { "f-cuit": "30-71234567-1", "f-zona": "z-cap", "f-plazo": "30" } }),
    item("i-ace", 2, "Aceros Rosario", "PRV-0002", { fields: { "f-cuit": "30-70988123-4", "f-zona": "z-gba" } }),
    item("i-ais", 3, "Aislantes Norte", "PRV-0003", { fields: { "f-cuit": "33-71011223-9", "f-zona": "z-cuyo" } }),
    item("i-alu", 4, "Aluminios Cuyo", "PRV-0005", { isActive: false, fields: { "f-cuit": "30-71455890-7", "f-zona": "z-cap" } }),
  ];
  const zonas = [item("z-cap", 1, "Capital", "CAP"), item("z-gba", 2, "Gran Buenos Aires", "GBA"), item("z-cuyo", 3, "Cuyo", "CUY", { isActive: false })];
  const page = (items: FormCatalogItemRow[]) => HttpResponse.json({ items, page: 1, pageSize: 10, totalCount: items.length, totalPages: 1, hasPrevious: false, hasNext: false });

  let provPuts: UpdateFormCatalogRequest[] = [];
  function serveProveedores(put: () => Response = () => HttpResponse.json({ version: 8, itemIdentityMap: [], fieldIdentityMap: [] })) {
    provPuts = [];
    server.use(
      http.get(`${base}/c-proveedores`, () => HttpResponse.json(proveedores)),
      http.get(`${base}/c-proveedores/items`, () => page(rows)),
      // Las de un campo «De un catálogo»: por su identidad, también las de baja, o las activas para elegir (111).
      http.get(`${base}/c-zonas/items`, ({ request }) => {
        const ids = new URL(request.url).searchParams.getAll("ids");
        return page(ids.length ? zonas.filter((zona) => ids.includes(zona.id)) : zonas.filter((zona) => zona.isActive));
      }),
      http.put(`${base}/c-proveedores`, async ({ request }) => { provPuts.push(await request.json() as UpdateFormCatalogRequest); return put(); }),
    );
  }
  async function openProveedores() {
    const mounted = mountForms(formsOwner, provPath);
    await screen.findByRole("textbox", { name: "Texto de Abrasivos del Sur" });
    return mounted;
  }
  const saveReason = "Guardá el catálogo para cargar los valores de este campo.";
  const headers = () => screen.getAllByRole("columnheader").map((header) => header.textContent);

  beforeEach(() => serveProveedores());

  it("cada campo es una columna después del código y antes del detalle, con el control de su tipo, y «Columnas» las oculta con lo elegido en la URL", async () => {
    const { user, router } = await openProveedores();
    expect(headers()).toEqual(["", "#", "Texto", "Código", "CUIT", "Zona", "Plazo de pago", "Detalle", "Estado", "Acciones"]);
    expect(textbox("CUIT de Abrasivos del Sur")).toHaveValue("30-71234567-1");
    expect(textbox("CUIT de Abrasivos del Sur")).toHaveAttribute("maxlength", "13");
    expect(textbox("Plazo de pago de Abrasivos del Sur")).toHaveValue("30");
    expect(await screen.findByRole("button", { name: "Zona de Abrasivos del Sur Capital" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Agregar campos · 3" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Columnas" }));
    await user.click(await screen.findByRole("option", { name: "CUIT" }));
    await user.keyboard("{Escape}");
    expect(headers()).toEqual(["", "#", "Texto", "Código", "Zona", "Plazo de pago", "Detalle", "Estado", "Acciones"]);
    expect(new URLSearchParams(router.state.location.search).get("hiddenColumns")).toBe("f-cuit");
    expect(await axe(screen.getByRole("region", { name: "Opciones" }))).toHaveNoViolations();
  });

  it("un campo nuevo deja su columna y su fila del modal grisadas hasta guardar, con su motivo", async () => {
    const { user } = await openProveedores();
    await user.click(screen.getByRole("button", { name: "Agregar campos · 3" }));
    const fieldsDialog = await screen.findByRole("dialog", { name: "Campos de «Proveedores»" });
    await user.click(within(fieldsDialog).getByRole("button", { name: "Agregar campo" }));
    await user.paste("Rubro");
    await user.click(within(fieldsDialog).getByRole("button", { name: "Listo" }));
    expect(screen.getByRole("button", { name: "Agregar campos · 4" })).toBeInTheDocument();

    const header = screen.getAllByRole("columnheader").find((cell) => within(cell).queryByText("Rubro"))!;
    expect(within(header).getByText("Rubro")).toHaveAttribute("aria-disabled", "true");
    expect(within(header).getByText("Rubro")).toHaveAccessibleDescription(saveReason);
    const cell = textbox("Rubro de Abrasivos del Sur");
    expect(cell).toHaveAttribute("aria-disabled", "true");
    expect(cell).toHaveAccessibleDescription(saveReason);

    await user.click(screen.getByRole("button", { name: "Editar Abrasivos del Sur" }));
    const dialog = await screen.findByRole("dialog", { name: "Opciones de «Proveedores»" });
    expect(within(dialog).getByRole("textbox", { name: "Rubro" })).toHaveAttribute("aria-disabled", "true");
    expect(within(dialog).getByRole("textbox", { name: "Rubro" })).toHaveAccessibleDescription(saveReason);
    expect(within(dialog).getByRole("textbox", { name: "CUIT" })).toHaveValue("30-71234567-1");
  });

  it("el valor que apunta a una opción dada de baja se ve con «De baja», se conserva y no impide guardar (lección 1)", async () => {
    const { user } = await openProveedores();
    const zona = await screen.findByRole("button", { name: "Zona de Aislantes Norte Cuyo" });
    await user.click(zona);
    const chosen = await screen.findByRole("option", { name: /^Cuyo/ });
    expect(chosen).toHaveAttribute("aria-selected", "true");
    expect(chosen).toHaveTextContent("De baja");
    expect(await screen.findByRole("option", { name: /^Gran Buenos Aires/ })).toBeInTheDocument();
    await user.keyboard("{Escape}");

    await user.clear(textbox("CUIT de Aislantes Norte"));
    await user.paste("33-71011223-0");
    await user.click(saveButton());
    await waitFor(() => expect(provPuts).toHaveLength(1));
    // El delta: solo el campo que cambió; la zona dada de baja queda como estaba.
    expect(provPuts[0].items).toEqual([expect.objectContaining({ itemId: "i-ais", fields: { "f-cuit": "33-71011223-0" } })]);
  });

  it("«1.500» en un número da numberAmbiguous (207) sin mandar, y uno de 18 dígitos llega entero", async () => {
    const { user } = await openProveedores();
    await user.click(textbox("Plazo de pago de Aceros Rosario"));
    await user.paste("1.500");
    await user.click(saveButton());
    const dialog = await screen.findByRole("dialog", { name: "Opciones de «Proveedores»" });
    expect(provPuts).toHaveLength(0);
    const plazo = within(dialog).getByRole("textbox", { name: "Plazo de pago" });
    expect(plazo).toHaveAccessibleDescription(/Se puede leer de dos maneras/);
    await user.clear(plazo);
    await user.paste("123456789012345678");
    await user.click(within(dialog).getByRole("button", { name: "Listo" }));
    await user.click(saveButton());
    await waitFor(() => expect(provPuts).toHaveLength(1));
    expect(provPuts[0].items).toEqual([expect.objectContaining({ itemId: "i-ace", fields: { "f-plazo": "123456789012345678" } })]);
  });

  it("borrar una opción que es valor de otro catálogo dice «No se puede borrar: la usa otra opción.», en lugar del texto genérico", async () => {
    serveProveedores(() => HttpResponse.json({ status: 409, code: "Forms.Catalog.ItemInUse", traceId: "t",
      errors: { "deleteItems.0": ["No se puede borrar porque se usa. Podés darla de baja."] }, uses: ["options"] }, { status: 409 }));
    const { user } = await openProveedores();
    await user.click(screen.getByRole("button", { name: "Borrar Aceros Rosario" }));
    await user.click(await screen.findByRole("button", { name: "Borrar opción" }));
    await user.click(saveButton());
    expect((await screen.findAllByText("No se puede borrar: la usa otra opción. Podés darla de baja.")).length).toBeGreaterThan(0);
    expect(screen.queryByText(/No se puede borrar porque se usa/)).not.toBeInTheDocument();
  });

  it("cambiar el tipo manda sin frenar y muestra los errores del servidor arriba de la tabla y en cada fila; «Revisar» abre el campo (lección 4)", async () => {
    serveProveedores(() => HttpResponse.json({ status: 400, code: "Forms.Catalog.FieldTypeNotConvertible", traceId: "t",
      errors: { "fields.0.type": ["3 opciones tienen un valor que no es un número entero."] }, invalidCount: 3,
      invalidRows: [{ position: 1, itemId: "i-abr", text: "Abrasivos del Sur", reason: "invalid" }, { position: 2, itemId: "i-ace", text: "Aceros Rosario", reason: "invalid" },
        { position: 3, itemId: "i-ais", text: "Aislantes Norte", reason: "invalid" }] }, { status: 400 }));
    const { user } = await openProveedores();
    await user.click(screen.getByRole("button", { name: "Agregar campos · 3" }));
    const fieldsDialog = await screen.findByRole("dialog", { name: "Campos de «Proveedores»" });
    await user.click(within(fieldsDialog).getByRole("button", { name: pickerName("Tipo") }));
    await user.click(await screen.findByRole("option", { name: "Número entero" }));
    await user.click(within(fieldsDialog).getByRole("button", { name: "Listo" }));
    await user.click(saveButton());
    await waitFor(() => expect(provPuts).toHaveLength(1));

    expect(await screen.findByText("«CUIT» · Tipo: 3 opciones tienen un valor que no es un número entero.")).toBeInTheDocument();
    expect(textbox("CUIT de Abrasivos del Sur")).toHaveAccessibleDescription(/No es un valor válido\./);
    expect(textbox("CUIT de Aceros Rosario")).toHaveAccessibleDescription(/No es un valor válido\./);
    // La pantalla no tapa al servidor: se vuelve a mandar y él decide.
    await user.click(saveButton());
    await waitFor(() => expect(provPuts).toHaveLength(2));

    await user.click(screen.getByRole("button", { name: "Revisar" }));
    const review = await screen.findByRole("dialog", { name: "Campos de «Proveedores»" });
    expect(within(review).getByRole("textbox", { name: "Nombre" })).toHaveValue("CUIT");
    expect(within(review).getByText("3 opciones tienen un valor que no es un número entero.")).toBeInTheDocument();
  });

  it("«Reactivar» va en el ⋮ de la fila de una dada de baja (261)", async () => {
    const { user } = await openProveedores();
    expect(screen.getByRole("checkbox", { name: "Activa: Aluminios Cuyo" })).not.toBeChecked();
    // Los ⋮ (Radix) se abren con el teclado en jsdom, como en RowActions.test.
    screen.getByRole("button", { name: "Acciones de Aluminios Cuyo" }).focus();
    await user.keyboard("{Enter}");
    await user.click(await screen.findByRole("menuitem", { name: /Reactivar/ }));
    expect(screen.getByRole("checkbox", { name: "Activa: Aluminios Cuyo" })).toBeChecked();
  });
});

describe("OptionsDialog, lo que se ve (FRM-Catalogo-Opciones y M-FRM-Catalogo-Opciones, verificación de la E12)", () => {
  it("«Sin código» va entero en su columna, la columna de rótulos mide 149 y la marca de error es el círculo con «!»", async () => {
    serve(() => HttpResponse.json({
      code: "Forms.Catalog.DuplicateCode", status: 400, title: "Bad Request", errors: { "items.0.code": ["Ya está en la opción 1."] }, n: 1,
    }, { status: 400 }));
    const { user } = await openEditor();
    await user.clear(textbox("Código de Venta nueva"));
    await user.paste("VTA");
    await user.click(saveButton());
    const dialog = await screen.findByRole("dialog", { name: "Opciones de «Motivos de visita»" });
    const [, venta] = optionsOf(dialog);
    expect(within(venta).getByTitle("Tiene un error").querySelector("svg")).toHaveClass("lucide-circle-alert", "size-4.5");
    const label = within(dialog).getAllByText("Texto")[0].closest("div.md\\:grid");
    expect(label).toHaveClass("md:grid-cols-[9.3125rem_minmax(0,1fr)]");
    await user.click(within(dialog).getByRole("button", { name: "Agregar opción" }));
    const noCode = within(dialog).getByText("Sin código");
    expect(noCode).toHaveClass("whitespace-nowrap");
    expect(noCode).not.toHaveClass("break-all");
  });

  it("en el teléfono, la lista va en una tarjeta, con el número en un círculo y «Código» arriba de su valor", async () => {
    const restore = asPhone();
    try {
      const { user } = mountForms(formsOwner, path);
      await user.click(await screen.findByRole("button", { name: "Editar Venta nueva" }));
      const option = await screen.findByRole("dialog", { name: "Opción 2 de 4" });
      await user.click(within(option).getByRole("button", { name: "Volver a la lista" }));
      const dialog = await screen.findByRole("dialog", { name: "Opciones" });
      const list = within(dialog).getByRole("list", { name: "Opciones" });
      expect(list).toHaveClass("rounded-[0.875rem]");
      const [seguimiento] = within(list).getAllByRole("button");
      expect(within(seguimiento).getByText("1")).toHaveClass("rounded-full");
      expect(within(seguimiento).getByText("Código").nextElementSibling).toHaveTextContent("SEG");
    } finally { restore(); }
  });
});
