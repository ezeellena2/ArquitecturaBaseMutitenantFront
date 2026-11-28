import { NumberAmbiguousError } from "@/shared/format/parsers";
import type { FormatState } from "@/shared/format/useFormat";
import type { FormCatalogFieldType, FormCatalogValueType } from "../api/types";

/**
 * El canónico «2500.5» como se ve en la región del idioma («2.500,5»), sin perder dígitos (C6): lo formatea shared/format.
 * Mientras cargan los formatos, tal cual.
 */
export function displayValue(value: string | null | undefined, valueType: FormCatalogValueType, format: FormatState): string {
  if (value == null || value === "") return "";
  if (valueType === "Date") return format.formatDate(value) || value;
  if (valueType === "Text" || format.isLoading) return value;
  return format.formatDecimalText(value);
}

/**
 * El canónico como se escribe en una celda, sin miles («1500», «2,5»): así se vuelve a leer igual, sin la duda de un solo
 * separador de miles. Lo usa lo que propone el asistente, que llega canónico.
 */
export function editableValue(value: string | null, valueType: FormCatalogValueType, format: FormatState): string {
  if (value == null || valueType === "Text" || valueType === "Date" || format.isLoading) return displayValue(value, valueType, format);
  return format.formatDecimalText(value, false);
}

export type ValueRead = { canonical: string | null; error?: string };

/** Lee el valor escrito con la región del idioma y da el canónico, o el error de su campo (207 y C6). */
export function readValue(input: string, valueType: FormCatalogValueType, format: FormatState, t: (key: string) => string): ValueRead {
  if (valueType === "Text") return { canonical: input.trim() === "" ? null : input };
  if (input.trim() === "") return { canonical: null, error: t("forms:catalog.errors.valueRequired") };
  try {
    if (valueType === "Date") {
      const date = format.parseDate(input);
      return date ? { canonical: date } : { canonical: null, error: t("forms:catalog.errors.valueInvalid.Date") };
    }
    const canonical = format.parseDecimalText(input);
    if (canonical == null) return { canonical: null, error: t("forms:catalog.errors.valueRequired") };
    if (valueType === "WholeNumber" && canonical.includes(".")) return { canonical: null, error: t("forms:catalog.errors.valueInvalid.WholeNumber") };
    return { canonical };
  } catch (error) {
    if (error instanceof NumberAmbiguousError) return { canonical: null, error: t("common:fields.numberAmbiguous") };
    return { canonical: null, error: t(`forms:catalog.errors.valueInvalid.${valueType}`) };
  }
}

/**
 * El valor de un campo en el borrador de una opción (E13): lo que se ve y se escribe. Un texto, un número o una fecha como
 * se escriben (el número sin miles, para volver a leerse igual), sí/no como booleano y uno de otro catálogo con la identidad
 * de su opción; `null` es «sin valor».
 */
export type FieldValue = string | boolean | null;

/** El valor guardado (canónico) como se escribe en su celda: el número y la fecha, con la región del idioma (207 y C6). */
export function fieldDraftValue(raw: string | boolean | null | undefined, type: FormCatalogFieldType | undefined, format: FormatState): FieldValue {
  if (raw === undefined || raw === null || typeof raw === "boolean") return raw ?? null;
  return type === "WholeNumber" || type === "DecimalNumber" || type === "Date" ? editableValue(raw, type, format) : raw;
}

export type FieldValueRead = { canonical: string | boolean | null; error?: string };

/**
 * Lee lo escrito en un campo y da el canónico que viaja en el `PUT`, o el error de su celda: un número, con `parseDecimalText`
 * de la E12, así «1.500» en español es `numberAmbiguous` (207) y uno de 18 dígitos llega entero. Vacío es `null`, que limpia;
 * lo obligatorio, el rango y lo único los dice el servidor.
 */
export function readFieldValue(value: FieldValue, type: FormCatalogFieldType, format: FormatState, t: (key: string) => string): FieldValueRead {
  if (value === null || typeof value === "boolean") return { canonical: value };
  if (value.trim() === "") return { canonical: null };
  if (type !== "WholeNumber" && type !== "DecimalNumber" && type !== "Date") return { canonical: value };
  const read = readValue(value, type, format, t);
  return read.error ? { canonical: null, error: read.error } : { canonical: read.canonical };
}

/** El valor guardado de un campo como se lee en la tabla de lectura y en el teléfono; el de otro catálogo, con el texto de su opción. */
export function fieldValueText(raw: string | boolean | null | undefined, type: FormCatalogFieldType, format: FormatState, sourceText?: string): string {
  if (raw === undefined || raw === null) return "";
  if (typeof raw === "boolean") return format.formatBoolean(raw);
  if (type === "Catalog") return sourceText ?? "";
  return type === "WholeNumber" || type === "DecimalNumber" || type === "Date" ? displayValue(raw, type, format) : raw;
}

/** Dos textos o dos códigos iguales, sin mirar mayúsculas ni espacios de los costados. */
export const sameText = (a: string, b: string) => a.trim().toLocaleLowerCase() === b.trim().toLocaleLowerCase();

/** «Seguimiento» → SEG; «Gran Buenos Aires» → GBA: las iniciales con tres palabras o más, y si no, las tres primeras letras. */
export function codeFromText(text: string): string {
  const words = text.normalize("NFD").replace(/[̀-ͯ]/g, "").toUpperCase().match(/[A-Z0-9]+/g) ?? [];
  if (words.length >= 3) return words.slice(0, 3).map((word) => word[0]).join("");
  return (words[0] ?? "").slice(0, 3);
}

/** El código, o con un número al final si ya está tomado: SEG, SEG2, SEG3… */
export function uniqueCode(code: string, taken: ReadonlySet<string>): string {
  if (!taken.has(code)) return code;
  for (let n = 2; ; n += 1) if (!taken.has(`${code}${n}`)) return `${code}${n}`;
}
