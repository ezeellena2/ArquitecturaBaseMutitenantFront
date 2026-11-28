import { describe, expect, it } from "vitest";
import type { FormatState } from "@/shared/format/useFormat";
import type { FormCatalogFieldDetail } from "../api/types";
import { ambiguousReadings, catalogImportColumns, gridColumnKey, importColumnOf, pastedCsv, readPaste, type PastedSheet } from "./catalogImport";

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
    expect(sheet.columns.map((column) => [column.column, column.source])).toEqual([["code", 2], ["text", 1], ["value", 0], ["detail", -1]]);
    expect(pastedCsv(sheet)).toBe('"Code","Text","Value"\r\n"","","zona 1"\r\n"N1","Norte","1,5"');
    expect(readPaste(" \n\t\n", text)).toBeNull();
  });

  describe("con campos (E13)", () => {
    const field = (id: string, key: string, name: string, type: FormCatalogFieldDetail["type"], isActive = true): FormCatalogFieldDetail =>
      ({ id, key, name, type, required: false, unique: false, isActive, valuesCount: 0 });
    const fields = [field("f-cuit", "cuit", "CUIT", "Text"), field("f-viejo", "viejo", "Viejo", "Text", false),
      field("f-zona", "zona", "Zona", "Catalog"), field("f-plazo", "plazo_de_pago", "Plazo de pago", "WholeNumber")];
    const withFields = catalogImportColumns("Text", fields);
    const keys = (sheet: PastedSheet) => sheet.columns.map((column) => [column.column === null ? null : gridColumnKey(column.column), column.source]);

    it("la grilla trae una columna por campo activo, en el orden del catálogo, después del valor y antes del detalle, como la plantilla", () => {
      expect(withFields.map(gridColumnKey)).toEqual(["code", "text", "field-f-cuit", "field-f-zona", "field-f-plazo", "detail"]);
      expect(catalogImportColumns("DecimalNumber", fields).map(gridColumnKey)).toEqual(["code", "text", "value", "field-f-cuit", "field-f-zona", "field-f-plazo", "detail"]);
    });

    it("sin encabezados, lo copiado de la plantilla de un catálogo tipado (Código, Texto, Valor, los campos y Detalle) cae en su columna", () => {
      const sheet = readPaste("PRV-1\tBulones\t1,5\t30-71567890-2\tNorte\t30\tFerretería", catalogImportColumns("DecimalNumber", fields))!;
      expect(keys(sheet)).toEqual([["code", 0], ["text", 1], ["value", 2], ["field-f-cuit", 3], ["field-f-zona", 4], ["field-f-plazo", 5], ["detail", 6]]);
      expect(pastedCsv(sheet)).toBe('"Code","Text","Value","cuit","zona","plazo_de_pago","Detail"\r\n"PRV-1","Bulones","1,5","30-71567890-2","Norte","30","Ferretería"');
    });

    it("sin encabezados, los campos se llenan en el orden de la plantilla y viajan con su clave", () => {
      const sheet = readPaste("PRV-1\tBulones\t30-71567890-2\tNorte\t30\tFerretería", withFields)!;
      expect(keys(sheet)).toEqual([["code", 0], ["text", 1], ["field-f-cuit", 2], ["field-f-zona", 3], ["field-f-plazo", 4], ["detail", 5]]);
      expect(pastedCsv(sheet)).toBe('"Code","Text","cuit","zona","plazo_de_pago","Detail"\r\n"PRV-1","Bulones","30-71567890-2","Norte","30","Ferretería"');
    });

    it("con encabezados, un campo se reconoce por su nombre (sin tildes ni mayúsculas) o por su clave; lo que no es de ningún campo queda ajeno", () => {
      const sheet = readPaste("Código\tTexto\tplazo_de_pago\tZONA\tRubro\tViejo\nPRV-1\tBulones\t30\tNorte\tFerretería\tx", withFields)!;
      expect(keys(sheet)).toEqual([["code", 0], ["text", 1], ["field-f-cuit", -1], ["field-f-zona", 3], ["field-f-plazo", 2], ["detail", -1], [null, 4], [null, 5]]);
      expect(sheet.columns.slice(-2).map((column) => column.header)).toEqual(["Rubro", "Viejo"]);
      expect(pastedCsv(sheet)).toBe('"Code","Text","zona","plazo_de_pago"\r\n"PRV-1","Bulones","Norte","30"');
      // Solo encabezados de campos también son encabezados.
      expect(readPaste("cuit\nCUIT 1", withFields)!.rows).toEqual([["CUIT 1"]]);
    });

    it("un campo que se llama como una columna fija toma el segundo encabezado con ese nombre", () => {
      const columns = catalogImportColumns("Text", [field("f-cod", "codigo", "Código", "Text")]);
      const sheet = readPaste("Código\tTexto\tCódigo\nPRV-1\tBulones\tA-1", columns)!;
      expect(keys(sheet)).toEqual([["code", 0], ["text", 1], ["field-f-cod", 2], ["detail", -1]]);
      expect(pastedCsv(sheet)).toBe('"Code","Text","codigo"\r\n"PRV-1","Bulones","A-1"');
    });

    it("un campo «Detalle» toma el primero de dos encabezados «Detalle», como en la plantilla, y solo, el encabezado es el detalle", () => {
      const columns = catalogImportColumns("Text", [field("f-det", "detalle", "Detalle", "Text")]);
      const sheet = readPaste("Código\tTexto\tDetalle\tDetail\nPRV-1\tBulones\tdel campo\tdel detalle", columns)!;
      expect(keys(sheet)).toEqual([["code", 0], ["text", 1], ["field-f-det", 2], ["detail", 3]]);
      expect(pastedCsv(sheet)).toBe('"Code","Text","detalle","Detail"\r\n"PRV-1","Bulones","del campo","del detalle"');
      expect(keys(readPaste("Código\tTexto\tDetalle\nPRV-1\tBulones\tdel detalle", columns)!)).toEqual([["code", 0], ["text", 1], ["field-f-det", -1], ["detail", 2]]);
      // Exactamente su clave es el campo, como lo lee el servidor.
      expect(keys(readPaste("detalle\tDetalle\ndel campo\tdel detalle", columns)!)).toEqual([["code", -1], ["text", -1], ["field-f-det", 0], ["detail", 1]]);
    });
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
