import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { StatusBadge } from "./StatusBadge";

const getStatusTone = vi.hoisted(() => vi.fn((_name: string, value: string) => value));
vi.mock("@/shared/format/statusTones", () => ({ getStatusTone }));
vi.mock("@/shared/format/useFormat", () => ({
  useFormat: () => ({ isLoading: false, formatEnum: (_name: string, value: string) => "Estado " + value, formatEmpty: () => "—" }),
}));

describe("StatusBadge", () => {
  it.each([
    ["success", "--ok"],
    ["warning", "--alerta"],
    ["danger", "--peligro"],
    ["neutral", "--t2"],
    ["pending", "--marca-tx"],
  ])("traduce el estado y usa el punto del tono %s sin badge", (tone, dot) => {
    render(<StatusBadge enum="TestStatus" value={tone} />);
    expect(getStatusTone).toHaveBeenCalledWith("TestStatus", tone);
    const state = screen.getByText("Estado " + tone);
    const statusDot = state?.querySelector('[data-slot="status-dot"]');
    expect(state).toHaveClass("inline-flex", "text-[13px]");
    expect(state).not.toHaveClass("rounded-full");
    expect(statusDot).toHaveClass("size-2", "bg-[var(" + dot + ")]");
    expect(statusDot).toHaveAttribute("aria-hidden", "true");
  });
});
