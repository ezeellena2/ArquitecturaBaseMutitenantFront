import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import { CheckboxField } from "./CheckboxField";
import { GroupLabel } from "./GroupLabel";

// «Criterio · Formularios» (213): el título de un grupo de opciones o de casillas lleva su (i), como un campo, y la (i)
// respeta los saltos de renglón (211).
describe("GroupLabel", () => {
  it("nombra un grupo de casillas con su título, y su (i) abre la ayuda sin marcar ninguna", async () => {
    const onChange = vi.fn();
    const { container } = render(<main>
      <GroupLabel id="dias" help={"Los días en que atiende.\nFuera de ellos, contesta el aviso."}>{"Días"}</GroupLabel>
      <div role="group" aria-labelledby="dias">
        <CheckboxField label="Lunes" checked={false} onCheckedChange={onChange} />
        <CheckboxField label="Martes" checked={false} onCheckedChange={onChange} />
      </div>
    </main>);

    expect(screen.getByRole("group", { name: "Días" })).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Más información sobre Días" }));
    const tooltip = await screen.findByRole("tooltip");
    expect(tooltip).toHaveTextContent("Los días en que atiende.");
    expect(onChange).not.toHaveBeenCalled();
    expect(await axe(container)).toHaveNoViolations();
  });

  it("tiene la letra de un rótulo, no la de un título de zona", () => {
    render(<GroupLabel id="columnas">{"Columnas"}</GroupLabel>);

    expect(screen.getByText("Columnas")).toHaveClass("text-[0.78125rem]", "font-semibold", "text-[var(--t2)]");
    expect(screen.queryByRole("heading")).not.toBeInTheDocument();
  });
});
