import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { RowActions, type RowAction } from "./RowActions";
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
    expect(trigger.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
    trigger.focus();
    await userEvent.keyboard("{Enter}");
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
});
