import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { RowActions, type RowAction } from "./RowActions";
import { AppChromeProvider } from "./app/AppChrome";
import { ShieldIcon } from "./icons";
import { renderWithProviders } from "@/test/utils/renderWithProviders";

function action(overrides: Partial<RowAction> = {}): RowAction {
  return {
    label: "Roles",
    accessibleName: "Editar los roles de Ana",
    icon: ShieldIcon,
    onSelect: vi.fn(),
    ...overrides,
  };
}

describe("RowActions", () => {
  it("names the menu with the row datum and runs the selected action", async () => {
    const onSelect = vi.fn();
    renderWithProviders(
      <RowActions label="Acciones de Ana" actions={[action({ onSelect })]} />,
    );

    const trigger = screen.getByRole("button", { name: "Acciones de Ana" });
    expect(trigger).toHaveClass("size-8", "text-[var(--t3)]");
    expect(trigger.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
    trigger.focus();
    await userEvent.keyboard("{Enter}");
    const menu = await screen.findByRole("menu");
    expect(menu).toHaveClass("min-w-[220px]");
    expect(menu).not.toHaveClass("lg:min-w-[220px]");
    await userEvent.click(await screen.findByRole("menuitem", { name: "Editar los roles de Ana" }));

    expect(onSelect).toHaveBeenCalledOnce();
  });

  it("hides unauthorized actions and renders nothing if all are hidden", async () => {
    const { rerender } = renderWithProviders(
      <RowActions
        label="Acciones de Ana"
        actions={[
          action(),
          action({ label: "Eliminar", accessibleName: "Eliminar a Ana", hidden: true }),
        ]}
      />,
    );
    const trigger = screen.getByRole("button", { name: "Acciones de Ana" });
    trigger.focus();
    await userEvent.keyboard("{Enter}");
    expect(screen.queryByRole("menuitem", { name: "Eliminar a Ana" })).not.toBeInTheDocument();

    await userEvent.keyboard("{Escape}");
    rerender(<RowActions label="Acciones de Ana" actions={[action({ hidden: true })]} />);
    expect(screen.queryByRole("button", { name: "Acciones de Ana" })).not.toBeInTheDocument();
  });

  it("puts destructive actions last, separated and red", async () => {
    renderWithProviders(
      <RowActions
        label="Acciones de Ana"
        actions={[
          action({ label: "Eliminar", accessibleName: "Eliminar a Ana", destructive: true }),
          action(),
        ]}
      />,
    );

    screen.getByRole("button", { name: "Acciones de Ana" }).focus();
    await userEvent.keyboard("{Enter}");
    const menu = await screen.findByRole("menu");
    const items = screen.getAllByRole("menuitem");
    expect(items.map((item) => item.textContent)).toEqual(["Roles", "Eliminar"]);
    expect(menu.querySelector("[role='separator']")).not.toBeNull();
    expect(items[1]).toHaveAttribute("data-variant", "destructive");
    // «Criterio · Menús» (.mn .it svg y .it.pel svg): el ícono va en el gris tenue; el de una de peligro, del rojo de su texto.
    expect(items[0].querySelector("svg")).toHaveClass("size-4", "text-[var(--t3)]");
    expect(items[1].querySelector("svg")).toHaveClass("text-current");
  });

  it("keeps the trigger and focus when the row name changes", () => {
    const { rerender } = renderWithProviders(
      <RowActions label="Acciones de Ana" actions={[action()]} />,
    );
    const trigger = screen.getByRole("button", { name: "Acciones de Ana" });
    trigger.focus();

    rerender(<RowActions label="Acciones de Luis" actions={[action()]} />);

    expect(screen.getByRole("button", { name: "Acciones de Luis" })).toBe(trigger);
    expect(trigger).toHaveFocus();
  });

  // Tableros M-Empresa («Invitación: acciones») y M-Cuenta-Metodo: en el teléfono el ⋮ abre una hoja desde abajo con el dato
  // de la fila de título, sin ✕; las opciones de 54, las de peligro al final, en rojo y después de una franja. Elegir una
  // cierra la hoja y corre la acción con el ⋮, para que el diálogo que abra le devuelva el foco.
  it("en el teléfono abre una hoja con el dato de la fila, las opciones y las de peligro al final", async () => {
    const onSelect = vi.fn();
    renderWithProviders(<AppChromeProvider value={{ phone: true, parent: null, subtitle: null, hideBottomNav: () => {} }}>
      <RowActions label="Acciones de Ana" title="Ana Gómez" actions={[
        action({ label: "Eliminar", accessibleName: "Eliminar a Ana", destructive: true, onSelect }),
        action(),
      ]} />
    </AppChromeProvider>);

    const trigger = screen.getByRole("button", { name: "Acciones de Ana" });
    expect(trigger).toHaveAttribute("aria-haspopup", "dialog");
    // Tableros M-Usuarios, M-Empresa y M-Configuracion (.ap-ib): el ⋮ de 20, casi negro, en el botón de 44.
    expect(trigger).toHaveAttribute("data-slot", "row-actions");
    expect(trigger).toHaveClass("max-md:size-11", "max-md:text-[var(--t1)]");
    expect(trigger.querySelector("svg")).toHaveClass("max-md:size-5");
    await userEvent.click(trigger);
    const sheet = await screen.findByRole("dialog", { name: "Ana Gómez" });
    expect(sheet).toHaveClass("bottom-0", "rounded-t-[20px]");
    expect(within(sheet).queryByRole("button", { name: "Cerrar" })).not.toBeInTheDocument();
    const menu = within(sheet).getByRole("menu", { name: "Acciones de Ana" });
    const items = within(menu).getAllByRole("menuitem");
    expect(items.map((item) => item.textContent)).toEqual(["Roles", "Eliminar"]);
    expect(items[0]).toHaveClass("min-h-[54px]", "text-[16.5px]");
    expect(items[1]).toHaveClass("text-[var(--peligro)]");
    expect(within(menu).getByRole("separator")).toHaveClass("bg-[var(--s2)]");

    await userEvent.click(items[1]);
    expect(onSelect).toHaveBeenCalledWith(trigger);
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });

  // R10 («Criterio · Menús», 13/10; tablero M-WA-Chats-Formulario, .ap-menu span.off): una opción que no se puede usar por
  // algo que se puede resolver va apagada, en gris y con el motivo debajo; se lee con el teclado, pero no hace nada.
  it.each([["la compu", false], ["el teléfono", true]] as const)("en %s, una opción apagada muestra su motivo y no corre", async (_, phone) => {
    const onSelect = vi.fn();
    renderWithProviders(<AppChromeProvider value={{ phone, parent: null, subtitle: null, hideBottomNav: () => {} }}>
      <RowActions label="Acciones de Auditor" actions={[action(),
        action({ label: "Inactivar", accessibleName: "Inactivar", destructive: true, onSelect, disabledReason: "Lo tiene 1 usuario. Quitáselo primero." })]} />
    </AppChromeProvider>);

    const trigger = screen.getByRole("button", { name: "Acciones de Auditor" });
    trigger.focus();
    await userEvent.keyboard("{Enter}");
    const off = await screen.findByRole("menuitem", { name: "Inactivar" });
    expect(off).toHaveAttribute("aria-disabled", "true");
    expect(off).toHaveAccessibleDescription("Lo tiene 1 usuario. Quitáselo primero.");
    expect(off).toHaveClass("text-[var(--t3)]");
    // Apagada no va en rojo, aunque sea de peligro.
    if (phone) expect(off).not.toHaveClass("text-[var(--peligro)]"); else expect(off).toHaveAttribute("data-variant", "default");
    await userEvent.click(off);
    expect(onSelect).not.toHaveBeenCalled();
    expect(screen.getByRole("menuitem", { name: "Inactivar" })).toBeVisible();
  });
});
