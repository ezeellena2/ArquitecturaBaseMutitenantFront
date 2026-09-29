import { parsePhoneNumberFromString } from "libphonenumber-js";
import type { ReferenceData } from "@/shared/referenceData/referenceData";
import { getCultureProfile } from "./cultureProfiles";

type Translate = (key: string, options?: { count?: number }) => string;

export type FormatContext = {
  referenceData: ReferenceData;
  culture: string;
  timeZone: string;
  now?: string | Date;
  translate: Translate;
};

export type MoneyValue = { amount: number; currency: string };
export type TaxIdValue = { type: string; number: string };
export type DateRangeValue = { start: string; end: string };

type CivilParts = { year: number; month: number; day: number; hour: number; minute: number; second: number };

function parseCivil(value: string, timeZone: string, culture: string): CivilParts {
  const date = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (date) {
    const [, year, month, day] = date;
    const parsed = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
    if (parsed.getUTCFullYear() !== Number(year) || parsed.getUTCMonth() + 1 !== Number(month) || parsed.getUTCDate() !== Number(day)) {
      throw new Error("La fecha civil no es válida.");
    }
    return { year: Number(year), month: Number(month), day: Number(day), hour: 0, minute: 0, second: 0 };
  }

  const time = /^(\d{2}):(\d{2}):(\d{2})$/.exec(value);
  if (time) {
    const hour = Number(time[1]);
    const minute = Number(time[2]);
    const second = Number(time[3]);
    if (hour > 23 || minute > 59 || second > 59) throw new Error("La hora civil no es válida.");
    return { year: 2000, month: 1, day: 1, hour, minute, second };
  }

  if (!value.endsWith("Z")) throw new Error("Un instante debe terminar en Z.");
  const instant = new Date(value);
  if (Number.isNaN(instant.getTime())) throw new Error("El instante no es válido.");
  const parts = new Intl.DateTimeFormat(culture, {
    timeZone,
    calendar: "gregory",
    numberingSystem: "latn",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(instant);
  const number = (part: Intl.DateTimeFormatPartTypes) => {
    const found = parts.find((item) => item.type === part)?.value;
    if (found === undefined) throw new Error(`Falta ${part} en el instante local.`);
    return Number(found);
  };
  return {
    year: number("year"), month: number("month"), day: number("day"),
    hour: number("hour"), minute: number("minute"), second: number("second"),
  };
}

function applyDatePattern(pattern: string, parts: CivilParts, culture: string): string {
  const monthName = () => new Intl.DateTimeFormat(culture, {
    timeZone: "UTC", calendar: "gregory", month: "long",
  }).format(new Date(Date.UTC(parts.year, parts.month - 1, 1)));
  const pad = (value: number) => String(value).padStart(2, "0");
  const hour12 = parts.hour % 12 || 12;
  const tokens: Record<string, () => string> = {
    yyyy: () => String(parts.year).padStart(4, "0"),
    MMMM: monthName,
    MM: () => pad(parts.month),
    M: () => String(parts.month),
    dd: () => pad(parts.day),
    d: () => String(parts.day),
    HH: () => pad(parts.hour),
    H: () => String(parts.hour),
    hh: () => pad(hour12),
    h: () => String(hour12),
    mm: () => pad(parts.minute),
    m: () => String(parts.minute),
    tt: () => parts.hour < 12 ? "AM" : "PM",
  };
  return pattern.replace(/'([^']*)'|yyyy|MMMM|MM|M|dd|d|HH|H|hh|h|mm|m|tt/g, (token, quoted: string | undefined) =>
    quoted === undefined ? tokens[token]() : quoted);
}

function formatNumber(value: number, minimumDigits: number, maximumDigits: number,
  decimalSeparator: string, groupSeparator: string, culture: string): string {
  if (!Number.isFinite(value) || minimumDigits < 0 || maximumDigits > 20 || minimumDigits > maximumDigits) {
    throw new Error("El número o la precisión no es válida.");
  }
  // Intl solo redondea; los separadores y el patrón visibles salen de Cultures.
  const parts = new Intl.NumberFormat(culture, {
    useGrouping: false,
    numberingSystem: "latn",
    minimumFractionDigits: minimumDigits,
    maximumFractionDigits: maximumDigits,
  }).formatToParts(Math.abs(value));
  const integer = parts.find((part) => part.type === "integer")?.value ?? "0";
  const fraction = parts.find((part) => part.type === "fraction")?.value;
  const grouped = integer.replace(/\B(?=(\d{3})+(?!\d))/g, groupSeparator);
  return (value < 0 ? "-" : "") + grouped + (fraction === undefined ? "" : decimalSeparator + fraction);
}

