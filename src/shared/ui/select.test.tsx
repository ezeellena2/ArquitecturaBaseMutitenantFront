import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Select, SelectTrigger, SelectValue } from "./select";

describe("SelectTrigger · Criterio v60", () => {
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

    expect(screen.getByRole("combobox", { name: "Tipo de dato" })).toHaveClass("h-9", "lg:h-11");
    expect(screen.getByRole("combobox", { name: "Filas por página" })).toHaveClass("h-8", "lg:h-9");
  });
});
