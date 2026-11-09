import { act, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { RadioGroupField } from "./RadioGroupField";
import { renderWithProviders } from "@/test/utils/renderWithProviders";

const options = [
  { value: "Email", label: "Por correo", description: "Cargá un correo para usar esta opción.", disabled: true },
  { value: "WhatsApp", label: "Por WhatsApp" },
];

describe("RadioGroupField", () => {
  it("segmentado usa flechas, salta opciones deshabilitadas y no envía el formulario", async () => {
    const submit = vi.fn((event) => event.preventDefault());
    function Segmented() {
      const [value, setValue] = useState("first");
      return <form onSubmit={submit}><RadioGroupField variant="segmented" label="Elección" value={value} onValueChange={setValue}
        options={[{ value: "first", label: "Primera" }, { value: "second", label: "Segunda", disabled: true }, { value: "third", label: "Tercera" }]} /></form>;
    }
    renderWithProviders(<Segmented />);
    const user = userEvent.setup();
    act(() => screen.getByRole("radio", { name: "Primera" }).focus()); await user.keyboard("{ArrowRight>}");
    await waitFor(() => expect(screen.getByRole("radio", { name: "Tercera" })).toBeChecked()); await user.keyboard("{/ArrowRight}"); expect(screen.getByRole("radio", { name: "Tercera" })).toHaveFocus();
    expect(screen.getByRole("radio", { name: "Segunda" })).toBeDisabled(); expect(submit).not.toHaveBeenCalled();
  });
  // «Criterio · Formularios», «Lo elegido, sin dudas» (142): el segmentado de un formulario rellena la elegida con la
  // marca y la letra blanca, en una vía blanca con su borde; en el teléfono, cada opción mide 44 × 44.
  it("segmentado: la elegida, rellena con la marca; las otras, blancas; 44 × 44 en el teléfono", () => {
    renderWithProviders(<RadioGroupField variant="segmented" label="¿Llegó en buen estado?" value="yes" onValueChange={vi.fn()}
      options={[{ value: "yes", label: "Sí" }, { value: "no", label: "No" }]} />);

    expect(screen.getByRole("radiogroup", { name: "¿Llegó en buen estado?" })).toHaveClass("bg-[var(--superficie)]", "border-[var(--borde2)]");
    for (const option of screen.getAllByRole("radio")) {
      expect(option).toHaveClass("data-[state=checked]:bg-[var(--marca)]", "data-[state=checked]:text-[var(--superficie)]", "max-md:min-h-11", "max-md:min-w-11");
      expect(option).not.toHaveClass("truncate", "whitespace-nowrap");
    }
    expect(screen.getByRole("radio", { name: "Sí" })).toHaveAttribute("data-state", "checked");
  });

  // «Tarjetas de opción» (.r311-cards2): la elegida suma un borde de 2 px y el tinte de la marca, además del punto, sin
  // moverse: el relleno baja 1 cuando el borde sube 1. Tocar la tarjeta en cualquier lado la elige.
  it("tarjetas: la elegida suma un borde de 2 px y el tinte, sin moverse, y se elige tocándola", async () => {
    const onValueChange = vi.fn();
    const { container } = renderWithProviders(<RadioGroupField label="De dónde salen las opciones" value="manual" onValueChange={onValueChange}
      options={[{ value: "manual", label: "Escritas a mano" }, { value: "members", label: "De los miembros" }]} />);

    const [chosen, other] = container.querySelectorAll("[data-slot='option-card']");
    expect(chosen).toHaveAttribute("data-state", "checked");
    expect(chosen).toHaveClass("border-2", "border-[var(--marca)]", "bg-[var(--marca-t)]", "px-2.75", "py-2.25");
    expect(other).toHaveClass("border", "border-[var(--borde)]", "bg-[var(--superficie)]", "px-3", "py-2.5");
    expect(screen.getByRole("radio", { name: "Escritas a mano" })).toHaveClass("data-[state=checked]:border-[var(--marca)]");
    expect(screen.getByText("De los miembros")).toHaveClass("after:absolute", "after:inset-0");

    await userEvent.click(screen.getByText("De los miembros"));
    expect(onValueChange).toHaveBeenCalledWith("members");
  });

  it("names the group and each option with its label", () => {
    renderWithProviders(<RadioGroupField label="Por dónde" options={options} value="WhatsApp" onValueChange={vi.fn()} />);

    expect(screen.getByRole("radiogroup", { name: "Por dónde" })).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "Por WhatsApp" })).toBeChecked();
    expect(screen.getByRole("radio", { name: "Por correo" })).not.toBeChecked();
  });

  it("disables an option and says why with its help line", () => {
    renderWithProviders(<RadioGroupField label="Por dónde" options={options} value="WhatsApp" onValueChange={vi.fn()} />);

    const email = screen.getByRole("radio", { name: "Por correo" });
    expect(email).toBeDisabled();
    expect(email).toHaveAccessibleDescription("Cargá un correo para usar esta opción.");
  });

  it("reports the option that is picked", async () => {
    const onValueChange = vi.fn();
    renderWithProviders(
      <RadioGroupField
        label="Por dónde"
        options={[
          { value: "Email", label: "Por correo" },
          { value: "WhatsApp", label: "Por WhatsApp" },
        ]}
        value="Email"
        onValueChange={onValueChange}
      />,
    );

    await userEvent.click(screen.getByRole("radio", { name: "Por WhatsApp" }));

    expect(onValueChange).toHaveBeenCalledWith("WhatsApp");
  });

  it("shows the error under the options and ties it to the group", () => {
    renderWithProviders(
      <RadioGroupField
        label="Por dónde"
        options={options}
        value={undefined}
        onValueChange={vi.fn()}
        error="Elegí por dónde mandarla."
      />,
    );

    expect(screen.getByRole("alert")).toHaveTextContent("Elegí por dónde mandarla.");
    expect(screen.getByRole("radiogroup", { name: "Por dónde" })).toHaveAccessibleDescription("Elegí por dónde mandarla.");
  });
});
