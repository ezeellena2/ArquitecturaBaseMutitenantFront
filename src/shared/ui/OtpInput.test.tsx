import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import { OtpInput } from "./OtpInput";

describe("OtpInput", () => {
  it("distribuye seis casillas en todo el ancho como en el lienzo, con nombre accesible", async () => {
    const { container } = render(<OtpInput length={6} value="" onChange={vi.fn()} label="Código" />);
    expect(screen.getByRole("group", { name: "Código" })).toHaveClass("grid-cols-6");
    expect(screen.getAllByRole("textbox")).toHaveLength(6);
    expect(screen.getByRole("textbox", { name: "Código 1" })).toHaveClass("h-[52px]", "w-full");
    expect(screen.getByRole("textbox", { name: "Código 1" })).toHaveAttribute("autocomplete", "one-time-code");
    expect(await axe(container, { rules: { region: { enabled: false } } })).toHaveNoViolations();
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

  it("ignora letras y marca todas las casillas cuando el código falla", async () => {
    const onChange = vi.fn();
    const { rerender } = render(<OtpInput length={6} value="" onChange={onChange} label="Código" />);
    await userEvent.type(screen.getByRole("textbox", { name: "Código 1" }), "a");
    expect(onChange).not.toHaveBeenCalled();
    rerender(<OtpInput length={6} value="482915" onChange={onChange} label="Código" invalid />);
    for (const box of screen.getAllByRole("textbox")) expect(box).toHaveAttribute("aria-invalid", "true");
  });

  it("usa superficie apagada del tablero cuando un código queda bloqueado", () => {
    render(<OtpInput length={6} value="" onChange={vi.fn()} label="Código" disabled />);
    const first = screen.getByRole("textbox", { name: "Código 1" });
    expect(first).toBeDisabled();
    expect(first).toHaveClass("disabled:bg-[var(--s2)]", "disabled:opacity-100");
  });
});
