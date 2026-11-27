import { NumberAmbiguousError } from "@/shared/format/parsers";
import type { FormatState } from "@/shared/format/useFormat";
import type { FormCatalogValueType } from "../api/types";

/** El canónico «2500.5» como se ve en la región del idioma («2.500,5»), sin pasar por `Number`, que perdería dígitos (C6). */
export function displayValue(value: string | null | undefined, valueType: FormCatalogValueType, format: FormatState): string {
  if (value == null || value === "") return "";
  if (valueType === "Date") return format.formatDate(value) || value;
  if (valueType === "Text") return value;
  const culture = format.referenceData?.cultures.find((item) => item.code === format.culture);
  if (!culture) return value;
  const negative = value.startsWith("-");
  const [integer, fraction] = value.replace(/^[+-]/, "").split(".");
  const grouped = integer.replace(/\B(?=(\d{3})+(?!\d))/g, culture.groupSeparator);
  return `${negative ? "-" : ""}${grouped}${fraction === undefined ? "" : `${culture.decimalSeparator}${fraction}`}`;
}

/**
 * El canónico como se escribe en una celda, sin miles («1500», «2,5»): así se vuelve a leer igual, sin la duda de un solo
 * separador de miles. Lo usa lo que propone el asistente, que llega canónico.
 */
export function editableValue(value: string | null, valueType: FormCatalogValueType, format: FormatState): string {
  if (value == null || valueType === "Text" || valueType === "Date") return displayValue(value, valueType, format);
  const culture = format.referenceData?.cultures.find((item) => item.code === format.culture);
  return culture ? value.replace(".", culture.decimalSeparator) : value;
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
