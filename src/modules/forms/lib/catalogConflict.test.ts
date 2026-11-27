import { describe, expect, it } from "vitest";
import type { FormCatalogItemRow, FormCatalogResponse } from "../api/types";
import { conflictChanges } from "./catalogConflict";
import type { CatalogRowView } from "./catalogDraft";

const item = (id: string, position: number, text: string, extra: Partial<FormCatalogItemRow> = {}): FormCatalogItemRow =>
  ({ id, position, text, code: id.toUpperCase(), detail: null, value: null, isActive: true, textRepeated: false, ...extra });
const draftOf = (row: FormCatalogItemRow) => ({ code: row.code, text: row.text, detail: row.detail ?? "", value: row.value ?? "", isActive: row.isActive });
const view = (row: FormCatalogItemRow, extra: Partial<CatalogRowView> = {}, draft: Partial<CatalogRowView["draft"]> = {}): CatalogRowView =>
  ({ key: row.id, itemId: row.id, number: row.position, draft: { ...draftOf(row), ...draft }, isNew: false, pendingDelete: false, textRepeated: false, errors: {}, canMoveUp: false, canMoveDown: false, ...extra });
const fresh = (extra: Partial<FormCatalogResponse> = {}) => ({ id: "c", name: "Motivos", source: "Manual", valueType: "Text", isActive: true, usable: true, canManage: true,
  itemCounts: { total: 3, active: 3 }, modifiedAtUtc: "2026-11-27T12:00:00Z", version: 8, ...extra }) as FormCatalogResponse;

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

  it("el nombre y las cantidades, cuando cambian", () => {
    const changes = conflictChanges({ name: "Motivos de visita", rows: [], total: 3, active: 2, fresh: fresh({ itemCounts: { total: 3, active: 3 } }), freshItems: [],
      savedRow: () => undefined, freshDraft: draftOf });
    expect(changes.map((change) => change.key)).toEqual(["name", "counts"]);
  });
});
