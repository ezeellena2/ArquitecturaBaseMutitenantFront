import { screen, waitFor, within } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import { server } from "@/test/mocks/server";
import { choose } from "@/test/picker";
import type { FormCatalogItemRow, FormCatalogResponse, UpdateFormCatalogRequest } from "../api/types";
import { formsOwner, formsReader, mountForms } from "../test/support";

const base = "/api/organization/forms/catalogs";
const path = "/org/formularios/catalogos/c-motivos";
const catalog = (extra: Partial<FormCatalogResponse> = {}): FormCatalogResponse => ({
  id: "c-motivos", name: "Motivos de visita", description: "Por qué se visita a un cliente.", source: "Manual", valueType: "Text",
  isActive: true, usable: true, canManage: true, itemCounts: { total: 4, active: 3 }, modifiedAtUtc: "2026-11-20T13:00:00Z", version: 7, ...extra,
});
const item = (id: string, position: number, text: string, code: string, extra: Partial<FormCatalogItemRow> = {}): FormCatalogItemRow =>
  ({ id, position, text, code, detail: null, value: null, isActive: true, textRepeated: false, ...extra });
// Tablero FRM-Catalogo, «Sin cambios»: cuatro opciones, «Cobranza» dada de baja.
const motivos = [
  item("i-seg", 1, "Seguimiento", "SEG", { detail: "Visita programada a un cliente actual" }),
  item("i-ven", 2, "Venta nueva", "VEN", { detail: "Primera visita a un cliente" }),
  item("i-rec", 3, "Reclamo", "REC", { detail: "Hay un problema para resolver" }),
  item("i-cob", 4, "Cobranza", "COB", { detail: "Cobrar un pago pendiente", isActive: false }),
];
const paged = (items: FormCatalogItemRow[], page = 1, totalCount = items.length) =>
  ({ items, page, pageSize: 10, totalCount, totalPages: Math.max(1, Math.ceil(totalCount / 10)), hasPrevious: page > 1, hasNext: page * 10 < totalCount });

let puts: UpdateFormCatalogRequest[] = [];
function serve({ detail = catalog(), items = motivos, put = () => HttpResponse.json({ version: 8, itemIdentityMap: [] }) }: {
  detail?: FormCatalogResponse; items?: FormCatalogItemRow[] | ((url: URL) => ReturnType<typeof paged>); put?: () => Response;
} = {}) {
  puts = [];
  server.use(
    http.get(`${base}/c-motivos`, () => HttpResponse.json(detail)),
    http.get(`${base}/c-motivos/items`, ({ request }) => HttpResponse.json(typeof items === "function" ? items(new URL(request.url)) : paged(items))),
    http.put(`${base}/c-motivos`, async ({ request }) => { puts.push(await request.json() as UpdateFormCatalogRequest); return put(); }),
  );
}

async function openEditor(me = formsOwner) {
  const mounted = mountForms(me, path);
  await screen.findByRole("textbox", { name: "Texto de Seguimiento" });
  return mounted;
}

const textbox = (name: string) => screen.getByRole("textbox", { name });
/** Los ⋮ (Radix) se abren con el teclado en jsdom, como en RowActions.test. */
async function openMenu(user: { keyboard: (text: string) => Promise<void> }, name: string) {
  screen.getByRole("button", { name }).focus();
  await user.keyboard("{Enter}");
}
const saveButton = () => screen.getByRole("button", { name: "Guardar cambios" });

beforeAll(async () => { await import("./CatalogEditorPage"); });
beforeEach(() => serve());
vi.setConfig({ testTimeout: 20_000 });

