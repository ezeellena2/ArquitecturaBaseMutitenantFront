import { describe, expect, it } from "vitest";
import { capitalize, foldText, stripDiacritics } from "./text";

describe("shared/lib/text", () => {
  it("stripDiacritics quita tildes y diacríticos conservando la caja", () => {
    expect(stripDiacritics("Árbol Ñandú Crème")).toBe("Arbol Nandu Creme");
    expect(stripDiacritics("Categorías")).toBe("Categorias");
  });

  it("foldText pliega tildes y mayúsculas para búsqueda", () => {
    expect(foldText("Córdoba · ÁREA")).toBe("cordoba · area");
    expect(foldText("Español")).toBe("espanol");
  });

  it("capitalize pone en mayúscula la primera letra respetando cultura", () => {
    expect(capitalize("español", "es-AR")).toBe("Español");
    expect(capitalize("english", "en-US")).toBe("English");
    expect(capitalize("")).toBe("");
  });
});
