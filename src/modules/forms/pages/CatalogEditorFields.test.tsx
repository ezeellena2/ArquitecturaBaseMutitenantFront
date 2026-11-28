import { screen, waitFor, within } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { server } from "@/test/mocks/server";
import { pickerName } from "@/test/picker";
import { asPhone, cardData } from "@/test/utils/phone";
import type { FormCatalogFieldDetail, FormCatalogItemRow, FormCatalogResponse } from "../api/types";
import { formsOwner, formsReader, mountForms, withoutFields } from "../test/support";

// Los campos de un catálogo en el editor (verificación de la E13). Fuera de su celda, el teléfono, la tabla de lectura y «Por
// ejemplo» reciben el borrador, que ya viene con la región del idioma («12/03/2021», «2500,5») y en el tipo guardado, y lo leen
// así antes de formatearlo.
const base = "/api/organization/forms/catalogs";
const path = "/org/formularios/catalogos/c-motivos";
const alta: FormCatalogFieldDetail = { id: "f-alta", key: "alta", name: "Alta", type: "Date", required: false, unique: false, isActive: true, valuesCount: 1 };
const tasa: FormCatalogFieldDetail = { id: "f-tasa", key: "tasa", name: "Tasa", type: "DecimalNumber", required: false, unique: false, isActive: true, valuesCount: 1 };
const catalog: FormCatalogResponse = {
  id: "c-motivos", name: "Motivos de visita", description: null, source: "Manual", valueType: "Text", isActive: true, usable: true, canManage: true,
  itemCounts: { total: 2, active: 2 }, modifiedAtUtc: "2026-11-20T13:00:00Z", version: 7, ...withoutFields(), fields: [alta, tasa],
};
const item = (id: string, position: number, text: string, code: string, fields: FormCatalogItemRow["fields"]): FormCatalogItemRow =>
  ({ id, position, text, code, detail: null, value: null, isActive: true, textRepeated: false, fields });
const items = [item("i-seg", 1, "Seguimiento", "SEG", { "f-alta": "2021-03-12", "f-tasa": "2500.5" }), item("i-ven", 2, "Venta nueva", "VEN", {})];

beforeAll(async () => { await import("./CatalogEditorPage"); });
beforeEach(() => {
  server.use(
    http.get(`${base}/c-motivos`, () => HttpResponse.json(catalog)),
    http.get(`${base}/c-motivos/items`, () => HttpResponse.json({ items, page: 1, pageSize: 10, totalCount: 2, totalPages: 1, hasPrevious: false, hasNext: false })),
  );
});

