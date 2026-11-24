import { describe, expect, it } from "vitest";
import { summarizeChoices } from "./summarizeChoices";

const more = (count: number) => `y ${count} más`;

describe("summarizeChoices", () => {
  it("pone todos los nombres cuando entran", () => {
    expect(summarizeChoices(["Ventas", "Auditor"], () => true, more)).toEqual({ names: "Ventas, Auditor", more: null });
  });

  it("deja los que entran y nombra el resto con «y N más»", () => {
    const fits = (text: string) => text.length <= 32;
    expect(summarizeChoices(["Recursos humanos", "Ventas", "Auditor", "Dueño"], fits, more))
      .toEqual({ names: "Recursos humanos, Ventas", more: "y 2 más" });
  });

  it("deja siempre el primero, aunque no entre", () => {
    expect(summarizeChoices(["Administración de personas", "Ventas"], () => false, more))
      .toEqual({ names: "Administración de personas", more: "y 1 más" });
  });

  it("sin nombres no dice nada", () => {
    expect(summarizeChoices([], () => true, more)).toEqual({ names: "", more: null });
  });
});
