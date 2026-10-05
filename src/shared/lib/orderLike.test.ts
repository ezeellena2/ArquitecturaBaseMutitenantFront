import { describe, expect, it } from "vitest";
import { orderLike } from "./orderLike";

describe("orderLike", () => {
  // Volver a lo guardado no cuenta como un cambio: lo que ya estaba conserva su lugar.
  it("lo que ya estaba conserva su lugar aunque se haya vuelto a elegir", () => {
    expect(orderLike(["a", "b"], ["b", "a"])).toEqual(["a", "b"]);
  });

  it("lo nuevo va al final, en el orden en que se eligió", () => {
    expect(orderLike(["a"], ["c", "a", "b"])).toEqual(["a", "c", "b"]);
  });

  it("lo que se sacó no vuelve, y sin nada guardado queda lo elegido", () => {
    expect(orderLike(["a", "b"], ["b"])).toEqual(["b"]);
    expect(orderLike(undefined, ["b", "a"])).toEqual(["b", "a"]);
  });
});
