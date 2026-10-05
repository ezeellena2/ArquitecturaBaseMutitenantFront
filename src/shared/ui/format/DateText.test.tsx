import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { DateText } from "./DateText";

vi.mock("@/shared/format/useFormat", () => ({
  useFormat: () => ({
    formatDate: () => "27/09/2026",
    formatDateTime: () => "27/09/2026 12:00",
    formatShortDate: () => "27/09",
    formatShortDateTime: () => "27/09 12:00",
    formatTime: () => "12:00",
    formatDateLong: () => "27 de septiembre de 2026",
    formatRelative: () => "hace 5 minutos",
    formatEmpty: () => "—",
  }),
}));

describe("DateText", () => {
  it("usa time con el instante ISO y muestra la fecha/hora absoluta como tooltip", () => {
    render(<DateText value="2026-09-27T15:00:00Z" kind="relative" />);
    const time = screen.getByText("hace 5 minutos");
    expect(time.tagName).toBe("TIME");
    expect(time).toHaveAttribute("datetime", "2026-09-27T15:00:00Z");
    expect(time).toHaveAttribute("title", "27/09/2026 12:00");
  });

  it("conserva DateOnly sin convertirlo a instante y muestra el vacío", () => {
    const { rerender } = render(<DateText value="2026-09-27" />);
    expect(screen.getByText("27/09/2026")).toHaveAttribute("datetime", "2026-09-27");
    rerender(<DateText value={null} />);
    expect(screen.getByText("—")).toBeInTheDocument();
  });

  // Lienzo v99 («Fecha corta»): las listas del teléfono la piden; la fecha completa queda en el tooltip.
  it("muestra la fecha corta, con la fecha y hora completas como tooltip", () => {
    const { rerender } = render(<DateText value="2026-09-27T15:00:00Z" kind="shortDate" />);
    expect(screen.getByText("27/09")).toHaveAttribute("title", "27/09/2026 12:00");
    rerender(<DateText value="2026-09-27T15:00:00Z" kind="shortDateTime" />);
    expect(screen.getByText("27/09 12:00")).toHaveAttribute("title", "27/09/2026 12:00");
  });
});
