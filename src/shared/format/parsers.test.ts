import { describe, expect, it } from "vitest";
import { referenceDataFixture } from "@/test/mocks/handlers";
import { parseDate, parseDateTime, parseDecimal, parseMoney, parsePercent, parseTime } from "./parsers";

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

  it("rechaza decimales que Number no puede conservar sin redondeo silencioso", () => {
    expect(parseMoney("1.234.567.890.123,45", "ARS", spanish, referenceData))
      .toEqual({ amount: 1234567890123.45, currency: "ARS" });
    expect(() => parseMoney("123.456.789.012.345,67", "ARS", spanish, referenceData)).toThrow();
    expect(() => parseDecimal("123.456.789.012.345,67", spanish)).toThrow();
    expect(() => parseDecimal(`0,${"0".repeat(323)}1`, spanish)).toThrow();
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
    expect(parsePercent("8,2", spanish)).toBe(0.082);
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

  it("interpreta TimeOnly según TimePattern y emite HH:mm:ss sin zona", () => {
    expect(parseTime("14:35", spanish)).toBe("14:35:00");
    expect(parseTime("2:35 PM", english)).toBe("14:35:00");
    expect(parseTime("12:05 AM", english)).toBe("00:05:00");
    expect(parseTime("", spanish)).toBeNull();
    expect(() => parseTime("24:00", spanish)).toThrow();
    expect(() => parseTime("2:35", english)).toThrow();
  });

  it("convierte la fecha y hora de la cultura y zona efectiva a un instante UTC", () => {
    const zone = "America/Argentina/Buenos_Aires";
    expect(parseDateTime("27/09/2026 14:35", spanish, zone))
      .toBe("2026-09-27T17:35:00Z");
    expect(parseDateTime("09/27/2026 2:35 PM", english, zone))
      .toBe("2026-09-27T17:35:00Z");
    expect(parseDateTime("", spanish, zone)).toBeNull();
    expect(() => parseDateTime("31/02/2026 14:35", spanish, zone)).toThrow();
  });

  it("rechaza una hora local inexistente o ambigua durante cambio horario", () => {
    const zone = "America/New_York";
    expect(() => parseDateTime("03/08/2026 2:30 AM", english, zone)).toThrow();
    expect(() => parseDateTime("11/01/2026 1:30 AM", english, zone)).toThrow();
    expect(parseDateTime("11/01/2026 2:30 AM", english, zone))
      .toBe("2026-11-01T07:30:00Z");
  });

  it("admite el símbolo visible del porcentaje además de su valor numérico", () => {
    expect(parsePercent("12,5 %", spanish)).toBe(0.125);
    expect(parsePercent("12.5%", english)).toBe(0.125);
    expect(() => parsePercent("%", spanish)).toThrow();
  });
});
