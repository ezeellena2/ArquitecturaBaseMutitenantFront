import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { EnumText } from "./EnumText";
import { BooleanText } from "./BooleanText";

const formatEnum = vi.hoisted(() => vi.fn(() => "Activo"));
const formatBoolean = vi.hoisted(() => vi.fn((value: boolean) => value ? "Sí" : "No"));
vi.mock("@/shared/format/useFormat", () => ({
  useFormat: () => ({ isLoading: false, formatEnum, formatBoolean, formatEmpty: () => "—" }),
}));

describe("EnumText y BooleanText", () => {
  it("traduce un enum con su namespace y valor", () => {
    render(<EnumText enum="TestStatus" value="Active" />);
    expect(formatEnum).toHaveBeenCalledWith("TestStatus", "Active");
    expect(screen.getByText("Activo")).toBeInTheDocument();
  });

  it("muestra booleanos traducidos y distingue false de null", () => {
    const { rerender } = render(<BooleanText value={false} />);
    expect(formatBoolean).toHaveBeenCalledWith(false);
    expect(screen.getByText("No")).toBeInTheDocument();
    rerender(<BooleanText value={true} />);
    expect(screen.getByText("Sí")).toBeInTheDocument();
  });
});
