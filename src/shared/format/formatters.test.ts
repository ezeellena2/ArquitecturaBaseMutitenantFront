import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it, vi } from "vitest";
import { parseReferenceData } from "@/shared/referenceData/referenceData";
import { referenceDataFixture } from "@/test/mocks/handlers";
import { createFormatters } from "./formatters";

type FormatCase = {
  id: string;
  type: string;
  culture: string;
  timeZone: string;
  input: unknown;
  expected?: string;
  error?: string;
};

type FormatContract = { now: string; cases: FormatCase[] };

const backendRoot = path.resolve(import.meta.dirname, "../../../../ArquitecturaBaseMutitenant");
const backendPresent = existsSync(backendRoot);

if (!backendPresent && !process.env.CI) {
  throw new Error("El repo hermano ArquitecturaBaseMutitenant es obligatorio para probar la paridad local.");
}

if (!backendPresent) {
  console.warn("Se omite la paridad de formatos en CI: falta el repo hermano ArquitecturaBaseMutitenant.");
}

function readJson<T>(absolutePath: string): T {
  return JSON.parse(readFileSync(absolutePath, "utf8")) as T;
}

function sourceRows(file: string, collection: string): Record<string, unknown>[] {
  const source = readJson<Record<string, unknown>>(
    path.join(backendRoot, "src/ArquitecturaBaseMultitenant.Infrastructure/Persistence/Seed/ReferenceData", file),
  );
  return source[collection] as Record<string, unknown>[];
}

function camelCase(key: string): string {
  return key[0].toLowerCase() + key.slice(1);
}

function localizedRow(row: Record<string, unknown>, culture: string): Record<string, unknown> {
  const translations = row.Translations as Record<string, unknown>[];
  const translation = translations.find((item) => item.Culture === culture || item.DisplayCulture === culture);
  if (!translation) throw new Error(`Falta traducción ${culture} para ${String(row.Code ?? row.Id)}`);
  return Object.fromEntries(
    Object.entries({ ...row, ...translation })
      .filter(([key]) => key !== "Translations" && key !== "Culture" && key !== "DisplayCulture")
      .map(([key, value]) => [camelCase(key), value]),
  );
}

function sourceCatalog(culture: string) {
  return parseReferenceData({
    culture,
    currencies: sourceRows("currencies.json", "Currencies").map((item) => localizedRow(item, culture)),
    countries: sourceRows("countries.json", "Countries").map((item) => localizedRow(item, culture)),
    timeZones: sourceRows("time-zones.json", "TimeZones").map((item) => localizedRow(item, culture)),
    cultures: sourceRows("cultures.json", "Cultures").map((item) => localizedRow(item, culture)),
    taxIdTypes: sourceRows("tax-id-types.json", "TaxIdTypes").map((item) => localizedRow(item, culture)),
  });
}

function translator(culture: string) {
  const language = culture.split("-")[0];
  const namespace = {
    format: readJson<Record<string, unknown>>(path.resolve(import.meta.dirname, `../../locales/${language}/format.json`)),
    enums: readJson<Record<string, unknown>>(path.resolve(import.meta.dirname, `../../locales/${language}/enums.json`)),
  };
  return (key: string, options?: { count?: number }): string => {
    const [name, nested] = key.split(":", 2) as ["format" | "enums", string];
    const parts = nested.split(".");
    const terminal = parts.pop()!;
    let parent: unknown = namespace[name];
    for (const part of parts) parent = (parent as Record<string, unknown>)[part];
    const entries = parent as Record<string, unknown>;
    const value = options?.count === undefined
      ? entries[terminal]
      : entries[`${terminal}_${options.count === 1 ? "one" : "other"}`] ?? entries[terminal];
    if (typeof value !== "string") throw new Error(`Falta texto ${key}`);
    return value.replace("{{count}}", String(options?.count ?? ""));
  };
}

