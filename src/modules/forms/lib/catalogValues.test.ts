import { describe, expect, it } from "vitest";
import type { FormatState } from "@/shared/format/useFormat";
import { codeFromText, displayValue, editableValue, sameText, uniqueCode } from "./catalogValues";

const esAR = { culture: "es-AR", referenceData: { cultures: [{ code: "es-AR", groupSeparator: ".", decimalSeparator: "," }] }, formatDate: (value: string) => `fecha ${value}` } as unknown as FormatState;

describe("los valores y los códigos de un catálogo", () => {
  it("el código sale del texto: las iniciales con tres palabras o más, si no, las tres primeras letras, sin acentos", () => {
    expect(codeFromText("Seguimiento")).toBe("SEG");
    expect(codeFromText("Gran Buenos Aires")).toBe("GBA");
    expect(codeFromText("Reparación")).toBe("REP");
    expect(uniqueCode("SEG", new Set(["SEG", "SEG2"]))).toBe("SEG3");
    expect(uniqueCode("VEN", new Set(["SEG"]))).toBe("VEN");
  });

  it("el canónico se ve con la región del idioma, sin perder dígitos, y se escribe sin miles", () => {
    expect(displayValue("2500.5", "DecimalNumber", esAR)).toBe("2.500,5");
    expect(displayValue("-123456789012345678", "WholeNumber", esAR)).toBe("-123.456.789.012.345.678");
    expect(displayValue("2026-11-27", "Date", esAR)).toBe("fecha 2026-11-27");
    expect(displayValue(null, "Text", esAR)).toBe("");
    expect(editableValue("2500.5", "DecimalNumber", esAR)).toBe("2500,5");
  });

  it("dos textos son el mismo sin mirar mayúsculas ni espacios de los costados", () => {
    expect(sameText(" Venta ", "venta")).toBe(true);
    expect(sameText("Venta", "Ventas")).toBe(false);
  });
});
