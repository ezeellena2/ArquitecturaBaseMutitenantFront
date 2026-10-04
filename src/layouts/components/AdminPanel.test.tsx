import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Link, MemoryRouter } from "react-router";
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

  // Tablero Usuarios: cada opción con su ícono de 18 y una línea fina entre opciones; la sección en la que estás, en
  // blanco. «Criterio · Menús» (v92): 2 px entre opciones, con la línea fina adentro de ese espacio.
  it("marca la sección activa, con ícono en cada opción y una línea fina entre ellas", () => {
    render(<MemoryRouter initialEntries={["/org/auditoria"]}><AdminPanel panel={businessNavigation.administration} open onClose={vi.fn()} /></MemoryRouter>);
    const panel = screen.getByRole("navigation", { name: "Administración" });
    const audit = within(panel).getByRole("link", { name: "Auditoría" });
    expect(audit).toHaveAttribute("aria-current", "page");
    expect(audit).toHaveClass("bg-[var(--lado-activo)]", "font-semibold", "text-[var(--marca-tx)]", "ring-1");
    expect(within(panel).getByRole("link", { name: "Empresas" })).not.toHaveAttribute("aria-current");
    for (const name of ["Gestión de usuarios", "Empresas", "Configuración", "Página pública", "Auditoría"]) {
      expect(within(panel).getByRole("link", { name }).querySelector("svg")).not.toBeNull();
    }
    const [first, ...rest] = within(panel).getAllByRole("listitem");
    expect(first).not.toHaveClass("before:h-px");
    expect(first.parentElement).toHaveClass("gap-0.5");
    for (const item of rest) {
      expect(item).toHaveClass("before:absolute", "before:-top-0.5", "before:h-px", "before:bg-[var(--lado-borde)]");
      expect(item).not.toHaveClass("border-t");
    }
  });

  // Lienzo v102 («Criterio · Menús»): un grupo arranca abierto solo si estás en una de sus pantallas; si no, cerrado,
  // con la flechita a la derecha, y lleva a su primera opción. Los hijos van con 18 de sangría y 10 de relleno, 2 px
  // debajo del grupo.
  it("abre solo el grupo de la pantalla en la que estás; los demás llevan a su primera opción", () => {
    const { unmount } = render(<MemoryRouter initialEntries={["/org/usuarios"]}><AdminPanel panel={businessNavigation.administration} open onClose={vi.fn()} /></MemoryRouter>);
    const group = screen.getByRole("button", { name: "Gestión de usuarios" });
    expect(group).toHaveAttribute("aria-expanded", "true");
    expect(group).toHaveClass("font-semibold", "text-[var(--t1)]");
    const children = screen.getByRole("link", { name: "Roles y permisos" }).closest("ul");
    expect(children).toHaveClass("mt-0.5", "ml-[18px]", "gap-0.5", "pl-2.5");
    unmount();

    render(<MemoryRouter initialEntries={["/org/empresas"]}><AdminPanel panel={businessNavigation.administration} open onClose={vi.fn()} /></MemoryRouter>);
    expect(screen.queryByRole("button", { name: "Gestión de usuarios" })).not.toBeInTheDocument();
    const closed = screen.getByRole("link", { name: "Gestión de usuarios" });
    expect(closed).toHaveAttribute("href", "/org/usuarios");
    expect(closed).not.toHaveAttribute("aria-expanded");
    expect(closed.querySelector(".-rotate-90")).not.toBeNull();
    expect(screen.queryByRole("link", { name: "Roles y permisos" })).not.toBeInTheDocument();
  });

  it("lo que cerrás o abrís a mano vale mientras estás en esa pantalla", async () => {
    render(<MemoryRouter initialEntries={["/org/roles"]}>
      <AdminPanel panel={businessNavigation.administration} open onClose={vi.fn()} />
      <Link to="/org/usuarios">{"Ir a Usuarios"}</Link>
    </MemoryRouter>);
    const group = screen.getByRole("button", { name: "Gestión de usuarios" });
    await userEvent.click(group);
    expect(group).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("link", { name: "Roles y permisos" })).not.toBeInTheDocument();
    await userEvent.click(group);
    expect(group).toHaveAttribute("aria-expanded", "true");
    await userEvent.click(group);
    expect(group).toHaveAttribute("aria-expanded", "false");

    await userEvent.click(screen.getByRole("link", { name: "Ir a Usuarios" }));
    expect(screen.getByRole("button", { name: "Gestión de usuarios" })).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("link", { name: "Roles y permisos" })).toBeVisible();
  });

  it("en una ruta hija marca la opción de la que sale", () => {
    render(<MemoryRouter initialEntries={["/org/usuarios/abc"]}><AdminPanel panel={businessNavigation.administration} open onClose={vi.fn()} /></MemoryRouter>);
    expect(screen.getByRole("link", { name: "Usuarios" })).toHaveAttribute("aria-current", "page");
  });


});
