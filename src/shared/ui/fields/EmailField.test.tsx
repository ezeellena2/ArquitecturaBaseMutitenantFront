import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it } from "vitest";
import { FormField } from "../FormField";
import { EmailField } from "./EmailField";

function renderField() {
  function Harness() {
    const [value, setValue] = useState<string | null>(null);
    return (
      <>
        <FormField label="Correo" hint="Para avisos de la cuenta">
          <EmailField value={value} onChange={setValue} name="email" />
        </FormField>
        <output>{value ?? "vacío"}</output>
      </>
    );
  }
  return render(<Harness />);
}

describe("EmailField", () => {
  it("normaliza trim y minúsculas mientras se escribe y emite null al vaciar", () => {
    renderField();
    const input = screen.getByRole("textbox", { name: "Correo" });
    expect(input).toHaveAttribute("type", "email");
    expect(input).toHaveAttribute("autocomplete", "email");
    expect(input).toHaveAccessibleDescription("Para avisos de la cuenta");

    fireEvent.change(input, { target: { value: "  Juan.PEREZ@Ejemplo.COM  " } });
    expect(input).toHaveValue("juan.perez@ejemplo.com");
    expect(screen.getByRole("status")).toHaveTextContent("juan.perez@ejemplo.com");

    fireEvent.change(input, { target: { value: "   " } });
    expect(input).toHaveValue("");
    expect(screen.getByRole("status")).toHaveTextContent("vacío");
  });
});
