import { ApiError } from "@/shared/api/ApiError";
import type { FormCatalogInvalidRow } from "./api/types";

/// Dónde va un rechazo del back en el editor de un catálogo: un dato de la ficha, una columna de una opción, la fila
/// entera (borrar o mover una que ya no es del catálogo, o que se usa), una condición de los filtros, la persona o el
/// cliente de ejemplo, o el archivo de importar. Desde la E13, también la lista de campos (el tope), un campo del modal
/// «Campos de …», el valor de un campo en una opción y «En WhatsApp». Lo demás (el 409 común, el catálogo dado de baja,
/// el origen equivocado, el tope de opciones, una importación en curso, una fuente en uso) va en la franja de la página o
/// del diálogo.
export type CatalogErrorField = "name" | "description" | "code" | "text" | "detail" | "value" | "row" | "condition" | "sample" | "file"
  | "fields" | "field" | "fieldValue" | "presentation";

/// «Errores y sus textos» de las specs de la E12 y la E13: cada código con su campo.
const fields: Readonly<Record<string, CatalogErrorField>> = {
  "Forms.Catalog.ItemNotFound": "row",
  "Forms.Catalog.ItemInUse": "row",
  "Forms.Catalog.DuplicateCode": "code",
  "Forms.Catalog.ValueRequired": "value",
  "Forms.Catalog.ValueInvalid": "value",
  "Forms.Catalog.ItemTextTooLong": "text",
  "Forms.Catalog.ItemDetailTooLong": "detail",
  "Forms.Catalog.FiltersInvalid": "condition",
  "Forms.Catalog.SampleRequired": "sample",
  "Forms.Catalog.SampleMemberNotFound": "sample",
  "Forms.Catalog.SampleContactNotFound": "sample",
  "Forms.CatalogImport.FileInvalid": "file",
  "Forms.Catalog.TooManyFields": "fields",
  "Forms.Catalog.FieldKeyDuplicate": "field",
  "Forms.Catalog.FieldInvalid": "field",
  "Forms.Catalog.FieldRemovalNotConfirmed": "field",
  "Forms.Catalog.FieldTypeNotConvertible": "field",
  "Forms.Catalog.FieldValuesIncompatible": "field",
  "Forms.Catalog.FieldValuesMissing": "field",
  "Forms.Catalog.FieldValueInvalid": "fieldValue",
  "Forms.Catalog.FieldValueRequired": "fieldValue",
  "Forms.Catalog.FieldValueDuplicate": "fieldValue",
  "Forms.Catalog.PresentationInvalid": "presentation",
};

export function catalogErrorField(error: unknown): CatalogErrorField | null {
  return error instanceof ApiError && error.code ? fields[error.code] ?? null : null;
}

/// Solo `General.ConcurrencyConflict` pone el editor en conflicto (lado a lado, 138); los demás 409 dicen lo suyo, también
/// `SourceInUse`, que se corrige quitando los campos que lo usan (E13).
export function isCatalogConflict(error: unknown): boolean {
  return error instanceof ApiError && error.code === "General.ConcurrencyConflict";
}

/// La lista del pedido a la que apunta un error: el índice es el de lo que se mandó, no el de la fila en la tabla.
export type CatalogErrorList = "items" | "deleteItems" | "moves" | "conditions" | "fields";

export interface CatalogFieldError {
  readonly list: CatalogErrorList | null;
  readonly index: number | null;
  readonly field: CatalogErrorField;
  readonly message: string;
  /** `items.{i}.fields.{id}` (E13): el id del campo cuyo valor rechazó el servidor en esa opción. */
  readonly fieldId?: string;
  /** `fields.{i}.key`, `.type`, `.required`… (E13): la parte del campo del modal a la que apunta el error. */
  readonly part?: string;
}

const plainFields: Readonly<Record<string, CatalogErrorField>> = {
  name: "name", description: "description", sampleMemberId: "sample", sampleContactId: "sample", file: "file", fields: "fields",
};
// `items[3].code` o, como lo manda el back desde la B3, `items.3.code`.
const itemKey = /^items(?:\[(\d+)\]|\.(\d+))(?:\.(code|text|detail|value))?$/;
// El valor de un campo en una opción (E13): `items.3.fields.<id del campo>`.
const itemFieldKey = /^items(?:\[(\d+)\]|\.(\d+))\.fields\.([^.[\]]+)$/;
// Un campo del modal (E13): `fields.2` o `fields.2.key`, con el índice de la lista de campos que se mandó.
const fieldKey = /^fields(?:\[(\d+)\]|\.(\d+))(?:\.(\w+))?$/;
const presentationKey = /^presentation(?:\..+)?$/;
const rowKey = /^(deleteItems|moves)(?:\[(\d+)\]|\.(\d+))$/;
const conditionKey = /^(?:filters\.)?conditions(?:\[(\d+)\]|\.(\d+))(?:\..+)?$/;

function fieldOf(key: string): Omit<CatalogFieldError, "message"> | null {
  const item = itemKey.exec(key);
  if (item) return { list: "items", index: Number(item[1] ?? item[2]), field: (item[3] as CatalogErrorField | undefined) ?? "row" };
  const itemField = itemFieldKey.exec(key);
  if (itemField) return { list: "items", index: Number(itemField[1] ?? itemField[2]), field: "fieldValue", fieldId: itemField[3] };
  const field = fieldKey.exec(key);
  if (field) return { list: "fields", index: Number(field[1] ?? field[2]), field: "field", ...(field[3] ? { part: field[3] } : {}) };
  if (presentationKey.test(key)) return { list: null, index: null, field: "presentation" };
  const row = rowKey.exec(key);
  if (row) return { list: row[1] as CatalogErrorList, index: Number(row[2] ?? row[3]), field: "row" };
  const condition = conditionKey.exec(key);
  if (condition) return { list: "conditions", index: Number(condition[1] ?? condition[2]), field: "condition" };
  const plain = Object.hasOwn(plainFields, key) ? plainFields[key] : undefined;
  return plain ? { list: null, index: null, field: plain } : null;
}

/// Cada error por campo del ProblemDetails (`items[3].code`, `deleteItems[0]`, `conditions[2]`, `sampleMemberId`,
/// `fields.1.key`, `items.4.fields.<id>`…) con su lista, su índice, su columna y el texto del back, para ponerlo debajo de
/// lo que lo causó.
export function catalogFieldErrors(error: unknown): CatalogFieldError[] {
  if (!(error instanceof ApiError) || !error.errors) return [];
  return Object.entries(error.errors).flatMap(([key, messages]) => {
    const target = fieldOf(key);
    const message = messages[0];
    return target && message ? [{ ...target, message }] : [];
  });
}

/// Las opciones que no cumplen el tipo o la regla nueva de un campo (`FieldTypeNotConvertible` y `FieldValuesIncompatible`,
/// E13): cuántas son y las primeras 50, en orden de fila, con su motivo. Sin filas, no hay nada que mostrar.
export function catalogInvalidRows(error: unknown): { count: number; rows: readonly FormCatalogInvalidRow[] } | null {
  if (!(error instanceof ApiError) || !Array.isArray(error.problem.invalidRows) || !error.problem.invalidRows.length) return null;
  const rows = error.problem.invalidRows as FormCatalogInvalidRow[];
  const count = typeof error.problem.invalidCount === "number" ? error.problem.invalidCount : rows.length;
  return { count, rows };
}
