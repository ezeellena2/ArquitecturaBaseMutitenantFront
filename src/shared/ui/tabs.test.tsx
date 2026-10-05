import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { MemoryRouter } from "react-router";
import { describe, expect, it } from "vitest";
import { Page } from "./Page";

// La ficha con dos grupos: `Page` arma la barra con las piezas de tabs.tsx.
function CompanyGroups() {
  const [value, setValue] = useState("members");
  return <MemoryRouter><Page title="Delta S.A." tabs={{ label: "Secciones de la empresa", value, onValueChange: setValue, items: [
    { value: "members", label: "Miembros", count: 6, content: "Lista de miembros" },
    { value: "roles", label: "Roles", count: 3, content: "Lista de roles" },
  ] }} /></MemoryRouter>;
}

// Tableros Empresa, Organizacion y Cuenta-Plat: las pestañas abren el contenido de la página, dentro de su margen, con la
// línea a lo ancho del contenido y 16 hasta lo de abajo; alineadas a la izquierda con 28 de separación y 44 de alto; la
// elegida en petróleo y subrayada; la cantidad, en gris al lado del nombre, sin etiqueta («Criterio · Marco»).
describe("Tabs · Criterio · Marco", () => {
  it("abren el contenido, debajo de la banda, subrayadas y con la cantidad en gris", async () => {
    render(<CompanyGroups />);

    const list = screen.getByRole("tablist", { name: "Secciones de la empresa" });
    const strip = list.parentElement!;
    expect(strip).toHaveAttribute("data-slot", "page-tabs");
    expect(strip).toHaveClass("border-b", "px-1");
    // La elegida subraya sobre la línea, como `.tab2` (margin-bottom: -1px): la franja mide 44 y no 45.
    expect(strip).toHaveClass("[&>[role=tablist]]:-mb-px");
    expect(strip).not.toHaveClass("bg-[var(--lado-activo)]");
    // Dentro del contenido, que lleva el margen de la página, y no pegadas a la banda.
    expect(screen.getByRole("banner")).not.toContainElement(list);
    expect(screen.getByRole("banner").nextElementSibling).toContainElement(strip);
    expect(strip.nextElementSibling).toHaveClass("pt-4");
    expect(strip.nextElementSibling).toContainElement(screen.getByText("Lista de miembros"));
    expect(list).toHaveClass("h-11", "gap-7", "justify-start");
    const members = screen.getByRole("tab", { name: "Miembros 6" });
    expect(members).toHaveClass("text-[14px]", "data-[state=active]:text-[var(--marca-tx)]", "data-[state=active]:shadow-[inset_0_-2px_0_var(--marca)]");
    expect(members).not.toHaveClass("flex-1");
    expect(screen.getByText("6")).toHaveClass("font-normal", "text-[var(--t3)]");
    await userEvent.click(screen.getByRole("tab", { name: "Roles 3" }));
    expect(screen.getByText("Lista de roles")).toBeVisible();
  });
});
