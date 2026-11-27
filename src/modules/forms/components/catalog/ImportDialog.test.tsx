import { File as FetchFile } from "node:buffer";
import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import { server } from "@/test/mocks/server";
import { choose, pickerName } from "@/test/picker";
import type { FormCatalogImportErrorRow, FormCatalogImportPreviewResponse, FormCatalogItemRow, FormCatalogResponse } from "../../api/types";
import { formsOwner, mountForms } from "../../test/support";

const base = "/api/organization/forms/catalogs";
const catalog: FormCatalogResponse = {
  id: "c-prov", name: "Proveedores", source: "Manual", valueType: "Text", isActive: true, usable: true, canManage: true,
  itemCounts: { total: 1097, active: 1097 }, modifiedAtUtc: "2026-11-20T13:00:00Z", version: 7,
};
const items: FormCatalogItemRow[] = [
  { id: "i-1", position: 1, text: "Abrasivos del Sur", code: "PRV-0001", detail: "CUIT 30-71234567-1", value: null, isActive: true, textRepeated: false },
];

function paged<T>(rows: readonly T[], page: number, totalCount: number, pageSize = 10) {
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  return { items: [...rows], page, pageSize, totalCount, totalPages, hasPrevious: page > 1, hasNext: page < totalPages };
}

const errorsPage1: FormCatalogImportErrorRow[] = [
  { row: 37, column: "code", code: "Forms.Catalog.DuplicateCode", otherRow: 52 },
  { row: 88, column: "text", code: "Forms.Catalog.ItemTextTooLong" },
  { row: 90, column: "code", code: "Forms.Catalog.ItemTextTooLong" },
];
const errorsPage2: FormCatalogImportErrorRow[] = [{ row: 415, column: "code", code: "Forms.Catalog.DuplicateCode", otherRow: 477 }];

// Tablero FRM-Catalogo-Importar, «Revisión»: proveedores.xlsx, 1.106 filas leídas y 1.084 sin cambios.
function previewOf(page: number, overrides: Partial<FormCatalogImportPreviewResponse> = {}): FormCatalogImportPreviewResponse {
  return {
    version: 7, sha256: "a1b2c3", sheetName: "Hoja 1", rowsRead: 1106, unchanged: 1084, deactivationShare: 0.003, errorShare: 0.011,
    confirmDeactivations: false, confirmErrors: false,
    errors: paged(page === 1 ? errorsPage1 : errorsPage2, page, 12),
    added: paged([{ row: 1098, code: "PRV-1098", text: "Bulones Mar del Plata" }], page, 1),
    changed: paged([
      { row: 11, code: "PRV-0010", column: "text", before: "Cementos del Plata", after: "Cementos del Plata S.A." },
      { row: 11, code: "PRV-0010", column: "detail", before: "CUIT 30-69001234-8", after: "CUIT 30-69001234-9" },
    ], page, 2),
    deactivated: paged([{ code: "PRV-0005", text: "Aluminios Cuyo" }], page, 1),
    ...overrides,
  };
}

interface Sent { mode: string; version: string; page: string | null; fileName: string; fileText: string }
interface Applied { mode: string; version: string; sha256: string; skipErrorRows: string; confirmedDeactivations: string; idempotencyKey: string | null }
let previews: Sent[] = [];
let applies: Applied[] = [];
let catalogReads = 0;

function serve({ preview = (page: number) => HttpResponse.json(previewOf(page)), apply = () => HttpResponse.json({ version: 8 }), current = () => catalog }: {
  preview?: (page: number) => Response; apply?: () => Response; current?: () => FormCatalogResponse;
} = {}) {
  previews = []; applies = []; catalogReads = 0;
  server.use(
    http.get(`${base}/c-prov`, () => { catalogReads++; return HttpResponse.json(current()); }),
    http.get(`${base}/c-prov/items`, () => HttpResponse.json(paged(items, 1, 1))),
    http.post(`${base}/c-prov/imports/previews`, async ({ request }) => {
      const form = await request.formData();
      const file = form.get("file") as File;
      const page = form.get("page") as string | null;
      previews.push({ mode: String(form.get("mode")), version: String(form.get("version")), page, fileName: file.name, fileText: await file.text() });
      return preview(Number(page ?? 1));
    }),
    http.post(`${base}/c-prov/imports`, async ({ request }) => {
      const form = await request.formData();
      applies.push({ mode: String(form.get("mode")), version: String(form.get("version")), sha256: String(form.get("sha256")), skipErrorRows: String(form.get("skipErrorRows")),
        confirmedDeactivations: String(form.get("confirmedDeactivations")), idempotencyKey: request.headers.get("Idempotency-Key") });
      return apply();
    }),
  );
}

