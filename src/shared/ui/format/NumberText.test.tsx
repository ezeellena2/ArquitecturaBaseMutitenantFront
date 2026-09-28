import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { NumberText } from "./NumberText";

vi.mock("@/shared/format/useFormat", () => ({
  useFormat: () => ({
    formatInteger: () => "1.234",
    formatDecimal: () => "1.234,50",
    formatQuantity: () => "1.234,5",
    formatCompact: () => "1,2 mil",
    formatEmpty: () => "—",
  }),
}));

describe("NumberText", () => {
  it("alinea números con dígitos tabulares y explicita los decimales", () => {
    render(<NumberText value={1234.5} kind="decimal" digits={2} />);
    expect(screen.getByText("1.234,50")).toHaveClass("text-right", "tabular-nums");
  });

  it("muestra el valor completo en tooltip cuando es compacto", () => {
    render(<NumberText value={1234.5} kind="compact" />);
    expect(screen.getByText("1,2 mil")).toHaveAttribute("title", "1.234,5");
  });
});
