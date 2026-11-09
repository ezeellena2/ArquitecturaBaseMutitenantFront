import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const srcRoot = path.resolve(import.meta.dirname, "../..");

function sourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) return directory === srcRoot && entry.name === "test" ? [] : sourceFiles(full);
    return /\.tsx?$/.test(entry.name) && !/\.(test|spec|d)\.tsx?$/.test(entry.name) ? [full] : [];
  });
}

function violations(relative: string, source: string): string[] {
  const normalized = relative.replaceAll("\\", "/");
  const inFormat = normalized.startsWith("shared/format/");
  const inTime = normalized.startsWith("shared/time/");
  const inPhone = normalized.startsWith("shared/phone/");
  const found: string[] = [];

  if (!inFormat && !inTime && /\b(?:toLocaleString|toLocaleDateString|toFixed)\s*\(|\bIntl\.|\bnew\s+Date\s*\(/.test(source)) {
    found.push("formato manual fuera de shared/format y shared/time");
  }
  if (!inTime && /\bDate\s*\.\s*(?:now|parse)\s*\(/.test(source)) {
    found.push("reloj o parsing de fecha fuera de shared/time");
  }
  if (!inFormat && !inPhone && /(?:from\s*["']libphonenumber-js|import\s*\(["']libphonenumber-js)/.test(source)) {
    found.push("libphonenumber-js fuera de shared/format y shared/phone");
  }
  if (/\b(?:const|let|var)\s+\w*(?:currenc|countries|cultures|timeZones|taxIdTypes|monedas|paises|zonas)\w*\s*=\s*\[[\s\S]*?["'][A-Z]{2,3}(?:-[A-Z]{2,4})?["']/.test(source)
    || /\[\s*["'][A-Z]{2,3}["']\s*,\s*["'][A-Z]{2,3}["']/.test(source)) {
    found.push("lista de referencia fija");
  }
  if (/\bcase\s+["'](?:[A-Z]{2,3}|[a-z]{2}-[A-Z]{2}|[A-Za-z]+\/[A-Za-z_/]+)["']\s*:/.test(source)) {
    found.push("switch de códigos de referencia");
  }
  // formatos.md (base de la 12): una fecha va completa y un momento con su hora; nunca la fecha corta, «hace 2 horas»,
  // «hoy» ni «ayer».
  if (/\bformat(?:Relative|Calendar|ShortDate|ShortDateTime)\b|kind=\{?["'](?:relative|shortDate|shortDateTime)["']|type:\s*["']relative["']/.test(source)) {
    found.push("fecha relativa, corta o de calendario");
  }
  return found;
}

describe("uso exclusivo de formatos y catálogos", () => {
  it("detecta formatos, importaciones telefónicas y listas fijas de prueba", () => {
    expect(violations("areas/business/companies/columns.tsx", "Date.now(); Date.parse(value)")).not.toEqual([]);
    expect(violations("shared/format/formatters.ts", "Date.now()")).not.toEqual([]);
    expect(violations("shared/time/serverClock.ts", "Date.now(); Date.parse(value)")).toEqual([]);
    expect(violations("shared/ui/DateText.tsx", "new Date(value).toLocaleDateString() ")).not.toEqual([]);
    expect(violations("shared/ui/PhoneText.tsx", 'import { parsePhoneNumber } from "libphonenumber-js"')).not.toEqual([]);
    expect(violations("shared/ui/fields/CurrencySelect.tsx", 'const currencies = ["ARS", "USD"]')).not.toEqual([]);
    expect(violations("shared/format/formatters.ts", 'const options = ["ARS", "USD"]')).not.toEqual([]);
    expect(violations("shared/ui/fields/CountrySelect.tsx", 'switch (code) { case "AR": return "Argentina"; }')).not.toEqual([]);
    expect(violations("shared/format/formatters.ts", "new Date(value); Intl.DateTimeFormat(culture)")).toEqual([]);
    expect(violations("areas/business/home/components/HomeCards.tsx", "format.formatCalendar(last)")).not.toEqual([]);
    expect(violations("areas/platform/accounts/columns.tsx", '<DateText value={value} kind="relative" />')).not.toEqual([]);
    expect(violations("modules/whatsapp/contacts/columns.tsx", '{ id: "last", type: "relative", value }')).not.toEqual([]);
    expect(violations("shared/ui/format/DateText.tsx", '<DateText value={value} kind="shortDate" />')).not.toEqual([]);
    expect(violations("shared/format/formatters.ts", "function formatShortDateTime(value)")).not.toEqual([]);
  });

  it("mantiene las reglas en el código de producción", () => {
    const problems = sourceFiles(srcRoot).flatMap((file) => {
      const relative = path.relative(srcRoot, file);
      return violations(relative, readFileSync(file, "utf8")).map((error) => `${relative}: ${error}`);
    });
    expect(problems).toEqual([]);
  });
});
