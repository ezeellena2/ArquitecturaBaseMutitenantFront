import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { Shield } from "lucide-react";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { configureI18n } from "@/shared/i18n";
import { businessNavigation } from "../navigation/business";
import type { NavigationPanel } from "../navigation/types";
import { AdminPanel } from "./AdminPanel";

const futurePanel: NavigationPanel = { labelKey: "navigation.administration", icon: Shield, links: [] };

beforeAll(async () => {
  await configureI18n([{ code: "es-AR", languageCode: "es", fallbackCulture: null, isEnabled: true, isDefault: true }]);
});

describe("AdminPanel", () => {
  it("con un panel configurado abre y cierra con ‹", async () => {
    const onClose = vi.fn();
    render(<MemoryRouter><AdminPanel panel={futurePanel} open onClose={onClose} /></MemoryRouter>);
    expect(screen.getByRole("navigation", { name: "Administración" })).toHaveClass("w-[232px]", "bg-[var(--panel)]");
    expect(screen.getByRole("button", { name: "Cerrar Administración" })).toHaveClass("size-7");
    expect(screen.queryByRole("link", { name: "Usuarios" })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Cerrar Administración" }));
    expect(onClose).toHaveBeenCalledOnce();
  });

  // Tablero Usuarios (v77): cada opción con su ícono de 18 y una línea fina entre opciones, también entre las de
  // «Gestión de usuarios»; la sección en la que estás, en blanco.
  it("marca la sección activa, con ícono en cada opción y una línea fina entre ellas", () => {
    render(<MemoryRouter initialEntries={["/org/auditoria"]}><AdminPanel panel={businessNavigation.administration} open onClose={vi.fn()} /></MemoryRouter>);
    const panel = screen.getByRole("navigation", { name: "Administración" });
    const audit = within(panel).getByRole("link", { name: "Auditoría" });
    expect(audit).toHaveAttribute("aria-current", "page");
    expect(audit).toHaveClass("bg-[var(--lado-activo)]", "font-semibold", "text-[var(--marca-tx)]", "ring-1");
    expect(within(panel).getByRole("link", { name: "Empresas" })).not.toHaveAttribute("aria-current");
    for (const name of ["Empresas", "Configuración", "Página pública", "Auditoría"]) {
      expect(within(panel).getByRole("link", { name }).querySelector("svg")).not.toBeNull();
    }
    expect(within(panel).getByRole("button", { name: "Gestión de usuarios" }).querySelector("svg")).not.toBeNull();
    // «Criterio · Menús» (v92): 2 px entre opciones, con la línea fina adentro de ese espacio; los hijos de «Gestión de
    // usuarios» arrancan 2 px debajo del grupo.
    const [first, ...rest] = within(panel).getAllByRole("listitem");
    expect(first).not.toHaveClass("before:h-px");
    expect(first.parentElement).toHaveClass("gap-0.5");
    const users = within(panel).getByRole("link", { name: "Usuarios" }).closest("li");
    expect(users?.parentElement).toHaveClass("mt-0.5", "gap-0.5");
    for (const item of rest.filter((entry) => entry !== users)) {
      expect(item).toHaveClass("before:absolute", "before:-top-0.5", "before:h-px", "before:bg-[var(--lado-borde)]");
      expect(item).not.toHaveClass("border-t");
    }
  });

  it("en una ruta hija marca la opción de la que sale", () => {
    render(<MemoryRouter initialEntries={["/org/usuarios/abc"]}><AdminPanel panel={businessNavigation.administration} open onClose={vi.fn()} /></MemoryRouter>);
    expect(screen.getByRole("link", { name: "Usuarios" })).toHaveAttribute("aria-current", "page");
  });


});
