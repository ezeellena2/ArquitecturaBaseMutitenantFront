import type { FormatState } from "@/shared/format/useFormat";
import type { FormCatalogFieldType, FormCatalogItemRow, FormCatalogPresentationDetail, FormCatalogResponse } from "../api/types";
import type { CatalogRowView, ItemDraft } from "./catalogDraft";
import { rangeValueType } from "./catalogFields";
import { displayValue, type FieldValue } from "./catalogValues";

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
  readonly what: { readonly kind: "name" } | { readonly kind: "counts" } | { readonly kind: "fields" }
    | { readonly kind: "field"; readonly name: string } | { readonly kind: "presentation"; readonly part: "title" | "description" }
    | { readonly kind: "option"; readonly number: number | null; readonly field?: keyof ItemDraft; readonly fieldName?: string };
  readonly yours: ConflictValue;
  readonly theirs: ConflictValue;
}

const fields = ["text", "code", "value", "detail", "isActive"] as const;

function valueOf(field: (typeof fields)[number], draft: ItemDraft): ConflictValue {
  if (field === "isActive") return { kind: "status", isActive: draft.isActive };
  const text = draft[field];
  return text.trim() === "" ? { kind: "none" } : { kind: "text", text, mono: field === "code" };
}

const names = (list: readonly string[]): ConflictValue => list.length ? { kind: "text", text: list.join(" · ") } : { kind: "none" };

/** Un campo activo en la revisión (E13): su identidad (`null` en uno nuevo), su nombre y lo que dice, ya leído (`fieldSummary`). */
export interface ConflictField {
  readonly id: string | null;
  readonly name: string;
  readonly summary: string;
}

/** Lo que dice un campo, con los valores canónicos de su rango, como el `PUT` y el detalle. */
export interface FieldSummaryInput {
  readonly type: FormCatalogFieldType;
  readonly sourceCatalogName?: string | null;
  readonly required: boolean;
  readonly unique: boolean;
  readonly maxLength?: number | null;
  readonly min?: string | null;
  readonly max?: string | null;
}

/** Un campo en una línea: el tipo, el largo o el rango, el catálogo fuente y las reglas («Número entero · De 0 a 1.000 · Obligatorio»). */
export function fieldSummary(field: FieldSummaryInput, format: FormatState, t: (key: string, options?: Record<string, unknown>) => string): string {
  const parts = [format.formatEnum("FormCatalogFieldType", field.type)];
  const range = rangeValueType(field.type);
  if (field.type === "Text" && field.maxLength != null) parts.push(t("forms:catalog.fieldsDialog.lengthRead", { n: format.formatInteger(field.maxLength) }));
  if (range && (field.min || field.max)) {
    const end = (value: string | null | undefined) => displayValue(value, range, format) || format.formatEmpty();
    parts.push(t("forms:catalog.fieldsDialog.rangeRead", { min: end(field.min), max: end(field.max) }));
  }
  if (field.type === "Catalog" && field.sourceCatalogName) parts.push(field.sourceCatalogName);
  if (field.required) parts.push(t("forms:catalog.fieldsDialog.required"));
  if (field.unique) parts.push(t("forms:catalog.fieldsDialog.unique"));
  return parts.join(" · ");
}

/**
 * Lo que distingue lo tuyo de lo guardado ahora por otra persona (138, O15): el nombre, los campos (E13: la lista, y de cada uno
 * que está de los dos lados, su tipo, su largo o su rango, su catálogo y sus reglas), «En WhatsApp», cada opción de la página
 * que se ve con lo que tiene distinto (una nueva tuya, una que quitás y una que cambió de un lado o del otro, también el valor
 * de un campo) y las cantidades. Solo lo distinto; lo que una versión no tiene va como «—». Una opción que no está en la
 * página leída ahora se compara con lo que leíste al abrir.
 */
