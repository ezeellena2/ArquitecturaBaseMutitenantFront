import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { configureI18n } from "@/shared/i18n";
import { ImportantNotice } from "./ImportantNotice";
import { InfoButton } from "./InfoButton";

beforeAll(async () => {
  await configureI18n([{ code: "es-AR", languageCode: "es", fallbackCulture: null, isEnabled: true, isDefault: true }]);
});

// Tablero «Criterio · Dialogos», Aviso importante: 420 px, se abre desde un ⓘ; el título dice qué pasa, el motivo va
// en una caja roja suave, debajo «Qué podés hacer» en pasos numerados y un solo botón, «Entendido».
describe("ImportantNotice · Criterio · Dialogos", () => {
  it("muestra el motivo, los pasos numerados y solo «Entendido»", async () => {
    const onOpenChange = vi.fn();
    render(<ImportantNotice open onOpenChange={onOpenChange} title="Página despublicada" reason="Datos de contacto falsos"
      detail="Despublicada por la plataforma el 26/09/2026" steps={["Corregí los datos de la página", "Pedí a la plataforma que la habilite"]} />);

    const dialog = screen.getByRole("dialog", { name: "Página despublicada" });
    expect(dialog).toHaveClass("md:max-w-[420px]");
    expect(within(dialog).getByText("Datos de contacto falsos").closest("[data-slot='notice-reason']")).toHaveClass("bg-[var(--peligro-t)]");
    expect(within(dialog).getByText("Despublicada por la plataforma el 26/09/2026")).toBeVisible();
    expect(within(dialog).getByText("Qué podés hacer")).toBeVisible();
    expect(within(dialog).getAllByRole("listitem").map((step) => step.textContent)).toEqual([
      "1Corregí los datos de la página", "2Pedí a la plataforma que la habilite",
    ]);
    expect(within(dialog).queryByRole("button", { name: "Cancelar" })).not.toBeInTheDocument();
    await userEvent.click(within(dialog).getByRole("button", { name: "Entendido" }));
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});

describe("InfoButton", () => {
  it("es un ⓘ redondo con nombre para el lector de pantalla", async () => {
    const onClick = vi.fn();
    render(<InfoButton label="Por qué no podés darte de baja" onClick={onClick} />);

    const button = screen.getByRole("button", { name: "Por qué no podés darte de baja" });
    expect(button).toHaveClass("size-6", "rounded-full", "text-[var(--peligro)]");
    expect(button).toHaveAttribute("title", "Por qué no podés darte de baja");
    await userEvent.click(button);
    expect(onClick).toHaveBeenCalledOnce();
  });
});
