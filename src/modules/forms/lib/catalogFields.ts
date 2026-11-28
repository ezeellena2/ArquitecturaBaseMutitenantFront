import { validationConstraints } from "@/shared/api/generated/validation";
import type { FormatState } from "@/shared/format/useFormat";
import type { FormCatalogFieldDetail, FormCatalogFieldType, FormCatalogItemSortInput, FormCatalogPresentationDetail, FormCatalogValueType } from "../api/types";
import { editableValue } from "./catalogValues";

const field = validationConstraints.FormCatalogFieldHttpInput;

/**
 * Los topes de un campo, los mismos que valida el servidor (269 y O13): salen del contrato, nunca de un número escrito en la
 * pantalla. Los activos de un catálogo son los que entran en el `PUT` (42 y 105).
 */
export const catalogFieldLimits = {
  name: field.name.maxLength,
  key: field.key.maxLength,
  minLength: field.maxLength.minimum,
  maxLength: field.maxLength.maximum,
  active: validationConstraints.UpdateFormCatalogHttpRequest.fields.maxItems,
} as const;

/** Los tipos de un campo, en el orden de la pieza (FRM-Catalogo-Campos). */
export const catalogFieldTypes: readonly FormCatalogFieldType[] = ["Text", "WholeNumber", "DecimalNumber", "Date", "YesNo", "Catalog"];

/** Lo que rechazó el servidor de un campo, en su lugar del modal. */
export type CatalogFieldErrors = Partial<Record<"row" | "name" | "key" | "type" | "required", string>>;

/**
 * Un campo en el borrador del editor: uno guardado (`id`) o uno nuevo, todavía sin `id`. El nombre, el largo y el rango van
 * como se escriben (el rango de un número o una fecha, con la región del idioma, como el valor de la E12), y la clave sigue al
 * nombre hasta que alguien la escribe; guardada, queda fija (130).
 */
export interface CatalogFieldDraft {
  /** El id guardado, o el local de uno nuevo: identifica la fila en el modal y en el `PUT` (`id` o `localId`). */
  readonly localKey: string;
  readonly id: string | null;
  readonly key: string;
  /** Si la clave la escribió alguien: entonces deja de seguir al nombre. */
  readonly keyEdited: boolean;
  readonly name: string;
  readonly type: FormCatalogFieldType;
  readonly sourceCatalogId: string | null;
  readonly sourceCatalogName: string | null;
  readonly required: boolean;
  readonly unique: boolean;
  readonly maxLength: string;
  readonly min: string;
  readonly max: string;
  /** Las opciones con valor: quitar uno con valores pide marcar la confirmación. */
  readonly valuesCount: number;
  readonly errors?: CatalogFieldErrors;
}

/** Los campos activos del borrador, en orden, y los guardados con valores cuya baja ya se confirmó. */
export interface CatalogFieldsDraft {
  readonly fields: readonly CatalogFieldDraft[];
  readonly confirmedRemovals: readonly string[];
}

/** El tipo del valor de la E12 con que se lee el rango de un campo (número o fecha), o `null` si no lleva rango. */
export function rangeValueType(type: FormCatalogFieldType): FormCatalogValueType | null {
  return type === "WholeNumber" || type === "DecimalNumber" || type === "Date" ? type : null;
}

/** Los activos guardados, como los edita el modal: el rango, como se escribe en la región del idioma. */
export function fieldDraftsOf(details: readonly FormCatalogFieldDetail[], format: FormatState): CatalogFieldsDraft {
  const fields = details.filter((detail) => detail.isActive).map((detail): CatalogFieldDraft => {
    const valueType = rangeValueType(detail.type);
    const range = (value: string | null | undefined) => value == null || !valueType ? "" : editableValue(value, valueType, format);
    return {
      localKey: detail.id, id: detail.id, key: detail.key, keyEdited: true, name: detail.name, type: detail.type,
      sourceCatalogId: detail.sourceCatalogId ?? null, sourceCatalogName: detail.sourceCatalogName ?? null,
      required: detail.required, unique: detail.unique, maxLength: detail.maxLength == null ? "" : String(detail.maxLength),
      min: range(detail.min), max: range(detail.max), valuesCount: detail.valuesCount,
    };
  });
  return { fields, confirmedRemovals: [] };
}

/** Un campo nuevo: Texto y opcional, sin nombre ni clave (nace opcional, 130). */
export function newFieldDraft(): CatalogFieldDraft {
  return {
    localKey: `local-${crypto.randomUUID()}`, id: null, key: "", keyEdited: false, name: "", type: "Text", sourceCatalogId: null,
    sourceCatalogName: null, required: false, unique: false, maxLength: "", min: "", max: "", valuesCount: 0,
  };
}

/** Los lugares de la presentación: una clave así suma un número, como en el servidor. */
const reservedKeys: readonly string[] = ["text", "code", "value", "detail"];
const keyFallback = "campo";