describe("CatalogEditorPage (FRM-Catalogo)", () => {
  it("abre con «El catálogo», la vista previa y la tabla editable, sin cambios para guardar y sin problemas de accesibilidad", async () => {
    const { container } = await openEditor();
    expect(screen.getByText("Escritas a mano · Texto")).toBeInTheDocument();
    expect(textbox("Texto de Seguimiento")).toHaveValue("Seguimiento");
    expect(screen.getByRole("group", { name: "Cómo se elige" })).toBeInTheDocument();
    expect(saveButton()).toBeDisabled();
    expect(await axe(container)).toHaveNoViolations();
  });

  it("borrar pregunta y deja la opción «Se borra al guardar»; «Restaurar», en el ⋮ de la fila, la devuelve, y ↑ ↓ dicen por qué están apagados", async () => {
    const { user } = await openEditor();
    await user.click(screen.getByRole("button", { name: "Borrar Reclamo" }));
    const dialog = await screen.findByRole("dialog", { name: "¿Borrar «Reclamo»?" });
    expect(within(dialog).getByText("Se borra al guardar el catálogo. Hasta entonces se puede restaurar.")).toBeInTheDocument();
    await user.click(within(dialog).getByRole("button", { name: "Borrar opción" }));
    expect(await screen.findByText("Se borra al guardar")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Subir Venta nueva" })).toHaveAttribute("aria-disabled", "true");
    expect(screen.getAllByText("Guardá o descartá el borrado pendiente para mover opciones.").length).toBeGreaterThan(0);
    await openMenu(user, "Acciones de Reclamo");
    await user.click(await screen.findByRole("menuitem", { name: /Restaurar/ }));
    expect(screen.queryByText("Se borra al guardar")).not.toBeInTheDocument();
    expect(saveButton()).toBeDisabled();
  });

  it("una opción nueva se quita sin preguntar y no se puede mover hasta guardarla", async () => {
    const { user } = await openEditor();
    await user.click(screen.getByRole("button", { name: "Agregar opción" }));
    expect(screen.getByRole("button", { name: "Subir Opción nueva" })).toHaveAttribute("aria-disabled", "true");
    await user.click(screen.getByRole("button", { name: "Quitar Opción nueva" }));
    expect(screen.queryByRole("textbox", { name: "Texto de Opción nueva" })).not.toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("mover deja el movimiento pendiente, con «Descartar movimientos»; apaga el 🗑 y «Ordenar por…» con su motivo, y el PUT lleva los movimientos", async () => {
    const { user } = await openEditor();
    await user.click(screen.getByRole("button", { name: "Bajar Seguimiento" }));
    const rows = screen.getAllByRole("row").slice(1);
    expect(within(rows[0]).getByRole("textbox", { name: "Texto de Venta nueva" })).toBeInTheDocument();
    expect(screen.getByText("1 movimiento pendiente. Se aplica al guardar.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Borrar Reclamo" })).toHaveAttribute("aria-disabled", "true");
    await openMenu(user, "Más acciones de las opciones");
    expect(await screen.findByRole("menuitem", { name: /Ordenar por…/ })).toHaveAttribute("aria-disabled", "true");
    await user.keyboard("{Escape}");
    await user.click(saveButton());
    await waitFor(() => expect(puts).toHaveLength(1));
    expect(puts[0]).toMatchObject({ version: 7, moves: [{ itemId: "i-seg", direction: "Down" }] });
    expect(puts[0].items).toBeUndefined();
  });

  it("«Descartar movimientos» vuelve al orden guardado", async () => {
    const { user } = await openEditor();
    await user.click(screen.getByRole("button", { name: "Bajar Seguimiento" }));
    await user.click(screen.getByRole("button", { name: "Descartar movimientos" }));
    expect(within(screen.getAllByRole("row")[1]).getByRole("textbox", { name: "Texto de Seguimiento" })).toBeInTheDocument();
    expect(saveButton()).toBeDisabled();
  });

  it("«Ordenar por…» elige la columna y el orden en la pieza; queda pendiente con «Cancelar orden» y viaja al guardar", async () => {
    const { user } = await openEditor();
    await openMenu(user, "Más acciones de las opciones");
    await user.click(await screen.findByRole("menuitem", { name: /Ordenar por…/ }));
    const dialog = await screen.findByRole("dialog", { name: "Ordenar las opciones" });
    await choose(user, "Columna", "Código");
    await choose(user, "Orden", "De la Z a la A");
    await user.click(within(dialog).getByRole("button", { name: "Ordenar" }));
    expect(await screen.findByText("Se ordenará por «Código», de la Z a la A, al guardar.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Borrar Reclamo" })).toHaveAttribute("aria-disabled", "true");
    await user.click(screen.getByRole("button", { name: "Cancelar orden" }));
    expect(screen.queryByText(/Se ordenará por/)).not.toBeInTheDocument();
    await openMenu(user, "Más acciones de las opciones");
    await user.click(await screen.findByRole("menuitem", { name: /Ordenar por…/ }));
    await user.click(within(await screen.findByRole("dialog", { name: "Ordenar las opciones" })).getByRole("button", { name: "Ordenar" }));
    await user.click(saveButton());
    await waitFor(() => expect(puts).toHaveLength(1));
    expect(puts[0].sort).toEqual({ column: "Text", descending: false });
  });

  it("guardar manda solo la opción que cambió y conserva el lugar: la página, las filas a la vista y el desplazamiento (F7 del traspaso 15)", async () => {
    const many = Array.from({ length: 12 }, (_, index) => item(`i-${index + 1}`, index + 1, `Opción ${index + 1}`, `O${index + 1}`));
    serve({ items: (url) => { const page = Number(url.searchParams.get("page") ?? "1"); return paged(many.slice((page - 1) * 10, page * 10), page, many.length); } });
    const scrollTo = vi.spyOn(window, "scrollTo").mockImplementation(() => undefined);
    const { user } = mountForms(formsOwner, path);
    await screen.findByRole("textbox", { name: "Texto de Opción 1" });
    await user.click(screen.getByRole("button", { name: /Página siguiente|Siguiente/ }));
    const field = await screen.findByRole("textbox", { name: "Texto de Opción 11" });
    await user.clear(field);
    await user.type(field, "Opción once");
    await user.click(saveButton());
    await waitFor(() => expect(puts).toHaveLength(1));
    expect(puts[0].items).toEqual([{ itemId: "i-11", code: "O11", text: "Opción once", detail: null, value: null, isActive: true }]);
    expect(await screen.findByText("Guardamos el catálogo.")).toBeInTheDocument();
    // Sigue en la página 2, con sus filas a la vista: la tabla no se vació mientras se releía.
    expect(screen.getByRole("textbox", { name: "Texto de Opción 12" })).toBeInTheDocument();
    expect(screen.queryByRole("textbox", { name: "Texto de Opción 1" })).not.toBeInTheDocument();
    expect(scrollTo).not.toHaveBeenCalled();
    scrollTo.mockRestore();
  });

  it("si algo usa la opción que se borra, se dice qué: con dos motivos de `uses`, se ve el primero", async () => {
    serve({ put: () => HttpResponse.json({
      code: "Forms.Catalog.ItemInUse", status: 409, title: "Conflict", errors: { "deleteItems[0]": ["No se puede borrar porque se usa. Podés darla de baja."] },
      uses: ["FormQuestion", "AssistantDraft"],
    }, { status: 409 }) });
    const { user } = await openEditor();
    await user.click(screen.getByRole("button", { name: "Borrar Reclamo" }));
    await user.click(await screen.findByRole("button", { name: "Borrar opción" }));
    await user.click(saveButton());
    expect(await screen.findByText("No se puede borrar porque se usa. Podés darla de baja. FormQuestion")).toBeInTheDocument();
    expect(screen.queryByText(/AssistantDraft/)).not.toBeInTheDocument();
  });

  it("«Reactivar», en el ⋮ de una dada de baja, la vuelve a activar", async () => {
    const { user } = await openEditor();
    expect(screen.getByRole("checkbox", { name: "Activa: Cobranza" })).not.toBeChecked();
    await openMenu(user, "Acciones de Cobranza");
    await user.click(await screen.findByRole("menuitem", { name: /Reactivar/ }));
    expect(screen.getByRole("checkbox", { name: "Activa: Cobranza" })).toBeChecked();
    expect(saveButton()).toBeEnabled();
  });

  it("en un catálogo decimal, «1.500» en el valor da numberAmbiguous y uno de 18 dígitos llega entero (207 y C6)", async () => {
    serve({ detail: catalog({ name: "Recargo por zona", valueType: "DecimalNumber" }), items: [item("i-cap", 1, "Capital", "CAP", { value: "2500.00" })] });
    const { user } = mountForms(formsOwner, path);
    const value = await screen.findByRole("textbox", { name: "Valor de Capital" });
    expect(value).toHaveValue("2.500,00");
    await user.clear(value);
    await user.type(value, "1.500");
    expect(await screen.findByText("Se puede leer de dos maneras: escribilo sin separador de miles, como 1500 o 1500,5.")).toBeInTheDocument();
    await user.click(saveButton());
    expect(puts).toHaveLength(0);
    await user.clear(value);
    await user.type(value, "123456789012345678");
    await user.click(saveButton());
    await waitFor(() => expect(puts).toHaveLength(1));
    expect(puts[0].items?.[0].value).toBe("123456789012345678");
  });

  it("si otra persona guardó, la revisión lado a lado; «Seguir editando» conserva lo escrito", async () => {
    let calls = 0;
    serve({ put: () => HttpResponse.json({ code: "General.ConcurrencyConflict", status: 409, title: "Conflict" }, { status: 409 }) });
    server.use(http.get(`${base}/c-motivos`, () => HttpResponse.json(catalog(calls++ === 0 ? {} : { modifiedBy: "Laura Ríos", version: 8, itemCounts: { total: 5, active: 4 } }))));
    const { user } = await openEditor();
    const field = textbox("Texto de Seguimiento");
    await user.clear(field);
    await user.type(field, "Seguimiento programado");
    await user.click(saveButton());
    const dialog = await screen.findByRole("dialog", { name: "Otra persona guardó el catálogo" });
    expect(within(dialog).getByText("Laura Ríos lo guardó mientras lo editabas. Tus cambios se conservan hasta que elijas.")).toBeInTheDocument();
    expect(within(dialog).getByRole("region", { name: "Tus cambios" })).toHaveTextContent("Seguimiento programado");
    expect(within(dialog).getByRole("region", { name: "Lo guardado ahora" })).toHaveTextContent("5 · 4 activas");
    await user.click(within(dialog).getByRole("button", { name: "Seguir editando" }));
    expect(field).toHaveValue("Seguimiento programado");
  });

  it("«Dar de baja», en el ⋮ de la banda, pregunta y manda el PUT con la versión y isActive", async () => {
    const { user } = await openEditor();
    await openMenu(user, "Acciones de Motivos de visita");
    await user.click(await screen.findByRole("menuitem", { name: /Dar de baja/ }));
    const dialog = await screen.findByRole("dialog", { name: "¿Dar de baja «Motivos de visita»?" });
    await user.click(within(dialog).getByRole("button", { name: "Dar de baja" }));
    await waitFor(() => expect(puts).toEqual([{ version: 7, isActive: false }]));
  });

  it("con solo formcatalogs.read: la tabla de lectura, sin casillas ni guardar, con Exportar", async () => {
    serve({ detail: catalog({ canManage: false }) });
    mountForms(formsReader, path);
    expect(await screen.findByText("Seguimiento")).toBeInTheDocument();
    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
    expect(screen.queryByRole("textbox", { name: "Texto de Seguimiento" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Guardar cambios" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Agregar opción" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Exportar" })).toBeInTheDocument();
    expect(screen.getByText("De baja")).toBeInTheDocument();
  });
});
