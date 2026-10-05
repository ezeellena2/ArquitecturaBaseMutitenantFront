import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import { OtpInput } from "./OtpInput";

describe("OtpInput", () => {
  // Tableros Ingreso y Registro (y sus M-*): seis casillas a todo el ancho, de 44, radio 8 y número de 22, también en el
  // teléfono. Las medidas del campo del teléfono (48, radio 12, letra de 16) no se cuelan en el código.
  it("en el ingreso, distribuye seis casillas en todo el ancho como en el lienzo, con nombre accesible", async () => {
    const { container } = render(<OtpInput variant="auth" length={6} value="" onChange={vi.fn()} label="Código" />);
    expect(screen.getByRole("group", { name: "Código" })).toHaveClass("grid", "grid-cols-6", "gap-2");
    expect(screen.getAllByRole("textbox")).toHaveLength(6);
    const box = screen.getByRole("textbox", { name: "Código 1" });
    expect(box).toHaveClass("h-11", "w-full", "rounded-[8px]", "border-[var(--borde2)]", "text-[22px]", "max-md:h-11", "max-md:rounded-[8px]", "max-md:text-[22px]");
    expect(box).not.toHaveClass("max-md:h-12", "max-md:rounded-[12px]", "max-md:text-[16px]");
    expect(box).toHaveAttribute("autocomplete", "one-time-code");
    expect(await axe(container, { rules: { region: { enabled: false } } })).toHaveNoViolations();
  });

  // «Criterio · Formularios» (Código) y Cuenta-Verificar: en un diálogo, casillas de 40 × 44 a la izquierda, con radio 8 y
  // número de 18. En la hoja del teléfono (M-Cuenta-Verificar), a todo el ancho, de 52, con radio 12 y número de 22.
  it("en un diálogo, casillas de 40 a la izquierda; en la hoja del teléfono, a todo el ancho", () => {
    render(<OtpInput length={6} value="" onChange={vi.fn()} label="Código" />);
    expect(screen.getByRole("group", { name: "Código" })).toHaveClass("flex", "gap-2", "max-md:grid", "max-md:grid-cols-6");
    const box = screen.getByRole("textbox", { name: "Código 1" });
    expect(box).toHaveClass("h-11", "w-10", "rounded-[8px]", "text-[18px]", "max-md:h-[52px]", "max-md:w-full", "max-md:rounded-[12px]", "max-md:text-[22px]");
    expect(box).not.toHaveClass("w-full", "max-md:h-12", "max-md:text-[16px]");
  });

  it("avanza al escribir, distribuye al pegar y vuelve con Backspace", async () => {
    const onChange = vi.fn();
    const { rerender } = render(<OtpInput length={6} value="" onChange={onChange} label="Código" />);
    const boxes = screen.getAllByRole("textbox");
    await userEvent.type(boxes[0], "4");
    expect(onChange).toHaveBeenLastCalledWith("4");
    expect(boxes[1]).toHaveFocus();

    rerender(<OtpInput length={6} value="" onChange={onChange} label="Código" />);
    boxes[0].focus();
    await userEvent.paste("482913");
    expect(onChange).toHaveBeenLastCalledWith("482913");

    rerender(<OtpInput length={6} value="48" onChange={onChange} label="Código" />);
    boxes[2].focus();
    await userEvent.keyboard("{Backspace}");
    expect(onChange).toHaveBeenLastCalledWith("4");
    expect(boxes[1]).toHaveFocus();
  });

  it("borra con Backspace una casilla llena, incluso la última", async () => {
    const onChange = vi.fn();
    render(<OtpInput length={6} value="482194" onChange={onChange} label="Código" />);
    const last = screen.getByRole("textbox", { name: "Código 6" });
    last.focus();
    await userEvent.keyboard("{Backspace}");
    expect(onChange).toHaveBeenLastCalledWith("48219");
  });

  it("acepta los seis dígitos del autocompletado en la primera casilla", () => {
    const onChange = vi.fn();
    render(<OtpInput length={6} value="" onChange={onChange} label="Código" />);
    const first = screen.getByRole("textbox", { name: "Código 1" });
    expect(first).toHaveAttribute("maxLength", "6");
    fireEvent.change(first, { target: { value: "482193" } });
    expect(onChange).toHaveBeenLastCalledWith("482193");
  });

  it("no genera espacios ni un código válido si se escribe primero en otra casilla", () => {
    const onChange = vi.fn();
    render(<OtpInput length={6} value="" onChange={onChange} label="Código" />);
    const third = screen.getByRole("textbox", { name: "Código 3" });
    fireEvent.change(third, { target: { value: "5" } });
    expect(onChange).toHaveBeenLastCalledWith("5");
    expect(screen.getByRole("textbox", { name: "Código 2" })).toHaveFocus();
  });

  // Cuenta-Verificar y M-Cuenta-Verificar (`.p-otp.mal`, `.ap-cod6.mal`): en un diálogo, el código incorrecto marca solo
  // el borde de cada casilla en rojo, sin fondo rosado.
  it("ignora letras y marca todas las casillas cuando el código falla: en un diálogo, solo el borde rojo", async () => {
    const onChange = vi.fn();
    const { rerender } = render(<OtpInput length={6} value="" onChange={onChange} label="Código" />);
    await userEvent.type(screen.getByRole("textbox", { name: "Código 1" }), "a");
    expect(onChange).not.toHaveBeenCalled();
    rerender(<OtpInput length={6} value="482915" onChange={onChange} label="Código" invalid />);
    for (const box of screen.getAllByRole("textbox")) {
      expect(box).toHaveAttribute("aria-invalid", "true");
      expect(box).toHaveClass("aria-invalid:border-[var(--peligro)]");
      expect(box.className).not.toMatch(/aria-invalid:bg-/);
    }
  });

  // Ingreso, Registro y Registro-Empresa, y sus M-* (`.otp.mal input`): en el ingreso y los registros, el borde rojo y el
  // fondo rosado.
  it("en el ingreso y los registros, el código incorrecto lleva el borde rojo y el fondo rosado", () => {
    render(<OtpInput length={6} value="482915" onChange={vi.fn()} label="Código" variant="auth" invalid />);
    for (const box of screen.getAllByRole("textbox")) {
      expect(box).toHaveClass("aria-invalid:border-[var(--peligro)]", "aria-invalid:bg-[var(--peligro-t)]");
    }
  });

  it("usa superficie apagada del tablero cuando un código queda bloqueado", () => {
    render(<OtpInput length={6} value="" onChange={vi.fn()} label="Código" disabled />);
    const first = screen.getByRole("textbox", { name: "Código 1" });
    expect(first).toBeDisabled();
    expect(first).toHaveClass("disabled:bg-[var(--s2)]", "disabled:opacity-100");
  });
});
