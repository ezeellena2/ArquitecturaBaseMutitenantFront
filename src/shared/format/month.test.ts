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

  // 205: el mes nunca va en letras; se escribe como su rango, y al elegirlo, los meses van con su número.
  it("escribe el mes como su rango sin convertirlo por zona ni perder años tempranos", () => {
    expect(format().formatMonth("2026-10")).toBe("01/10/2026 – 31/10/2026");
    expect(format("en-US").formatMonth("2026-10")).toBe("10/01/2026 – 10/31/2026");
    expect(format().formatMonth("2028-02")).toBe("01/02/2028 – 29/02/2028");
    expect(format().formatMonth("2026-02")).toBe("01/02/2026 – 28/02/2026");
    expect(format("en-US", "Pacific/Kiritimati").formatMonth("2026-12")).toBe("12/01/2026 – 12/31/2026");
    for (const [year, last] of [["0001", "28"], ["0004", "29"], ["0099", "28"], ["0100", "28"], ["2000", "29"], ["9999", "28"]]) {
      expect(format().formatMonth(`${year}-02`)).toBe(`01/02/${year} – ${last}/02/${year}`);
      expect(format("en-US", "Pacific/Kiritimati").formatMonth(`${year}-02`)).toBe(`02/01/${year} – 02/${last}/${year}`);
      expect(format().getMonthOptions(`${year}-02`)).toHaveLength(12);
      expect(format().getMonthOptions(`${year}-02`)[11]).toEqual({ value: `${year}-12`, label: "12" });
    }
    expect(format().getMonthOptions("2026-10").map((option) => option.label))
      .toEqual(["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"]);
    expect(format("en-US").getMonthOptions("2026-10")[0]).toEqual({ value: "2026-01", label: "01" });
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
