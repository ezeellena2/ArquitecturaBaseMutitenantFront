import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { EmailText } from "./EmailText";

// Los tableros parten un correo largo después de la @ («martin.sosa@ / arquitecturabase.ejemplo.com»), no en cualquier
// letra; si el dominio solo tampoco entra (a 320), antes de uno de sus puntos. El correo se lee entero.
describe("EmailText", () => {
  it("deja un corte posible después de la @ y antes de cada punto del dominio, y se lee entero", () => {
    const { container } = render(<p><EmailText value="martin.sosa@arquitecturabase.ejemplo.com" /></p>);

    expect(container.querySelector("p")?.innerHTML).toBe("martin.sosa@<wbr>arquitecturabase<wbr>.ejemplo<wbr>.com");
    expect(container).toHaveTextContent("martin.sosa@arquitecturabase.ejemplo.com");
  });

  it("un texto sin @ va tal cual", () => {
    const { container } = render(<p><EmailText value="Lucía Fernández" /></p>);

    expect(container.querySelector("p")?.innerHTML).toBe("Lucía Fernández");
  });
});
