import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./dropdown-menu";

describe("DropdownMenu · Criterio v65", () => {
  it("keeps secondary actions accessible and compact at both breakpoints", () => {
    render(
      <DropdownMenu open>
        <DropdownMenuTrigger aria-label="Más acciones">{"⋮"}</DropdownMenuTrigger>
        <DropdownMenuContent aria-label="Acciones">
          <DropdownMenuItem>{"Editar"}</DropdownMenuItem>
          <DropdownMenuItem variant="destructive">{"Eliminar"}</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>,
    );

    const menu = screen.getByRole("menu", { name: "Más acciones" });
    const edit = screen.getByRole("menuitem", { name: "Editar" });
    const remove = screen.getByRole("menuitem", { name: "Eliminar" });

    expect(menu).toHaveClass("min-w-[200px]", "rounded-[10px]");
    expect(edit).toHaveClass("min-h-[34px]", "text-[13px]");
    expect(edit).not.toHaveClass("lg:min-h-10", "lg:text-[14px]");
    expect(remove).toHaveClass("data-[variant=destructive]:text-[var(--peligro)]");
  });
});
