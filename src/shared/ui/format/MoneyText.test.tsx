import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MoneyText } from "./MoneyText";

vi.mock("@/shared/format/useFormat", () => ({
  useFormat: () => ({ formatMoney: () => "$ 1.234,50", formatEmpty: () => "—" }),
}));

describe("MoneyText", () => {
  it("alinea el monto y anuncia el código cuando el símbolo es ambiguo", () => {
    render(<MoneyText value={{ amount: 1234.5, currency: "ARS" }} />);
    expect(screen.getByText("$ 1.234,50")).toHaveClass("text-right", "tabular-nums");
    expect(screen.getByLabelText(/ARS/)).toBeInTheDocument();
  });

  it("representa null como vacío y no como cero", () => {
    render(<MoneyText value={null} />);
    expect(screen.getByText("—")).toBeInTheDocument();
    expect(screen.queryByText("0")).not.toBeInTheDocument();
  });
});
