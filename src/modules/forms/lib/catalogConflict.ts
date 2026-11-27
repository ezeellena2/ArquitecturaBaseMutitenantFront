import type { FormCatalogItemRow, FormCatalogResponse } from "../api/types";
import type { CatalogRowView, ItemDraft } from "./catalogDraft";

/** Un lado de un dato: lo que dice, que la opción se quita al guardar, o que esa versión no lo tiene («—»). */
export type ConflictValue =
  | { readonly kind: "text"; readonly text: string; readonly mono?: boolean }
  | { readonly kind: "status"; readonly isActive: boolean }
  | { readonly kind: "counts"; readonly total: number; readonly active: number }
  | { readonly kind: "removed" }
  | { readonly kind: "none" };

/** Un renglón de «Qué cambió»: el dato una sola vez y cada versión en su columna, solo lo distinto (pantallas-y-ui, O15). */
export interface ConflictChange {
  readonly key: string;
  readonly what: { readonly kind: "name" } | { readonly kind: "counts" } | { readonly kind: "option"; readonly number: number | null; readonly field?: keyof ItemDraft };
  readonly yours: ConflictValue;
  readonly theirs: ConflictValue;
}

const fields = ["text", "code", "value", "detail", "isActive"] as const;

function valueOf(field: (typeof fields)[number], draft: ItemDraft): ConflictValue {
  if (field === "isActive") return { kind: "status", isActive: draft.isActive };
  const text = draft[field];
  return text.trim() === "" ? { kind: "none" } : { kind: "text", text, mono: field === "code" };
}

/**
 * Lo que distingue lo tuyo de lo guardado ahora por otra persona (138, O15): el nombre, cada opción de la página que se ve
 * con lo que tiene distinto (una nueva tuya, una que quitás y una que cambió de un lado o del otro) y las cantidades. Solo
 * lo distinto; lo que una versión no tiene va como «—». Una opción que no está en la página leída ahora se compara con lo
 * que leíste al abrir.
 */
export function conflictChanges({ name, rows, total, active, fresh, freshItems, savedRow, freshDraft }: {
  name: string;
  rows: readonly CatalogRowView[];
  total: number;
  active: number;
  fresh: FormCatalogResponse;
  freshItems: readonly FormCatalogItemRow[];
  savedRow: (key: string | undefined) => FormCatalogItemRow | undefined;
  /** Una guardada como se ve en la pantalla (con el valor en la región del idioma). */
  freshDraft: (row: FormCatalogItemRow) => ItemDraft;
}): ConflictChange[] {
  const changes: ConflictChange[] = [];
  if (name.trim() !== fresh.name.trim()) changes.push({ key: "name", what: { kind: "name" }, yours: { kind: "text", text: name }, theirs: { kind: "text", text: fresh.name } });
  for (const row of rows) {
    if (row.isNew) {
      changes.push({ key: row.key, what: { kind: "option", number: null }, yours: valueOf("text", row.draft), theirs: { kind: "none" } });
      continue;
    }
    const theirsRow = freshItems.find((item) => item.id === row.itemId) ?? savedRow(row.itemId);
    if (!theirsRow) continue;
    const theirs = freshDraft(theirsRow);
    if (row.pendingDelete) {
      changes.push({ key: row.key, what: { kind: "option", number: theirsRow.position }, yours: { kind: "removed" }, theirs: valueOf("text", theirs) });
      continue;
    }
    for (const field of fields) {
      if (row.draft[field] === theirs[field]) continue;
      changes.push({ key: `${row.key}:${field}`, what: { kind: "option", number: row.number, field }, yours: valueOf(field, row.draft), theirs: valueOf(field, theirs) });
    }
  }
  if (total !== fresh.itemCounts.total || active !== fresh.itemCounts.active) {
    changes.push({ key: "counts", what: { kind: "counts" }, yours: { kind: "counts", total, active },
      theirs: { kind: "counts", total: fresh.itemCounts.total, active: fresh.itemCounts.active } });
  }
  return changes;
}
