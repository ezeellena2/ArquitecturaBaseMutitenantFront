import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import { configureI18n } from "@/shared/i18n";
import { AppChromeProvider } from "@/shared/ui/app/AppChrome";
import { ForbiddenPage } from "./ForbiddenPage";
import { homeOf } from "@/tenancy/access";

beforeAll(async () => { await configureI18n([{ code: "es-AR", languageCode: "es", fallbackCulture: null, isEnabled: true, isDefault: true }]); });

describe("ForbiddenPage", () => {
  it("reproduce el 403 de Error-Org y vuelve al inicio de la organización", async () => {
    const { container } = render(<MemoryRouter><ForbiddenPage organizationName="Grupo Delta" homePath={homeOf("business")} /></MemoryRouter>);
    expect(screen.getByRole("heading", { name: "No tenés permiso para ver esta página" })).toBeVisible();
    expect(screen.queryByText(/pedíselo a quien administra/i)).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Ir al inicio" })).toHaveAttribute("href", "/org");
    // En la compu es el botón principal de siempre (36 y letra de 14), como el tablero Error-Org.
    expect(screen.getByRole("link", { name: "Ir al inicio" })).toHaveAttribute("data-variant", "default");
    expect(screen.getByRole("link", { name: "Ir al inicio" })).toHaveClass("h-9", "text-[14px]");
    // El candado del tablero: el cuerpo y el arco, sin cerradura.
    expect(container.querySelector('path[d="M8 10.5V8a4 4 0 0 1 8 0v2.5"]')).not.toBeNull();
    expect(await axe(container)).toHaveNoViolations();
  });

  // Tablero M-Error-Org: en el teléfono la barra lleva ‹ y el nombre de la pantalla; debajo, el aviso al medio y
  // «Ir al inicio» redondeado.
  it("en el teléfono lleva la barra de la pantalla y el botón redondeado", () => {
    render(<MemoryRouter><AppChromeProvider value={{ phone: true, parent: { to: "/mas", label: "Volver a Más" }, subtitle: "Administración", title: "Auditoría", hideBottomNav: () => {} }}>
      <ForbiddenPage organizationName="Grupo Delta" homePath={homeOf("business")} />
    </AppChromeProvider></MemoryRouter>);

    expect(screen.getByRole("heading", { level: 1, name: "Auditoría" })).toBeVisible();
    expect(screen.getByRole("link", { name: "Volver a Más" })).toHaveAttribute("href", "/mas");
    expect(screen.getByRole("heading", { level: 2, name: "No tenés permiso para ver esta página" })).toHaveClass("text-[22px]");
    expect(screen.getByRole("link", { name: "Ir al inicio" })).toHaveClass("h-12", "rounded-full");
  });

  // Tablero M-Error-Org: la barra de abajo no marca ninguna sección.
  it("en el teléfono la barra de abajo no marca ninguna sección", () => {
    const hideActiveSection = vi.fn();
    const { unmount } = render(<MemoryRouter><AppChromeProvider value={{ phone: true, parent: null, subtitle: null, title: "Auditoría", hideBottomNav: () => {}, hideActiveSection }}>
      <ForbiddenPage organizationName="Grupo Delta" homePath={homeOf("business")} />
    </AppChromeProvider></MemoryRouter>);

    expect(hideActiveSection).toHaveBeenLastCalledWith(true);
    unmount();
    expect(hideActiveSection).toHaveBeenLastCalledWith(false);
  });
});
