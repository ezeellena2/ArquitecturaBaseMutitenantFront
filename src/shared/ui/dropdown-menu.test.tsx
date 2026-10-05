import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./dropdown-menu";

// Tablero «Criterio · Menús»: opción de 36 con letra de 13 e ícono gris, ancho de 220 a 320, una línea fina entre
// opciones y una franja antes de las de peligro.
describe("DropdownMenu · Criterio · Menús", () => {
  it("lleva una línea fina entre opciones y una franja antes de las de peligro", () => {
    render(
      <DropdownMenu open>
        <DropdownMenuTrigger aria-label="Más acciones">{"⋮"}</DropdownMenuTrigger>
        <DropdownMenuContent aria-label="Acciones">
          <DropdownMenuItem>{"Editar"}</DropdownMenuItem>
          <DropdownMenuItem>{"Reenviar invitación"}</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive">{"Eliminar"}</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>,
    );

    const menu = screen.getByRole("menu", { name: "Más acciones" });
    const edit = screen.getByRole("menuitem", { name: "Editar" });

    expect(menu).toHaveClass("min-w-[220px]", "max-w-[320px]", "rounded-[10px]", "p-0");
    // .menu de los tableros: la sombra de 0 12px 32px.
    expect(menu).toHaveClass("shadow-[var(--sombra-menu)]");
    expect(edit).toHaveClass("min-h-9", "text-[13px]", "border-t", "first:border-t-0");
    expect(screen.getByRole("separator")).toHaveClass("h-1.5", "bg-[var(--s2)]", "border-t");
    expect(screen.getByRole("menuitem", { name: "Eliminar" })).toHaveClass("data-[variant=destructive]:text-[var(--peligro)]");
  });
});
