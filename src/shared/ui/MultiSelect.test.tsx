import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it } from "vitest";
import { FormField } from "./FormField";
import { MultiSelect } from "./MultiSelect";
import { renderWithProviders } from "@/test/utils/renderWithProviders";

const options = [
  { value: "Admin", label: "Admin", description: "Puede hacer todo." },
  { value: "User", label: "User" },
];

function Harness({ initial = [] }: { initial?: string[] }) {
  const [value, setValue] = useState(initial);

  return (
    <FormField label="Roles">
      <MultiSelect options={options} value={value} onChange={setValue} placeholder="Sin roles" />
    </FormField>
  );
}

describe("MultiSelect", () => {
  it("shows the placeholder while nothing is picked", () => {
    renderWithProviders(<Harness />);

    expect(screen.getByRole("button", { name: "Roles" })).toHaveTextContent("Sin roles");
    // Tablero Usuario: el vacío, como «Ninguno», en el gris de campo vacío.
    expect(screen.getByRole("button", { name: "Roles" })).toHaveClass("text-[var(--t3)]");
  });

  it("shows the picked options separated by commas", () => {
    renderWithProviders(<Harness initial={["Admin", "User"]} />);

    expect(screen.getByRole("button", { name: "Roles" })).toHaveTextContent("Admin, User");
  });

  it("stays open while several options are toggled", async () => {
    renderWithProviders(<Harness />);
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: "Roles" }));
    await user.click(await screen.findByRole("menuitemcheckbox", { name: /admin/i }));
    await user.click(screen.getByRole("menuitemcheckbox", { name: /user/i }));

    expect(screen.getByRole("menuitemcheckbox", { name: /admin/i })).toHaveAttribute("aria-checked", "true");
    expect(screen.getByRole("menuitemcheckbox", { name: /user/i })).toHaveAttribute("aria-checked", "true");

    // Con el menú abierto, lo de atrás queda oculto para la accesibilidad: se cierra para leer el control.
    await user.keyboard("{Escape}");

    expect(screen.getByRole("button", { name: "Roles" })).toHaveTextContent("Admin, User");
  });

  // Tablero Usuario (el desplegable de roles abierto): la lista mide lo mismo que el campo, con 4 de margen; cada opción
  // lleva su casilla a la izquierda y la descripción debajo del nombre, sin líneas entre opciones ni fondo al marcarla.
  it("shows a checkbox before each option and its description below the name, as wide as the field", async () => {
    renderWithProviders(<Harness initial={["Admin"]} />);
    const user = userEvent.setup();

    // Por teclado, como el test de abajo: en jsdom, después de otro test con un menú de Radix, el clic no lo abre.
    screen.getByRole("button", { name: "Roles" }).focus();
    await user.keyboard("{Enter}");
    // El nombre es el del rol; la descripción, su descripción accesible.
    const admin = await screen.findByRole("menuitemcheckbox", { name: "Admin" });
    expect(admin).toHaveAccessibleDescription("Puede hacer todo.");
    // «Criterio · Formularios», Desplegable (2026-10-05): debajo del campo, alineada a su izquierda y de su mismo ancho.
    expect(screen.getByRole("menu")).toHaveClass("w-(--radix-dropdown-menu-trigger-width)", "max-w-none", "min-w-0", "p-1");
    expect(screen.getByRole("menu")).toHaveAttribute("data-side", "bottom");
    expect(screen.getByRole("menu")).toHaveAttribute("data-align", "start");
    // Abierto, el campo lleva el borde petróleo y el halo (.o-dd > button.ct[aria-expanded="true"]).
    const trigger = screen.getByRole("button", { name: "Roles", hidden: true });
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    // En el teléfono (.in2 svg), la flechita de 18 y casi negra.
    expect(trigger.querySelector("svg")).toHaveClass("max-md:size-[18px]", "max-md:text-[var(--t1)]");
    expect(trigger).toHaveClass("aria-expanded:border-[var(--marca)]", "aria-expanded:ring-[3px]", "aria-expanded:ring-[var(--foco-halo)]");
    expect(admin).toHaveClass("min-h-9", "gap-2.5", "rounded-[6px]", "px-2.5", "py-1");
    expect(admin).not.toHaveClass("border-t");
    // La casilla, como la de «Todos»: borde gris y, marcada, petróleo.
    const box = admin.querySelector("[data-slot='dropdown-menu-check']")!;
    expect(box).toHaveClass("size-4", "rounded-[4px]", "border", "border-input", "group-data-[state=checked]:bg-primary");
    expect(box.compareDocumentPosition(within(admin).getByText("Admin")) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(within(admin).getByText("Puede hacer todo.")).toHaveClass("text-[12px]", "text-[var(--t3)]");
    expect(screen.getByRole("menuitemcheckbox", { name: /user/i }).querySelector("[data-slot='dropdown-menu-check']")).not.toBeNull();
  });

  it("unpicks an option that was picked", async () => {
    renderWithProviders(<Harness initial={["Admin"]} />);
    const user = userEvent.setup();

    // Por teclado y no con un clic: en jsdom, después de un test que ya abrió un menú de Radix, el clic
    // sobre el disparador deja de abrirlo (en el navegador no pasa). Enter es un camino igual de real.
    screen.getByRole("button", { name: "Roles" }).focus();
    await user.keyboard("{Enter}");
    await user.click(await screen.findByRole("menuitemcheckbox", { name: /admin/i }));
    await user.keyboard("{Escape}");

    expect(screen.getByRole("button", { name: "Roles" })).toHaveTextContent("Sin roles");
  });
});