async function openImport() {
  const mounted = mountForms(formsOwner, "/org/formularios/catalogos/c-prov");
  await screen.findByRole("textbox", { name: "Texto de Abrasivos del Sur" });
  await mounted.user.click(screen.getByRole("button", { name: "Importar" }));
  const dialog = await screen.findByRole("dialog", { name: "Importar opciones a «Proveedores»" });
  return { ...mounted, dialog };
}

async function reviewFile(mounted: Awaited<ReturnType<typeof openImport>>) {
  const { user, dialog } = mounted;
  fireEvent.change(within(dialog).getByLabelText("Archivo"), { target: { files: [new FetchFile(["xlsx"], "proveedores.xlsx")] } });
  expect(within(dialog).getByText("proveedores.xlsx")).toBeVisible();
  await user.click(within(dialog).getByRole("button", { name: "Revisar" }));
  await within(dialog).findByText("Filas leídas");
}

const problem = (status: number, code: string, detail: string) =>
  HttpResponse.json({ status, code, title: "Error", detail }, { status, headers: { "Content-Type": "application/problem+json" } });

beforeAll(async () => { await import("../../pages/CatalogEditorPage"); });
// El multipart viaja con el `fetch` de Node: el `FormData` y el `File` de jsdom no le llegan enteros.
beforeEach(async () => {
  const nativeForm = await new Request("http://localhost/form", { method: "POST", headers: { "content-type": "multipart/form-data; boundary=test" }, body: "--test--\r\n" }).formData();
  vi.stubGlobal("FormData", nativeForm.constructor);
  vi.stubGlobal("File", FetchFile);
  serve();
});
afterEach(() => { vi.unstubAllGlobals(); });

