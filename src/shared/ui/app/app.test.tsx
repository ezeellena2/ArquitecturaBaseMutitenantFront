import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { House } from "lucide-react";
import { MemoryRouter } from "react-router";
import { describe, expect, it, vi } from "vitest";
import { AppBar, AppBarBellProvider, AppIconButton } from "./AppBar";
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
    expect(screen.getByRole("heading", { level: 1, name: "Más" })).toHaveClass("text-[1.5rem]", "font-bold");
    expect(screen.getByText("Grupo Delta")).toHaveClass("text-[0.78125rem]", "text-[var(--t3)]");
    expect(screen.getByRole("heading", { level: 1 }).closest("header")).toHaveClass("h-15");

    rerender(<MemoryRouter><AppBar title="Usuarios" subtitle="Administración" back={{ to: "/org/mas", label: "Volver a Más" }}
      actions={<AppIconButton label="Buscar"><House /></AppIconButton>} /></MemoryRouter>);
    expect(screen.getByRole("heading", { level: 1, name: "Usuarios" })).toHaveClass("text-[1.25rem]");
    // M-* (.ap-bar h1 y .sub): el título con interlineado 1.15 y la bajada con el normal, pegada al título. tailwind-merge
    // borraba el interlineado del título si iba antes del tamaño.
    expect(screen.getByRole("heading", { level: 1, name: "Usuarios" })).toHaveClass("leading-[1.15]");
    expect(screen.getByText("Administración")).toHaveClass("leading-[normal]");
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
    // 173: la inicial va en un cuadrado relleno de la marca, sin círculo ni degradé, como en la compu.
    expect(screen.getByText("L")).toHaveAttribute("data-slot", "avatar");
    expect(screen.getByText("L")).toHaveClass("size-6.5", "rounded-[0.5rem]", "bg-[var(--marca)]");
    expect(screen.getByText("L")).not.toHaveClass("rounded-full");
    expect(screen.getByRole("link", { name: "Inicio" })).not.toHaveAttribute("aria-current");
  });

  it("crear es un «+» flotante de 56 con nombre", async () => {
    const onClick = vi.fn();
    render(<MemoryRouter><Fab label="Invitar usuario" onClick={onClick} /></MemoryRouter>);
    const fab = screen.getByRole("button", { name: "Invitar usuario" });
    expect(fab).toHaveClass("fixed", "size-14", "rounded-2xl", "bg-[var(--marca)]");
    // Tableros M-Usuarios y M-Empresa (.ap-fab): a 25 de la línea de arriba de la barra de abajo (que mide 68 sin la raya
    // de inicio), no a 16.
    expect(fab).toHaveClass("bottom-[calc(5.8125rem+env(safe-area-inset-bottom))]");
    await userEvent.click(fab);
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("la acción fija va abajo con botones de 50 y esconde la barra de abajo", () => {
    const hideBottomNav = vi.fn();
    const { unmount } = render(<AppChromeProvider value={{ phone: true, parent: null, subtitle: null, hideBottomNav }}>
      <FixedActions><button type="button">{"Guardar cambios"}</button></FixedActions>
    </AppChromeProvider>);
    expect(screen.getByRole("button", { name: "Guardar cambios" }).parentElement).toHaveClass("sticky", "bottom-0", "border-t", "[&>*]:h-12.5");
    expect(hideBottomNav).toHaveBeenLastCalledWith(true);
    unmount();
    expect(hideBottomNav).toHaveBeenLastCalledWith(false);
  });

  it("una fila de borde a borde lleva hasta tres líneas y una línea fina debajo", () => {
    render(<ul><ListRow leading={<span>{"T"}</span>} title="Tomás Acosta" lines={["tomas@delta.test", "Activo · Delta S.A."]} /></ul>);
    const row = screen.getByRole("listitem");
    expect(row).toHaveClass("relative", "py-3", "pl-4", "after:bg-[var(--borde)]");
    expect(screen.getByText("Tomás Acosta")).toHaveClass("text-[0.96875rem]", "font-medium");
    // Con un círculo a la izquierda es la fila de una persona (M-Usuarios, .w-conv): el correo en gris claro y la
    // tercera línea en 12,5.
    expect(screen.getByText("tomas@delta.test")).toHaveClass("text-[0.875rem]", "text-[var(--t3)]");
    expect(screen.getByText("Activo · Delta S.A.")).toHaveClass("text-[0.78125rem]", "text-[var(--t3)]");
  });

  it("los ajustes van en grupos blancos con su título arriba", () => {
    render(<MemoryRouter>
      <GroupTitle action={<a href="/x">{"Sumar empresa"}</a>}>{"Empresas"}</GroupTitle>
      <SettingsGroup label="Empresas"><SettingsItem title="Delta S.A." detail="Solo lectura" to="/org/empresas/1" /></SettingsGroup>
    </MemoryRouter>);
    expect(screen.getByText("Empresas", { selector: "span" })).toHaveClass("text-[0.84375rem]", "font-semibold");
    // .ap-gtit: con el interlineado normal; con el 1.5 de la página, cada grupo bajaba 4 px.
    expect(screen.getByText("Empresas", { selector: "span" }).parentElement).toHaveClass("leading-[normal]");
    expect(screen.getByRole("list", { name: "Empresas" })).toHaveClass("rounded-[0.875rem]", "bg-[var(--superficie)]");
    expect(screen.getByRole("link", { name: /Delta S.A./ })).toHaveClass("min-h-14");
  });

  // Tableros M-Cuentas, M-WA-Chats y M-Mas-Plat: la campana del marco va al final de la barra, solo sin ‹.
  it("la barra lleva al final la campana del marco, salvo en una pantalla interna", () => {
    const bell = <a href="/avisos">{"Avisos"}</a>;
    const { rerender } = render(<MemoryRouter><AppBarBellProvider value={bell}>
      <AppBar title="Cuentas" actions={<AppIconButton label="Buscar"><House /></AppIconButton>} />
    </AppBarBellProvider></MemoryRouter>);
    expect(screen.getByRole("button", { name: "Buscar" }).parentElement!.nextElementSibling).toBe(screen.getByRole("link", { name: "Avisos" }));

    rerender(<MemoryRouter><AppBarBellProvider value={bell}>
      <AppBar title="Usuarios" back={{ to: "/mas", label: "Volver a Más" }} />
    </AppBarBellProvider></MemoryRouter>);
    expect(screen.queryByRole("link", { name: "Avisos" })).not.toBeInTheDocument();
  });

  // Tablero M-Avisos: lo que sigue pasando (sin conexión) va debajo de la barra de la pantalla.
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
