import { readFileSync } from "node:fs";
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { BrandMark } from "./BrandMark";

describe("BrandMark", () => {
  it("reproduce el cuadrado abierto y la sombra de marca del lienzo", () => {
    const { container } = render(<BrandMark />);
    const mark = container.querySelector(".brand-mark");
    expect(mark).toHaveClass("relative", "shadow-[0_2px_0.375rem_-1px_var(--marca-sombra)]");
    expect(mark?.querySelector("svg")).toBeNull();
    expect(mark?.firstElementChild).toHaveClass(
      "absolute", "inset-2", "rounded-[0.1875rem]", "border-[0.15625rem]",
      "border-[var(--lado-activo)]", "border-r-transparent", "-rotate-45",
    );
    expect(readFileSync("src/index.css", "utf8")).toContain("--marca-sombra: oklch(0.5 0.1 195 / 0.3)");
  });
});
