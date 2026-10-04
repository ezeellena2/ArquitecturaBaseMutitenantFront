import { render, screen } from "@testing-library/react";
import { Mail } from "lucide-react";
import { describe, expect, it } from "vitest";
import { List, ListItem } from "./List";

// Tablero «Criterio · Tablas», Lista: lo corto dentro de una pantalla, sin encabezado de columnas. Filas de 44, o
// de 56 con segunda línea; lo que aclara la fila, en gris de 12 debajo; el ícono, gris.
describe("List · Criterio · Tablas", () => {
  it("filas de 44, o de 56 con segunda línea, con el ícono gris y lo que aclara la fila debajo", () => {
    render(<List label="Cómo entrás">
      <ListItem icon={<Mail />} title="lucia.fer@gmail.com" detail="Principal" />
      <ListItem title="delta.ejemplo.com"><button type="button">{"Verificar"}</button></ListItem>
    </List>);

    expect(screen.getByRole("list", { name: "Cómo entrás" })).toHaveClass("list-none");
    const [first, second] = screen.getAllByRole("listitem");
    expect(first).toHaveClass("min-h-14", "border-b", "border-[var(--borde)]", "last:border-b-0", "pl-4", "text-[13px]");
    expect(first).not.toHaveClass("odd:bg-[var(--fila-alterna)]");
    expect(second).toHaveClass("min-h-11");
    expect(screen.getByText("lucia.fer@gmail.com")).toHaveClass("truncate", "text-[var(--t1)]");
    expect(screen.getByText("Principal")).toHaveClass("text-[12px]", "text-[var(--t3)]");
    expect(first.querySelector("svg")?.parentElement).toHaveClass("text-[var(--t3)]");
    expect(screen.getByRole("button", { name: "Verificar" })).toBeVisible();
  });
});
