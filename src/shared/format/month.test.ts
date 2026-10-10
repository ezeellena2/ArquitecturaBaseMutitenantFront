import { describe, expect, it } from "vitest";
import { referenceDataFixture } from "@/test/mocks/handlers";
import { createFormatters } from "./formatters";
import { parseMonth } from "./parsers";

function format(culture = "es-AR", timeZone = "America/Argentina/Buenos_Aires", now = "2026-11-01T01:30:00Z") {
  return createFormatters({ referenceData: referenceDataFixture(), culture, timeZone, now, translate: (key) => key });
}

describe("período mensual central", () => {
  it("conserva el contrato exacto y diferencia vacío de inválido", () => {
    for (const value of ["0001-01", "0099-12", "0100-02", "2024-02", "2025-02", "9999-12"]) {
      expect(parseMonth(value)).toBe(value);
    }
    expect(parseMonth("")).toBeNull();
    for (const value of ["0000-01", "10000-01", "2026-00", "2026-13", "2026-1", "026-01", "2026-01-01", "2026-01-01T00:00:00Z", " 2026-01", "2026-01\n", " "]) {
      expect(() => parseMonth(value)).toThrow();
    }
  });

  it("localiza mes y año sin convertir el período por zona ni perder años tempranos", () => {
    expect(format().formatMonth("2026-10")).toBe("Octubre de 2026");
    expect(format("en-US").formatMonth("2026-10")).toBe("October 2026");
    for (const year of ["0001", "0099", "0100", "9999"]) {
      expect(format().formatMonth(`${year}-02`)).toBe(`Febrero de ${year}`);
      expect(format("en-US", "Pacific/Kiritimati").formatMonth(`${year}-02`)).toBe(`February ${year}`);
      expect(format().getMonthOptions(`${year}-02`)).toHaveLength(12);
      expect(format().getMonthOptions(`${year}-02`)[11]).toEqual({ value: `${year}-12`, label: "Diciembre" });
    }
    expect(() => format().formatMonth("0000-01")).toThrow();
    expect(() => format().getMonthOptions("2026-13")).toThrow();
    expect(format().getAdjacentMonthYear("0100-02", -1)).toBe("0099-02");
    expect(format().getAdjacentMonthYear("0001-01", -1)).toBeNull();
    expect(format().getAdjacentMonthYear("9999-12", 1)).toBeNull();
  });

  it("obtiene el mes actual del reloj central en la zona efectiva en límites de mes y año", () => {
    expect(format().getCurrentMonth()).toBe("2026-10");
    expect(format("en-US", "UTC").getCurrentMonth()).toBe("2026-11");
    expect(format("es-AR", "America/Argentina/Buenos_Aires", "2027-01-01T01:00:00Z").getCurrentMonth()).toBe("2026-12");
    expect(format("en-US", "Pacific/Kiritimati", "2026-12-31T12:00:00Z").getCurrentMonth()).toBe("2027-01");
  });
});
