import type { FormatState } from "@/shared/format/useFormat";
import type {
  FormCatalogFieldDetail,
  FormCatalogItemInput,
  FormCatalogItemRow,
  FormCatalogItemSortInput,
  FormCatalogMoveDirection,
  FormCatalogValueType,
} from "../api/types";
import { catalogLimits } from "./catalogLimits";
import { displayValue, fieldDraftValue, readFieldValue, readValue, sameText, type FieldValue } from "./catalogValues";

// El borrador de un catálogo a mano como dato (C3): lo que se cambió de cada opción guardada, las nuevas, las que se borran
// al guardar, los movimientos y el orden pendientes. De acá salen las filas de la tabla, con sus errores, y lo que viaja en
// el `PUT`; el hook (`useCatalogDraft`) solo guarda el estado y lo cambia.

export type ItemField = "code" | "text" | "detail" | "value";
export interface ItemDraft {
  readonly code: string;
  readonly text: string;
  readonly detail: string;
  /** Lo que se ve y se escribe: en un catálogo tipado, con la región del idioma (207); se manda canónico. */
  readonly value: string;
  readonly isActive: boolean;
  /** El valor de cada campo (E13), por su id, como se ve y se escribe; ausente o `null`, sin valor. */
  readonly fields?: Readonly<Record<string, FieldValue>>;
}
export interface NewItem extends ItemDraft { readonly localId: string }
/** Lo cambiado de una opción; de los campos, solo los que cambiaron (el delta de `items[i].fields`). */
export type ItemEdits = Partial<ItemDraft>;
/** El error del valor de un campo en una opción va en `field:<id del campo>`. */
export type FieldErrorKey = `field:${string}`;
export type RowError = Partial<Record<ItemField | "row" | FieldErrorKey, string>>;
export const fieldErrorKey = (fieldId: string): FieldErrorKey => `field:${fieldId}`;
export type CatalogMove = { readonly itemId: string; readonly direction: FormCatalogMoveDirection };

/** Una fila de la tabla de opciones: guardada (con lo que se cambió encima) o nueva. */
export interface CatalogRowView {
  readonly key: string;
  readonly itemId?: string;
  readonly localId?: string;
  /** La posición, con los movimientos pendientes; «—» en una nueva. */
  readonly number: number | null;
  readonly draft: ItemDraft;
  readonly isNew: boolean;
  readonly pendingDelete: boolean;
  readonly textRepeated: boolean;
  /** Los errores que se ven: los del servidor siempre; los de la pantalla, después de intentar guardar (162 y 2026-10-24). */
  readonly errors: RowError;
  readonly canMoveUp: boolean;
  readonly canMoveDown: boolean;
}

/** El estado del borrador. */
export interface CatalogDraftState {
  readonly edits: Readonly<Record<string, ItemEdits>>;
  readonly added: readonly NewItem[];
  readonly deletes: ReadonlySet<string>;
  readonly moves: readonly CatalogMove[];
  readonly positions: Readonly<Record<string, number>>;
  readonly sort: FormCatalogItemSortInput | null;
  readonly serverErrors: Readonly<Record<string, RowError>>;
}

/** Una opción con algún error (no el aviso de texto repetido, que no frena): la lista del modal la marca con un triángulo. */
export const rowHasErrors = (row: Pick<CatalogRowView, "errors">) => Object.values(row.errors).some(Boolean);

/**
 * Lo que se ve de una guardada que no se tocó: lo leído, con el valor en la región del idioma, y el de cada campo como se
 * escribe en su celda, según su tipo guardado (`fields`).
 */
export function savedDraft(row: FormCatalogItemRow, valueType: FormCatalogValueType, format: FormatState,
  fields: readonly Pick<FormCatalogFieldDetail, "id" | "type">[] = []): ItemDraft {
  const values = Object.entries(row.fields ?? {}).map(([id, raw]) => [id, fieldDraftValue(raw, fields.find((field) => field.id === id)?.type, format)]);
  return { code: row.code, text: row.text, detail: row.detail ?? "", value: displayValue(row.value, valueType, format), isActive: row.isActive,
    fields: Object.fromEntries(values) };
}

