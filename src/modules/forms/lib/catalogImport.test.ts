import { describe, expect, it } from "vitest";
import type { FormatState } from "@/shared/format/useFormat";
import { ambiguousReadings, catalogImportColumns, importColumnOf, pastedCsv, readPaste } from "./catalogImport";

const text = catalogImportColumns("Text");
const decimal = catalogImportColumns("DecimalNumber");

describe("lo pegado en la grilla de importar (FRM-Catalogo-Importar)", () => {
  it("sin encabezados, las filas van en el orden de la plantilla, lo que sobra queda al final y lo que no se pegó no se manda", () => {
    const sheet = readPaste("PRV-1\tBulones\r\n\r\nPRV-2\tClavos\n", text)!;
    expect(sheet.rows).toEqual([["PRV-1", "Bulones"], ["PRV-2", "Clavos"]]);
    expect(sheet.columns.map((column) => [column.column, column.source])).toEqual([["code", 0], ["text", 1], ["detail", -1]]);
    expect(pastedCsv(sheet)).toBe('"Code","Text"\r\n"PRV-1","Bulones"\r\n"PRV-2","Clavos"');

    const wide = readPaste("PRV-1\tBulones\tCUIT 1\tFerretería", text)!;
    expect(wide.columns.at(-1)).toEqual({ column: null, header: null, position: 4, source: 3 });
    expect(pastedCsv(wide)).toBe('"Code","Text","Detail"\r\n"PRV-1","Bulones","CUIT 1"');
  });

  it("con encabezados, cada columna va a su lugar por su nombre, sin tildes ni mayúsculas, y esa fila no se importa", () => {
    const sheet = readPaste("Valor (decimal)\tTEXTO\tcódigo\nzona 1\t\n1,5\tNorte\tN1", decimal)!;
    expect(sheet.rows).toEqual([["zona 1", ""], ["1,5", "Norte", "N1"]]);
    expect(sheet.columns.map((column) => [column.column, column.source])).toEqual([["code", 2], ["text", 1], ["detail", -1], ["value", 0]]);
    expect(pastedCsv(sheet)).toBe('"Code","Text","Value"\r\n"","","zona 1"\r\n"N1","Norte","1,5"');
    expect(readPaste(" \n\t\n", text)).toBeNull();
  });

  it("la columna de una fila de la revisión se lee por su clave o por su encabezado", () => {
    expect(["code", "Texto", "detail", "Value", "Rubro", null].map(importColumnOf)).toEqual(["code", "text", "detail", "value", null, null]);
  });

  it("lo que se lee de dos formas dice las dos maneras de escribirlo sin dudas (C9)", () => {
    const format = { formatDecimal: (value: number, digits: number) => value.toFixed(digits).replace(".", ","), formatInteger: (value: number) => String(value) } as FormatState;
    expect(ambiguousReadings("1.500", format)).toEqual(["1500", "1,5"]);
    expect(ambiguousReadings("12.345", format)).toEqual(["12345", "12,345"]);
    expect(ambiguousReadings("1,000", format)).toEqual(["1000", "1"]);
    expect(ambiguousReadings("3/4/2026", format)).toEqual(["2026-04-03", "2026-03-04"]);
    expect(ambiguousReadings("abc", format)).toBeNull();
  });
});
