import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { FormField } from "./FormField";
import { Input } from "./input";

describe("FormField", () => {
  it("links the label with the control", () => {
    render(
      <FormField label="Email" htmlFor="email">
        <Input id="email" />
      </FormField>,
    );

    expect(screen.getByLabelText("Email")).toBeInTheDocument();
  });

  it("shows the error and marks the control as invalid", () => {
    render(
      <FormField label="Email" htmlFor="email" error="Ingresá un correo válido.">
        <Input id="email" />
      </FormField>,
    );

    const input = screen.getByLabelText("Email");
    expect(screen.getByRole("alert")).toHaveTextContent("Ingresá un correo válido.");
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAccessibleDescription("Ingresá un correo válido.");
  });

  it("shows the hint when there is no error", () => {
    render(
      <FormField label="Código" htmlFor="code" hint="Te lo mandamos por email.">
        <Input id="code" />
      </FormField>,
    );

    expect(screen.getByLabelText("Código")).toHaveAccessibleDescription("Te lo mandamos por email.");
  });

  it("announces a required field and uses the compact field label style", () => {
    render(
      <FormField label="Nombre" required>
        <Input />
      </FormField>,
    );

    const input = screen.getByLabelText("Nombre *");
    expect(input).toHaveAttribute("aria-required", "true");
    expect(input).toHaveClass("h-9", "text-[13px]", "rounded-[8px]");
    expect(input).not.toHaveClass("lg:h-11", "lg:text-[15px]");
    expect(screen.getByText("Nombre")).toHaveClass("text-[12px]", "lg:text-[13px]", "font-semibold", "text-[var(--t2)]");
  });

  // Tablero «Criterio · Formularios»: si el dato es obligatorio, el rótulo lleva un asterisco rojo.
  it("pone el asterisco de obligatorio en rojo", () => {
    render(<FormField label="Nombre" required><Input /></FormField>);

    expect(screen.getByText("*")).toHaveClass("text-[var(--peligro)]");
  });

  // Tablero Usuario: «Todos» va a la derecha del rótulo, en la misma línea.
  it("deja un lugar a la derecha del rótulo", () => {
    render(<FormField label="Roles de la organización" aside={<button type="button">{"Todos"}</button>}><Input /></FormField>);

    const label = screen.getByText("Roles de la organización");
    expect(label.parentElement).toHaveClass("flex", "justify-between");
    expect(label.parentElement).toContainElement(screen.getByRole("button", { name: "Todos" }));
    expect(screen.getByLabelText("Roles de la organización")).toBeInTheDocument();
  });

  it("usa la etiqueta compacta y gris del lienzo en ingreso y registro", () => {
    render(
      <FormField label="Correo electrónico" variant="auth">
        <Input />
      </FormField>,
    );

    expect(screen.getByText("Correo electrónico")).toHaveClass("text-[12px]", "font-semibold", "text-[var(--t2)]");
    expect(screen.getByLabelText("Correo electrónico")).toHaveClass("h-11", "rounded-[10px]", "text-[15px]");
  });
});
