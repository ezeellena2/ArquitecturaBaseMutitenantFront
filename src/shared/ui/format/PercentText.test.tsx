import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { PercentText } from "./PercentText";

const formatPercent = vi.hoisted(() => vi.fn((fraction: number) => fraction === 0.125 ? "12,5 %" : "0 %"));
vi.mock("@/shared/format/useFormat", () => ({
  useFormat: () => ({ formatPercent, formatEmpty: () => "—" }),
}));

describe("PercentText", () => {
  it("envía la fracción al formateador y alinea el porcentaje", () => {
    render(<PercentText value={0.125} />);
    expect(formatPercent).toHaveBeenCalledWith(0.125);
    expect(screen.getByText("12,5 %")).toHaveClass("text-right", "tabular-nums");
  });
});
