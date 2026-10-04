import { describe, expect, it } from "vitest";
import { initials } from "./initials";

describe("initials", () => {
  it("toma la inicial de las dos primeras palabras, como los tableros («GD», «DN»)", () => {
    expect(initials("Grupo Delta")).toBe("GD");
    expect(initials("Delta Norte S.A.")).toBe("DN");
    expect(initials("  ágora  ")).toBe("Á");
    expect(initials("")).toBe("");
  });
});
