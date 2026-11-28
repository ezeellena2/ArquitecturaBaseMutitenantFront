import { screen, waitFor, within } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import { server } from "@/test/mocks/server";
import { choose, pickerName } from "@/test/picker";
import { asPhone } from "@/test/utils/phone";
import type { FormCatalogItemRow, FormCatalogResponse, UpdateFormCatalogRequest } from "../api/types";
import { formsOwner, formsReader, mountForms, withoutFields } from "../test/support";

const base = "/api/organization/forms/catalogs";
const path = "/org/formularios/catalogos/c-motivos";
const catalog = (extra: Partial<FormCatalogResponse> = {}): FormCatalogResponse => ({
  id: "c-motivos", name: "Motivos de visita", description: "Por qué se visita a un cliente.", source: "Manual", valueType: "Text",
  isActive: true, usable: true, canManage: true, itemCounts: { total: 4, active: 3 }, modifiedAtUtc: "2026-11-20T13:00:00Z", version: 7, ...withoutFields(), ...extra,
});
const item = (id: string, position: number, text: string, code: string, extra: Partial<FormCatalogItemRow> = {}): FormCatalogItemRow =>
  ({ id, position, text, code, detail: null, value: null, isActive: true, textRepeated: false, fields: {}, ...extra });
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
    // «Agregar opción» abre el modal de opciones (117); lo escrito queda en la tabla con «Listo».
    await user.click(screen.getByRole("button", { name: "Agregar opción" }));
    const dialog = await screen.findByRole("dialog", { name: "Opciones nuevas de «Motivos de visita»" });
    await user.type(within(dialog).getByRole("textbox", { name: "Texto" }), "Garantía");
    await user.click(within(dialog).getByRole("button", { name: "Listo" }));
    expect(screen.getByRole("button", { name: "Subir Garantía" })).toHaveAttribute("aria-disabled", "true");
    await user.click(screen.getByRole("button", { name: "Quitar Garantía" }));
    expect(screen.queryByRole("textbox", { name: "Texto de Garantía" })).not.toBeInTheDocument();
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
    // El contrato exige el nombre, la versión e isActive en cada guardado (C3).
    expect(puts[0]).toMatchObject({ version: 7, isActive: true, name: "Motivos de visita", moves: [{ itemId: "i-seg", direction: "Down" }] });
    expect(puts[0].items).toBeUndefined();
  });

  it("«Ordenar por…», abierto desde el ⋮, devuelve el foco a ese botón al cerrar (formularios)", async () => {
    const { user } = await openEditor();
    await openMenu(user, "Más acciones de las opciones");
    await user.click(await screen.findByRole("menuitem", { name: /Ordenar por…/ }));
    await user.click(within(await screen.findByRole("dialog", { name: "Ordenar las opciones" })).getByRole("button", { name: "Cancelar" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(screen.getByRole("button", { name: "Más acciones de las opciones" })).toHaveFocus();
  });

  it("en la vista previa, las opciones se marcan también con el teclado (accesibilidad)", async () => {
    const { user } = await openEditor();
    const preview = screen.getByRole("group", { name: "Así lo ve quien lo recibe" });
    await user.click(within(preview).getByRole("button", { name: /Elegí una opción/ }));
    within(preview).getByRole("button", { name: "Pregunta" }).focus();
    await user.tab();
    const first = within(preview).getByRole("radio", { name: /^Seguimiento/ });
    expect(first).toHaveFocus();
    await user.keyboard(" ");
    expect(first).toBeChecked();
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

  it("lo cambiado en otra página viaja al guardar, y su rechazo se ve en esa opción, aunque se guarde desde otra página", async () => {
    const many = Array.from({ length: 12 }, (_, index) => item(`i-${index + 1}`, index + 1, `Opción ${index + 1}`, `O${index + 1}`));
    serve({
      items: (url) => { const page = Number(url.searchParams.get("page") ?? "1"); return paged(many.slice((page - 1) * 10, page * 10), page, many.length); },
      put: () => puts.length === 1
        ? HttpResponse.json({ code: "Forms.Catalog.DuplicateCode", status: 409, title: "Conflict", errors: { "items.1.code": ["Ya hay otra opción con ese código."] } }, { status: 409 })
        : HttpResponse.json({ version: 8, itemIdentityMap: [] }),
    });
    const { user } = mountForms(formsOwner, path);
    const first = await screen.findByRole("textbox", { name: "Código de Opción 1" });
    await user.clear(first);
    await user.paste("O99");
    await user.click(screen.getByRole("button", { name: /Página siguiente|Siguiente/ }));
    const field = await screen.findByRole("textbox", { name: "Texto de Opción 11" });
    await user.clear(field);
    await user.paste("Opción once");
    await user.click(saveButton());
    await waitFor(() => expect(puts).toHaveLength(1));
    // La de la página a la vista va primero; la de la página 1, después.
    expect(puts[0].items?.map((input) => input.itemId)).toEqual(["i-11", "i-1"]);
    expect(puts[0].items?.[1]).toMatchObject({ itemId: "i-1", code: "O99", text: "Opción 1" });
    // El rechazo de la de la página 1 se ve en ella: el modal de opciones se abre en la que tiene el problema (117).
    const dialog = await screen.findByRole("dialog", { name: "Opciones de «Motivos de visita»" });
    expect(within(dialog).getByText("11–12 de 12")).toBeInTheDocument();
    expect(within(dialog).getByText("Ya hay otra opción con ese código.")).toBeInTheDocument();
  });

  it("lo cambiado en dos páginas y antes de buscar viaja junto al guardar, y después cada opción se ve en su página con su valor nuevo (T09-01)", async () => {
    let many = Array.from({ length: 12 }, (_, index) => item(`i-${index + 1}`, index + 1, `Opción ${index + 1}`, `O${index + 1}`));
    serve({
      items: (url) => {
        const page = Number(url.searchParams.get("page") ?? "1");
        const search = url.searchParams.get("search")?.toLocaleLowerCase();
        const found = search ? many.filter((row) => row.text.toLocaleLowerCase().includes(search)) : many;
        return paged(found.slice((page - 1) * 10, page * 10), page, found.length);
      },
      // Lo guardado queda en el servidor: una relectura ya trae lo nuevo.
      put: () => {
        const sent = puts[puts.length - 1].items ?? [];
        many = many.map((row) => {
          const input = sent.find((candidate) => candidate.itemId === row.id);
          return input ? { ...row, code: input.code ?? row.code, text: input.text ?? row.text } : row;
        });
        return HttpResponse.json({ version: 8, itemIdentityMap: [] });
      },
    });
    const { user } = mountForms(formsOwner, path);
    const first = await screen.findByRole("textbox", { name: "Código de Opción 1" });
    await user.clear(first);
    await user.paste("O99");
    await user.click(screen.getByRole("button", { name: /Página siguiente|Siguiente/ }));
    const field = await screen.findByRole("textbox", { name: "Texto de Opción 11" });
    await user.clear(field);
    await user.paste("Opción once");
    const search = screen.getByRole("searchbox", { name: "Buscar opción" });
    await user.type(search, "Opción 5");
    await screen.findByRole("textbox", { name: "Texto de Opción 5" });
    // La búsqueda no las trae, pero las dos cambiadas siguen a la vista.
    expect(textbox("Código de Opción 1")).toHaveValue("O99");
    expect(textbox("Texto de Opción once")).toHaveValue("Opción once");
    await user.click(saveButton());
    await waitFor(() => expect(puts).toHaveLength(1));
    expect(puts[0].items).toEqual([
      { itemId: "i-1", code: "O99", text: "Opción 1", detail: null, value: null, isActive: true },
      { itemId: "i-11", code: "O11", text: "Opción once", detail: null, value: null, isActive: true },
    ]);
    expect(await screen.findByText("Guardamos el catálogo.")).toBeInTheDocument();
    // Sin la búsqueda, cada una se ve en su página con lo guardado, sin pasar antes por lo que tenía.
    await user.clear(search);
    expect(await screen.findByRole("textbox", { name: "Código de Opción 1" })).toHaveValue("O99");
    await user.click(screen.getByRole("button", { name: /Página siguiente|Siguiente/ }));
    await screen.findByRole("textbox", { name: "Texto de Opción 12" });
    expect(textbox("Texto de Opción once")).toHaveValue("Opción once");
    expect(screen.queryByRole("textbox", { name: "Texto de Opción 11" })).not.toBeInTheDocument();
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
    // El modal de opciones se abre en la que tiene el problema (117).
    const dialog = await screen.findByRole("dialog", { name: "Opciones de «Motivos de visita»" });
    expect(within(dialog).getByText("No se puede borrar porque se usa. Podés darla de baja. FormQuestion")).toBeInTheDocument();
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
    // Antes de intentar guardar, nada va en rojo (formularios, decisión del 2026-10-24).
    const ambiguous = "Se puede leer de dos maneras: escribilo sin separador de miles, como 1500 o 1500,5.";
    expect(screen.queryByText(ambiguous)).not.toBeInTheDocument();
    expect(value).not.toHaveAttribute("aria-invalid");
    await user.click(saveButton());
    expect(puts).toHaveLength(0);
    // El modal de opciones se abre en la que tiene el problema (117), con su error, y ahí se corrige.
    const dialog = await screen.findByRole("dialog", { name: "Opciones de «Recargo por zona»" });
    expect(within(dialog).getByText(ambiguous)).toBeInTheDocument();
    const modalValue = within(dialog).getByRole("textbox", { name: "Valor (decimal)" });
    expect(modalValue).toHaveValue("1.500");
    await user.clear(modalValue);
    await user.type(modalValue, "123456789012345678");
    await user.click(within(dialog).getByRole("button", { name: "Listo" }));
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
    // O15: «Qué cambió», el dato una vez y cada versión en su columna, solo lo distinto: la opción que cambió y las cantidades.
    const changes = within(dialog).getAllByRole("listitem").map((row) => row.textContent);
    expect(changes).toEqual([
      "Opción 1 · TextoTus cambios: Seguimiento programadoLo guardado ahora: Seguimiento",
      "OpcionesTus cambios: 4 · 3 activasLo guardado ahora: 5 · 4 activas",
    ]);
    await user.click(within(dialog).getByRole("button", { name: "Seguir editando" }));
    expect(field).toHaveValue("Seguimiento programado");
    // Otro 409 vuelve a leer lo guardado ahora: la revisión no muestra la lectura anterior.
    const reads = calls;
    await user.click(saveButton());
    expect(await screen.findByRole("dialog", { name: "Otra persona guardó el catálogo" })).toBeVisible();
    await waitFor(() => expect(calls).toBe(reads + 1));
  });

  it("«Dar de baja», en el ⋮ de la banda, pregunta y manda el mismo PUT: la versión, el nombre, lo pendiente e isActive", async () => {
    const { user } = await openEditor();
    const field = textbox("Texto de Seguimiento");
    // Pegado y no tipeado letra por letra: cada test entra en 5 s (tests).
    await user.clear(field);
    await user.paste("Seguimiento programado");
    await openMenu(user, "Acciones de Motivos de visita");
    await user.click(await screen.findByRole("menuitem", { name: /Dar de baja/ }));
    const dialog = await screen.findByRole("dialog", { name: "¿Dar de baja «Motivos de visita»?" });
    await user.click(within(dialog).getByRole("button", { name: "Dar de baja" }));
    await waitFor(() => expect(puts).toHaveLength(1));
    expect(puts[0]).toMatchObject({
      version: 7, isActive: false, name: "Motivos de visita", description: "Por qué se visita a un cliente.",
      items: [{ itemId: "i-seg", text: "Seguimiento programado" }],
    });
    expect(await screen.findByText("Dimos de baja el catálogo.")).toBeVisible();
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });

  it("si otra persona guardó, «Dar de baja» abre la revisión lado a lado y «Ver lo nuevo» se lleva el 409", async () => {
    let calls = 0;
    serve({ put: () => HttpResponse.json({ code: "General.ConcurrencyConflict", status: 409, title: "Conflict" }, { status: 409 }) });
    server.use(http.get(`${base}/c-motivos`, () => HttpResponse.json(catalog(calls++ === 0 ? {} : { modifiedBy: "Laura Ríos", version: 8 }))));
    const { user } = await openEditor();
    await openMenu(user, "Acciones de Motivos de visita");
    await user.click(await screen.findByRole("menuitem", { name: /Dar de baja/ }));
    await user.click(within(await screen.findByRole("dialog", { name: "¿Dar de baja «Motivos de visita»?" })).getByRole("button", { name: "Dar de baja" }));
    const review = await screen.findByRole("dialog", { name: "Otra persona guardó el catálogo" });
    await user.click(within(review).getByRole("button", { name: "Ver lo nuevo" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(screen.queryByText("Otra persona cambió esto mientras lo editabas.")).not.toBeInTheDocument();
  });

  it("si otra persona guardó al dar de baja, «Seguir editando» cierra la revisión sin dejar el cartel del 409 y conserva lo escrito", async () => {
    let calls = 0;
    serve({ put: () => HttpResponse.json({ code: "General.ConcurrencyConflict", status: 409, title: "Conflict" }, { status: 409 }) });
    server.use(http.get(`${base}/c-motivos`, () => HttpResponse.json(catalog(calls++ === 0 ? {} : { modifiedBy: "Laura Ríos", version: 8 }))));
    const { user } = await openEditor();
    const field = textbox("Texto de Seguimiento");
    await user.clear(field);
    await user.paste("Seguimiento programado");
    await openMenu(user, "Acciones de Motivos de visita");
    await user.click(await screen.findByRole("menuitem", { name: /Dar de baja/ }));
    await user.click(within(await screen.findByRole("dialog", { name: "¿Dar de baja «Motivos de visita»?" })).getByRole("button", { name: "Dar de baja" }));
    const review = await screen.findByRole("dialog", { name: "Otra persona guardó el catálogo" });
    await user.click(within(review).getByRole("button", { name: "Seguir editando" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(screen.queryByText("Otra persona cambió esto mientras lo editabas.")).not.toBeInTheDocument();
    expect(field).toHaveValue("Seguimiento programado");
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

describe("CatalogEditorPage: un catálogo nuevo", () => {
  it("cambiar el tipo o el origen con opciones cargadas pregunta antes, con lo que se va (162), y «Cambiar» las quita", async () => {
    const { user } = mountForms(formsOwner, "/org/formularios/catalogos/nuevo");
    await user.click(await screen.findByRole("button", { name: "Agregar opción" }));
    const options = await screen.findByRole("dialog", { name: "Opciones nuevas" });
    await user.type(within(options).getByRole("textbox", { name: "Texto" }), "Garantía");
    await user.click(within(options).getByRole("button", { name: "Listo" }));
    expect(screen.getByRole("textbox", { name: "Texto de Garantía" })).toBeInTheDocument();
    await choose(user, "Tipo de valor", "Número entero");
    let dialog = await screen.findByRole("dialog", { name: "¿Cambiar a Número entero?" });
    expect(dialog).toHaveTextContent("Se quita la opción cargada.");
    await user.click(within(dialog).getByRole("button", { name: "Cancelar" }));
    expect(screen.getByRole("button", { name: pickerName("Tipo de valor") })).toHaveAccessibleName(/Texto/);
    expect(screen.getByRole("textbox", { name: "Texto de Garantía" })).toBeInTheDocument();
    await choose(user, "De dónde salen las opciones", /De los miembros/);
    dialog = await screen.findByRole("dialog", { name: "¿Cambiar a De los miembros?" });
    await user.click(within(dialog).getByRole("button", { name: "Cambiar" }));
    await choose(user, "De dónde salen las opciones", /Escritas a mano/);
    expect(screen.queryByRole("textbox", { name: "Texto de Garantía" })).not.toBeInTheDocument();
  });
});

describe("CatalogEditorPage: crear (idempotencia)", () => {
  it("si «Crear catálogo» falla, el reintento manda la misma Idempotency-Key y el catálogo se crea una vez", async () => {
    const keys: (string | null)[] = [];
    server.use(http.post(base, ({ request }) => {
      keys.push(request.headers.get("Idempotency-Key"));
      return keys.length === 1 ? HttpResponse.error() : HttpResponse.json({ catalog: catalog(), itemIdentityMap: [] }, { status: 201 });
    }));
    const { user, router } = mountForms(formsOwner, "/org/formularios/catalogos/nuevo");
    await user.type(await screen.findByRole("textbox", { name: /^Nombre/ }), "Motivos de visita");
    await user.click(screen.getByRole("button", { name: "Crear catálogo" }));
    expect(await screen.findByText("No pudimos conectarnos. Revisá tu conexión.")).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Crear catálogo" }));
    await waitFor(() => expect(router.state.location.pathname).toBe(path));
    expect(keys).toHaveLength(2);
    expect(keys[0]).toMatch(/^[0-9a-f-]{36}$/);
    expect(keys[1]).toBe(keys[0]);
  });

  it("si «Crear catálogo» recibe un 400, el pedido corregido sale con otra Idempotency-Key", async () => {
    const keys: (string | null)[] = [];
    server.use(http.post(base, ({ request }) => {
      keys.push(request.headers.get("Idempotency-Key"));
      return keys.length === 1
        ? HttpResponse.json({ code: "General.Validation", status: 400, title: "Bad Request", errors: { name: ["Ya hay un catálogo con ese nombre."] } }, { status: 400 })
        : HttpResponse.json({ catalog: catalog(), itemIdentityMap: [] }, { status: 201 });
    }));
    const { user, router } = mountForms(formsOwner, "/org/formularios/catalogos/nuevo");
    await user.click(await screen.findByRole("textbox", { name: /^Nombre/ }));
    await user.paste("Motivos");
    await user.click(screen.getByRole("button", { name: "Crear catálogo" }));
    expect(await screen.findByText("Ya hay un catálogo con ese nombre.")).toBeVisible();
    await user.click(screen.getByRole("textbox", { name: /^Nombre/ }));
    await user.paste(" de visita");
    await user.click(screen.getByRole("button", { name: "Crear catálogo" }));
    await waitFor(() => expect(router.state.location.pathname).toBe(path));
    expect(keys).toHaveLength(2);
    expect(keys[1]).not.toBe(keys[0]);
  });
});

describe("CatalogEditorPage: los errores (errores.md)", () => {
  it("si el servidor rechaza «Exportar», lo dice en un aviso con su motivo", async () => {
    server.use(http.get(`${base}/c-motivos/export`, () => HttpResponse.json(
      { code: "Security.Forbidden", status: 403, title: "Forbidden", detail: "No tenés permiso para exportar este catálogo." }, { status: 403 })));
    const { user } = await openEditor();
    await user.click(screen.getByRole("button", { name: "Exportar" }));
    expect(await screen.findByText("No tenés permiso para exportar este catálogo.")).toBeVisible();
  });

  it("si «Exportar» o «Descargar la plantilla» responden 500, avisan el error sin fallar en silencio", async () => {
    server.use(
      http.get(`${base}/c-motivos/export`, () => HttpResponse.json({ status: 500, title: "Server Error" }, { status: 500 })),
      http.get(`${base}/template`, () => HttpResponse.json({ status: 500, title: "Server Error" }, { status: 500 })),
    );
    const { user } = await openEditor();
    await user.click(screen.getByRole("button", { name: "Exportar" }));
    expect(await screen.findByText("Algo salió mal. Probá de nuevo en un rato.")).toBeVisible();
    await openMenu(user, "Más acciones de las opciones");
    await user.click(await screen.findByRole("menuitem", { name: /Descargar la plantilla/ }));
    await waitFor(() => expect(screen.getAllByText("Algo salió mal. Probá de nuevo en un rato.").length).toBeGreaterThanOrEqual(2));
  });

  it("si se corta la red al guardar, «Reintentar» del aviso termina el guardado: «Guardamos el catálogo.» y el siguiente va con la versión nueva", async () => {
    serve({ put: () => puts.length === 1 ? HttpResponse.error() : HttpResponse.json({ version: puts.length === 2 ? 8 : 9, itemIdentityMap: [] }) });
    const { user } = await openEditor();
    const field = textbox("Texto de Seguimiento");
    // Pegado y no tipeado letra por letra: cada test entra en 5 s (tests).
    await user.clear(field);
    await user.paste("Seguimiento programado");
    await user.click(saveButton());
    expect(await screen.findByText("No pudimos conectarnos. Revisá tu conexión.")).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Reintentar" }));
    expect(await screen.findByText("Guardamos el catálogo.")).toBeVisible();
    // El borrador queda limpio.
    await waitFor(() => expect(saveButton()).toBeDisabled());
    const again = textbox("Texto de Seguimiento");
    await user.clear(again);
    await user.paste("Seguimiento mensual");
    await user.click(saveButton());
    await waitFor(() => expect(puts).toHaveLength(3));
    expect(puts.map((put) => put.version)).toEqual([7, 7, 8]);
  });

  it("si después de un 409 lo guardado ahora no se puede leer, el 409 se ve en su cartel, con «Ver lo nuevo» y «Seguir editando»", async () => {
    let reads = 0;
    serve({ put: () => HttpResponse.json({ code: "General.ConcurrencyConflict", status: 409, title: "Conflict" }, { status: 409 }) });
    server.use(http.get(`${base}/c-motivos`, () => reads++ === 0 ? HttpResponse.json(catalog()) : HttpResponse.error()));
    const { user } = await openEditor();
    const field = textbox("Texto de Seguimiento");
    // Pegado y no tipeado letra por letra: cada test entra en 5 s (tests).
    await user.clear(field);
    await user.paste("Seguimiento programado");
    await user.click(saveButton());
    expect(await screen.findByText("Otra persona cambió esto mientras lo editabas.")).toBeVisible();
    expect(screen.getByRole("button", { name: "Ver lo nuevo" })).toBeVisible();
    expect(screen.queryByRole("dialog", { name: "Otra persona guardó el catálogo" })).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Seguir editando" }));
    expect(screen.queryByText("Otra persona cambió esto mientras lo editabas.")).not.toBeInTheDocument();
    expect(field).toHaveValue("Seguimiento programado");
  });

  it("sin permiso, la ficha es la pantalla de permiso: su consulta bloquea la vista", async () => {
    server.use(http.get(`${base}/c-motivos`, () => HttpResponse.json({ code: "Auth.Forbidden", status: 403, title: "Forbidden" }, { status: 403 })));
    mountForms(formsOwner, path);
    expect(await screen.findByText("No tenés permiso para ver esta página")).toBeVisible();
  });

  it("un catálogo que no existe es la pantalla de no encontrado, sin otro aviso abajo", async () => {
    server.use(http.get(`${base}/c-motivos`, () => HttpResponse.json({ code: "Forms.Catalog.NotFound", status: 404, title: "Not Found", detail: "No existe ese catálogo." }, { status: 404 })));
    mountForms(formsOwner, path);
    expect(await screen.findByText("No encontramos esta página")).toBeVisible();
    expect(screen.queryByText("No existe ese catálogo.")).not.toBeInTheDocument();
  });

  it("las opciones que no cargan se dicen una vez, en su lugar, con «Reintentar»", async () => {
    let reads = 0;
    server.use(http.get(`${base}/c-motivos/items`, () => reads++ === 0
      ? HttpResponse.json({ status: 500, title: "Server Error" }, { status: 500 }) : HttpResponse.json(paged(motivos))));
    const { user } = mountForms(formsOwner, path);
    expect(await screen.findByText("No pudimos cargar las opciones.")).toBeVisible();
    expect(screen.getAllByText("Algo salió mal. Probá de nuevo en un rato.")).toHaveLength(1);
    expect(screen.queryByText("Todavía no hay opciones.")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Reintentar" }));
    expect(await screen.findByRole("textbox", { name: "Texto de Seguimiento" })).toHaveValue("Seguimiento");
  });

  it("«Descartar» queda habilitado sin cambios y el nombre y la descripción llevan el tope del contrato", async () => {
    await openEditor();
    expect(screen.getByRole("button", { name: "Descartar" })).toBeEnabled();
    expect(saveButton()).toBeDisabled();
    expect(screen.getByRole("textbox", { name: /^Nombre/ })).toHaveAttribute("maxLength", "60");
    expect(screen.getByRole("textbox", { name: /^Descripción/ })).toHaveAttribute("maxLength", "300");
    expect(screen.getByRole("textbox", { name: /^Descripción/ })).not.toHaveAttribute("placeholder");
  });
});

describe("CatalogEditorPage, la banda y lo que la rodea (FRM-Catalogo y M-FRM-Catalogo, verificación de la E12)", () => {
  it("las migas terminan en el nombre del catálogo y el estado lleva su punto de color", async () => {
    await openEditor();
    await waitFor(() => expect(screen.getByRole("navigation", { name: "Migas de pan" })).toHaveTextContent("Inicio/Gestión de formularios/Catálogos/Motivos de visita"));
    const status = screen.getByText("Activo");
    expect(status.parentElement?.querySelector("[data-slot=status-dot]")).toHaveClass("bg-[var(--punto-ok)]");
  });

  it("«No se puede usar» va en rojo, con su punto y su motivo en la (i)", async () => {
    serve({ detail: catalog({ usable: false, unusableReason: "NoActiveOptions" }) });
    await openEditor();
    const status = screen.getByText("No se puede usar").closest("span.inline-flex");
    expect(status).toHaveClass("text-[var(--peligro)]");
    expect(status?.querySelector("[data-slot=status-dot]")).toHaveClass("bg-[var(--peligro)]");
    expect(within(status as HTMLElement).getByRole("button", { name: "Más información sobre No se puede usar" })).toBeInTheDocument();
  });

  it("«Dar de baja» es una opción común del ⋮ y su confirmación es la roja", async () => {
    const { user } = await openEditor();
    await openMenu(user, "Acciones de Motivos de visita");
    const deactivate = await screen.findByRole("menuitem", { name: /Dar de baja/ });
    expect(deactivate).not.toHaveAttribute("data-variant", "destructive");
    await user.click(deactivate);
    const dialog = await screen.findByRole("dialog", { name: "¿Dar de baja «Motivos de visita»?" });
    expect(within(dialog).getByRole("button", { name: "Dar de baja" })).toHaveClass("bg-[var(--peligro)]");
  });

  it("mientras carga, la banda tiene ‹ y el título, y abajo una zona con el aro", async () => {
    server.use(http.get(`${base}/c-motivos`, () => new Promise<Response>(() => {})));
    mountForms(formsOwner, path);
    expect(await screen.findByRole("heading", { name: "Catálogo" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Volver a Catálogos" })).toBeInTheDocument();
    const zone = document.querySelector<HTMLElement>("[data-slot=catalog-loading]");
    expect(zone).not.toBeNull();
    expect(within(zone!).getByRole("status")).toHaveTextContent("Cargando");
  });

  it("un catálogo nuevo rotula «Nombre», con «Nombre del catálogo» de ejemplo", async () => {
    mountForms(formsOwner, "/org/formularios/catalogos/nuevo");
    const name = await screen.findByRole("textbox", { name: /^Nombre/ });
    expect(name).toHaveAttribute("placeholder", "Nombre del catálogo");
    expect(screen.queryByText("Nombre del catálogo", { selector: "label, label *" })).not.toBeInTheDocument();
  });

  it("en el teléfono, «Así lo ve quien lo recibe» es el ojo de la barra y «El catálogo» tiene su título a la vista", async () => {
    const restore = asPhone();
    try {
      mountForms(formsOwner, path);
      const eye = await screen.findByRole("button", { name: "Así lo ve quien lo recibe" });
      expect(eye.querySelector("svg")).not.toBeNull();
      expect(eye).not.toHaveTextContent("Así lo ve quien lo recibe");
      expect(screen.getByRole("heading", { name: "El catálogo" })).not.toHaveClass("sr-only");
      expect(screen.getByText("Activo").parentElement?.querySelector("[data-slot=status-dot]")).toBeNull();
    } finally { restore(); }
  });
});

describe("CatalogEditorPage, «Opciones» (FRM-Catalogo y M-FRM-Catalogo, verificación de la E12)", () => {
  const options = () => screen.getByRole("region", { name: "Opciones" });

  it("un catálogo nuevo dice «Todavía no hay opciones.», sin la tabla ni el buscador", async () => {
    mountForms(formsOwner, "/org/formularios/catalogos/nuevo");
    expect(await screen.findByText("Todavía no hay opciones.")).toBeVisible();
    expect(within(options()).queryByRole("columnheader")).not.toBeInTheDocument();
    expect(screen.queryByText("No hay nada para mostrar")).not.toBeInTheDocument();
    expect(screen.queryByRole("searchbox", { name: "Buscar opción" })).not.toBeInTheDocument();
  });

  it("uno guardado sin opciones no muestra el buscador", async () => {
    serve({ detail: catalog({ usable: false, unusableReason: "NoActiveOptions", itemCounts: { total: 0, active: 0 } }), items: [] });
    mountForms(formsOwner, path);
    expect(await screen.findByText("Todavía no hay opciones.")).toBeVisible();
    expect(screen.queryByRole("searchbox", { name: "Buscar opción" })).not.toBeInTheDocument();
  });

  it("el encabezado es arena, «Agregar opción» es de contorno y los íconos del ⋮ son los del lienzo", async () => {
    const { user } = await openEditor();
    const heading = within(options()).getByRole("heading", { name: "Opciones" });
    expect(heading.parentElement).toHaveClass("bg-[var(--cab)]");
    expect(within(options()).getByRole("button", { name: "Agregar opción" })).toHaveClass("bg-[var(--superficie)]");
    expect(within(options()).getByRole("button", { name: "Agregar opción" })).not.toHaveClass("bg-[var(--marca)]");
    await openMenu(user, "Más acciones de las opciones");
    expect((await screen.findByRole("menuitem", { name: /Descargar la plantilla/ })).querySelector("svg")).toHaveClass("lucide-file-text");
    expect(screen.getByRole("menuitem", { name: /Generar los códigos que faltan/ }).querySelector("svg")).toHaveClass("lucide-code");
  });

  it("una opción de baja va atenuada, y el contador va adentro del campo de texto", async () => {
    await openEditor();
    expect(textbox("Texto de Cobranza")).toHaveClass("text-[var(--t3)]");
    expect(textbox("Detalle de Cobranza")).toHaveClass("text-[var(--t3)]");
    expect(textbox("Texto de Seguimiento")).not.toHaveClass("text-[var(--t3)]");
    const counter = screen.getAllByText("11/30", { selector: "small" })[0];
    expect(counter.closest("div.relative")).toContainElement(textbox("Texto de Seguimiento"));
    expect(textbox("Texto de Seguimiento")).toHaveClass("pr-12");
  });

  it("una opción por borrar conserva sus casillas apagadas y dice «Se borra al guardar» en Acciones, junto al ⋮", async () => {
    const { user } = await openEditor();
    await user.click(screen.getByRole("button", { name: "Borrar Reclamo" }));
    await user.click(within(await screen.findByRole("dialog", { name: "¿Borrar «Reclamo»?" })).getByRole("button", { name: "Borrar opción" }));
    const row = screen.getByRole("textbox", { name: "Texto de Reclamo" }).closest("tr")!;
    expect(within(row).getByRole("checkbox", { name: "Elegir Reclamo" })).toBeDisabled();
    expect(within(row).getByRole("checkbox", { name: "Activa: Reclamo" })).toBeDisabled();
    const deleteText = within(row).getByText("Se borra al guardar");
    expect(deleteText.closest("td")).toContainElement(within(row).getByRole("button", { name: "Acciones de Reclamo" }));
    expect(within(row).queryByRole("button", { name: "Subir Reclamo" })).not.toBeInTheDocument();
    expect(within(row).queryByRole("button", { name: "Editar Reclamo" })).not.toBeInTheDocument();
  });

  it("un movimiento pendiente es una franja suelta, arriba de «Opciones», y las elegidas van debajo del buscador con el tinte de la marca", async () => {
    const { user } = await openEditor();
    await user.click(screen.getByRole("button", { name: "Bajar Seguimiento" }));
    const strip = screen.getByText("1 movimiento pendiente. Se aplica al guardar.").closest("[role=status]") as HTMLElement;
    expect(options()).not.toContainElement(strip);
    expect(strip.querySelector("svg")).toBeNull();
    await user.click(screen.getByRole("button", { name: "Descartar movimientos" }));
    await user.click(screen.getByRole("checkbox", { name: "Elegir Venta nueva" }));
    const bar = screen.getByText("1 elegida").parentElement as HTMLElement;
    expect(bar).toHaveClass("bg-[var(--marca-t)]");
    expect(screen.getByRole("searchbox", { name: "Buscar opción" }).compareDocumentPosition(bar) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("con un orden pendiente, ↑ ↓ quedan apagados en todas las filas", async () => {
    const { user } = await openEditor();
    await openMenu(user, "Más acciones de las opciones");
    await user.click(await screen.findByRole("menuitem", { name: /Ordenar por…/ }));
    const dialog = await screen.findByRole("dialog", { name: "Ordenar las opciones" });
    await user.click(within(dialog).getByRole("button", { name: "Ordenar" }));
    expect(await screen.findByText(/Se ordenará por/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Bajar Seguimiento" })).toHaveAttribute("aria-disabled", "true");
    expect(screen.getByRole("button", { name: "Subir Venta nueva" })).toHaveAttribute("aria-disabled", "true");
    expect(screen.getAllByText("Guardá o cancelá el orden pendiente para mover opciones.").length).toBeGreaterThan(0);
  });

  it("el pie cuenta también las opciones nuevas que se ven", async () => {
    const { user } = await openEditor();
    expect(screen.getByText("1–4 de 4")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Agregar opción" }));
    const dialog = await screen.findByRole("dialog", { name: "Opciones nuevas de «Motivos de visita»" });
    await user.type(within(dialog).getByRole("textbox", { name: "Texto" }), "Garantía");
    await user.click(within(dialog).getByRole("button", { name: "Listo" }));
    expect(await screen.findByText("1–5 de 5")).toBeInTheDocument();
  });

  it("en solo lectura, el Estado de cada opción lleva su punto", async () => {
    serve({ detail: catalog({ canManage: false }) });
    mountForms(formsReader, path);
    const inactive = await screen.findByText("De baja");
    expect(inactive.parentElement?.querySelector("[data-slot=status-dot]")).toHaveClass("bg-[var(--punto-apagado)]");
    expect(screen.getAllByText("Activa")[0].parentElement?.querySelector("[data-slot=status-dot]")).toHaveClass("bg-[var(--punto-ok)]");
  });

  it("en el teléfono: el enlace «Agregar opción», la lista en una tarjeta con el número en un círculo y lo demás en el ⋮ de la banda", async () => {
    const restore = asPhone();
    try {
      const { user } = mountForms(formsOwner, path);
      const name = await screen.findByText("Seguimiento");
      const region = options();
      expect(within(region).getByRole("button", { name: "Agregar opción" })).not.toHaveClass("bg-[var(--marca)]");
      expect(within(region).queryByRole("button", { name: "Exportar" })).not.toBeInTheDocument();
      expect(within(region).queryByRole("button", { name: "Más acciones de las opciones" })).not.toBeInTheDocument();
      const item = name.closest("li") as HTMLElement;
      expect(within(item).getByText("1")).toHaveClass("rounded-full");
      const code = within(item).getByText("Código");
      expect(code.tagName).toBe("DT");
      expect(code.nextElementSibling).toHaveTextContent("SEG");
      expect(item.closest("ul")).toHaveClass("rounded-[0.875rem]");
      const cobranza = screen.getByText("Cobranza");
      expect(cobranza).toHaveClass("text-[var(--t3)]");
      expect(within(cobranza.closest("li") as HTMLElement).getByText("De baja").parentElement?.querySelector("[data-slot=status-dot]")).not.toBeNull();
      expect(screen.getByRole("searchbox", { name: "Buscar opción" })).toHaveClass("max-md:pl-10");
      await user.click(screen.getByRole("button", { name: "Acciones de Motivos de visita" }));
      const menu = await screen.findByRole("menu", { name: "Acciones de Motivos de visita" });
      expect(within(menu).getAllByRole("menuitem").map((entry) => entry.textContent)).toEqual(
        ["Exportar", "Descargar la plantilla", "Ordenar por…", "Generar los códigos que faltan", "Dar de baja el catálogo"]);
    } finally { restore(); }
  });

  it("en el teléfono, una opción por borrar lleva solo el ⋮ y su Estado con el punto rojo", async () => {
    const restore = asPhone();
    try {
      const { user } = mountForms(formsOwner, path);
      await screen.findByText("Reclamo");
      await user.click(screen.getByRole("button", { name: "Borrar Reclamo" }));
      await user.click(within(await screen.findByRole("dialog", { name: "¿Borrar «Reclamo»?" })).getByRole("button", { name: "Borrar opción" }));
      const item = screen.getByText("Reclamo").closest("li") as HTMLElement;
      expect(within(item).queryByRole("button", { name: "Subir Reclamo" })).not.toBeInTheDocument();
      expect(within(item).getByRole("button", { name: "Acciones de Reclamo" })).toBeInTheDocument();
      expect(within(item).getByText("Se borra al guardar").parentElement?.querySelector("[data-slot=status-dot]")).toHaveClass("bg-[var(--peligro)]");
    } finally { restore(); }
  });

  it("en el teléfono, un catálogo nuevo dice «Todavía no hay opciones.» en su tarjeta", async () => {
    const restore = asPhone();
    try {
      mountForms(formsOwner, "/org/formularios/catalogos/nuevo");
      expect(await screen.findByText("Todavía no hay opciones.")).toHaveClass("font-semibold");
    } finally { restore(); }
  });
});

describe("CatalogEditorPage, «Así lo ve quien lo recibe» (FRM-Catalogo y M-FRM-Catalogo, verificación de la E12)", () => {
  it("en la compu va suelto: el segmentado chico y centrado, y el teléfono con su franja, «⌄» y «Enviar» apagado hasta elegir", async () => {
    const { user } = await openEditor();
    const aside = screen.getByRole("region", { name: "Así lo ve quien lo recibe" });
    expect(aside).not.toHaveClass("border");
    expect(within(aside).getByRole("group", { name: "Cómo se elige" }).parentElement).toHaveClass("justify-center");
    const phone = within(aside).getByRole("group", { name: "Así lo ve quien lo recibe" });
    expect(phone.querySelector("[data-slot=preview-phone-band]")).not.toBeNull();
    const choose = within(phone).getByRole("button", { name: /Elegí una opción/ });
    expect(choose).toHaveTextContent("⌄");
    expect(within(phone).getByText("Enviar")).toHaveAttribute("aria-disabled", "true");
    await user.click(choose);
    expect(within(phone).getByRole("button", { name: /Pregunta/ })).toBeInTheDocument();
    await user.click(within(phone).getByRole("radio", { name: /Venta nueva/ }));
    await user.click(within(phone).getByRole("button", { name: /Pregunta/ }));
    expect(within(phone).getByRole("button", { name: /Venta nueva/ })).toBeInTheDocument();
    expect(within(phone).getByText("Enviar")).not.toHaveAttribute("aria-disabled");
  });

  it("con «Varias», «Elegí hasta 3» va debajo de «× Formulario», con las casillas en la hoja", async () => {
    const { user } = await openEditor();
    const aside = screen.getByRole("region", { name: "Así lo ve quien lo recibe" });
    await user.click(within(aside).getByRole("button", { name: "Varias" }));
    const phone = within(aside).getByRole("group", { name: "Así lo ve quien lo recibe" });
    expect(within(phone).getByText("Formulario")).toBeInTheDocument();
    expect(within(phone).getByText("Elegí hasta 3")).toBeInTheDocument();
    expect(within(phone).getAllByRole("checkbox").length).toBe(3);
  });

  it("en el teléfono, el ojo abre la lista de opciones en una tarjeta, sin el marco del teléfono", async () => {
    const restore = asPhone();
    try {
      const { user } = mountForms(formsOwner, path);
      await user.click(await screen.findByRole("button", { name: "Así lo ve quien lo recibe" }));
      const dialog = await screen.findByRole("dialog", { name: "Así lo ve quien lo recibe" });
      expect(dialog.querySelector("[data-slot=preview-phone]")).toBeNull();
      expect(dialog.querySelector("[data-slot=preview-card]")).not.toBeNull();
      expect(within(dialog).getByText("Seguimiento")).toBeInTheDocument();
      expect(within(dialog).getByText("Visita programada a un cliente actual")).toBeInTheDocument();
      expect(within(dialog).queryByRole("group", { name: "Cómo se elige" })).not.toBeInTheDocument();
    } finally { restore(); }
  });
});