function renderCase(item: FormatCase, now: string): string {
  const formatter = createFormatters({
    referenceData: sourceCatalog(item.culture),
    culture: item.culture,
    timeZone: item.timeZone,
    now,
    translate: translator(item.culture),
  });

  switch (item.type) {
    case "date": return formatter.formatDate(item.input as string);
    case "dateTime": return formatter.formatDateTime(item.input as string);
    case "time": return formatter.formatTime(item.input as string);
    case "dateLong": return formatter.formatDateLong(item.input as string);
    case "relative": return formatter.formatRelative(item.input as string);
    case "dateRange": return formatter.formatDateRange(item.input as { start: string; end: string });
    case "integer": return formatter.formatInteger(item.input as number);
    case "decimal": {
      const value = item.input as { value: number; digits: number };
      return formatter.formatDecimal(value.value, value.digits);
    }
    case "quantity": return formatter.formatQuantity(item.input as number);
    case "percent": return formatter.formatPercent(item.input as number);
    case "money": return formatter.formatMoney(item.input as { amount: number; currency: string });
    case "compact": return formatter.formatCompact(item.input as number);
    case "fileSize": return formatter.formatFileSize(item.input as number);
    case "duration": return formatter.formatDuration(item.input as number);
    case "phone": return formatter.formatPhone(item.input as string);
    case "timeZone": return formatter.formatTimeZone(item.input as string);
    case "culture": return formatter.formatCulture(item.input as string);
    case "taxId": return formatter.formatTaxId(item.input as { type: string; number: string });
    case "email": return formatter.formatEmail(item.input as string);
    case "enum": {
      const value = item.input as { enum: string; value: string };
      return formatter.formatEnum(value.enum, value.value);
    }
    case "boolean": return formatter.formatBoolean(item.input as boolean);
    case "empty": return formatter.formatEmpty();
    case "text": return formatter.formatText(item.input as string);
    default: throw new Error(`Tipo de caso desconocido: ${item.type}`);
  }
}

describe.skipIf(!backendPresent)("paridad con format-cases.json", () => {
  const contract = backendPresent
    ? readJson<FormatContract>(path.join(backendRoot, "docs/contracts/format-cases.json"))
    : { now: "", cases: [] };

  it("abarca todos los tipos documentados en ambas culturas", () => {
    const types = new Set(contract.cases.map((item) => item.type));
    for (const type of [
      "date", "dateTime", "time", "dateLong", "relative", "dateRange", "integer", "decimal",
      "quantity", "percent", "money", "compact", "fileSize", "duration", "phone", "timeZone",
      "culture", "taxId", "email", "enum", "boolean", "empty", "text",
    ]) {
      expect(types.has(type), `Faltan casos de ${type}`).toBe(true);
    }
    expect(new Set(contract.cases.map((item) => item.culture)).size).toBeGreaterThanOrEqual(2);
  });

  for (const item of contract.cases) {
    it(item.id, () => {
      if (item.error) {
        expect(() => renderCase(item, contract.now)).toThrow();
      } else {
        expect(renderCase(item, contract.now)).toBe(item.expected);
      }
    });
  }
});

describe.skipIf(!backendPresent)("reloj del formateador", () => {
  it("recalcula el offset al mostrar tras un cambio de horario de verano", () => {
    vi.useFakeTimers();
    try {
      vi.setSystemTime(new Date("2026-01-15T15:00:00Z"));
      const formatter = createFormatters({
        referenceData: sourceCatalog("en-US"), culture: "en-US", timeZone: "America/New_York",
        translate: translator("en-US"),
      });
      expect(formatter.formatTimeZone("America/New_York")).toBe("New York (GMT−5)");

      vi.setSystemTime(new Date("2026-07-15T15:00:00Z"));
      expect(formatter.formatTimeZone("America/New_York")).toBe("New York (GMT−4)");
    } finally {
      vi.useRealTimers();
    }
  });

  it("mantiene el instante explícito del contrato aunque avance el reloj real", () => {
    vi.useFakeTimers();
    try {
      const formatter = createFormatters({
        referenceData: sourceCatalog("en-US"), culture: "en-US", timeZone: "America/New_York",
        now: "2026-01-15T15:00:00Z", translate: translator("en-US"),
      });
      vi.setSystemTime(new Date("2026-07-15T15:00:00Z"));
      expect(formatter.formatTimeZone("America/New_York")).toBe("New York (GMT−5)");
    } finally {
      vi.useRealTimers();
    }
  });

  it("actualiza también los textos relativos cuando no se fijó now", () => {
    vi.useFakeTimers();
    try {
      vi.setSystemTime(new Date("2026-01-15T15:00:00Z"));
      const formatter = createFormatters({
        referenceData: sourceCatalog("en-US"), culture: "en-US", timeZone: "America/New_York",
        translate: translator("en-US"),
      });
      expect(formatter.formatRelative("2026-01-15T14:55:00Z")).toBe("5 minutes ago");
      vi.setSystemTime(new Date("2026-01-16T15:00:00Z"));
      expect(formatter.formatRelative("2026-01-15T14:55:00Z")).toBe("1 day ago");
    } finally {
      vi.useRealTimers();
    }
  });
});