/** Lo cambiado de una guardada sin lo que volvió a lo leído: una opción sin cambios no viaja (C3), tampoco un campo. */
export function cleanEdits(edit: ItemEdits, base: ItemDraft): ItemEdits {
  const { fields, ...rest } = edit;
  const clean = Object.fromEntries(Object.entries(rest).filter(([field, value]) => base[field as keyof ItemDraft] !== value)) as ItemEdits;
  const changed = Object.entries(fields ?? {}).filter(([id, value]) => (base.fields?.[id] ?? null) !== value);
  return changed.length ? { ...clean, fields: Object.fromEntries(changed) } : clean;
}

/** Lo cambiado encima de una guardada; los campos, sumados a los suyos. */
export const withEdits = (base: ItemDraft, edit: ItemEdits | undefined): ItemDraft =>
  edit ? { ...base, ...edit, fields: { ...base.fields, ...edit.fields } } : base;

/** Lo que se cambió de una opción guardada, en el orden de la tabla: «Lo que cambia» de la propuesta lo nombra. */
export function changedFieldsOf(state: CatalogDraftState, key: string): (keyof ItemDraft)[] {
  const edit = state.edits[key];
  return edit ? (["text", "code", "value", "detail", "isActive"] as const).filter((field) => edit[field] !== undefined) : [];
}

interface RowsInput {
  /** La página a la vista, como la leyó el servidor. */
  readonly pageRows: readonly FormCatalogItemRow[];
  /** Guardadas de otras páginas que el borrador toca (las de una propuesta del asistente): se ven con cambios o por borrar. */
  readonly extraRows: readonly FormCatalogItemRow[];
  readonly state: CatalogDraftState;
  readonly valueType: FormCatalogValueType;
  /** Ya se intentó guardar: los errores de la pantalla se ven. */
  readonly showErrors: boolean;
  /** Los campos guardados (E13): con su tipo se lee y se valida el valor de cada uno. */
  readonly fields?: readonly FormCatalogFieldDetail[];
  /** Los que se validan (los que viajan): sin los que el borrador quitó o les cambió el tipo. Si falta, todos los guardados. */
  readonly writableFields?: readonly FormCatalogFieldDetail[];
  /**
   * Las opciones que no cumplen el tipo o la regla nueva de un campo, como las dijo el servidor (`invalidRows`): se ven en su
   * celda, como un error del servidor, y no frenan el próximo guardado (lección 4).
   */
  readonly invalidValues?: Readonly<Record<string, RowError>>;
  readonly format: FormatState;
  readonly t: (key: string, options?: Record<string, unknown>) => string;
}

/** La posición de una guardada con los movimientos pendientes. */
export const positionOf = (state: CatalogDraftState, row: FormCatalogItemRow) => state.positions[row.id] ?? row.position;

/** La guardada de una clave: en la página o entre las que toca el borrador desde otra. */
export function savedRowOf(input: Pick<RowsInput, "pageRows" | "extraRows">, key: string | undefined): FormCatalogItemRow | undefined {
  return input.pageRows.find((item) => item.id === key) ?? input.extraRows.find((item) => item.id === key);
}

/**
 * Las filas de la tabla: la página en el orden pendiente, las de otras páginas que el borrador toca y las nuevas. Cada una con
 * todos sus errores (`problems`, lo que frena el guardado) y los que se ven (`errors`).
 */
