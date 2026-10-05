import { screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
import { asPhone } from "@/test/utils/phone";
import { renderRouteWithProviders } from "@/test/utils/renderWithProviders";

let restore: () => void = () => {};
beforeEach(() => { restore = asPhone(); });
afterEach(() => restore());

// Tableros M-Mas-Personal y M-WA-Menu: «Más» junta quién sos, tus perfiles, Administración, Mi cuenta y Salir.
describe("Más en el teléfono", () => {
  it("en una organización muestra perfiles, Administración según permisos, Mi cuenta y Salir", async () => {
    const { container } = renderRouteWithProviders("/mas", { as: "business-e6-admin" });

    expect(await screen.findByRole("heading", { level: 1, name: "Más" })).toHaveClass("text-[24px]");
    const profiles = screen.getByRole("list", { name: "Perfiles" });
    expect(within(profiles).getByText("Personal")).toBeInTheDocument();
    expect(within(profiles).getByText("Empresa A")).toBeInTheDocument();
    const administration = screen.getByRole("list", { name: "Administración" });
    expect(within(administration).getByRole("link", { name: "Usuarios" })).toHaveAttribute("href", "/org/usuarios");
    // M-WA-Menu: en «Más», «Roles» a secas; la pantalla que abre sigue titulada «Roles y permisos».
    expect(within(administration).getByRole("link", { name: "Roles" })).toHaveAttribute("href", "/org/roles");
    expect(within(administration).getByRole("link", { name: "Auditoría" })).toHaveAttribute("href", "/org/auditoria");
    expect(screen.getByRole("link", { name: "Mi cuenta" })).toHaveAttribute("href", "/cuenta");
    expect(screen.getByRole("button", { name: "Salir" })).toBeVisible();
    expect(within(screen.getByRole("navigation", { name: "Secciones" })).getByRole("link", { name: "Más" })).toHaveAttribute("aria-current", "page");
    // Lienzo v104 (.ap-yo .w-av): tu inicial, de 56, con el degradé de la marca, como en la barra de abajo y en la compu.
    const [you, tab] = container.querySelectorAll("[data-slot='avatar']");
    expect(you).toHaveClass("size-14", "text-[20px]", "bg-linear-to-br", "from-[var(--marca)]", "to-[var(--marca-2)]");
    expect(tab).toHaveClass("size-[26px]", "bg-linear-to-br");
    // .ap-yo: el nombre y el correo con el interlineado normal, como el resto del teléfono.
    expect(you.nextElementSibling).toHaveClass("leading-[normal]");
    expect(await axe(container)).toHaveNoViolations();
  });

  it("en el perfil personal no hay Administración", async () => {
    renderRouteWithProviders("/mas", { as: "consumer-with-organizations" });

    expect(await screen.findByRole("heading", { level: 1, name: "Más" })).toBeVisible();
    expect(screen.getByText("Personal", { selector: "[data-slot='app-bar'] span" })).toBeInTheDocument();
    expect(screen.queryByRole("list", { name: "Administración" })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Mi cuenta" })).toBeVisible();
  });
});
