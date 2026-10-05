import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import { configureI18n } from "@/shared/i18n";
import { businessNavigation } from "../navigation/business";
import { personalNavigation } from "../navigation/personal";
import { Sidebar } from "./Sidebar";

beforeAll(async () => {
  await configureI18n([{ code: "es-AR", languageCode: "es", fallbackCulture: null, isEnabled: true, isDefault: true }]);
});

describe("Sidebar", () => {
  it("muestra Inicio, Administración aprobada, el ámbito y la identidad", async () => {
    const onToggleAdministration = vi.fn();
    const onToggleCollapsed = vi.fn();
    const { container } = render(<MemoryRouter initialEntries={["/org"]}>
      <Sidebar navigation={businessNavigation} account={{ name: "Ana", email: "ana@example.com" }} context={{ title: "Empresa A", detail: "Organización" }} collapsed={false} administrationOpen={false} onToggleAdministration={onToggleAdministration} onToggleCollapsed={onToggleCollapsed} />
    </MemoryRouter>);
    expect(screen.getByRole("complementary", { name: "Navegación principal" })).toHaveClass("w-[232px]");
    expect(screen.getByRole("link", { name: "Inicio" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Inicio" })).toHaveClass("rounded-[8px]", "ring-1", "ring-[var(--borde)]", "shadow-sm");
    expect(screen.getByRole("button", { name: "Contraer menú" })).toHaveClass("top-16", "bg-[var(--lado-activo)]");
    expect(screen.getByText("Ana")).toBeVisible();
    expect(screen.getByText("ana@example.com")).toBeVisible();
    expect(screen.getByText("Empresa A")).toBeVisible();
    expect(screen.getByRole("button", { name: "Administración" })).toBeVisible();
    await userEvent.click(screen.getByRole("button", { name: "Administración" }));
    expect(onToggleAdministration).toHaveBeenCalledOnce();
    await userEvent.click(screen.getByRole("button", { name: "Contraer menú" }));
    expect(onToggleCollapsed).toHaveBeenCalledOnce();
    expect(await axe(container, { rules: { region: { enabled: false } } })).toHaveNoViolations();
  });

  // «Criterio · Menús» (v92): opciones de 32 separadas por 2 px, con la línea fina adentro de ese espacio (34 de una a
  // otra); Administración con su escudo y ›; abierta, en blanco con ‹, como la opción en la que estás.
  it("separa las opciones con una línea fina en el espacio entre ellas y marca Administración abierta", () => {
    const props = { account: null, context: null, collapsed: false, onToggleAdministration: vi.fn(), onToggleCollapsed: vi.fn() };
    const { rerender } = render(<MemoryRouter initialEntries={["/"]}><Sidebar {...props} navigation={personalNavigation} administrationOpen={false} /></MemoryRouter>);
    const items = screen.getAllByRole("listitem");
    expect(items[0].parentElement).toHaveClass("gap-0.5");
    expect(items[0]).not.toHaveClass("before:h-px");
    expect(items[1]).toHaveClass("relative", "before:absolute", "before:-top-0.5", "before:h-px", "before:bg-[var(--lado-borde)]");
    expect(items[1]).not.toHaveClass("border-t", "pt-0.5");

    rerender(<MemoryRouter initialEntries={["/org"]}><Sidebar {...props} navigation={businessNavigation} administrationOpen={false} /></MemoryRouter>);
    const closed = screen.getByRole("button", { name: "Administración" });
    // El escudo con la tilde del tablero (ShieldCheckIcon), no el de lucide.
    expect(closed.querySelector('path[d="M12 3.5 5 6v5.5c0 4.2 2.9 7.6 7 9 4.1-1.4 7-4.8 7-9V6Z"]')).not.toBeNull();
    expect(closed.querySelector(".lucide-chevron-right")).not.toBeNull();
    // Las opciones que no están activas van en el gris del marco (--lado-t2), como en el lienzo.
    expect(closed).toHaveClass("min-h-[32px]", "text-[var(--lado-t2)]");

    rerender(<MemoryRouter initialEntries={["/org"]}><Sidebar {...props} navigation={businessNavigation} administrationOpen /></MemoryRouter>);
    const open = screen.getByRole("button", { name: "Administración" });
    expect(open).toHaveClass("bg-[var(--lado-activo)]", "font-semibold", "text-[var(--marca-tx)]", "ring-1");
    expect(open.querySelector(".lucide-chevron-left")).not.toBeNull();
  });


});
