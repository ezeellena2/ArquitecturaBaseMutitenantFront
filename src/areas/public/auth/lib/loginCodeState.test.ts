import { describe, expect, it } from "vitest";
import { beginCodeStep, secondsUntilResend } from "./loginCodeState";

describe("paso del código", () => {
  it("pasa al código dentro de la misma pantalla y habilita reenvío a los 60 s", () => {
    const step = beginCodeStep("ana@example.com", 1_000);
    expect(step).toEqual({ kind: "code", destination: "ana@example.com", sentAtMs: 1_000 });
    expect(secondsUntilResend(step.sentAtMs, 1_000)).toBe(60);
    expect(secondsUntilResend(step.sentAtMs, 43_000)).toBe(18);
    expect(secondsUntilResend(step.sentAtMs, 61_000)).toBe(0);
  });
});
