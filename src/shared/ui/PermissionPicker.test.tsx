import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import { renderWithProviders } from "@/test/utils/renderWithProviders";
import { AppChromeProvider } from "./app/AppChrome";
import { PermissionPicker } from "./PermissionPicker";
import { allowedPermissions, type PermissionAreaGroup } from "./permissionAreas";

const groups: PermissionAreaGroup[] = [
  { area: "users", name: "Usuarios", permissions: [
    { code: "users.read", name: "Ver usuarios", description: "Consultar la lista y la ficha.", includes: [], grantable: true },
    { code: "users.invite", name: "Invitar usuarios", description: "Enviar una invitación.", includes: ["users.read"], grantable: true },
    { code: "users.manage", name: "Administrar usuarios", description: "Editar y dar de baja.", includes: ["users.read"], grantable: true },
  ] },
  { area: "settings", name: "Configuración", permissions: [
    { code: "settings.read", name: "Ver la configuración", description: "Consultarla.", includes: [], grantable: true },
    { code: "settings.manage", name: "Cambiar la configuración", description: "Editarla.", includes: ["settings.read"], grantable: false },
  ] },
  { area: "audit", name: "Auditoría", permissions: [
    { code: "audit.read", name: "Ver la auditoría", description: "El registro.", includes: [], grantable: true },
  ] },
];

function Editor({ initial = [], onChange = vi.fn(), phone = false }: { initial?: string[]; onChange?: (next: string[]) => void; phone?: boolean }) {
  const [picked, setPicked] = useState(() => allowedPermissions(groups, initial));
  return <AppChromeProvider value={{ phone, parent: null, subtitle: null, hideBottomNav: () => {} }}>
    <main><PermissionPicker label="Permisos" groups={groups} picked={picked} saved={initial}
      onChange={(next) => { setPicked(next); onChange(next); }} /></main>
  </AppChromeProvider>;
}

const area = (name: string) => screen.getByRole("button", { name: `Abrir o cerrar ${name}` });
const areaBox = (name: string) => screen.getByRole("checkbox", { name: `Todos los permisos de ${name}` });

