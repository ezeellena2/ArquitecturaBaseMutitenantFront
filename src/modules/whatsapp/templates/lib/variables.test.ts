import { describe, expect, it } from "vitest";
import { insertPlaceholder, nextPlaceholder, placeholderNumbers, placeholdersInOrder, templateVariables } from "./variables";

describe("datos de una plantilla", () => {
  it("lee los números del texto sin repetir y en orden", () => {
    expect(placeholderNumbers("Hola {{2}}, {{1}} y otra vez {{ 2 }}")).toEqual([1, 2]);
    expect(placeholderNumbers("Sin datos")).toEqual([]);
  });

  it("el dato nuevo sigue al más alto y entra donde está el cursor", () => {
    expect(nextPlaceholder("Hola")).toBe(1);
    expect(nextPlaceholder("Hola {{1}}, tu pedido {{2}}")).toBe(3);
    expect(insertPlaceholder("Hola , listo", 1, 5)).toEqual({ body: "Hola {{1}}, listo", cursor: 10 });
    expect(insertPlaceholder("Hola", 1)).toEqual({ body: "Hola{{1}}", cursor: 9 });
  });

  it("pide los datos desde 1 y sin saltos", () => {
    expect(placeholdersInOrder("{{1}} {{2}}")).toBe(true);
    expect(placeholdersInOrder("{{1}} {{3}}")).toBe(false);
    expect(placeholdersInOrder("{{2}}")).toBe(false);
  });

  it("arma las variables en el orden del texto, con su nombre y su ejemplo", () => {
    expect(templateVariables("Hola {{1}}, tu pedido {{2}}", { 1: { label: " nombre ", example: "Ana" }, 2: { label: "número de pedido", example: "1234" }, 5: { label: "sobra", example: "x" } }))
      .toEqual([{ label: "nombre", example: "Ana" }, { label: "número de pedido", example: "1234" }]);
    expect(templateVariables("{{1}}", {})).toEqual([{ label: "", example: "" }]);
  });
});