const fit = (key: string, suffix: string) => key.slice(0, catalogFieldLimits.key - suffix.length).replace(/_+$/, "") + suffix;

/**
 * La clave que nace del nombre, como la arma el servidor (`FormCatalogField.KeyFromName`): en minúsculas, sin acentos y con
 * `_` en lugar de lo demás, hasta 40. Sin letras ni números da «campo», y la que empieza con un número lleva «campo_» delante.
 */
export function keyFromName(name: string): string {
  let key = "";
  for (const character of name.trim().normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase()) {
    if (/[a-z0-9]/.test(character)) key += character;
    else if (key.length > 0 && !key.endsWith("_")) key += "_";
  }
  key = key.replace(/^_+|_+$/g, "");
  if (key === "") return keyFallback;
  if (!/^[a-z]/.test(key)) key = `${keyFallback}_${key}`;
  return fit(key, "");
}

/** La misma clave, o con `_2`, `_3`… si choca con un lugar de la presentación o con la de un campo quitado. */
export function freeKey(key: string, taken: readonly string[]): string {
  const used = (candidate: string) => reservedKeys.includes(candidate) || taken.includes(candidate);
  if (!used(key)) return key;
  for (let number = 2; ; number++) {
    const candidate = fit(key, `_${number}`);
    if (!used(candidate)) return candidate;
  }
}

/** Lo que se escribe en la clave: minúsculas, números y `_`, como pide el contrato (`^[a-z][a-z0-9_]{0,39}$`). */
export const typedKey = (input: string) => input.toLowerCase().replace(/[^a-z0-9_]/g, "").slice(0, catalogFieldLimits.key);

/** Si la clave puede guardarse: empieza con una letra. */
export const keyStartsWell = (key: string) => /^[a-z]/.test(key);

/** El campo activo que ya usa esa clave, sin mirar mayúsculas: «Cuit» y «CUIT» chocan (FieldKeyDuplicate). */
export function fieldUsingKey(fields: readonly CatalogFieldDraft[], draft: CatalogFieldDraft): CatalogFieldDraft | undefined {
  const key = draft.key.trim().toLowerCase();
  if (!key) return undefined;
  return fields.find((other) => other.localKey !== draft.localKey && other.key.trim().toLowerCase() === key);
}

/** Si el campo es uno de los lugares del título o de la descripción de «En WhatsApp». */
export function fieldInPresentation(presentation: FormCatalogPresentationDetail | null | undefined, fieldId: string | null): boolean {
  if (!presentation || !fieldId) return false;
  const place = `field:${fieldId}`;
  return presentation.title.includes(place) || presentation.description.includes(place);
}

/** Las columnas fijas de «Ordenar por…»: lo demás es el id de un campo (224). */
export const isFixedSortColumn = (column: string) => column.toLowerCase() === "text" || column.toLowerCase() === "code";

/** El orden pendiente, después de cambiar los campos: si se quitó el campo elegido, se cancela con él (224). */
export function sortAfterFields(sort: FormCatalogItemSortInput | null, fields: readonly CatalogFieldDraft[]): FormCatalogItemSortInput | null {
  if (!sort?.column || isFixedSortColumn(sort.column)) return sort;
  return fields.some((item) => item.id === sort.column) ? sort : null;
}

/** Cómo se dice el sentido de un orden: un texto o un campo de otro catálogo, de la A a la Z; un número, de menor a mayor… (224). */
export type SortKind = "text" | "number" | "date" | "yesNo";

/** La columna de «Ordenar por…» con su sentido: «Texto», «Código» o un campo activo guardado. */
export function sortKindOf(column: string, fields: readonly Pick<FormCatalogFieldDetail, "id" | "type">[]): SortKind {
  const type = fields.find((item) => item.id === column)?.type;
  return type === "WholeNumber" || type === "DecimalNumber" ? "number" : type === "Date" ? "date" : type === "YesNo" ? "yesNo" : "text";
}

/** La clave del texto del sentido, en la pieza («De menor a mayor») o en una oración («de menor a mayor»). */
export function sortOrderKey(kind: SortKind, descending: boolean, inSentence = false): string {
  const word = `${descending ? "descending" : "ascending"}${inSentence ? "InSentence" : ""}`;
  return kind === "text" ? `forms:catalog.sort.${word}` : `forms:catalog.sort.byKind.${kind}.${word}`;
}

const comparable = (draft: CatalogFieldsDraft) => JSON.stringify([
  draft.fields.map(({ id, key, name, type, sourceCatalogId, required, unique, maxLength, min, max }) => [id, key, name, type, sourceCatalogId, required, unique, maxLength, min, max]),
  draft.confirmedRemovals,
]);

/** Si dos borradores de los campos dicen lo mismo: «Listo» sin cambios no deja el catálogo con cambios. */
export const sameFieldsDraft = (a: CatalogFieldsDraft, b: CatalogFieldsDraft) => comparable(a) === comparable(b);