describe("PermissionPicker", () => {
  it("una tabla de una columna, «Permiso»: abiertas las áreas con algo, cada una con su casilla y qué permite en su (i)", async () => {
    const { container } = renderWithProviders(<Editor initial={["users.read"]} />);

    const table = screen.getByRole("table", { name: "Permisos" });
    expect(within(table).getByRole("columnheader", { name: "Permiso" })).toBeVisible();
    expect(area("Usuarios")).toHaveAttribute("aria-expanded", "true");
    expect(area("Configuración")).toHaveAttribute("aria-expanded", "false");
    expect(areaBox("Usuarios")).toHaveAttribute("data-state", "indeterminate");
    expect(areaBox("Auditoría")).not.toBeChecked();
    // Sin cuentas ni descripciones a la vista: qué permite cada uno va en la (i), un permiso por renglón.
    expect(screen.queryByText(/de 3/)).toBeNull();
    expect(screen.getByRole("button", { name: "Más información sobre Usuarios" })).toBeVisible();
    const help = ["Ver usuarios — Consultar la lista y la ficha.", "Invitar usuarios — Enviar una invitación.", "Administrar usuarios — Editar y dar de baja."];
    expect(screen.getByText((_, element) => element?.textContent === help.join("\n") && element.hasAttribute("hidden"))).not.toBeVisible();
    expect(screen.getByRole("checkbox", { name: "Ver usuarios" })).toHaveAccessibleDescription("Consultar la lista y la ficha.");
    expect(await axe(container)).toHaveNoViolations();
  });

  it("lo incluido se ve marcado y apagado con su motivo, y nombra a todos los que lo incluyen (260)", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderWithProviders(<Editor initial={["users.read"]} onChange={onChange} />);

    await user.click(screen.getByRole("checkbox", { name: "Administrar usuarios" }));
    expect(onChange).toHaveBeenLastCalledWith(["users.manage", "users.read"]);
    const read = screen.getByRole("checkbox", { name: "Ver usuarios" });
    expect(read).toBeChecked();
    expect(read).toHaveAttribute("aria-disabled", "true");
    expect(read).toHaveAccessibleDescription("Consultar la lista y la ficha. Lo incluye «Administrar usuarios».");

    await user.click(screen.getByRole("checkbox", { name: "Invitar usuarios" }));
    expect(read).toHaveAccessibleDescription("Consultar la lista y la ficha. Lo incluyen «Invitar usuarios» y «Administrar usuarios».");

    // Tocar lo incluido solo muestra el motivo; quitar a quien lo incluye lo deja marcado y se puede tocar de nuevo.
    onChange.mockClear();
    await user.click(screen.getByText("Ver usuarios"));
    expect(onChange).not.toHaveBeenCalled();
    expect(await screen.findByRole("tooltip")).toHaveTextContent("Lo incluyen «Invitar usuarios» y «Administrar usuarios».");
    // Rol-Base2: el globo se abre desde la casilla, hacia adentro de la tabla, y no centrado sobre ella.
    expect(screen.getByRole("tooltip").closest("[data-slot=tooltip-content]")).toHaveAttribute("data-align", "start");
    await user.keyboard("{Escape}");
    await user.click(screen.getByRole("checkbox", { name: "Invitar usuarios" }));
    await user.click(screen.getByRole("checkbox", { name: "Administrar usuarios" }));
    expect(onChange).toHaveBeenLastCalledWith(["users.read"]);
    expect(screen.getByRole("checkbox", { name: "Ver usuarios" })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: "Ver usuarios" })).not.toHaveAttribute("aria-disabled");
  });

  it("lo que quien edita no tiene queda apagado con su motivo, y el área que lo tiene también (269)", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderWithProviders(<Editor initial={["settings.read"]} onChange={onChange} />);

    const manage = screen.getByRole("checkbox", { name: "Cambiar la configuración" });
    expect(manage).toHaveAttribute("aria-disabled", "true");
    expect(manage).toHaveAccessibleDescription("Editarla. No tenés este permiso.");
    expect(areaBox("Configuración")).toHaveAttribute("aria-disabled", "true");
    expect(areaBox("Configuración")).toHaveAccessibleDescription("Tiene permisos que no tenés.");
    await user.click(manage);
    await user.click(areaBox("Configuración"));
    expect(onChange).not.toHaveBeenCalled();
    // Lo que sí tiene se sigue eligiendo.
    await user.click(screen.getByRole("checkbox", { name: "Ver la configuración" }));
    expect(onChange).toHaveBeenLastCalledWith([]);
  });

  it("la casilla de un permiso va encima de su nombre, que cubre la fila: el puntero da en ella, y tocar el nombre también la marca", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderWithProviders(<Editor initial={["audit.read"]} onChange={onChange} />);

    // jsdom no apila capas: se mira que el nombre cubra la fila y que la casilla tenga su capa encima.
    const name = screen.getByText("Ver la auditoría", { selector: "label" });
    expect(name).toHaveClass("after:absolute", "after:inset-0");
    expect(screen.getByRole("checkbox", { name: "Ver la auditoría" })).toHaveClass("relative", "z-[1]");
    await user.click(name);
    expect(onChange).toHaveBeenLastCalledWith([]);
  });

  it("la casilla del área elige el área entera con lo incluido, y la vuelve a vaciar", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderWithProviders(<Editor onChange={onChange} />);

    // Un rol nuevo: todas cerradas.
    for (const name of ["Usuarios", "Configuración", "Auditoría"]) expect(area(name)).toHaveAttribute("aria-expanded", "false");
    await user.click(areaBox("Usuarios"));
    expect(onChange).toHaveBeenLastCalledWith(["users.invite", "users.manage", "users.read"]);
    expect(areaBox("Usuarios")).toBeChecked();
    await user.click(areaBox("Usuarios"));
    expect(onChange).toHaveBeenLastCalledWith([]);
  });

  it("el Dueño se lee: con tildes, sin casillas y con sus áreas cerradas", async () => {
    const user = userEvent.setup();
    const all = groups.flatMap((group) => group.permissions.map((permission) => permission.code));
    renderWithProviders(<PermissionPicker label="Permisos" readOnly groups={groups} picked={all} />);

    expect(screen.queryByRole("checkbox")).toBeNull();
    expect(area("Usuarios")).toHaveAttribute("aria-expanded", "false");
    await user.click(screen.getByText("Usuarios"));
    expect(area("Usuarios")).toHaveAttribute("aria-expanded", "true");
    expect(screen.getAllByRole("img", { name: "Tiene este permiso" })).toHaveLength(3);
    expect(screen.getByText("Administrar usuarios")).toBeVisible();
  });

  it("al leer los permisos de un operador, solo las áreas con algo, abiertas, y en cada una lo que tiene", () => {
    renderWithProviders(<PermissionPicker label="Permisos de plataforma" readOnly openWhenRead groups={groups} picked={["audit.read"]} />);

    expect(screen.queryByRole("button", { name: "Abrir o cerrar Usuarios" })).toBeNull();
    expect(area("Auditoría")).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText("Ver la auditoría")).toBeVisible();
  });

  // M-Rol-Base2: en el teléfono la flecha y la casilla del área tienen cada una su zona de 44 × 44, una al lado de la otra.
  // A 390 y a 320 la fila es la misma (sin anchos fijos): tocar la flecha solo abre o cierra, y tocar la casilla solo elige.
  it.each([390, 320])("en el teléfono a %i, la flecha y la casilla del área responden cada una a su toque, sin pisarse", async (width) => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    window.innerWidth = width;
    renderWithProviders(<Editor phone onChange={onChange} />);

    const arrow = area("Usuarios");
    const box = areaBox("Usuarios");
    expect(arrow).toHaveClass("max-md:size-11");
    const zone = box.closest("label")!.parentElement!;
    expect(zone).toHaveClass("max-md:size-11");
    expect(zone.contains(arrow)).toBe(false);
    expect(arrow.contains(zone)).toBe(false);

    await user.click(arrow);
    expect(arrow).toHaveAttribute("aria-expanded", "true");
    expect(onChange).not.toHaveBeenCalled();
    await user.click(box.closest("label")!);
    expect(onChange).toHaveBeenLastCalledWith(["users.invite", "users.manage", "users.read"]);
    expect(arrow).toHaveAttribute("aria-expanded", "true");
  });
});