describe("los valores de los campos fuera de su celda (E13)", () => {
  describe("en el teléfono (M-FRM-Catalogo-13)", () => {
    let restore: () => void = () => {};
    beforeEach(() => { restore = asPhone(); });
    afterEach(() => restore());

    it("una fecha y un número con valor se leen con la región del idioma, sin romper la pantalla; sin valor, «—»", async () => {
      mountForms(formsOwner, path);
      const [seguimiento, venta] = (await screen.findAllByRole("listitem")).filter((card) => card.querySelector("dl"));
      expect(within(seguimiento!).getByText("Seguimiento")).toBeInTheDocument();
      expect(cardData(seguimiento!)).toEqual([["Código", "SEG"], ["Alta", "12/03/2021"], ["Tasa", "2.500,5"]]);
      expect(cardData(venta!).slice(1).map(([name, value]) => [name, value.trim()])).toEqual([["Alta", "—"], ["Tasa", "—"]]);
      expect(screen.queryByText("No pudimos abrir esta pantalla")).not.toBeInTheDocument();
    });
  });

  it("«Por ejemplo» lee el valor con el tipo guardado: con «Zona» cambiada a Número entero dice «Capital», nunca la identidad de su opción", async () => {
    const zona: FormCatalogFieldDetail = { id: "f-zona", key: "zona", name: "Zona", type: "Catalog", sourceCatalogId: "c-zonas", sourceCatalogName: "Zonas",
      required: false, unique: false, isActive: true, valuesCount: 1 };
    const capital: FormCatalogItemRow = { ...item("z-cap", 1, "Capital", "CAP", {}) };
    server.use(
      http.get(`${base}/c-motivos`, () => HttpResponse.json({ ...catalog, fields: [zona], presentation: { title: ["text"], description: ["field:f-zona"] } })),
      http.get(`${base}/c-motivos/items`, () => HttpResponse.json({ items: [item("i-seg", 1, "Seguimiento", "SEG", { "f-zona": "z-cap" })],
        page: 1, pageSize: 10, totalCount: 1, totalPages: 1, hasPrevious: false, hasNext: false })),
      http.get(`${base}/c-zonas/items`, () => HttpResponse.json({ items: [capital], page: 1, pageSize: 100, totalCount: 1, totalPages: 1, hasPrevious: false, hasNext: false })),
    );
    const { user } = mountForms(formsOwner, path);
    const example = () => screen.getByRole("group", { name: "Por ejemplo" });
    await waitFor(() => expect(example()).toHaveTextContent("SeguimientoCapital"));
    await user.click(screen.getByRole("button", { name: /^Agregar campos/ }));
    const dialog = await screen.findByRole("dialog", { name: "Campos de «Motivos de visita»" });
    await user.click(within(dialog).getByRole("button", { name: pickerName("Tipo") }));
    await user.click(await screen.findByRole("option", { name: "Número entero" }));
    await user.click(within(dialog).getByRole("button", { name: "Listo" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(example()).toHaveTextContent("SeguimientoCapital");
    expect(example()).not.toHaveTextContent("z-cap");
  });

  it("quien solo lee ve la fecha y el número en la tabla de lectura de la compu", async () => {
    server.use(http.get(`${base}/c-motivos`, () => HttpResponse.json({ ...catalog, canManage: false })));
    mountForms(formsReader, path);
    // «Seguimiento» también es la vista previa de al lado: la fila es la de la tabla.
    await screen.findByRole("columnheader", { name: "Alta" });
    const row = screen.getAllByText("Seguimiento").map((text) => text.closest("tr")).find(Boolean)!;
    expect(within(row).getByText("12/03/2021")).toBeInTheDocument();
    expect(within(row).getByText("2.500,5")).toBeInTheDocument();
  });
});

describe("el encabezado de Opciones con campos (FRM-Catalogo-13 y M-FRM-Catalogo-13)", () => {
  it("en la compu, «+ Agregar campos · 2» como «+ Agregar opción»; con un campo rechazado, solo el número va en rojo", async () => {
    let puts = 0;
    server.use(http.put(`${base}/c-motivos`, () => {
      puts++;
      return HttpResponse.json({ status: 400, code: "Forms.Catalog.FieldTypeNotConvertible", traceId: "t",
        errors: { "fields.0.type": ["1 opción tiene un valor que no es un número entero."] }, invalidCount: 1,
        invalidRows: [{ position: 1, itemId: "i-seg", text: "Seguimiento", reason: "invalid" }] }, { status: 400 });
    }));
    const { user } = mountForms(formsOwner, path);
    const fieldsButton = await screen.findByRole("button", { name: "Agregar campos · 2" });
    expect(fieldsButton.querySelector("svg")).not.toBeNull();
    expect(screen.getByRole("button", { name: "Agregar opción" }).querySelector("svg")).not.toBeNull();
    await user.click(fieldsButton);
    const dialog = await screen.findByRole("dialog", { name: "Campos de «Motivos de visita»" });
    await user.click(within(dialog).getByRole("button", { name: pickerName("Tipo") }));
    await user.click(await screen.findByRole("option", { name: "Número entero" }));
    await user.click(within(dialog).getByRole("button", { name: "Listo" }));
    await user.click(screen.getByRole("button", { name: "Guardar cambios" }));
    await waitFor(() => expect(puts).toBe(1));
    expect(await screen.findByText("«Alta» · Tipo: 1 opción tiene un valor que no es un número entero.")).toBeInTheDocument();
    const rejected = screen.getByRole("button", { name: "Agregar campos · 2" });
    expect(rejected).not.toHaveClass("text-[var(--peligro)]");
    expect(rejected.querySelector("[data-rejected]")).toHaveClass("text-[var(--peligro)]", "bg-[var(--peligro-t)]");
  });

  describe("en el teléfono", () => {
    let restore: () => void = () => {};
    beforeEach(() => { restore = asPhone(); });
    afterEach(() => restore());

    it("debajo del título, «Agregar opción» y «Agregar campos · 2», dos botones iguales y sin «+», y «Columnas» a todo el ancho antes de la búsqueda", async () => {
      mountForms(formsOwner, path);
      const fieldsButton = await screen.findByRole("button", { name: "Agregar campos · 2" });
      const add = screen.getByRole("button", { name: "Agregar opción" });
      expect(add.parentElement).toBe(fieldsButton.parentElement);
      for (const button of [add, fieldsButton]) {
        expect(button).toHaveClass("h-11", "border-[var(--borde2)]");
        expect(button.querySelector("svg")).toBeNull();
      }
      const columns = screen.getByRole("button", { name: /Columnas/ });
      expect(columns).toHaveClass("w-full", "h-11");
      const search = screen.getByRole("searchbox", { name: "Buscar opción" });
      expect(columns.compareDocumentPosition(search) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    });
  });
});
