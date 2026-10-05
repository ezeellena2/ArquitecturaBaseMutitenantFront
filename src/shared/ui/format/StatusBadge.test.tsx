import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { StatusTone, StatusTones } from "@/shared/format/statusTones";
import { StatusBadge, StatusMark } from "./StatusBadge";

vi.mock("@/shared/format/useFormat", () => ({
  useFormat: () => ({ isLoading: false, formatEnum: (name: string, value: string) => `${name} ${value}`, formatEmpty: () => "—" }),
}));

// Un enum de prueba con un valor por tono: cada feature registra los suyos con `defineStatusTones`.
const tones: StatusTones<StatusTone> = {
  enum: "TestStatus",
  tones: { success: "success", warning: "warning", danger: "danger", neutral: "neutral", pending: "pending" },
};

describe("StatusBadge", () => {
  it.each([
    // Tablero M-Usuarios (.w-est): el punto lleva su propio tono, más claro que el texto.
    ["success", "--punto-ok"],
    ["warning", "--punto-alerta"],
    ["danger", "--peligro"],
    ["neutral", "--punto-apagado"],
    ["pending", "--marca"],
  ] as const)("traduce el estado con su enum y pinta el punto del tono %s, sin badge", (tone, dot) => {
    render(<StatusBadge tones={tones} value={tone} />);
    const state = screen.getByText("TestStatus " + tone).parentElement!;
    const statusDot = state.querySelector('[data-slot="status-dot"]');
    expect(state).toHaveClass("inline-flex", "text-[13px]");
    expect(state).not.toHaveClass("rounded-full");
    expect(statusDot).toHaveClass("size-2", "bg-[var(" + dot + ")]");
    expect(statusDot).toHaveAttribute("aria-hidden", "true");
  });

  it("sin estado muestra el vacío, no un punto", () => {
    render(<StatusBadge tones={tones} value={null} />);
    expect(screen.getByText("—")).toBeVisible();
    expect(document.querySelector('[data-slot="status-dot"]')).toBeNull();
  });

  // Tableros Pagina-Org y M-Configuracion: cuando la palabra va dentro de otro texto con su letra, va solo el punto, con
  // el tono que registró la feature.
  it("StatusMark pinta solo el punto del tono registrado, sin la palabra", () => {
    const { container } = render(<StatusMark tones={tones} value="danger" className="max-md:mr-1.5" />);
    const statusDot = container.querySelector('[data-slot="status-dot"]');
    expect(statusDot).toHaveClass("size-2", "rounded-full", "bg-[var(--peligro)]", "max-md:mr-1.5");
    expect(statusDot).toHaveAttribute("aria-hidden", "true");
    expect(container).toHaveTextContent("");
  });
});
