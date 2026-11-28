import { describe, expect, it } from "vitest";
import type { FormCatalogItemRow, FormCatalogResponse } from "../api/types";
import { conflictChanges } from "./catalogConflict";
import type { CatalogRowView } from "./catalogDraft";

const item = (id: string, position: number, text: string, extra: Partial<FormCatalogItemRow> = {}): FormCatalogItemRow =>
  ({ id, position, text, code: id.toUpperCase(), detail: null, value: null, isActive: true, textRepeated: false, fields: {}, ...extra });
const draftOf = (row: FormCatalogItemRow) => ({ code: row.code, text: row.text, detail: row.detail ?? "", value: row.value ?? "", isActive: row.isActive });
const view = (row: FormCatalogItemRow, extra: Partial<CatalogRowView> = {}, draft: Partial<CatalogRowView["draft"]> = {}): CatalogRowView =>
  ({ key: row.id, itemId: row.id, number: row.position, draft: { ...draftOf(row), ...draft }, isNew: false, pendingDelete: false, textRepeated: false, errors: {}, canMoveUp: false, canMoveDown: false, ...extra });
const fresh = (extra: Partial<FormCatalogResponse> = {}) => ({ id: "c", name: "Motivos", source: "Manual", valueType: "Text", isActive: true, usable: true, canManage: true,
  itemCounts: { total: 3, active: 3 }, modifiedAtUtc: "2026-11-27T12:00:00Z", version: 8, fields: [], ...extra }) as FormCatalogResponse;

describe("«Qué cambió» entre lo tuyo y lo guardado ahora (O15)", () => {
  const seg = item("seg", 1, "Seguimiento"), ven = item("ven", 2, "Venta"), rec = item("rec", 3, "Reclamo");

  it("lista solo lo distinto: cada opción cambiada de un lado o del otro, la nueva tuya y la que quitás; sin el nombre ni las cantidades si son iguales", () => {
    const rows = [
      view(seg, {}, { text: "Seguimiento programado" }),
      view(ven),
      view(rec, { pendingDelete: true }),
      { ...view(item("local-1", 0, "Garantía")), itemId: undefined, localId: "local-1", number: null, isNew: true },
    ];
    const changes = conflictChanges({ name: "Motivos", rows, total: 3, active: 3, fresh: fresh(), freshItems: [seg, item("ven", 2, "Venta nueva"), rec],
      savedRow: () => undefined, freshDraft: draftOf });
    expect(changes.map((change) => [change.key, change.yours, change.theirs])).toEqual([
      ["seg:text", { kind: "text", text: "Seguimiento programado", mono: false }, { kind: "text", text: "Seguimiento", mono: false }],
      ["ven:text", { kind: "text", text: "Venta", mono: false }, { kind: "text", text: "Venta nueva", mono: false }],
      ["rec", { kind: "removed" }, { kind: "text", text: "Reclamo", mono: false }],
      ["local-1", { kind: "text", text: "Garantía", mono: false }, { kind: "none" }],
    ]);
  });

  it("de los campos con el mismo nombre y orden, lo que cambió de cada uno (tipo, reglas, catálogo) y «En WhatsApp», de los dos lados", () => {
    const precio = { id: "f-precio", name: "Precio" }, cuit = { id: "f-cuit", name: "CUIT" };
    const changes = conflictChanges({ name: "Motivos", rows: [], total: 3, active: 3, freshItems: [], savedRow: () => undefined, freshDraft: draftOf,
      fresh: fresh(),
      fields: [{ ...precio, summary: "Texto" }, { ...cuit, summary: "Texto · Único" }, { id: null, name: "Nuevo", summary: "Texto" }],
      freshFields: [{ ...precio, summary: "Número entero · Obligatorio" }, { ...cuit, summary: "Texto" }],
      presentation: { yours: { title: ["text"], description: ["detail"] }, theirs: { title: ["text"], description: ["field:f-precio"] } },
      placeName: (place, side) => place === "field:f-precio" ? `Precio (${side})` : place });
    expect(changes.map((change) => [change.key, change.what, change.yours, change.theirs])).toEqual([
      ["fields", { kind: "fields" }, { kind: "text", text: "Precio · CUIT · Nuevo" }, { kind: "text", text: "Precio · CUIT" }],
      ["field:f-precio", { kind: "field", name: "Precio" }, { kind: "text", text: "Texto" }, { kind: "text", text: "Número entero · Obligatorio" }],
      ["field:f-cuit", { kind: "field", name: "CUIT" }, { kind: "text", text: "Texto · Único" }, { kind: "text", text: "Texto" }],
      ["presentation:description", { kind: "presentation", part: "description" }, { kind: "text", text: "detail" }, { kind: "text", text: "Precio (theirs)" }],
    ]);
  });

  it("el nombre y las cantidades, cuando cambian", () => {
    const changes = conflictChanges({ name: "Motivos de visita", rows: [], total: 3, active: 2, fresh: fresh({ itemCounts: { total: 3, active: 3 } }), freshItems: [],
      savedRow: () => undefined, freshDraft: draftOf });
    expect(changes.map((change) => change.key)).toEqual(["name", "counts"]);
  });
});
