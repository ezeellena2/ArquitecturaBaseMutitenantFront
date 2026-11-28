import { describe, expect, it } from "vitest";
import type { FormCatalogFieldDetail, FormCatalogItemRow } from "../api/types";
import {
  catalogProposalDraft, catalogProposalFields, catalogProposalRowsOf, catalogProposalTargets, proposalKeyOf, proposalLocalId, toCatalogProposalRows,
} from "./proposal";

const saved = (id: string, text: string, code: string, extra: Partial<FormCatalogItemRow> = {}): FormCatalogItemRow =>
  ({ id, position: 1, text, code, detail: null, value: null, isActive: true, textRepeated: false, fields: {}, ...extra });
const rows = (options: { key: string; values: Record<string, unknown> }[]) => ({ fields: {}, lists: {}, rows: { options } });

describe("la propuesta de las opciones de un catálogo (catalogoptions.edit@1)", () => {
  it("los campos son los del catálogo destino: el valor, solo en uno tipado, con su tipo", () => {
    expect(catalogProposalFields("Text")[0].itemFields?.map((field) => field.name)).toEqual(["code", "text", "detail", "active"]);
    expect(catalogProposalFields("DecimalNumber")[0].itemFields?.find((field) => field.name === "value")).toMatchObject({ type: "decimal", required: true });
    expect(catalogProposalFields("WholeNumber")[0].itemFields?.find((field) => field.name === "value")?.type).toBe("integer");
    expect(catalogProposalFields("Date")[0].itemFields?.find((field) => field.name === "value")?.type).toBe("date");
  });

  // E13: cada campo activo es una columna de la fila, por su clave, con el tipo de la lista cerrada y sus límites.
  const field = (id: string, key: string, type: FormCatalogFieldDetail["type"], extra: Partial<FormCatalogFieldDetail> = {}): FormCatalogFieldDetail =>
    ({ id, key, name: key, type, required: true, unique: false, isActive: true, valuesCount: 0, ...extra });
  const campos = [
    field("f-cuit", "cuit", "Text", { maxLength: 13 }), field("f-plazo", "plazo", "WholeNumber", { min: "0", max: "120" }),
    field("f-alta", "alta", "Date"), field("f-iva", "iva", "YesNo"), field("f-zona", "zona", "Catalog", { sourceCatalogId: "c-zonas" }),
    field("f-viejo", "viejo", "Text", { isActive: false }), field("f-active", "active", "YesNo"),
  ];

  it("cada campo activo es una columna, opcional, con su tipo y sus límites; uno quitado o con la clave de una fija, no", () => {
    expect(catalogProposalFields("Text", campos)[0].itemFields?.slice(4)).toEqual([
      { name: "cuit", type: "text", required: false, maxLength: 13 },
      { name: "plazo", type: "integer", required: false, minimum: 0, maximum: 120 },
      { name: "alta", type: "date", required: false },
      { name: "iva", type: "boolean", required: false },
      { name: "zona", type: "record", required: false },
    ]);
  });

  it("el valor de un campo llega canónico por su id; uno que no es de su tipo no se puede mostrar", () => {
    const toRows = catalogProposalRowsOf(campos);
    expect(toRows(rows([{ key: "A", values: { code: "A", text: "Uno", cuit: "30-1", plazo: 30, iva: true, zona: "z-cap", alta: null } }])))
      .toEqual([{ key: "A", code: "A", text: "Uno", fields: { "f-cuit": "30-1", "f-plazo": "30", "f-iva": true, "f-zona": "z-cap", "f-alta": null } }]);
    expect(toRows(rows([{ key: "A", values: { plazo: 1e-7 } }]))).toBeUndefined();
    expect(toRows(rows([{ key: "A", values: { iva: "sí" } }]))).toBeUndefined();
  });

  it("en una guardada, el campo cambia solo si el valor es otro", () => {
    const touched = [saved("i-ven", "Venta nueva", "VEN", { fields: { "f-plazo": "30" } })];
    expect(catalogProposalDraft([{ key: "i-ven", fields: { "f-plazo": "30", "f-iva": true } }], touched, "Text"))
      .toEqual({ changes: { "i-ven": { fields: { "f-iva": true } } }, added: [], deletes: [] });
  });

  it("las opciones guardadas que toca son las que cambian o se quitan, con el texto de ahora", () => {
    expect(catalogProposalTargets([
      { field: "options", value: { op: "add", key: "GAR", row: { code: "GAR", text: "Garantía" } } },
      { field: "options", value: { op: "change", key: "i-ven", row: { detail: "Otra" } }, label: "Venta nueva" },
      { field: "options", value: { op: "remove", key: "i-rec" }, label: "Reclamo" },
    ])).toEqual([{ itemId: "i-ven", label: "Venta nueva" }, { itemId: "i-rec", label: "Reclamo" }]);
  });

  it("un número llega canónico; uno con exponente no se puede mostrar", () => {
    expect(toCatalogProposalRows(rows([{ key: "A", values: { code: "A", text: "Uno", value: 2.5, detail: null } }])))
      .toEqual([{ key: "A", code: "A", text: "Uno", value: "2.5", detail: "" }]);
    expect(toCatalogProposalRows(rows([{ key: "A", values: { code: "A", text: "Uno", value: 1e-7 } }]))).toBeUndefined();
  });

  it("arma el borrador: una guardada que sigue cambia solo lo distinto, una que no sigue se borra y una clave nueva se suma", () => {
    const touched = [saved("i-ven", "Venta nueva", "VEN", { detail: "Primera visita" }), saved("i-rec", "Reclamo", "REC")];
    const draft = catalogProposalDraft([
      { key: "i-ven", detail: "Primera visita a un cliente nuevo", code: "VEN" },
      { key: "GAR", code: "GAR", text: "Garantía", detail: "Revisar un equipo" },
    ], touched, "Text");
    expect(draft).toEqual({
      changes: { "i-ven": { detail: "Primera visita a un cliente nuevo" } },
      added: [{ localId: proposalLocalId("GAR"), code: "GAR", text: "Garantía", detail: "Revisar un equipo", value: null, isActive: true, fields: {} }],
      deletes: ["i-rec"],
    });
    expect(proposalKeyOf(draft?.added[0].localId)).toBe("GAR");
    expect(proposalKeyOf("local-1")).toBeUndefined();
  });

  it("una opción nueva sin texto, o sin valor en uno tipado, no se puede dibujar", () => {
    expect(catalogProposalDraft([{ key: "GAR", code: "GAR" }], [], "Text")).toBeUndefined();
    expect(catalogProposalDraft([{ key: "GAR", code: "GAR", text: "Garantía" }], [], "WholeNumber")).toBeUndefined();
  });
});
