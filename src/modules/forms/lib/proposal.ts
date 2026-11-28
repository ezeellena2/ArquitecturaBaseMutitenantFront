import type { AssistantProposalValueResponse } from "@/shared/api/types";
import type { AssistantActionContractField, AssistantActionFieldType, AssistantProposalValues } from "@/shared/assistant-actions";
import type { FormCatalogFieldDetail, FormCatalogFieldType, FormCatalogItemRow, FormCatalogValueType } from "../api/types";
import { catalogFieldLimits } from "./catalogFields";
import { catalogLimits } from "./catalogLimits";
import type { FieldValue } from "./catalogValues";

// «Cambiar las opciones de un catálogo» (catalogoptions.edit@1, §17 de la spec y B10): lo armado como dato. El contrato no
// publica sus campos: salen del catálogo destino, que el editor ya leyó. Las opciones se suman, se cambian y se quitan como
// operaciones; una guardada viaja por su id, con el texto de ahora que leyó el servidor, y una nueva, por su código. Desde la
// E13, cada campo activo del catálogo es una columna más de la fila, con su clave como nombre (spec 13, «Acciones del asistente»).

export const catalogProposalAction = "catalogoptions.edit@1" as const;
const optionsField = "options";

const typedValues: Readonly<Record<Exclude<FormCatalogValueType, "Text">, AssistantActionFieldType>> = {
  WholeNumber: "integer", DecimalNumber: "decimal", Date: "date",
};

const fixedNames: readonly string[] = ["code", "text", "detail", "active", "value"];

/** Cada tipo de campo en la lista cerrada de la ADR 0068 §4; «De un catálogo» es un registro, que resuelve el servidor. */
const fieldTypes: Readonly<Record<FormCatalogFieldType, AssistantActionFieldType>> = {
  Text: "text", WholeNumber: "integer", DecimalNumber: "decimal", Date: "date", YesNo: "boolean", Catalog: "record",
};

/** Los campos activos del catálogo que son columna de la propuesta: los que su clave no confunde con una columna fija. */
export function proposalCatalogFields(fields: readonly FormCatalogFieldDetail[]): readonly FormCatalogFieldDetail[] {
  return fields.filter((field) => field.isActive && !fixedNames.includes(field.key));
}

const bound = (value: string | null | undefined) => value == null || value.trim() === "" || !Number.isFinite(Number(value)) ? {} : { value: Number(value) };

/** Un campo como columna de la fila: su tipo y sus reglas son los límites (el largo de un texto y el rango de un número). */
function proposalField(field: FormCatalogFieldDetail): AssistantActionContractField {
  const numeric = field.type === "WholeNumber" || field.type === "DecimalNumber";
  const minimum = numeric ? bound(field.min).value : undefined;
  const maximum = numeric ? bound(field.max).value : undefined;
  return {
    name: field.key, type: fieldTypes[field.type], required: false,
    ...(field.type === "Text" ? { maxLength: field.maxLength ?? catalogFieldLimits.maxLength } : {}),
    ...(minimum !== undefined ? { minimum } : {}),
    ...(maximum !== undefined ? { maximum } : {}),
  };
}

/**
 * Los campos del catálogo destino, como los da el servidor (`ReadTargetFieldsAsync`): el valor, solo en uno tipado, y una
 * columna por campo activo. Los topes salen del contrato, los mismos que valida el `PUT` (O13).
 */
export function catalogProposalFields(valueType: FormCatalogValueType, fields: readonly FormCatalogFieldDetail[] = []): readonly AssistantActionContractField[] {
  return [{ name: optionsField, type: "items", required: false, maxItems: catalogLimits.deleteItems, itemKey: "code", itemFields: [
    { name: "code", type: "text", required: true, maxLength: catalogLimits.itemCode },
    { name: "text", type: "text", required: true, maxLength: catalogLimits.itemText },
    { name: "detail", type: "longText", required: false, maxLength: catalogLimits.itemDetail },
    { name: "active", type: "boolean", required: false },
    ...(valueType === "Text" ? [] : [{ name: "value", type: typedValues[valueType], required: true }]),
    ...proposalCatalogFields(fields).map(proposalField),
  ] }];
}

