import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Select, SelectTrigger, SelectValue } from "./select";

describe("SelectTrigger · Criterio v65", () => {
  it("uses regular field size and compact filter size responsively", () => {
    render(
      <>
        <Select value="value">
          <SelectTrigger aria-label="Tipo de dato"><SelectValue /></SelectTrigger>
        </Select>
        <Select value="10">
          <SelectTrigger size="sm" aria-label="Filas por página"><SelectValue /></SelectTrigger>
        </Select>
      </>,
    );

    const regular = screen.getByRole("combobox", { name: "Tipo de dato" });
    const compact = screen.getByRole("combobox", { name: "Filas por página" });
    expect(regular).toHaveClass("h-9", "text-[13px]");
    expect(regular).not.toHaveClass("lg:h-11", "text-sm");
    expect(compact).toHaveClass("h-8");
    expect(compact).not.toHaveClass("lg:h-9");
    // Tablero Usuario (.o-dd > button.ct[aria-expanded="true"]): abierto, el campo lleva el borde petróleo y el halo.
    expect(regular).toHaveClass("aria-expanded:border-[var(--marca)]", "aria-expanded:ring-[3px]", "aria-expanded:ring-[var(--foco-halo)]");
  });
});
