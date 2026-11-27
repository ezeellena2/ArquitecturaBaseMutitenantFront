import { ApiError } from "@/shared/api/ApiError";

/// Dónde va un rechazo del back en el editor de un catálogo: un dato de la ficha, una columna de una opción, la fila
/// entera (borrar o mover una que ya no es del catálogo, o que se usa), una condición de los filtros, la persona o el
/// cliente de ejemplo, o el archivo de importar. Lo demás (el 409 común, el catálogo dado de baja, el origen equivocado,
/// el tope de opciones, una importación en curso) va en la franja de la página o del diálogo.
export type CatalogErrorField = "name" | "description" | "code" | "text" | "detail" | "value" | "row" | "condition" | "sample" | "file";

/// «Errores y sus textos» de la spec de la E12: cada código con su campo.
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
};

export function catalogErrorField(error: unknown): CatalogErrorField | null {
  return error instanceof ApiError && error.code ? fields[error.code] ?? null : null;
}

/// Solo `General.ConcurrencyConflict` pone el editor en conflicto (lado a lado, 138); los demás 409 dicen lo suyo.
export function isCatalogConflict(error: unknown): boolean {
  return error instanceof ApiError && error.code === "General.ConcurrencyConflict";
}

/// La lista del pedido a la que apunta un error: el índice es el de lo que se mandó, no el de la fila en la tabla.
export type CatalogErrorList = "items" | "deleteItems" | "moves" | "conditions";

export interface CatalogFieldError {
  readonly list: CatalogErrorList | null;
  readonly index: number | null;
  readonly field: CatalogErrorField;
  readonly message: string;
}

const plainFields: Readonly<Record<string, CatalogErrorField>> = {
  name: "name", description: "description", sampleMemberId: "sample", sampleContactId: "sample", file: "file",
};
const itemKey = /^items\[(\d+)\](?:\.(code|text|detail|value))?$/;
const rowKey = /^(deleteItems|moves)\[(\d+)\]$/;
const conditionKey = /^(?:filters\.)?conditions\[(\d+)\](?:\..+)?$/;

function fieldOf(key: string): Omit<CatalogFieldError, "message"> | null {
  const item = itemKey.exec(key);
  if (item) return { list: "items", index: Number(item[1]), field: (item[2] as CatalogErrorField | undefined) ?? "row" };
  const row = rowKey.exec(key);
  if (row) return { list: row[1] as CatalogErrorList, index: Number(row[2]), field: "row" };
  const condition = conditionKey.exec(key);
  if (condition) return { list: "conditions", index: Number(condition[1]), field: "condition" };
  const field = Object.hasOwn(plainFields, key) ? plainFields[key] : undefined;
  return field ? { list: null, index: null, field } : null;
}

/// Cada error por campo del ProblemDetails (`items[3].code`, `deleteItems[0]`, `conditions[2]`, `sampleMemberId`…) con
/// su lista, su índice, su columna y el texto del back, para ponerlo debajo de lo que lo causó.
export function catalogFieldErrors(error: unknown): CatalogFieldError[] {
  if (!(error instanceof ApiError) || !error.errors) return [];
  return Object.entries(error.errors).flatMap(([key, messages]) => {
    const target = fieldOf(key);
    const message = messages[0];
    return target && message ? [{ ...target, message }] : [];
  });
}
