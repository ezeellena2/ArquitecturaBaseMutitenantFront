import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { StatusBadge } from "./StatusBadge";

const getStatusTone = vi.hoisted(() => vi.fn((_name: string, value: string) => value));
vi.mock("@/shared/format/statusTones", () => ({ getStatusTone }));
vi.mock("@/shared/format/useFormat", () => ({
  useFormat: () => ({ isLoading: false, formatEnum: (_name: string, value: string) => `Estado ${value}`, formatEmpty: () => "—" }),
}));

describe("StatusBadge", () => {
  it.each([
    ["success", "--ok", "--ok-t"],
    ["warning", "--alerta", "--alerta-t"],
    ["danger", "--peligro", "--peligro-t"],
    ["neutral", "--t2", "--s3"],
    ["pending", "--marca-tx", "--marca-t"],
  ])("traduce el estado y usa los tokens del tono %s", (tone, ink, background) => {
    render(<StatusBadge enum="TestStatus" value={tone} />);
    expect(getStatusTone).toHaveBeenCalledWith("TestStatus", tone);
    const badge = screen.getByText(`Estado ${tone}`);
    expect(badge.className).toContain(`text-[var(${ink})]`);
    expect(badge.className).toContain(`bg-[var(${background})]`);
    expect(badge.querySelector('[data-slot="status-dot"]')).toHaveAttribute("aria-hidden", "true");
  });
});