describe.skipIf(!backendPresent)("referencias históricas", () => {
  it("muestra valores guardados aunque sus filas ya estén deshabilitadas", () => {
    const source = sourceCatalog("en-US");
    const culture = source.cultures.find((item) => item.code === "es-AR");
    const taxIdType = source.taxIdTypes.find((item) => item.code === "AR-CUIT");
    expect(culture).toBeDefined();
    expect(taxIdType).toBeDefined();
    const data = parseReferenceData({
      ...source,
      cultures: source.cultures.map((item) => item.code === "es-AR" ? { ...item, isEnabled: false } : item),
      taxIdTypes: source.taxIdTypes.map((item) => item.code === "AR-CUIT" ? { ...item, isEnabled: false } : item),
    });
    expect(data.currencies.find((item) => item.code === "USD")?.isEnabled).toBe(false);
    expect(data.timeZones.find((item) => item.id === "America/New_York")?.isEnabled).toBe(false);
    expect(data.cultures.find((item) => item.code === "es-AR")?.isEnabled).toBe(false);
    expect(data.taxIdTypes.find((item) => item.code === "AR-CUIT")?.isEnabled).toBe(false);

    const formatter = createFormatters({
      referenceData: data, culture: "en-US", timeZone: "America/New_York",
      now: "2026-09-27T15:00:00Z", translate: translator("en-US"),
    });
    expect(formatter.formatMoney({ amount: 1234.5, currency: "USD" })).toBe("$1,234.50");
    expect(formatter.formatTimeZone("America/New_York")).toBe("New York (GMT−4)");
    expect(formatter.formatCulture("es-AR")).toBe("Spanish (Argentina)");
    expect(formatter.formatTaxId({ type: "AR-CUIT", number: "20123456786" })).toBe("20-12345678-6");
  });
});

describe("designadores horarios del catálogo", () => {
  it("muestra AM/PM según Cultures y no según la configuración del host", () => {
    const data = referenceDataFixture("en-US");
    const referenceData = {
      ...data,
      cultures: data.cultures.map((row) => row.code === "en-US"
        ? { ...row, amDesignator: "a. m.", pmDesignator: "p. m." } : row),
    };
    const formatter = createFormatters({ referenceData, culture: "en-US", timeZone: "UTC",
      translate: translator("en-US") });

    expect(formatter.formatTime("14:35:00")).toBe("2:35 p. m.");
    expect(formatter.formatDateTime("2026-09-27T14:35:00Z")).toBe("09/27/2026 2:35 p. m.");
  });
});

describe.skipIf(!backendPresent)("redondeo antes de signo y unidad", () => {
  for (const [culture, money, compact, fileSize] of [
    ["es-AR", "$ 0,00", "1 M", "1 MB"],
    ["en-US", "ARS 0.00", "1M", "1 MB"],
  ]) {
    it(culture, () => {
      const formatter = createFormatters({
        referenceData: sourceCatalog(culture), culture, timeZone: "UTC",
        translate: translator(culture),
      });
      expect(formatter.formatMoney({ amount: -0.001, currency: "ARS" })).toBe(money);
      expect(formatter.formatCompact(999950)).toBe(compact);
      expect(formatter.formatFileSize(999950)).toBe(fileSize);
    });
  }
});

describe.skipIf(!backendPresent)("offset independiente de la cultura visible", () => {
  for (const culture of ["fr-FR", "sv-SE"]) {
    it(culture, () => {
      const data = sourceCatalog("en-US");
      const english = data.cultures.find((row) => row.code === "en-US")!;
      const referenceData = {
        ...data,
        cultures: [...data.cultures, { ...english, code: culture, languageCode: culture.slice(0, 2) }],
      };
      const formatter = createFormatters({
        referenceData, culture, timeZone: "UTC", now: "2026-09-27T15:00:00Z",
        translate: translator("en-US"),
      });

      expect(formatter.formatTimeZone("America/New_York")).toBe("New York (GMT−4)");
    });
  }
});
