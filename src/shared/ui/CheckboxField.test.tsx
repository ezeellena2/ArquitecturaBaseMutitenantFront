import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import { AppChromeProvider } from "./app/AppChrome";
import { CheckboxField } from "./CheckboxField";
import { renderWithProviders } from "@/test/utils/renderWithProviders";

describe("CheckboxField", () => {
  it("names the checkbox with its label", () => {
    renderWithProviders(<CheckboxField label="Admin" checked={false} onCheckedChange={vi.fn()} />);

    expect(screen.getByRole("checkbox", { name: "Admin" })).not.toBeChecked();
  });

  it("reports the new value when it is clicked", async () => {
    const onCheckedChange = vi.fn();
    renderWithProviders(<CheckboxField label="Admin" checked={false} onCheckedChange={onCheckedChange} />);

    await userEvent.click(screen.getByRole("checkbox", { name: "Admin" }));

    expect(onCheckedChange).toHaveBeenCalledWith(true);
  });

  it("la casilla va encima de su etiqueta, que cubre la fila: el puntero da en ella, y tocar la etiqueta también la marca", async () => {
    const onCheckedChange = vi.fn();
    renderWithProviders(<CheckboxField label="Sin incluir a quien lo recibe" help="Nadie se elige a sí mismo." checked onCheckedChange={onCheckedChange} />);

    // jsdom no apila capas: se mira que la etiqueta cubra la fila y que la casilla tenga su capa encima (FRM-03 del E2E real).
    const label = screen.getByText("Sin incluir a quien lo recibe", { selector: "label" });
    expect(label).toHaveClass("after:absolute", "after:inset-0");
    expect(screen.getByRole("checkbox", { name: "Sin incluir a quien lo recibe" })).toHaveClass("relative", "z-[1]");
    await userEvent.click(label);
    expect(onCheckedChange).toHaveBeenCalledWith(false);
  });

  // 116: la ayuda va en la (i) al final de la etiqueta, sin línea debajo, y es la descripción de la casilla.
  it("describes the checkbox with the help of its (i), without a line below", () => {
    const { container } = renderWithProviders(
      <CheckboxField label="Admin" help="Puede hacer todo." checked onCheckedChange={vi.fn()} />,
    );

    expect(screen.getByRole("checkbox", { name: "Admin" })).toHaveAccessibleDescription("Puede hacer todo.");
    expect(screen.queryByText("Puede hacer todo.")).not.toBeVisible();
    expect(container.querySelector("[data-slot='info-tip']")).not.toBeNull();
  });

  it("shows the error under the box and marks the checkbox as invalid", () => {
    renderWithProviders(
      <CheckboxField
        label="Aceptó recibir mensajes"
        help="Sin esto, WhatsApp no permite escribirle primero."
        error="Confirmá que la persona aceptó recibir mensajes por WhatsApp."
        checked={false}
        onCheckedChange={vi.fn()}
      />,
    );

    const checkbox = screen.getByRole("checkbox", { name: "Aceptó recibir mensajes" });
    expect(screen.getByRole("alert")).toHaveTextContent("Confirmá que la persona aceptó recibir mensajes por WhatsApp.");
    expect(checkbox).toHaveAttribute("aria-invalid", "true");
    // La ayuda sigue: el error dice qué falta y la ayuda, por qué hace falta.
    expect(checkbox).toHaveAccessibleDescription(
      "Sin esto, WhatsApp no permite escribirle primero. Confirmá que la persona aceptó recibir mensajes por WhatsApp.",
    );
  });

  // 211: apagada con su motivo, sigue en el Tab con su nombre, «no disponible» y el motivo de descripción. Responde la fila
  // entera, el cuadradito y su texto: el clic, el toque, Enter o Espacio muestran el motivo arriba del cuadradito y no la
  // marcan, y lo cierran Escape o tocar afuera.
  describe("apagada con su motivo (211)", () => {
    const reason = "Lo incluye «Administrar usuarios».";
    const renderOff = (onCheckedChange = vi.fn(), chrome = false) => renderWithProviders(
      <AppChromeProvider value={{ phone: chrome, parent: null, subtitle: null, hideBottomNav: () => {} }}>
        <main><CheckboxField label="Ver usuarios" checked disabled disabledReason={reason} onCheckedChange={onCheckedChange} /></main>
      </AppChromeProvider>,
    );

    it("se alcanza con Tab, dice que no está disponible y su motivo, y pasa axe", async () => {
      const { container } = renderOff();
      const checkbox = screen.getByRole("checkbox", { name: "Ver usuarios" });

      expect(checkbox).toHaveAttribute("aria-disabled", "true");
      expect(checkbox).not.toBeDisabled();
      expect(checkbox).toBeChecked();
      expect(checkbox).toHaveAccessibleDescription(reason);
      expect(screen.queryByText(reason)).not.toBeVisible();
      await userEvent.tab();
      expect(checkbox).toHaveFocus();
      expect(await screen.findByRole("tooltip")).toHaveTextContent(reason);
      expect(await axe(container)).toHaveNoViolations();
    });

    it("el clic en el cuadradito o en su texto muestra el motivo y no la marca", async () => {
      const onCheckedChange = vi.fn();
      renderOff(onCheckedChange);
      const checkbox = screen.getByRole("checkbox", { name: "Ver usuarios" });

      await userEvent.click(screen.getByText("Ver usuarios"));
      expect(await screen.findByRole("tooltip")).toHaveTextContent(reason);
      await userEvent.keyboard("{Escape}");
      expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
      await userEvent.click(checkbox);
      expect(await screen.findByRole("tooltip")).toHaveTextContent(reason);
      expect(onCheckedChange).not.toHaveBeenCalled();
      expect(checkbox).toBeChecked();
    });

    it("Enter o Espacio muestran el motivo y no la marcan", async () => {
      const onCheckedChange = vi.fn();
      renderOff(onCheckedChange);
      const checkbox = screen.getByRole("checkbox", { name: "Ver usuarios" });

      await userEvent.tab();
      await userEvent.keyboard("{Escape}");
      expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
      await userEvent.keyboard("{Enter}");
      expect(await screen.findByRole("tooltip")).toHaveTextContent(reason);
      await userEvent.keyboard("{Escape}");
      await userEvent.keyboard(" ");
      expect(await screen.findByRole("tooltip")).toHaveTextContent(reason);
      expect(onCheckedChange).not.toHaveBeenCalled();
      expect(checkbox).toBeChecked();
    });

    it("en el teléfono, tocar la fila abre el motivo sobre el cuadradito y tocar afuera lo cierra", async () => {
      const onCheckedChange = vi.fn();
      renderOff(onCheckedChange, true);

      await userEvent.pointer({ keys: "[TouchA]", target: screen.getByText("Ver usuarios") });
      expect(await screen.findByRole("tooltip")).toHaveTextContent(reason);
      await userEvent.pointer({ keys: "[TouchA]", target: document.body });
      expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
      expect(onCheckedChange).not.toHaveBeenCalled();
    });

    it("sin motivo, apagada sigue fuera del Tab", async () => {
      renderWithProviders(<CheckboxField label="Ver usuarios" checked disabled onCheckedChange={vi.fn()} />);

      expect(screen.getByRole("checkbox", { name: "Ver usuarios" })).toBeDisabled();
      await userEvent.tab();
      expect(document.body).toHaveFocus();
    });
  });
});
