import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
import { DetailGrid } from "./DetailGrid";

const items = [{ key: "who", label: "Quién", value: "Martín · m***@correo.com" }, { key: "name", label: "Nombre", value: <><s>{"Anterior"}</s>{" → Nuevo"}</> }];
describe("DetailGrid (E5)", () => {
  it("en la compu conserva la grilla de Auditoría y los valores que entrega quien la usa", async () => {
    const { container } = render(<DetailGrid items={items} />);
    expect(container.querySelector("dl")).toHaveClass("grid", "grid-cols-[170px_minmax(0,1fr)]");
    expect(screen.getByText("Quién").tagName).toBe("DT");
    expect(screen.getByText("Martín · m***@correo.com").tagName).toBe("DD");
    expect(screen.getByText("Anterior")).toBeInTheDocument();
    expect(await axe(container)).toHaveNoViolations();
  });

  it("en el teléfono conserva rótulos encima de los valores y las separaciones de Auditoría", async () => {
    const { container } = render(<DetailGrid items={items} phone />);
    expect(container.querySelector("dl")).toHaveClass("flex", "flex-col", "px-5", "pt-2", "pb-4");
    expect(screen.getByText("Quién")).toHaveClass("text-[13px]", "text-[var(--t3)]");
    expect(screen.getByText("Martín · m***@correo.com")).toHaveClass("text-[15.5px]", "font-medium");
    expect(screen.getByText("Quién").parentElement).toHaveClass("border-t", "first:border-t-0");
    expect(await axe(container)).toHaveNoViolations();
  });
});
