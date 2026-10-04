import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import { configureI18n } from "@/shared/i18n";
import { AppChromeProvider } from "./app/AppChrome";
import { LoadErrorPage } from "./LoadErrorPage";

beforeAll(async () => { await configureI18n([{ code: "es-AR", languageCode: "es", fallbackCulture: null, isEnabled: true, isDefault: true }]); });

describe("LoadErrorPage", () => {
  // «Criterio · Avisos» (Pantalla de error): cuando no se puede mostrar nada de la pantalla, al centro el ícono de alerta
  // en su círculo, «No pudimos abrir esta pantalla» y «Reintentar» como botón secundario.
  it("dice que la pantalla no se pudo abrir y «Reintentar» la vuelve a pedir", async () => {
    const onRetry = vi.fn();
    const { container } = render(<MemoryRouter><LoadErrorPage onRetry={onRetry} /></MemoryRouter>);

    expect(screen.getByRole("alert")).toHaveTextContent("No pudimos abrir esta pantalla");
    expect(screen.getByRole("heading", { level: 1, name: "No pudimos abrir esta pantalla" })).toBeVisible();
    const retry = screen.getByRole("button", { name: "Reintentar" });
    expect(retry).toHaveAttribute("data-variant", "outline");
    expect(container.querySelector("svg")?.parentElement).toHaveClass("size-16", "rounded-full", "bg-[var(--s3)]");
    expect(container.querySelector("svg")).toHaveClass("text-[var(--peligro)]");
    expect(screen.queryByRole("link", { name: "Ir al inicio" })).not.toBeInTheDocument();

    await userEvent.click(retry);
    expect(onRetry).toHaveBeenCalledOnce();
    expect(await axe(container)).toHaveNoViolations();
  });

  // Tablero M-Error-Org («No se pudo abrir»): en el teléfono, dentro de la app, la barra con ‹ y el nombre de la
  // pantalla; al medio, el aviso y «Reintentar» redondeado de 48, secundario.
  it("en el teléfono lleva la barra de la pantalla y «Reintentar» redondeado", () => {
    render(<MemoryRouter><AppChromeProvider value={{ phone: true, parent: { to: "/mas", label: "Volver a Más" }, subtitle: "Administración", title: "Usuarios", hideBottomNav: () => {} }}>
      <LoadErrorPage onRetry={vi.fn()} screen="Usuario" back={{ to: "/org/usuarios", label: "Volver a Usuarios" }} />
    </AppChromeProvider></MemoryRouter>);

    expect(screen.getByRole("heading", { level: 1, name: "Usuario" })).toBeVisible();
    expect(screen.getByRole("link", { name: "Volver a Usuarios" })).toHaveAttribute("href", "/org/usuarios");
    expect(screen.getByRole("heading", { level: 2, name: "No pudimos abrir esta pantalla" })).toHaveClass("text-[22px]");
    expect(screen.getByRole("button", { name: "Reintentar" })).toHaveClass("h-12", "rounded-full", "border-[var(--borde2)]", "text-[var(--t1)]");
  });
});
