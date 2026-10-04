import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { FormField } from "./FormField";
import { Input } from "./input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select";

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
    // «Criterio · Formularios» y tableros Cuenta, Configuración, Rol y Usuario: el rótulo de 12,5 en la compu, a 6 del
    // campo, y el mensaje debajo también de 12,5.
    expect(screen.getByText("Nombre")).toHaveClass("text-[12.5px]", "font-semibold", "text-[var(--t2)]");
    expect(screen.getByText("Nombre")).not.toHaveClass("lg:text-[13px]", "text-[12px]");
    expect(screen.getByText("Nombre").parentElement).toHaveClass("gap-1.5");
    expect(screen.getByText("Nombre").parentElement).not.toHaveClass("lg:gap-2");
  });

  it("escribe el error del campo en 12,5", () => {
    render(<FormField label="Correo" error="Revisá el correo."><Input /></FormField>);

    expect(screen.getByRole("alert")).toHaveClass("text-[12.5px]", "text-[var(--peligro)]");
  });

  // Tableros M-* (.ap-cmp): en el teléfono el campo mide 48, con radio 12 y letra de 16, y el rótulo es de 13,5.
  it("en el teléfono usa campos de 48 y rótulos de 13,5", () => {
    render(<FormField label="Correo"><Input /></FormField>);

    expect(screen.getByLabelText("Correo")).toHaveClass("max-md:h-12", "max-md:rounded-[12px]", "max-md:text-[16px]");
    expect(screen.getByText("Correo")).toHaveClass("max-md:text-[13.5px]");
  });

  // Tablero «Criterio · Formularios»: si el dato es obligatorio, el rótulo lleva un asterisco rojo.
  it("pone el asterisco de obligatorio en rojo", () => {
    render(<FormField label="Nombre" required><Input /></FormField>);

    expect(screen.getByText("*")).toHaveClass("text-[var(--peligro)]");
    // Pegado al rótulo, como en el tablero: no con la separación de 8 que el rótulo usa para una casilla.
    expect(screen.getByText("*").parentElement).toHaveClass("gap-1!");
  });

  // Tablero Usuario: «Todos» va a la derecha del rótulo, en la misma línea.
  it("deja un lugar a la derecha del rótulo", () => {
    render(<FormField label="Roles de la organización" aside={<button type="button">{"Todos"}</button>}><Input /></FormField>);

    const label = screen.getByText("Roles de la organización");
    expect(label.parentElement).toHaveClass("flex", "justify-between");
    expect(label.parentElement).toContainElement(screen.getByRole("button", { name: "Todos" }));
    expect(screen.getByLabelText("Roles de la organización")).toBeInTheDocument();
  });

  // accesibilidad.md: un desplegable se rotula, dice que es obligatorio y lleva su error como cualquier campo. El Select
  // de Radix no es un elemento: lo que FormField le pasa llega a su botón.
  it("con un Select adentro, el desplegable sabe que es obligatorio, se rotula y lleva su error", () => {
    render(
      <FormField label="Empresa" required error="Elegí una empresa.">
        <Select value="" onValueChange={() => {}}>
          <SelectTrigger className="w-full"><SelectValue placeholder="Elegí una empresa" /></SelectTrigger>
          <SelectContent><SelectItem value="company-1">{"Delta S.A."}</SelectItem></SelectContent>
        </Select>
      </FormField>,
    );

    const select = screen.getByRole("combobox", { name: "Empresa" });
    expect(select).toHaveAttribute("aria-required", "true");
    expect(select).toHaveAttribute("aria-invalid", "true");
    expect(select).toHaveAccessibleDescription("Elegí una empresa.");
  });

  it("usa la etiqueta compacta y gris del lienzo en ingreso y registro", () => {
    render(
      <FormField label="Correo electrónico" variant="auth">
        <Input />
      </FormField>,
    );

    // Tableros Ingreso, Registro y sus M-*: rótulo de 12,5, a 6 del campo en la compu y en el teléfono.
    expect(screen.getByText("Correo electrónico")).toHaveClass("text-[12.5px]", "font-semibold", "text-[var(--t2)]");
    expect(screen.getByText("Correo electrónico").parentElement).toHaveClass("gap-1.5");
    expect(screen.getByText("Correo electrónico").parentElement).not.toHaveClass("lg:gap-2");
    expect(screen.getByLabelText("Correo electrónico")).toHaveClass("h-11", "rounded-[10px]", "text-[15px]");
  });
});
