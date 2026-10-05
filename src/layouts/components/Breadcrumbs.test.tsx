import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { beforeAll, describe, expect, it } from "vitest";
import { organizationPermissions, permissionsOf, type Permissions } from "@/auth/usePermissions";
import { configureI18n } from "@/shared/i18n";
import { useBreadcrumbLeaf } from "@/shared/hooks/useBreadcrumbLeaf";
import { businessNavigation } from "../navigation/business";
import { personalNavigation } from "../navigation/personal";
import { Breadcrumbs } from "./Breadcrumbs";

beforeAll(async () => {
  await configureI18n([{ code: "es-AR", languageCode: "es", fallbackCulture: null, isEnabled: true, isDefault: true }]);
});

function Leaf({ label }: { label: string }) {
  useBreadcrumbLeaf(label);
  return null;
}

const owner = permissionsOf({ features: [], effectivePermissions: { organization: [...organizationPermissions], companies: {} } });

function crumbs(path: string, leaf?: string, permissions: Permissions = owner) {
  render(<MemoryRouter initialEntries={[path]}><Breadcrumbs navigation={businessNavigation} permissions={permissions} />{leaf ? <Leaf label={leaf} /> : null}</MemoryRouter>);
  return screen.getByRole("navigation", { name: "Migas de pan" });
}

describe("Breadcrumbs", () => {
  it("ubica Inicio en el acceso activo sin una ruta ficticia", () => {
    const navigation = crumbs("/org");
    expect(navigation).toHaveTextContent("Inicio");
    expect(screen.queryByRole("link", { name: "Inicio" })).not.toBeInTheDocument();
  });

  it("el lado Personal se queda en su propio inicio", () => {
    render(<MemoryRouter initialEntries={["/"]}><Breadcrumbs navigation={personalNavigation} permissions={owner} /></MemoryRouter>);
    expect(screen.getByRole("navigation", { name: "Migas de pan" })).toHaveTextContent("Inicio");
  });

  // Tableros Empresas, Empresa, Auditoría, Usuario y Rol: el camino real hasta la pantalla.
  it.each([
    ["/org/empresas", "Inicio/Empresas", "Empresas"],
    ["/org/configuracion", "Inicio/Configuración", "Configuración"],
    ["/org/pagina", "Inicio/Página pública", "Página pública"],
    ["/org/auditoria", "Inicio/Auditoría", "Auditoría"],
    ["/org/usuarios", "Inicio/Gestión de usuarios/Usuarios", "Usuarios"],
  ])("en %s muestra «%s»", (path, text, current) => {
    expect(crumbs(path)).toHaveTextContent(text);
    // «Criterio · Marco»: todo el camino en el mismo gris, también la pantalla en la que estás.
    expect(screen.getByText(current, { selector: "[aria-current=page]" })).not.toHaveClass("font-medium", "font-semibold", "text-[var(--t1)]");
  });

  it("en una ficha suma la opción como enlace y el nombre al final", () => {
    expect(crumbs("/org/empresas/abc", "Delta S.A.")).toHaveTextContent("Inicio/Empresas/Delta S.A.");
    expect(screen.getByRole("link", { name: "Empresas" })).toHaveAttribute("href", "/org/empresas");
    expect(screen.getByText("Delta S.A.")).toHaveAttribute("aria-current", "page");
  });

  it("en una ficha de Gestión de usuarios pasa por la sección y la opción", () => {
    expect(crumbs("/org/usuarios/abc", "Tomás Acosta")).toHaveTextContent("Inicio/Gestión de usuarios/Usuarios/Tomás Acosta");
    expect(screen.getByRole("link", { name: "Usuarios" })).toHaveAttribute("href", "/org/usuarios");
  });

  // B4: quien administra solo su empresa no abre Empresas (`companies.read`). La opción va como texto, sin enlace, como
  // «‹», que lo devuelve al Inicio; con enlace, lo llevaría a «No tenés permiso».
  it("una opción que la sesión no puede abrir va sin enlace", () => {
    const companyAdmin = permissionsOf({ features: [], effectivePermissions: { organization: [], companies: { abc: ["company.members.read"] } } });
    const navigation = crumbs("/org/empresas/abc", "Delta S.A.", companyAdmin);

    expect(navigation).toHaveTextContent("Inicio/Empresas/Delta S.A.");
    expect(within(navigation).queryByRole("link", { name: "Empresas" })).not.toBeInTheDocument();
    expect(within(navigation).getByText("Empresas")).not.toHaveAttribute("aria-current");
    expect(within(navigation).getByRole("link", { name: "Inicio" })).toHaveAttribute("href", "/org");
  });
});