function findRow<T>(rows: readonly T[], key: string, select: (row: T) => string): T {
  const row = rows.find((item) => select(item) === key);
  if (!row) throw new Error(`El código ${key} no está en los datos de referencia.`);
  return row;
}

/** Formateadores puros sobre el catálogo efectivo; useFormat les entrega preferencias y recursos. */
export function createFormatters({ referenceData, culture, timeZone, now, translate }: FormatContext) {
  const profile = getCultureProfile(referenceData, culture);
  const fixedClock = now === undefined ? null : new Date(now);
  if (fixedClock && Number.isNaN(fixedClock.getTime())) throw new Error("El instante actual no es válido.");
  const clock = () => fixedClock ?? new Date();
  const number = (value: number, minimum: number, maximum: number) =>
    formatNumber(value, minimum, maximum, profile.decimalSeparator, profile.groupSeparator, culture);
  const date = (value: string, pattern: string) =>
    applyDatePattern(pattern, parseCivil(value, timeZone, culture), culture);

  function formatDate(value: string): string { return date(value, profile.datePattern); }
  function formatDateTime(value: string): string { return date(value, profile.dateTimePattern); }
  function formatTime(value: string): string { return date(value, profile.timePattern); }
  function formatDateLong(value: string): string { return date(value, profile.longDatePattern); }

  function formatRelative(value: string): string {
    if (!value.endsWith("Z")) throw new Error("Un instante relativo debe terminar en Z.");
    const instant = new Date(value);
    if (Number.isNaN(instant.getTime())) throw new Error("El instante no es válido.");
    const elapsed = clock().getTime() - instant.getTime();
    if (elapsed < 0 || elapsed >= 7 * 24 * 3600 * 1000) return formatDate(value);
    if (elapsed < 60 * 1000) return translate("format:relative.justNow");
    const count = elapsed >= 24 * 3600 * 1000 ? Math.floor(elapsed / (24 * 3600 * 1000))
      : elapsed >= 3600 * 1000 ? Math.floor(elapsed / (3600 * 1000))
        : Math.floor(elapsed / (60 * 1000));
    const key = elapsed >= 24 * 3600 * 1000 ? "daysAgo" : elapsed >= 3600 * 1000 ? "hoursAgo" : "minutesAgo";
    return translate(`format:relative.${key}`, { count });
  }

  function formatDateRange(value: DateRangeValue): string {
    return `${formatDate(value.start)} – ${formatDate(value.end)}`;
  }

  function formatInteger(value: number): string { return number(value, 0, 0); }
  function formatDecimal(value: number, digits: number): string { return number(value, digits, digits); }
  function formatQuantity(value: number): string { return number(value, 0, 3); }
  function formatPercent(value: number): string {
    return profile.percentPattern.replace("{number}", number(value * 100, 0, 2));
  }

  function formatMoney(value: MoneyValue): string {
    const currency = findRow(referenceData.currencies, value.currency, (item) => item.code);
    if (currency.minorUnits === null) throw new Error(`La moneda ${value.currency} no declara unidades menores.`);
    const amount = number(Math.abs(value.amount), currency.minorUnits, currency.minorUnits);
    const symbol = currency.displaySymbol;
    const pattern = /\p{L}$/u.test(symbol) && profile.currencyPattern.includes("{symbol}{number}")
      ? profile.currencyPattern.replace("{symbol}{number}", "{symbol} {number}")
      : profile.currencyPattern;
    const positive = pattern.replace("{symbol}", symbol).replace("{number}", amount);
    return value.amount < 0 ? `-${positive}` : positive;
  }

  function formatCompact(value: number): string {
    const magnitude = Math.abs(value);
    const divisor = magnitude >= 1_000_000_000 ? 1_000_000_000
      : magnitude >= 1_000_000 ? 1_000_000
        : magnitude >= 1_000 ? 1_000 : 1;
    const suffix = divisor === 1_000_000_000 ? "billion"
      : divisor === 1_000_000 ? "million"
        : divisor === 1_000 ? "thousand" : null;
    return number(value / divisor, 0, divisor === 1 ? 0 : 1)
      + (suffix === null ? "" : translate(`format:compact.${suffix}`));
  }

  function formatFileSize(bytes: number): string {
    const magnitude = Math.abs(bytes);
    const divisor = magnitude >= 1_000_000_000_000 ? 1_000_000_000_000
      : magnitude >= 1_000_000_000 ? 1_000_000_000
        : magnitude >= 1_000_000 ? 1_000_000
          : magnitude >= 1_000 ? 1_000 : 1;
    const unit = divisor === 1_000_000_000_000 ? "TB"
      : divisor === 1_000_000_000 ? "GB"
        : divisor === 1_000_000 ? "MB"
          : divisor === 1_000 ? "KB" : "B";
    return number(bytes / divisor, 0, divisor === 1 ? 0 : 1) + translate(`format:fileSize.${unit}`);
  }

  function formatDuration(totalSeconds: number): string {
    if (!Number.isInteger(totalSeconds) || totalSeconds < 0) throw new Error("La duración no es válida.");
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor(totalSeconds % 3600 / 60);
    const seconds = totalSeconds % 60;
    const parts: string[] = [];
    if (hours > 0) parts.push(translate("format:duration.hours", { count: hours }));
    if (minutes > 0) parts.push(translate("format:duration.minutes", { count: minutes }));
    if (seconds > 0 || parts.length === 0) parts.push(translate("format:duration.seconds", { count: seconds }));
    return parts.join(" ");
  }

  function formatPhone(value: string): string {
    const phone = parsePhoneNumberFromString(value);
    if (!phone) throw new Error("El teléfono E.164 no es válido.");
    return phone.country === profile.countryCode ? phone.formatNational() : phone.formatInternational();
  }

  function formatTimeZone(id: string): string {
    const zone = findRow(referenceData.timeZones, id, (item) => item.id);
    const offset = new Intl.DateTimeFormat(culture, {
      timeZone: id, timeZoneName: "longOffset", hour: "2-digit",
    }).formatToParts(clock()).find((part) => part.type === "timeZoneName")?.value;
    if (!offset) throw new Error(`No se pudo calcular el desfase de ${id}.`);
    const match = /^GMT([+-])(\d{2}):(\d{2})$/.exec(offset);
    const visible = offset === "GMT" ? "+0" : match
      ? `${match[1] === "-" ? "−" : "+"}${Number(match[2])}${match[3] === "00" ? "" : `:${match[3]}`}`
      : null;
    if (visible === null) throw new Error(`Desfase horario desconocido: ${offset}.`);
    return `${zone.city} (GMT${visible})`;
  }

  function formatCulture(code: string): string {
    return findRow(referenceData.cultures, code, (item) => item.code).name;
  }

  function formatTaxId(value: TaxIdValue): string {
    const type = findRow(referenceData.taxIdTypes, value.type, (item) => item.code);
    if (!/^\d+$/.test(value.number)) throw new Error("El número fiscal debe contener solo dígitos.");
    let position = 0;
    const displayed = Array.from(type.mask, (character) => {
      if (character !== "9") return character;
      return value.number[position++] ?? "";
    }).join("");
    if (position !== value.number.length || displayed.includes("undefined")) {
      throw new Error("El número fiscal no coincide con su máscara.");
    }
    return displayed;
  }

  function formatEmail(value: string): string {
    const normalized = value.trim().normalize("NFC").toLowerCase();
    const at = normalized.indexOf("@");
    if (at < 1 || at !== normalized.lastIndexOf("@")) throw new Error("El correo no es válido.");

    const local = normalized.slice(0, at);
    const domain = normalized.slice(at + 1);
    if (local.startsWith(".") || local.endsWith(".") || local.includes("..")
      || /[,;<>()[\]"\\:\s\p{Cc}\p{Cf}\p{Cs}]/u.test(local)
      || new TextEncoder().encode(local).length > 64) {
      throw new Error("El correo no es válido.");
    }

    let asciiDomain: string;
    try {
      asciiDomain = new URL(`http://${domain}`).hostname;
    } catch {
      throw new Error("El correo no es válido.");
    }
    if (!asciiDomain.includes(".") || asciiDomain.split(".").some((label) =>
      label.length > 63 || !/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(label))
      || new TextEncoder().encode(`${local}@${asciiDomain}`).length > 254) {
      throw new Error("El correo no es válido.");
    }
    return `${local}@${domain}`;
  }
  function formatEnum(enumName: string, value: string): string {
    return translate(`enums:${enumName}.${value}`);
  }
  function formatBoolean(value: boolean): string {
    return translate(`format:boolean.${value ? "true" : "false"}`);
  }
  function formatEmpty(): string { return translate("format:empty"); }
  function formatText(value: string): string { return value; }

  return {
    formatDate, formatDateTime, formatTime, formatDateLong, formatRelative, formatDateRange,
    formatInteger, formatDecimal, formatQuantity, formatPercent, formatMoney, formatCompact,
    formatFileSize, formatDuration, formatPhone, formatTimeZone, formatCulture, formatTaxId,
    formatEmail, formatEnum, formatBoolean, formatEmpty, formatText,
  };
}
