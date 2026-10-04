import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { describe, expect, it } from "vitest";
import { Page } from "./Page";
import { TabCount, Tabs, TabsContent, TabsList, TabsTrigger } from "./tabs";

// Tablero «Criterio · Marco», Pestañas: debajo de la banda, en una banda blanca; alineadas a la izquierda con 28 de
// separación y 44 de alto; la elegida en petróleo y subrayada; la cantidad, en gris al lado del nombre, sin etiqueta.
describe("Tabs · Criterio · Marco", () => {
  it("van en su banda debajo de la de la página, subrayadas y con la cantidad en gris", async () => {
    render(<MemoryRouter><Tabs defaultValue="members" className="contents!">
      <Page title="Delta S.A." tabs={<TabsList aria-label="Secciones de la empresa">
        <TabsTrigger value="members">{"Miembros"}<TabCount>{6}</TabCount></TabsTrigger>
        <TabsTrigger value="roles">{"Roles"}<TabCount>{3}</TabCount></TabsTrigger>
      </TabsList>}>
        <TabsContent value="members">{"Lista de miembros"}</TabsContent>
        <TabsContent value="roles">{"Lista de roles"}</TabsContent>
      </Page>
    </Tabs></MemoryRouter>);

    const list = screen.getByRole("tablist", { name: "Secciones de la empresa" });
    expect(list.parentElement).toHaveAttribute("data-slot", "page-tabs");
    expect(list.parentElement).toHaveClass("border-b", "bg-[var(--lado-activo)]");
    expect(list).toHaveClass("h-11", "gap-7", "justify-start");
    const members = screen.getByRole("tab", { name: "Miembros 6" });
    expect(members).toHaveClass("text-[14px]", "data-[state=active]:text-[var(--marca-tx)]", "data-[state=active]:shadow-[inset_0_-2px_0_var(--marca)]");
    expect(members).not.toHaveClass("flex-1");
    expect(screen.getByText("6")).toHaveClass("font-normal", "text-[var(--t3)]");
    await userEvent.click(screen.getByRole("tab", { name: "Roles 3" }));
    expect(screen.getByText("Lista de roles")).toBeVisible();
  });
});
