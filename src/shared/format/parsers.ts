import type { CultureReference, ReferenceData } from "@/shared/referenceData/referenceData";
import type { MoneyValue } from "./formatters";

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function numericParts(input: string, culture: CultureReference): { value: number; fractionDigits: number } | null {
  const trimmed = input.trim();
  if (trimmed === "") return null;
  if (culture.groupSeparator === culture.decimalSeparator) {
    throw new Error("Los separadores de la cultura deben ser distintos.");
  }

  const decimal = escapeRegExp(culture.decimalSeparator);
  const group = escapeRegExp(culture.groupSeparator);
  const grouped = `[1-9]\\d{0,2}(?:${group}\\d{3})+`;
  const pattern = new RegExp(`^[+-]?(?:\\d+|${grouped})(?:${decimal}\\d+)?$`);
  if (!pattern.test(trimmed)) throw new Error("El número no coincide con la cultura seleccionada.");

  const fraction = trimmed.split(culture.decimalSeparator)[1];
  const canonical = trimmed
    .replaceAll(culture.groupSeparator, "")
    .replace(culture.decimalSeparator, ".");
  const value = Number(canonical);
  if (!Number.isFinite(value) || Math.abs(value) > Number.MAX_SAFE_INTEGER) {
    throw new Error("El número está fuera del rango admitido.");
  }
  return { value, fractionDigits: fraction?.length ?? 0 };
}

/** Interpreta texto visible y devuelve el decimal del contrato, o null si está vacío. */
export function parseDecimal(input: string, culture: CultureReference): number | null {
  return numericParts(input, culture)?.value ?? null;
}

/** Una entrada nueva exige moneda habilitada y precisión declarada por Currencies. */
export function parseMoney(
  input: string,
  currency: string,
  culture: CultureReference,
  referenceData: ReferenceData,
): MoneyValue | null {
  const parsed = numericParts(input, culture);
  if (parsed === null) return null;
  const row = referenceData.currencies.find((item) => item.code === currency && item.isEnabled);
  if (!row || row.minorUnits === null || parsed.fractionDigits > row.minorUnits) {
    throw new Error("La moneda o su cantidad de decimales no es válida.");
  }
  return { amount: parsed.value, currency };
}

/** El usuario escribe 12,5 %, mientras el contrato HTTP recibe 0.125. */
export function parsePercent(input: string, culture: CultureReference): number | null {
  const value = parseDecimal(input, culture);
  return value === null ? null : value / 100;
}

function dateParts(input: string, pattern: string): { year: number; month: number; day: number } {
  const tokens = pattern.match(/yyyy|MM|M|dd|d|./g);
  if (!tokens) throw new Error("El patrón de fecha no es válido.");
  const fields: Array<"year" | "month" | "day"> = [];
  const expression = tokens.map((token) => {
    if (token === "yyyy") { fields.push("year"); return "(\\d{4})"; }
    if (token === "MM" || token === "M") { fields.push("month"); return token === "MM" ? "(\\d{2})" : "(\\d{1,2})"; }
    if (token === "dd" || token === "d") { fields.push("day"); return token === "dd" ? "(\\d{2})" : "(\\d{1,2})"; }
    return escapeRegExp(token);
  }).join("");
  if (new Set(fields).size !== 3 || fields.length !== 3) {
    throw new Error("El patrón de fecha debe contener día, mes y año una vez.");
  }
  const match = new RegExp(`^${expression}$`).exec(input);
  if (!match) throw new Error("La fecha no coincide con la cultura seleccionada.");
  const values = Object.fromEntries(fields.map((field, index) => [field, Number(match[index + 1])]));
  return values as { year: number; month: number; day: number };
}

/** DateOnly es civil: su día no se convierte por la zona horaria. */
export function parseDate(input: string, culture: CultureReference): string | null {
  const trimmed = input.trim();
  if (trimmed === "") return null;
  const { year, month, day } = dateParts(trimmed, culture.datePattern);
  if (year < 1 || year > 9999 || month < 1 || month > 12 || day < 1 || day > 31) {
    throw new Error("La fecha civil no es válida.");
  }
  const date = new Date(0);
  date.setUTCHours(0, 0, 0, 0);
  date.setUTCFullYear(year, month - 1, day);
  if (date.getUTCFullYear() !== year || date.getUTCMonth() + 1 !== month || date.getUTCDate() !== day) {
    throw new Error("La fecha civil no es válida.");
  }
  return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}