export function conflictChanges({ name, rows, total, active, fresh, freshItems, savedRow, freshDraft, fields: yourFields = [], freshFields, presentation, placeName, fieldText }: {
  name: string;
  rows: readonly CatalogRowView[];
  total: number;
  active: number;
  fresh: FormCatalogResponse;
  freshItems: readonly FormCatalogItemRow[];
  savedRow: (key: string | undefined) => FormCatalogItemRow | undefined;
  /** Una guardada como se ve en la pantalla (con el valor en la región del idioma). */
  freshDraft: (row: FormCatalogItemRow) => ItemDraft;
  /** Tus campos activos, en su orden (E13). */
  fields?: readonly ConflictField[];
  /** Los activos guardados ahora, en su orden; si faltan, los del detalle, sin lo que dicen. */
  freshFields?: readonly ConflictField[];
  /** «En WhatsApp» (E13) de los dos lados, cada uno con sus lugares en el orden de su catálogo. */
  presentation?: { readonly yours: FormCatalogPresentationDetail; readonly theirs: FormCatalogPresentationDetail };
  /** Cómo se llama un lugar de «En WhatsApp» de cada lado: un campo, por su nombre en esa versión. */
  placeName?: (place: string, side: "yours" | "theirs") => string;
  /** Cómo se lee el valor de un campo en una opción: «Sí», el número, la fecha o el texto de la opción fuente. */
  fieldText?: (fieldId: string, value: FieldValue) => string;
}): ConflictChange[] {
  const changes: ConflictChange[] = [];
  if (name.trim() !== fresh.name.trim()) changes.push({ key: "name", what: { kind: "name" }, yours: { kind: "text", text: name }, theirs: { kind: "text", text: fresh.name } });
  const activeFresh = (fresh.fields ?? []).filter((field) => field.isActive);
  const theirFields = freshFields ?? activeFresh.map((field): ConflictField => ({ id: field.id, name: field.name, summary: "" }));
  const yourNames = yourFields.map((field) => field.name.trim());
  if (JSON.stringify(yourNames) !== JSON.stringify(theirFields.map((field) => field.name.trim()))) {
    changes.push({ key: "fields", what: { kind: "fields" }, yours: names(yourNames), theirs: names(theirFields.map((field) => field.name)) });
  }
  for (const field of yourFields) {
    const theirs = field.id ? theirFields.find((item) => item.id === field.id) : undefined;
    if (!theirs || theirs.summary === field.summary) continue;
    changes.push({ key: `field:${field.id}`, what: { kind: "field", name: field.name.trim() || theirs.name }, yours: { kind: "text", text: field.summary },
      theirs: { kind: "text", text: theirs.summary } });
  }
  if (presentation) {
    for (const part of ["title", "description"] as const) {
      const yours = presentation.yours[part] ?? [], theirs = presentation.theirs[part] ?? [];
      if (JSON.stringify(yours) === JSON.stringify(theirs)) continue;
      const placesOf = (places: readonly string[], side: "yours" | "theirs") => names(places.map((place) => placeName ? placeName(place, side) : place));
      changes.push({ key: `presentation:${part}`, what: { kind: "presentation", part }, yours: placesOf(yours, "yours"), theirs: placesOf(theirs, "theirs") });
    }
  }
  const fieldValue = (fieldId: string, value: FieldValue): ConflictValue => {
    const text = value === null ? "" : fieldText ? fieldText(fieldId, value) : String(value);
    return text.trim() === "" ? { kind: "none" } : { kind: "text", text };
  };
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
    for (const field of activeFresh) {
      const yours = row.draft.fields?.[field.id] ?? null, theirsValue = theirs.fields?.[field.id] ?? null;
      if (yours === theirsValue) continue;
      changes.push({ key: `${row.key}:field:${field.id}`, what: { kind: "option", number: row.number, fieldName: field.name },
        yours: fieldValue(field.id, yours), theirs: fieldValue(field.id, theirsValue) });
    }
  }
  if (total !== fresh.itemCounts.total || active !== fresh.itemCounts.active) {
    changes.push({ key: "counts", what: { kind: "counts" }, yours: { kind: "counts", total, active },
      theirs: { kind: "counts", total: fresh.itemCounts.total, active: fresh.itemCounts.active } });
  }
  return changes;
}
