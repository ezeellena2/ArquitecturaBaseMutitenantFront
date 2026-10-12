import { describe, expect, it } from "vitest";
import { beginCodeStep } from "./loginCodeState";

describe("paso del código", () => {
  it("pasa al código dentro de la misma pantalla conservando la espera enviada por la API", () => {
    const step = beginCodeStep("ana@example.com", 1_000);
    expect(step).toEqual({ kind: "code", destination: "ana@example.com", sentAtMs: 1_000 });
    expect(beginCodeStep("ana@example.com", 1_000, undefined, 42).resendAfterSeconds).toBe(42);
  });
});
