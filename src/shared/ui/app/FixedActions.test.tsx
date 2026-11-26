import { render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { Button } from "@/shared/ui/button";
import { FixedActions } from "./FixedActions";

// La galería a 320 (base de la 12, segunda parte): «Descartar cambios» se salía de su botón de unos 138 px. El texto de un
// botón de la barra fija puede bajar de renglón; el alto de 50 no cambia.
it("los botones de la barra fija dejan bajar de renglón un texto largo, sin cambiar su alto", () => {
  render(<FixedActions><Button variant="outline">{"Descartar cambios"}</Button><Button>{"Guardar cambios"}</Button></FixedActions>);
  const bar = screen.getByRole("button", { name: "Descartar cambios" }).parentElement!;
  expect(bar).toHaveAttribute("data-slot", "fixed-actions");
  expect(bar.className).toContain("[&>*]:whitespace-normal");
  expect(bar.className).toContain("[&>*]:h-12.5");
});