export function catalogRows(input: RowsInput): (CatalogRowView & { readonly problems: RowError })[] {
  const { pageRows, extraRows, state, valueType, format, t } = input;
  const fields = input.fields ?? [];
  const writable = input.writableFields ?? fields;
  const ordered = [...pageRows].sort((a, b) => positionOf(state, a) - positionOf(state, b));
  const byPosition = new Map(ordered.map((row) => [positionOf(state, row), row]));
  const draftOf = (row: FormCatalogItemRow): ItemDraft => withEdits(savedDraft(row, valueType, format, fields), state.edits[row.id]);
  const elsewhere = extraRows.filter((row) => !pageRows.some((item) => item.id === row.id) && (state.edits[row.id] || state.deletes.has(row.id)));
  const visible = [
    ...ordered.map((row) => ({ key: row.id, row, draft: draftOf(row) })),
    ...elsewhere.map((row) => ({ key: row.id, row, draft: draftOf(row) })),
    ...state.added.map((item) => ({ key: item.localId, row: undefined, draft: item as ItemDraft })),
  ];
  const others = (key: string) => visible.filter((item) => item.key !== key && !state.deletes.has(item.key));

  function problemsOf(key: string, row: FormCatalogItemRow | undefined, draft: ItemDraft): RowError {
    const errors: RowError = {};
    if (draft.text.length > catalogLimits.itemText) errors.text = t("forms:catalog.errors.textTooLong", { n: catalogLimits.itemText });
    if (draft.code.length > catalogLimits.itemCode) errors.code = t("forms:catalog.errors.codeTooLong", { n: catalogLimits.itemCode });
    if (draft.detail.length > catalogLimits.itemDetail) errors.detail = t("forms:catalog.errors.detailTooLong", { n: catalogLimits.itemDetail });
    // El código repetido se marca en la opción que lo escribió (una nueva o con el código cambiado), no en la guardada que ya
    // lo tenía, como lo marca el servidor: el modal se abre en ella (117).
    if (draft.code.trim() && (!row || state.edits[key]?.code !== undefined)) {
      const other = others(key).find((item) => sameText(item.draft.code, draft.code));
      if (other?.row) errors.code ??= t("forms:catalog.errors.duplicateCode", { n: positionOf(state, other.row) });
    }
    // En un catálogo tipado, toda opción lleva su valor; uno guardado que no se tocó ya es canónico.
    if (valueType !== "Text" && (!row || state.edits[key]?.value !== undefined)) {
      const read = readValue(draft.value, valueType, format, t);
      if (read.error) errors.value = read.error;
    }
    // El valor de un campo se lee si se escribió (una nueva, o cambiado): uno guardado que no se tocó ya es canónico.
    const written = row ? Object.keys(state.edits[key]?.fields ?? {}) : Object.keys(draft.fields ?? {});
    for (const id of written) {
      const field = writable.find((item) => item.id === id);
      const read = field ? readFieldValue(draft.fields?.[id] ?? null, field.type, format, t) : null;
      if (read?.error) errors[fieldErrorKey(id)] = read.error;
    }
    return errors;
  }

  return visible.map(({ key, row, draft }) => {
    const pendingDelete = state.deletes.has(key);
    const touched = !row || state.edits[key]?.text !== undefined;
    const textRepeated = touched ? draft.text.trim() !== "" && others(key).some((item) => sameText(item.draft.text, draft.text)) : row.textRepeated;
    const neighbor = (offset: number) => row ? byPosition.get(positionOf(state, row) + offset) : undefined;
    // Una de otra página se mueve en la suya.
    const movable = row !== undefined && pageRows.includes(row) && !pendingDelete && state.deletes.size === 0;
    const server = { ...input.invalidValues?.[key], ...state.serverErrors[key] };
    const problems = { ...problemsOf(key, row, draft), ...server };
    return {
      key,
      itemId: row?.id,
      localId: row ? undefined : key,
      number: row ? positionOf(state, row) : null,
      draft,
      isNew: !row,
      pendingDelete,
      textRepeated,
      problems,
      errors: input.showErrors ? problems : server,
      canMoveUp: movable && Boolean(neighbor(-1)),
      canMoveDown: movable && Boolean(neighbor(1)),
    };
  });
}

/**
 * Una opción como viaja en el `PUT` o en el `POST`: una guardada sin tocar el valor manda el canónico que leyó. De los campos
 * (E13), el delta: en una guardada, solo los que cambiaron (`null` limpia); en una nueva, los que tienen valor.
 */
export function itemInputOf(row: CatalogRowView, original: FormCatalogItemRow | undefined, valueEdited: boolean,
  valueType: FormCatalogValueType, format: FormatState, t: (key: string) => string,
  fieldEdits?: Readonly<Record<string, FieldValue>>, fields: readonly FormCatalogFieldDetail[] = []): FormCatalogItemInput {
  const written = Object.entries(row.isNew ? row.draft.fields ?? {} : fieldEdits ?? {}).flatMap(([id, written]) => {
    const field = fields.find((item) => item.id === id);
    if (!field || (row.isNew && written === null)) return [];
    return [[id, readFieldValue(written, field.type, format, t).canonical] as const];
  });
  const value = valueType === "Text"
    ? row.draft.value.trim() === "" ? null : row.draft.value
    : original && !valueEdited ? original.value ?? null : readValue(row.draft.value, valueType, format, t).canonical;
  return {
    ...(row.itemId ? { itemId: row.itemId } : { localId: row.localId }),
    code: row.draft.code,
    text: row.draft.text,
    detail: row.draft.detail.trim() === "" ? null : row.draft.detail,
    value,
    isActive: row.draft.isActive,
    ...(written.length ? { fields: Object.fromEntries(written) } : {}),
  };
}