/** Una opción como la deja la propuesta: la clave (el id de una guardada o el código de una nueva) y solo lo propuesto. */
export interface CatalogProposalRow {
  readonly key: string;
  readonly code?: string;
  readonly text?: string;
  /** Vacío borra el detalle. */
  readonly detail?: string;
  /** Canónico, con punto y sin miles («1500», «2.5»), o la fecha ISO. */
  readonly value?: string;
  readonly isActive?: boolean;
  /** El valor propuesto de cada campo, por su id, canónico: el número sin miles, la fecha ISO, sí o no, o la opción fuente. */
  readonly fields?: Readonly<Record<string, FieldValue>>;
}

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null && !Array.isArray(value);

/** Un número de la propuesta como texto canónico; uno que JSON escribe con exponente no se puede mostrar tal cual. */
function canonicalNumber(value: number): string | undefined {
  const text = String(value);
  return Number.isFinite(value) && !/e/i.test(text) ? text : undefined;
}

/** El valor propuesto de un campo, canónico; `undefined` si no se puede dibujar (un número con exponente, otro tipo). */
function fieldValueOf(field: FormCatalogFieldDetail, value: unknown): FieldValue | undefined {
  if (value === null) return null;
  if (field.type === "YesNo") return typeof value === "boolean" ? value : undefined;
  if (field.type === "WholeNumber" || field.type === "DecimalNumber") return typeof value === "number" ? canonicalNumber(value) : undefined;
  return typeof value === "string" ? value : undefined;
}

/**
 * `toFormValues` de la acción: las filas de «options» que deja la propuesta sobre lo leído, con sus valores como los muestra
 * el editor, y el de cada campo por su id. `undefined` si un valor no se puede dibujar. Con los campos del catálogo, armada
 * una vez por catálogo (`useAssistantProposal` la pide estable).
 */
export function catalogProposalRowsOf(fields: readonly FormCatalogFieldDetail[]) {
  const columns = proposalCatalogFields(fields);
  return (values: AssistantProposalValues): readonly CatalogProposalRow[] | undefined => toCatalogProposalRows(values, columns);
}

export function toCatalogProposalRows(values: AssistantProposalValues, columns: readonly FormCatalogFieldDetail[] = []): readonly CatalogProposalRow[] | undefined {
  const rows: CatalogProposalRow[] = [];
  for (const row of values.rows[optionsField] ?? []) {
    const { code, text, detail, value, active } = row.values;
    const canonical = typeof value === "number" ? canonicalNumber(value) : typeof value === "string" ? value : undefined;
    if (value !== undefined && canonical === undefined) return undefined;
    const fieldValues: Record<string, FieldValue> = {};
    for (const field of columns) {
      if (!Object.hasOwn(row.values, field.key)) continue;
      const proposed = fieldValueOf(field, row.values[field.key]);
      if (proposed === undefined) return undefined;
      fieldValues[field.id] = proposed;
    }
    rows.push({
      key: row.key,
      ...(typeof code === "string" ? { code } : {}),
      ...(typeof text === "string" ? { text } : {}),
      ...(detail === null || typeof detail === "string" ? { detail: detail ?? "" } : {}),
      ...(canonical !== undefined ? { value: canonical } : {}),
      ...(typeof active === "boolean" ? { isActive: active } : {}),
      ...(Object.keys(fieldValues).length ? { fields: fieldValues } : {}),
    });
  }
  return rows;
}

/** Las opciones guardadas que toca la propuesta (cambiar o quitar), por su id, con el texto de ahora que leyó el servidor. */
export function catalogProposalTargets(values: readonly AssistantProposalValueResponse[]): readonly { readonly itemId: string; readonly label: string }[] {
  return values.flatMap((entry) => {
    const value: unknown = entry.value;
    return entry.field === optionsField && isRecord(value) && (value.op === "change" || value.op === "remove") && typeof value.key === "string"
      ? [{ itemId: value.key, label: entry.label ?? "" }] : [];
  });
}

