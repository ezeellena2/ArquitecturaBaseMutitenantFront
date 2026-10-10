import { describe, expect, it } from "vitest";
import { parseUtcInstant } from "./parseUtcInstant";

describe("parseUtcInstant", () => {
  it("conserva el instante UTC y su precisión para adaptadores de SDK", () => {
    expect(parseUtcInstant("2026-10-09T12:00:00.123Z").toISOString()).toBe("2026-10-09T12:00:00.123Z");
  });
  it.each(["2026-10-09T12:00:00", "2026-10-09T12:00:00+00:00", "invalidZ", "2026-10-09"])("rechaza %s sin elegir una fecha cliente", (value) => {
    expect(() => parseUtcInstant(value)).toThrow();
  });
});
