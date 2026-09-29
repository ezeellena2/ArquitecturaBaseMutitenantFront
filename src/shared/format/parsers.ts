import type { CultureReference, ReferenceData } from "@/shared/referenceData/referenceData";
import type { MoneyValue } from "./formatters";
import { shiftDecimal } from "./decimalScale";

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
  const digits = canonical.replace(/^[+-]/, "").replace(".", "").replace(/^0+/, "");
  if (digits.length > 15) throw new Error("El número excede la precisión admitida.");
  const value = Number(canonical);
  if (!Number.isFinite(value) || Math.abs(value) > Number.MAX_SAFE_INTEGER) {
    throw new Error("El número está fuera del rango admitido.");
  }
  const expectedUnits = digits === "" ? "0" : `${canonical.startsWith("-") ? "-" : ""}${digits}`;
  const actualUnits = shiftDecimal(value, fraction?.length ?? 0);
  if (!Number.isSafeInteger(actualUnits) || String(actualUnits) !== expectedUnits) {
    throw new Error("El número no se puede representar sin pérdida de precisión.");
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
  const trimmed = input.trim();
  const numeric = trimmed.replace(/\s*%$/, "");
  if (trimmed !== "" && numeric === "") throw new Error("El porcentaje no tiene un número.");
  const value = parseDecimal(numeric, culture);
  return value === null ? null : shiftDecimal(value, -2);
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

type LocalDateTime = { year: number; month: number; day: number; hour: number; minute: number };
type DateTimeToken = "year" | "month" | "day" | "hour24" | "hour12" | "minute" | "meridiem";

/** Lee los patrones CLDR del catálogo; no presupone el orden de día, mes ni hora. */
function parsePattern(input: string, pattern: string, dateRequired: boolean): LocalDateTime {
  const tokens: DateTimeToken[] = [];
  const expression = [...pattern.matchAll(/'([^']*)'|yyyy|MM|M|dd|d|HH|H|hh|h|mm|m|tt|./g)]
    .map((match) => {
      const token = match[0];
      if (match[1] !== undefined) return escapeRegExp(match[1]);
      if (token === "yyyy") { tokens.push("year"); return "(\\d{4})"; }
      if (token === "MM" || token === "M") { tokens.push("month"); return token === "MM" ? "(\\d{2})" : "(\\d{1,2})"; }
      if (token === "dd" || token === "d") { tokens.push("day"); return token === "dd" ? "(\\d{2})" : "(\\d{1,2})"; }
      if (token === "HH" || token === "H") { tokens.push("hour24"); return token === "HH" ? "(\\d{2})" : "(\\d{1,2})"; }
      if (token === "hh" || token === "h") { tokens.push("hour12"); return token === "hh" ? "(\\d{2})" : "(\\d{1,2})"; }
      if (token === "mm" || token === "m") { tokens.push("minute"); return token === "mm" ? "(\\d{2})" : "(\\d{1,2})"; }
      if (token === "tt") { tokens.push("meridiem"); return "(AM|PM)"; }
      return escapeRegExp(token);
    }).join("");
  const required: DateTimeToken[] = dateRequired
    ? ["year", "month", "day", "minute"] : ["minute"];
  const usesTwelveHours = tokens.includes("hour12");
  required.push(usesTwelveHours ? "hour12" : "hour24");
  if (usesTwelveHours) required.push("meridiem");
  if (required.some((token) => tokens.filter((part) => part === token).length !== 1)
    || tokens.some((token) => tokens.filter((part) => part === token).length !== 1)
    || (tokens.includes("meridiem") && !usesTwelveHours)
    || (dateRequired && tokens.length !== required.length)
    || (!dateRequired && tokens.some((token) => ["year", "month", "day"].includes(token)))) {
    throw new Error("El patrón de fecha y hora no es válido.");
  }
  const match = new RegExp(`^${expression}$`, "i").exec(input);
  if (!match) throw new Error("El valor no coincide con la cultura seleccionada.");
  const values = Object.fromEntries(tokens.map((token, index) => [token, match[index + 1]]));
  const rawHour = Number(values.hour12 ?? values.hour24);
  const minute = Number(values.minute);
  if (minute > 59 || (usesTwelveHours && (rawHour < 1 || rawHour > 12))
    || (!usesTwelveHours && rawHour > 23)) {
    throw new Error("La hora civil no es válida.");
  }
  const hour = usesTwelveHours
    ? rawHour % 12 + (values.meridiem?.toUpperCase() === "PM" ? 12 : 0) : rawHour;
  const year = dateRequired ? Number(values.year) : 2000;
  const month = dateRequired ? Number(values.month) : 1;
  const day = dateRequired ? Number(values.day) : 1;
  if (year < 1 || year > 9999 || month < 1 || month > 12 || day < 1 || day > 31) {
    throw new Error("La fecha civil no es válida.");
  }
  const date = new Date(0);
  date.setUTCHours(0, 0, 0, 0);
  date.setUTCFullYear(year, month - 1, day);
  if (date.getUTCFullYear() !== year || date.getUTCMonth() + 1 !== month || date.getUTCDate() !== day) {
    throw new Error("La fecha civil no es válida.");
  }
  return { year, month, day, hour, minute };
}

/** TimeOnly viaja como hora civil, sin aplicar una zona horaria. */
export function parseTime(input: string, culture: CultureReference): string | null {
  const trimmed = input.trim();
  if (trimmed === "") return null;
  const { hour, minute } = parsePattern(trimmed, culture.timePattern, false);
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00`;
}

function offsetMinutes(instant: Date, timeZone: string): number {
  const offset = new Intl.DateTimeFormat("en", {
    timeZone, timeZoneName: "longOffset", hour: "2-digit",
  }).formatToParts(instant).find((part) => part.type === "timeZoneName")?.value;
  if (offset === "GMT") return 0;
  const match = /^GMT([+-])(\d{2}):(\d{2})$/.exec(offset ?? "");
  if (!match) throw new Error("No se pudo calcular el desfase de la zona horaria.");
  const minutes = Number(match[2]) * 60 + Number(match[3]);
  return match[1] === "-" ? -minutes : minutes;
}

function localParts(instant: Date, timeZone: string, culture: string): LocalDateTime {
  const parts = new Intl.DateTimeFormat(culture, {
    timeZone, calendar: "gregory", numberingSystem: "latn", hourCycle: "h23",
    year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit",
  }).formatToParts(instant);
  const number = (type: Intl.DateTimeFormatPartTypes) => {
    const value = parts.find((part) => part.type === type)?.value;
    if (value === undefined) throw new Error("No se pudo resolver la hora local.");
    return Number(value);
  };
  return { year: number("year"), month: number("month"), day: number("day"),
    hour: number("hour"), minute: number("minute") };
}

/** Convierte un reloj local a UTC; rechaza huecos y horas repetidas por DST. */
export function parseDateTime(input: string, culture: CultureReference, timeZone: string): string | null {
  const trimmed = input.trim();
  if (trimmed === "") return null;
  const desired = parsePattern(trimmed, culture.dateTimePattern, true);
  const wall = new Date(0);
  wall.setUTCFullYear(desired.year, desired.month - 1, desired.day);
  wall.setUTCHours(desired.hour, desired.minute, 0, 0);
  const wallMillis = wall.getTime();
  const offsets = new Set([-48, -24, 0, 24, 48]
    .map((hours) => offsetMinutes(new Date(wallMillis + hours * 3600_000), timeZone)));
  const candidates = [...offsets]
    .map((minutes) => new Date(wallMillis - minutes * 60_000))
    .filter((candidate) => {
      const local = localParts(candidate, timeZone, culture.code);
      return Object.keys(desired).every((key) =>
        local[key as keyof LocalDateTime] === desired[key as keyof LocalDateTime]);
    });
  if (candidates.length !== 1) throw new Error("La hora local no identifica un instante único.");
  return candidates[0].toISOString().replace(/\.000Z$/, "Z");
}
