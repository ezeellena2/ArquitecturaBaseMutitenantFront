import { describe, expect, it } from "vitest";
import { asMoney } from "./values";

describe("asMoney", () => {
  it("lee el importe y la moneda tal como llegan, sin convertir", () => {
    expect(asMoney({ amount: 0.0312, currency: "USD" })).toEqual({ amount: 0.0312, currency: "USD" });
    expect(asMoney({ amount: "0.03", currency: "USD" })).toBeNull();
    expect(asMoney({ amount: 1 })).toBeNull();
    expect(asMoney(null)).toBeNull();
  });
});
