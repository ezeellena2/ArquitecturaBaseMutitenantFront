import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
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
});
