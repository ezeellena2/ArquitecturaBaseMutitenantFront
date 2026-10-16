import { describe, expect, it } from "vitest";
import { sameList } from "./sameList";

describe("sameList", () => {
  it("compara valores y orden; null y ausente valen como vacía", () => {
    expect(sameList(["a", "b"], ["a", "b"])).toBe(true);
    expect(sameList(["a", "b"], ["b", "a"])).toBe(false);
    expect(sameList(["a"], ["a", "b"])).toBe(false);
    expect(sameList(null, [])).toBe(true);
    expect(sameList(undefined, ["a"])).toBe(false);
  });
});
