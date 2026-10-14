import { describe, expect, it } from "vitest";
import { duplicateName } from "./names";

describe("duplicateName", () => {
  it("suma _2 o sube el número que ya tiene", () => {
    expect(duplicateName("pedido_listo", 60)).toBe("pedido_listo_2");
    expect(duplicateName("pedido_listo_2", 60)).toBe("pedido_listo_3");
    expect(duplicateName("promo_9", 60)).toBe("promo_10");
  });
  it("no pasa el largo del nombre: acorta lo de adelante", () => {
    expect(duplicateName("abcdefghij", 10)).toBe("abcdefgh_2");
    expect(duplicateName("abcdefg_99", 10)).toBe("abcdef_100");
  });
});
