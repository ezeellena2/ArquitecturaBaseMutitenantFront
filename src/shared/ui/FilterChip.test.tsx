import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { FilterChip } from "./FilterChip";

// «Criterio · Menús» (213): lo aplicado va en chips con su ×; un chip de solo lectura, como los filtros que repite un
// diálogo, va sin ×.
describe("FilterChip", () => {
  it("quita su filtro con la ×, que se llama por lo que quita", async () => {
    const onRemove = vi.fn();
    render(<FilterChip removeLabel="Quitar Estado: Aprobada" onRemove={onRemove}>{"Estado: Aprobada"}</FilterChip>);

    await userEvent.click(screen.getByRole("button", { name: "Quitar Estado: Aprobada" }));

    expect(onRemove).toHaveBeenCalledOnce();
  });

  it("de solo lectura se lee igual y va sin ×", () => {
    const { container } = render(<FilterChip>{"Estado: Aprobada"}</FilterChip>);

    expect(screen.getByText("Estado: Aprobada")).toBeVisible();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    // Sin la ×, el chip guarda a la derecha el mismo margen que a la izquierda.
    expect(container.querySelector('[data-slot="filter-chip"]')).toHaveClass("pl-2.5", "pr-2.5");
  });
});
