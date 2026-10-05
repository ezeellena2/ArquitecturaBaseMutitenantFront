import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { House } from "lucide-react";
import { MemoryRouter } from "react-router";
import { describe, expect, it, vi } from "vitest";
import { AppBar, AppIconButton } from "./AppBar";
import { AppChromeProvider } from "./AppChrome";
import { AppNoticesProvider } from "./AppNotices";
import { BottomNav } from "./BottomNav";
import { Fab } from "./Fab";
import { FixedActions } from "./FixedActions";
import { ListRow } from "./ListRow";
import { GroupTitle, SettingsGroup, SettingsItem } from "./SettingsGroup";

// Tableros M-* (.ap-* del lienzo): las piezas del marco de app del teléfono.
describe("marco de app del teléfono", () => {
  it("la barra de arriba lleva el título grande, o ‹ y el título de 20 en una pantalla interna", () => {
    const { rerender } = render(<MemoryRouter><AppBar title="Más" subtitle="Grupo Delta" /></MemoryRouter>);
    expect(screen.getByRole("heading", { level: 1, name: "Más" })).toHaveClass("text-[24px]", "font-bold");
    expect(screen.getByText("Grupo Delta")).toHaveClass("text-[12.5px]", "text-[var(--t3)]");
    expect(screen.getByRole("heading", { level: 1 }).closest("header")).toHaveClass("h-15");

    rerender(<MemoryRouter><AppBar title="Usuarios" subtitle="Administración" back={{ to: "/org/mas", label: "Volver a Más" }}
      actions={<AppIconButton label="Buscar"><House /></AppIconButton>} /></MemoryRouter>);
    expect(screen.getByRole("heading", { level: 1, name: "Usuarios" })).toHaveClass("text-[20px]");
    expect(screen.getByRole("link", { name: "Volver a Más" })).toHaveAttribute("href", "/org/mas");
    expect(screen.getByRole("button", { name: "Buscar" })).toHaveClass("size-11", "rounded-full");
  });

  it("la barra de abajo marca la sección y «Más» lleva la inicial", () => {
    render(<MemoryRouter><BottomNav label="Secciones" items={[
      { key: "home", label: "Inicio", to: "/org", icon: <House />, active: false },
      { key: "more", label: "Más", to: "/org/mas", avatar: "L", active: true },
    ]} /></MemoryRouter>);

    const nav = screen.getByRole("navigation", { name: "Secciones" });
    expect(nav).toHaveClass("grid", "border-t");
    expect(nav).toHaveStyle({ gridTemplateColumns: "repeat(2, minmax(0, 1fr))" });
    expect(screen.getByRole("link", { name: "Más" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Más" })).toHaveClass("text-[var(--marca-tx)]", "font-semibold");
    // Lienzo v104: la inicial va en el círculo con el degradé de la marca, como en la compu.
    expect(screen.getByText("L")).toHaveAttribute("data-slot", "avatar");
    expect(screen.getByText("L")).toHaveClass("size-[26px]", "rounded-full", "bg-linear-to-br", "from-[var(--marca)]", "to-[var(--marca-2)]");
    expect(screen.getByRole("link", { name: "Inicio" })).not.toHaveAttribute("aria-current");
  });

  it("crear es un «+» flotante de 56 con nombre", async () => {
    const onClick = vi.fn();
    render(<MemoryRouter><Fab label="Invitar usuario" onClick={onClick} /></MemoryRouter>);
    const fab = screen.getByRole("button", { name: "Invitar usuario" });
    expect(fab).toHaveClass("fixed", "size-14", "rounded-2xl", "bg-[var(--marca)]");
    await userEvent.click(fab);
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("la acción fija va abajo con botones de 50 y esconde la barra de abajo", () => {
    const hideBottomNav = vi.fn();
    const { unmount } = render(<AppChromeProvider value={{ phone: true, parent: null, subtitle: null, hideBottomNav }}>
      <FixedActions><button type="button">{"Guardar cambios"}</button></FixedActions>
    </AppChromeProvider>);
    expect(screen.getByRole("button", { name: "Guardar cambios" }).parentElement).toHaveClass("sticky", "bottom-0", "border-t", "[&>*]:h-[50px]");
    expect(hideBottomNav).toHaveBeenLastCalledWith(true);
    unmount();
    expect(hideBottomNav).toHaveBeenLastCalledWith(false);
  });

  it("una fila de borde a borde lleva hasta tres líneas y una línea fina debajo", () => {
    render(<ul><ListRow leading={<span>{"T"}</span>} title="Tomás Acosta" lines={["tomas@delta.test", "Activo · Delta S.A."]} /></ul>);
    const row = screen.getByRole("listitem");
    expect(row).toHaveClass("relative", "py-3", "pl-4", "after:bg-[var(--borde)]");
    expect(screen.getByText("Tomás Acosta")).toHaveClass("text-[15.5px]", "font-medium");
    // Con un círculo a la izquierda es la fila de una persona (M-Usuarios, .w-conv): el correo en gris claro y la
    // tercera línea en 12,5.
    expect(screen.getByText("tomas@delta.test")).toHaveClass("text-[14px]", "text-[var(--t3)]");
    expect(screen.getByText("Activo · Delta S.A.")).toHaveClass("text-[12.5px]", "text-[var(--t3)]");
  });

  it("los ajustes van en grupos blancos con su título arriba", () => {
    render(<MemoryRouter>
      <GroupTitle action={<a href="/x">{"Sumar empresa"}</a>}>{"Empresas"}</GroupTitle>
      <SettingsGroup label="Empresas"><SettingsItem title="Delta S.A." detail="Solo lectura" to="/org/empresas/1" /></SettingsGroup>
    </MemoryRouter>);
    expect(screen.getByText("Empresas", { selector: "span" })).toHaveClass("text-[13.5px]", "font-semibold");
    expect(screen.getByRole("list", { name: "Empresas" })).toHaveClass("rounded-[14px]", "bg-[var(--lado-activo)]");
    expect(screen.getByRole("link", { name: /Delta S.A./ })).toHaveClass("min-h-14");
  });

  // Tablero M-Avisos: lo que sigue pasando (sin conexión, versión nueva) va debajo de la barra de la pantalla.
  it("la barra aloja debajo los avisos que siguen pasando", () => {
    const release = vi.fn();
    const claim = vi.fn(() => release);
    const { unmount } = render(<MemoryRouter><AppNoticesProvider value={{ notices: <p>{"Sin conexión"}</p>, claim }}>
      <AppBar title="Configuración" />
    </AppNoticesProvider></MemoryRouter>);

    expect(screen.getByRole("heading", { level: 1 }).closest("header")!.nextElementSibling).toHaveTextContent("Sin conexión");
    expect(claim).toHaveBeenCalledOnce();
    unmount();
    expect(release).toHaveBeenCalledOnce();
  });
});
