import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import { configureI18n } from "@/shared/i18n";
import { businessNavigation } from "../navigation/business";
import { Sidebar } from "./Sidebar";

beforeAll(async () => {
  await configureI18n([{ code: "es-AR", languageCode: "es", fallbackCulture: null, isEnabled: true, isDefault: true }]);
});

describe("Sidebar", () => {
  it("muestra Inicio, el ámbito y la identidad sin destinos de etapas futuras", async () => {
    const onToggleCollapsed = vi.fn();
    const { container } = render(<MemoryRouter initialEntries={["/org"]}>
      <Sidebar navigation={businessNavigation} account={{ name: "Ana", email: "ana@example.com" }} context={{ title: "Empresa A", detail: "Organización" }} isMobile={false} mobileOpen={false} collapsed={false} administrationOpen={false} onToggleAdministration={vi.fn()} onToggleCollapsed={onToggleCollapsed} onCloseMobile={vi.fn()} />
    </MemoryRouter>);
    expect(screen.getByRole("complementary", { name: "Navegación principal" })).toHaveClass("w-[232px]");
    expect(screen.getByRole("link", { name: "Inicio" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Inicio" })).toHaveClass("rounded-[8px]", "ring-1", "ring-[var(--borde)]", "shadow-sm");
    expect(screen.getByRole("button", { name: "Contraer menú" })).toHaveClass("top-[78px]");
    expect(screen.getByText("Ana")).toBeVisible();
    expect(screen.getByText("ana@example.com")).toBeVisible();
    expect(screen.getByText("Empresa A")).toBeVisible();
    expect(screen.queryByRole("button", { name: "Administración" })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Contraer menú" }));
    expect(onToggleCollapsed).toHaveBeenCalledOnce();
    expect(await axe(container, { rules: { region: { enabled: false } } })).toHaveNoViolations();
  });

  it("en teléfono usa cajón con velo, cierra con Escape y no monta segundo panel", async () => {
    const onCloseMobile = vi.fn();
    render(<MemoryRouter initialEntries={["/org"]}>
      <Sidebar navigation={businessNavigation} account={{ name: "Ana", email: "ana@example.com" }} context={{ title: "Empresa A", detail: "Organización" }} isMobile mobileOpen collapsed={false} administrationOpen={false} onToggleAdministration={vi.fn()} onToggleCollapsed={vi.fn()} onCloseMobile={onCloseMobile} />
    </MemoryRouter>);
    expect(screen.getByRole("dialog", { name: "Navegación principal" })).toHaveClass("w-[280px]");
    expect(screen.getByRole("link", { name: "Inicio" })).toBeVisible();
    expect(screen.queryByRole("button", { name: "Administración" })).not.toBeInTheDocument();
    expect(screen.queryByRole("navigation", { name: "Administración" })).not.toBeInTheDocument();
    await userEvent.keyboard("{Escape}");
    expect(onCloseMobile).toHaveBeenCalledOnce();
  });
});
