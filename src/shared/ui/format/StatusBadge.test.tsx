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
    // Tablero M-Usuarios (.w-est): el punto lleva su propio tono, más claro que el texto.
    ["success", "--punto-ok"],
    ["warning", "--punto-alerta"],
    ["danger", "--peligro"],
    ["neutral", "--punto-apagado"],
    ["pending", "--marca"],
  ])("traduce el estado y usa el punto del tono %s sin badge", (tone, dot) => {
    render(<StatusBadge enum="TestStatus" value={tone} />);
    expect(getStatusTone).toHaveBeenCalledWith("TestStatus", tone);
    const state = screen.getByText("Estado " + tone).parentElement!;
    const statusDot = state?.querySelector('[data-slot="status-dot"]');
    expect(state).toHaveClass("inline-flex", "text-[13px]");
    expect(state).not.toHaveClass("rounded-full");
    expect(statusDot).toHaveClass("size-2", "bg-[var(" + dot + ")]");
    expect(statusDot).toHaveAttribute("aria-hidden", "true");
  });
});