/** Lo leído al abrir: las opciones guardadas que toca la propuesta, sin valores, así la propuesta les deja solo lo que cambia. */
export function catalogProposalBase(touched: readonly FormCatalogItemRow[]): AssistantProposalValues {
  return { fields: {}, lists: {}, rows: { [optionsField]: touched.map((row) => ({ key: row.id, label: row.text, values: {} })) } };
}

/** Lo que cambia de una opción, canónico: el editor lo pasa a la región del idioma. */
export interface CatalogItemPatch {
  readonly code?: string;
  readonly text?: string;
  readonly detail?: string;
  readonly value?: string | null;
  readonly isActive?: boolean;
  /** Solo los campos cuyo valor cambia, canónicos. */
  readonly fields?: Readonly<Record<string, FieldValue>>;
}

export interface CatalogProposedItem {
  readonly localId: string;
  readonly code: string;
  readonly text: string;
  readonly detail: string;
  readonly value: string | null;
  readonly isActive: boolean;
  readonly fields: Readonly<Record<string, FieldValue>>;
}

/** Lo propuesto, listo para el borrador del editor: lo que cambia en cada guardada, las nuevas y las que se borran al guardar. */
export interface CatalogProposalDraft {
  readonly changes: Readonly<Record<string, CatalogItemPatch>>;
  readonly added: readonly CatalogProposedItem[];
  readonly deletes: readonly string[];
}

const proposalLocalPrefix = "proposal-";
/** La clave en el borrador de una opción nueva de la propuesta, y al revés: así cada fila conserva su «Revisá». */
export const proposalLocalId = (key: string) => `${proposalLocalPrefix}${key}`;
export const proposalKeyOf = (localId: string | undefined) => localId?.startsWith(proposalLocalPrefix) ? localId.slice(proposalLocalPrefix.length) : undefined;

/**
 * Lo propuesto sobre las opciones guardadas que toca (`touched`): una que sigue es un cambio, con solo lo distinto de lo
 * guardado; una que no sigue se borra al guardar; una clave que no es de las guardadas es una opción nueva, que necesita su
 * código, su texto y, en uno tipado, su valor. `undefined` si una nueva no se puede dibujar.
 */
export function catalogProposalDraft(rows: readonly CatalogProposalRow[], touched: readonly FormCatalogItemRow[], valueType: FormCatalogValueType): CatalogProposalDraft | undefined {
  const changes: Record<string, CatalogItemPatch> = {};
  const added: CatalogProposedItem[] = [];
  for (const row of rows) {
    const saved = touched.find((item) => item.id === row.key);
    if (saved) {
      const fields = Object.entries(row.fields ?? {}).filter(([id, value]) => value !== (saved.fields[id] ?? null));
      const patch = Object.fromEntries(Object.entries({
        code: row.code === undefined || row.code === saved.code ? undefined : row.code,
        text: row.text === undefined || row.text === saved.text ? undefined : row.text,
        detail: row.detail === undefined || row.detail === (saved.detail ?? "") ? undefined : row.detail,
        value: row.value === undefined || row.value === (saved.value ?? null) ? undefined : row.value,
        isActive: row.isActive === undefined || row.isActive === saved.isActive ? undefined : row.isActive,
        fields: fields.length ? Object.fromEntries(fields) : undefined,
      }).filter(([, value]) => value !== undefined)) as CatalogItemPatch;
      if (Object.keys(patch).length) changes[saved.id] = patch;
      continue;
    }
    if (!row.code?.trim() || !row.text?.trim() || (valueType !== "Text" && row.value === undefined)) return undefined;
    added.push({ localId: proposalLocalId(row.key), code: row.code, text: row.text, detail: row.detail ?? "", value: row.value ?? null, isActive: row.isActive ?? true,
      fields: row.fields ?? {} });
  }
  const deletes = touched.filter((item) => !rows.some((row) => row.key === item.id)).map((item) => item.id);
  return { changes, added, deletes };
}
