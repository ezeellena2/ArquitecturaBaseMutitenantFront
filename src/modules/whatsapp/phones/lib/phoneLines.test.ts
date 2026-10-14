import { describe, expect, it } from "vitest";
import { referenceDataFixture } from "@/test/mocks/handlers";
import { phoneInputs, phoneLines, phoneLinesFromFile } from "./phoneLines";

const countries = referenceDataFixture().countries;

describe("teléfonos para cargar", () => {
  it("toma un teléfono por renglón, sin los renglones vacíos", () => {
    expect(phoneLines("11 5555-4521\r\n\n  11 5555-7310  \n")).toEqual(["11 5555-4521", "11 5555-7310"]);
  });

  it("de un archivo toma la primera columna de cada fila", () => {
    expect(phoneLinesFromFile("\"11 5555-4521\",Tomás\n11 5555-7310;Martín\n11 5555-8812")).toEqual(["11 5555-4521", "11 5555-7310", "11 5555-8812"]);
  });

  it("manda país y número como los carga la persona, y un «+» trae su país", () => {
    expect(phoneInputs(["11 5555-4521", "+54 9 11 5555-7310", "11 4444"], "AR", countries)).toEqual([
      { country: "AR", number: "11 5555-4521" },
      { country: "AR", number: "011 15-5555-7310" },
      { country: "AR", number: "11 4444" },
    ]);
  });
});
