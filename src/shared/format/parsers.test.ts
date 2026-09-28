import { describe, expect, it } from "vitest";
import { referenceDataFixture } from "@/test/mocks/handlers";
import { parseDate, parseDecimal, parseMoney, parsePercent } from "./parsers";

const referenceData = referenceDataFixture();
const spanish = referenceData.cultures[0];
const english = referenceData.cultures[1];

describe("entrada según Cultures", () => {
  it("interpreta agrupación y decimal de cada cultura sin usar la configuración del navegador", () => {
    expect(parseDecimal("1.234,50", spanish)).toBe(1234.5);
    expect(parseDecimal("1,234.50", english)).toBe(1234.5);
    expect(parseDecimal("-12,5", spanish)).toBe(-12.5);
    expect(parseDecimal("  ", spanish)).toBeNull();
    expect(() => parseDecimal("12.34,5", spanish)).toThrow();
    expect(() => parseDecimal("1,234.5", spanish)).toThrow();
    expect(() => parseDecimal("Infinity", english)).toThrow();
  });

  it("emite el contrato Money y valida los decimales desde Currencies, sin redondear", () => {
    expect(parseMoney("1.234,50", "ARS", spanish, referenceData))
      .toEqual({ amount: 1234.5, currency: "ARS" });
    expect(parseMoney("", "ARS", spanish, referenceData)).toBeNull();
    expect(() => parseMoney("1,234", "ARS", spanish, referenceData)).toThrow();
    expect(() => parseMoney("1,00", "XXX", spanish, referenceData)).toThrow();

    const noMinorUnits = {
      ...referenceData,
      currencies: [{ ...referenceData.currencies[0], minorUnits: 0 }],
    };
    expect(parseMoney("1234", "ARS", spanish, noMinorUnits))
      .toEqual({ amount: 1234, currency: "ARS" });
    expect(() => parseMoney("1234,5", "ARS", spanish, noMinorUnits)).toThrow();
  });

  it("no ofrece una moneda deshabilitada para un dato nuevo", () => {
    const disabled = {
      ...referenceData,
      currencies: [{ ...referenceData.currencies[0], isEnabled: false }],
    };
    expect(() => parseMoney("1", "ARS", spanish, disabled)).toThrow();
  });

  it("convierte el porcentaje visible a la fracción HTTP y preserva el vacío", () => {
    expect(parsePercent("12,5", spanish)).toBe(0.125);
    expect(parsePercent("12.5", english)).toBe(0.125);
    expect(parsePercent("", spanish)).toBeNull();
    expect(() => parsePercent("12.5", spanish)).toThrow();
  });

  it("interpreta DateOnly por DatePattern, valida calendario y no mueve la fecha por zona", () => {
    expect(parseDate("27/09/2026", spanish)).toBe("2026-09-27");
    expect(parseDate("09/27/2026", english)).toBe("2026-09-27");
    expect(parseDate("29/02/2024", spanish)).toBe("2024-02-29");
    expect(parseDate("", spanish)).toBeNull();
    expect(() => parseDate("31/02/2026", spanish)).toThrow();
    expect(() => parseDate("02/29/2025", english)).toThrow();
    expect(() => parseDate("2026-09-27", spanish)).toThrow();
  });
});