describe("ImportDialog (FRM-Catalogo-Importar)", () => {
  it("«Desde» va en la pieza (262): pegar arma la grilla del catálogo, marca «Pegá las filas.», deja afuera una columna ajena y revisa lo pegado como un CSV que agrega", async () => {
    const mounted = await openImport();
    const { user, dialog } = mounted;
    expect(within(dialog).getByRole("button", { name: pickerName("Desde") })).toHaveTextContent("Subir un archivo");
    // La (i) de cada renglón describe su campo (pantallas-y-ui).
    expect(within(dialog).getByRole("button", { name: pickerName("Desde") })).toHaveAccessibleDescription(/Pegar suma filas al catálogo/);
    expect(within(dialog).getByRole("button", { name: "Elegir archivo" })).toHaveAccessibleDescription("XLSX o CSV en UTF-8, de hasta 10 MiB y 10.000 filas.");
    await choose(user, "Desde", "Pegar desde Excel");

    const grid = within(dialog).getByRole("table", { name: "Filas pegadas" });
    expect(within(grid).getAllByRole("columnheader").map((header) => header.textContent)).toEqual(["Código", "Texto", "Detalle"]);
    await user.click(within(dialog).getByRole("button", { name: "Revisar" }));
    expect(within(dialog).getByRole("alert")).toHaveTextContent("Pegá las filas.");
    expect(previews).toHaveLength(0);

    await user.click(within(dialog).getByRole("textbox", { name: "Pegá acá las filas" }));
    await user.paste("Código\tTexto\tDetalle\tRubro\nPRV-1098\tBulones Mar del Plata\tCUIT 30-71567890-2\tBulones\nPRV-1099\tCerámicos \"Neuquén\"\t\tBulones\n");
    const filled = within(dialog).getByRole("table", { name: "Filas pegadas" });
    expect(within(filled).getAllByRole("columnheader").map((header) => header.textContent)).toEqual(["Código", "Texto", "Detalle", "Rubro"]);
    expect(within(filled).getAllByRole("row")).toHaveLength(3);
    expect(within(dialog).getByText("«Rubro» no es una columna del catálogo: no se manda.")).toBeVisible();
    expect(await axe(dialog)).toHaveNoViolations();

    await user.click(within(dialog).getByRole("button", { name: "Revisar" }));
    await within(dialog).findByText("Filas leídas");
    expect(previews).toEqual([{ mode: "Append", version: "7", page: "1", fileName: "filas-pegadas.csv",
      fileText: '"Code","Text","Detail"\r\n"PRV-1098","Bulones Mar del Plata","CUIT 30-71567890-2"\r\n"PRV-1099","Cerámicos ""Neuquén""",""' }]);
    // Desde «Revisar», el origen no cambia: hay que cancelar y volver a importar.
    expect(within(dialog).getByRole("button", { name: pickerName("Desde") })).toHaveAttribute("aria-disabled", "true");
    expect(within(dialog).getByRole("button", { name: "Limpiar" })).toHaveAttribute("aria-disabled", "true");
  });

  it("subir un archivo: «Revisar» sin archivo marca el campo; la revisión trae el archivo, la hoja y las listas con su segunda página, «Tiene más de 30 caracteres.» en una fila y «Cambios» lado a lado", async () => {
    const mounted = await openImport();
    const { user, dialog } = mounted;
    await user.click(within(dialog).getByRole("button", { name: "Revisar" }));
    expect(within(dialog).getByRole("alert")).toHaveTextContent("Elegí un archivo.");

    await reviewFile(mounted);
    expect(previews).toEqual([expect.objectContaining({ mode: "Replace", version: "7", page: "1", fileName: "proveedores.xlsx" })]);
    for (const text of ["proveedores.xlsx", "Hoja 1", "1.106", "1.084"]) expect(within(dialog).getAllByText(text).length).toBeGreaterThan(0);
    expect(within(dialog).getByRole("tab", { name: "Errores 12" })).toHaveAttribute("aria-selected", "true");
    const errors = within(dialog).getByRole("table", { name: "Errores" });
    expect(within(errors).getByRole("row", { name: "88 Texto Tiene más de 30 caracteres." })).toBeVisible();
    // Un código largo dice el tope del código, no el del texto.
    expect(within(errors).getByRole("row", { name: "90 Código Tiene más de 40 caracteres." })).toBeVisible();
    expect(within(errors).getByRole("row", { name: "37 Código Está repetido en la fila 52." })).toBeVisible();
    expect(within(dialog).getByRole("button", { name: "Aplicar sin las 12 filas con errores" })).toBeVisible();

    await user.click(within(dialog).getByRole("button", { name: "Página siguiente" }));
    await within(dialog).findByRole("row", { name: "415 Código Está repetido en la fila 477." });
    expect(previews.at(-1)).toEqual(expect.objectContaining({ page: "2", mode: "Replace", fileName: "proveedores.xlsx" }));

    await user.click(within(dialog).getByRole("tab", { name: "Cambios 2" }));
    await waitFor(() => expect(previews.at(-1)?.page).toBe("1"));
    const changes = await within(dialog).findByRole("table", { name: "Cambios" });
    expect(within(changes).getAllByRole("columnheader").map((header) => header.textContent)).toEqual(["Fila", "Código", "Columna", "Antes", "Después"]);
    expect(within(changes).getByRole("row", { name: "11 PRV-0010 Texto Cementos del Plata Cementos del Plata S.A." })).toBeVisible();
    expect(within(changes).getByRole("row", { name: "Detalle CUIT 30-69001234-8 CUIT 30-69001234-9" })).toBeVisible();
    expect(await axe(dialog)).toHaveNoViolations();
  });

  it("con muchas bajas, aplicar espera «Dar de baja 412 opciones»; manda la cantidad confirmada y el editor vuelve a leer el catálogo", async () => {
    serve({ preview: (page) => HttpResponse.json(previewOf(page, { confirmDeactivations: true, deactivationShare: 0.38, deactivated: paged([{ code: "PRV-0005", text: "Aluminios Cuyo" }], page, 412) })) });
    const mounted = await openImport();
    const { user, dialog } = mounted;
    await reviewFile(mounted);
    expect(within(dialog).getByRole("tab", { name: "Bajas 412" })).toHaveAttribute("aria-selected", "true");
    expect(within(dialog).getByText("Antes de aplicar")).toBeVisible();
    const applyButton = within(dialog).getByRole("button", { name: "Aplicar sin las 12 filas con errores" });
    expect(applyButton).toHaveAttribute("aria-disabled", "true");
    expect(applyButton).toHaveAccessibleDescription("Confirmá las bajas para aplicar.");
    await user.click(applyButton);
    expect(applies).toHaveLength(0);

    const readsBefore = catalogReads;
    await user.click(within(dialog).getByRole("checkbox", { name: /^Dar de baja 412 opciones \(el 38\s?%\)\.$/ }));
    await user.click(within(dialog).getByRole("button", { name: "Aplicar sin las 12 filas con errores" }));
    await waitFor(() => expect(screen.queryByRole("dialog", { name: "Importar opciones a «Proveedores»" })).not.toBeInTheDocument());
    expect(applies).toEqual([{ mode: "Replace", version: "7", sha256: "a1b2c3", skipErrorRows: "true", confirmedDeactivations: "412", idempotencyKey: expect.any(String) }]);
    expect(await screen.findByText("Importamos las opciones.")).toBeVisible();
    await waitFor(() => expect(catalogReads).toBeGreaterThan(readsBefore));
  });

  it("con muchas filas con error, aplicar espera «Aplicar sin las 140 filas con errores» y no da de baja sin confirmar", async () => {
    serve({ preview: (page) => HttpResponse.json(previewOf(page, { confirmErrors: true, errorShare: 0.13, errors: paged(errorsPage1, page, 140) })) });
    const mounted = await openImport();
    const { user, dialog } = mounted;
    await reviewFile(mounted);
    expect(within(dialog).getByRole("tab", { name: "Errores 140" })).toHaveAttribute("aria-selected", "true");
    const applyButton = within(dialog).getByRole("button", { name: "Aplicar sin las 140 filas con errores" });
    expect(applyButton).toHaveAccessibleDescription("Confirmá que se aplica sin esas filas.");
    await user.click(within(dialog).getByRole("checkbox", { name: /^Aplicar sin las 140 filas con errores \(el 13\s?%\)\.$/ }));
    await user.click(within(dialog).getByRole("button", { name: "Aplicar sin las 140 filas con errores" }));
    await waitFor(() => expect(applies).toHaveLength(1));
    expect(applies[0]).toEqual(expect.objectContaining({ skipErrorRows: "true", confirmedDeactivations: "0" }));
  });

  it("el 409: «Otra persona guardó el catálogo. Revisá de nuevo.», y «Revisar de nuevo» revisa el mismo archivo con la versión de ahora", async () => {
    let version = 7;
    serve({ apply: () => problem(409, "General.ConcurrencyConflict", "Otra persona cambió el catálogo."), current: () => ({ ...catalog, version }) });
    const mounted = await openImport();
    const { user, dialog } = mounted;
    await reviewFile(mounted);
    version = 8;
    await user.click(within(dialog).getByRole("button", { name: "Aplicar sin las 12 filas con errores" }));
    expect(await within(dialog).findByRole("alert")).toHaveTextContent("Otra persona guardó el catálogo. Revisá de nuevo.");
    await user.click(within(dialog).getByRole("button", { name: "Revisar de nuevo" }));
    await waitFor(() => expect(previews).toHaveLength(2));
    expect(previews[1]).toEqual(expect.objectContaining({ version: "8", page: "1", fileName: "proveedores.xlsx", mode: "Replace" }));
    expect(await within(dialog).findByRole("button", { name: "Aplicar sin las 12 filas con errores" })).toBeVisible();
    expect(within(dialog).queryByRole("alert")).not.toBeInTheDocument();
  });

  it("«Revisar de nuevo» con el catálogo que ya no está: el 404 va solo en la franja del diálogo, no también abajo", async () => {
    serve({ apply: () => problem(409, "General.ConcurrencyConflict", "Otra persona cambió el catálogo.") });
    const mounted = await openImport();
    const { user, dialog } = mounted;
    await reviewFile(mounted);
    await user.click(within(dialog).getByRole("button", { name: "Aplicar sin las 12 filas con errores" }));
    await within(dialog).findByRole("alert");
    server.use(http.get(`${base}/c-prov`, () => problem(404, "Forms.Catalog.NotFound", "Ese catálogo ya no está.")));
    await user.click(within(dialog).getByRole("button", { name: "Revisar de nuevo" }));
    expect(await within(dialog).findByText("Ese catálogo ya no está.")).toBeVisible();
    expect(screen.getAllByText("Ese catálogo ya no está.")).toHaveLength(1);
  });

  it("otra importación en curso (Busy): la franja con su texto y solo «Cerrar»", async () => {
    serve({ apply: () => problem(409, "Forms.CatalogImport.Busy", "Ya tenés una importación o una exportación en curso. Probá en un momento.") });
    const mounted = await openImport();
    const { user, dialog } = mounted;
    await reviewFile(mounted);
    await user.click(within(dialog).getByRole("button", { name: "Aplicar sin las 12 filas con errores" }));
    expect(await within(dialog).findByRole("alert")).toHaveTextContent("Ya tenés una importación o una exportación en curso. Probá en un momento.");
    const footer = dialog.querySelector<HTMLElement>("[data-slot=dialog-footer]")!;
    expect(within(footer).getAllByRole("button").map((button) => button.textContent)).toEqual(["Cerrar"]);
    await user.click(within(footer).getByRole("button", { name: "Cerrar" }));
    await waitFor(() => expect(screen.queryByRole("dialog", { name: "Importar opciones a «Proveedores»" })).not.toBeInTheDocument());
  });

  it("un valor ambiguo de un catálogo decimal dice las dos formas de escribirlo", async () => {
    serve({
      current: () => ({ ...catalog, valueType: "DecimalNumber" }),
      preview: (page) => HttpResponse.json(previewOf(page, { errors: paged([{ row: 3, column: "value", code: "Forms.CatalogImport.ValueAmbiguous", value: "1.500" }], page, 1) })),
    });
    const mounted = await openImport();
    await reviewFile(mounted);
    expect(within(mounted.dialog).getByRole("row", { name: "3 Valor «1.500» se lee de dos formas. Escribí 1500 o 1,5." })).toBeVisible();
  });
});
