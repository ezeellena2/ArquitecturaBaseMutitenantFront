import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { configureI18n } from "@/shared/i18n";
import { renderWithProviders } from "@/test/utils/renderWithProviders";
import { DataTable, type Column } from "../DataTable";
import { FilterBar } from "../FilterBar";
import { Page } from "../Page";
import { Pagination } from "../Pagination";
import { AppChromeProvider } from "./AppChrome";
import { ListRow, RowAvatar } from "./ListRow";

beforeAll(async () => {
  await configureI18n([{ code: "es-AR", languageCode: "es", fallbackCulture: null, isEnabled: true, isDefault: true }]);
});

const phone = { phone: true, parent: { to: "/mas", label: "Volver a Más" }, subtitle: "Administración", hideBottomNav: () => {} };

interface Row { id: string; name: string; email: string }
const rows: Row[] = [{ id: "1", name: "Tomás Acosta", email: "tomas@delta.test" }];
const columns: Column<Row>[] = [{ id: "name", header: "Usuario", type: "text", mobile: "primary", value: (row) => row.name }];

// Tableros M-Usuarios, M-Roles y M-Auditoria-Org: en el teléfono las listas son filas de borde a borde, los filtros
// son íconos en la barra y el paginado es «Cargar más».
describe("listas en el teléfono", () => {
  it("la fila lleva a la ficha, con el círculo, un dato a la derecha y hasta tres líneas", () => {
    render(<MemoryRouter><ul><ListRow to="/org/usuarios/1" leading={<RowAvatar name="Tomás Acosta" />} title="Tomás Acosta" meta="1 usuario"
      lines={["tomas@delta.test", "Activo"]} /></ul></MemoryRouter>);

    expect(screen.getByRole("link", { name: /Tomás Acosta/ })).toHaveAttribute("href", "/org/usuarios/1");
    expect(screen.getByText("1 usuario")).toHaveClass("text-[12.5px]", "text-[var(--t3)]");
    // Lienzo v104: el círculo de una persona lleva el degradé de la marca, como en la compu.
    expect(screen.getByText("T")).toHaveAttribute("data-slot", "avatar");
    expect(screen.getByText("T")).toHaveClass("size-11", "rounded-full", "bg-linear-to-br", "from-[var(--marca)]", "to-[var(--marca-2)]");
  });

  // Tableros M-Roles y M-Empresas (.ap-fila .ap-ib): en una fila sin círculo el ⋮ va gris y 4 más afuera; en la de una
  // persona (M-Usuarios, M-Empresa), casi negro y en su lugar.
  it("el ⋮ de una fila sin círculo va gris y 4 más afuera; el de una persona, no", () => {
    render(<MemoryRouter><ul>
      <ListRow title="Recursos humanos" trailing={<button type="button" data-slot="row-actions">{"⋮"}</button>} />
      <ListRow leading={<RowAvatar name="Tomás Acosta" />} title="Tomás Acosta" trailing={<button type="button" data-slot="row-actions">{"⋮"}</button>} />
    </ul></MemoryRouter>);

    const [plain, person] = screen.getAllByRole("listitem");
    expect(plain).toHaveClass("[&>[data-slot=row-actions]]:text-[var(--t2)]", "[&>[data-slot=row-actions]]:-mr-1");
    expect(person).not.toHaveClass("[&>[data-slot=row-actions]]:text-[var(--t2)]");
    expect(person).not.toHaveClass("[&>[data-slot=row-actions]]:-mr-1");
  });

  // Tablero M-Usuarios (.w-av.g): una invitación sin nombre lleva «@» en gris, sin el degradé.
  it("una invitación sin nombre lleva «@» en gris", () => {
    render(<RowAvatar name="" invitation />);

    expect(screen.getByText("@")).toHaveAttribute("data-slot", "avatar");
    expect(screen.getByText("@")).toHaveClass("size-11", "bg-[var(--s3)]", "text-[var(--t2)]");
    expect(screen.getByText("@")).not.toHaveClass("bg-linear-to-br");
  });

  // Tableros M-* (.ap-fila y .w-conv): las líneas con la altura normal de la letra, 80 px por fila de tres líneas. Con el
  // círculo de una persona (M-Usuarios, M-Empresa), el círculo va arriba, el correo en gris claro y la tercera línea en 12,5.
  it("las líneas van con la altura normal de la letra; la fila de una persona lleva el círculo arriba y la tercera línea en 12,5", () => {
    const { unmount } = render(<MemoryRouter><ul><ListRow to="/org/usuarios/1" leading={<RowAvatar name="Tomás Acosta" />} title="Tomás Acosta"
      lines={["tomas@delta.test", "Activo"]} /></ul></MemoryRouter>);
    const person = screen.getByRole("link", { name: /Tomás Acosta/ });
    expect(person).toHaveClass("items-start");
    expect(screen.getByText("tomas@delta.test").parentElement).toHaveClass("leading-[normal]");
    expect(screen.getByText("tomas@delta.test")).toHaveClass("text-[14px]", "text-[var(--t3)]");
    expect(screen.getByText("Activo")).toHaveClass("text-[12.5px]", "text-[var(--t3)]");
    unmount();

    render(<MemoryRouter><ul><ListRow to="/org/roles/1" title="Dueño" lines={["De sistema", "12 permisos"]} /></ul></MemoryRouter>);
    expect(screen.getByRole("link", { name: /Dueño/ })).toHaveClass("items-center");
    expect(screen.getByText("De sistema")).toHaveClass("text-[14px]", "text-[var(--t2)]");
    expect(screen.getByText("12 permisos")).toHaveClass("text-[13px]", "text-[var(--t3)]");
  });

  it("la tabla es una lista de filas cuando la pantalla da una fila de teléfono", () => {
    render(<MemoryRouter><AppChromeProvider value={phone}>
      <DataTable columns={columns} rows={rows} rowKey={(row) => row.id} mobileRow={(row) => <ListRow title={row.name} lines={[row.email]} />} />
    </AppChromeProvider></MemoryRouter>);

    expect(screen.queryByRole("table")).not.toBeInTheDocument();
    expect(screen.getByRole("listitem")).toHaveTextContent("Tomás Acostatomas@delta.test");
  });

  it("los filtros son íconos en la barra y se eligen en una hoja", async () => {
    const onChange = vi.fn();
    const onSearchChange = vi.fn();
    render(<MemoryRouter><AppChromeProvider value={phone}><Page title="Usuarios">
      <FilterBar label="Filtrar usuarios" searchLabel="Buscar por nombre o correo" searchValue="" onSearchChange={onSearchChange} clearLabel="Limpiar" onClear={vi.fn()}
        filters={[{ key: "state", label: "Estado: todos", menuLabel: "Filtrar por estado", value: "", active: false, onChange,
          options: [{ value: "all", label: "Todos", count: 11 }, { value: "Active", label: "Activos", count: 6 }] }]} />
    </Page></AppChromeProvider></MemoryRouter>);

    const bar = screen.getByRole("heading", { level: 1, name: "Usuarios" }).closest("header")!;
    expect(screen.queryByRole("search")).not.toBeInTheDocument();
    await userEvent.click(within(bar).getByRole("button", { name: "Buscar por nombre o correo" }));
    await userEvent.type(screen.getByRole("searchbox", { name: "Buscar por nombre o correo" }), "L");
    expect(onSearchChange).toHaveBeenLastCalledWith("L");

    await userEvent.click(within(bar).getByRole("button", { name: "Filtrar usuarios" }));
    const sheet = await screen.findByRole("dialog", { name: "Filtrar usuarios" });
    expect(within(sheet).getByText("Estado")).toBeVisible();
    expect(within(sheet).getByRole("radio", { name: /Todos/ })).toBeChecked();
    await userEvent.click(within(sheet).getByRole("radio", { name: /Activos/ }));
    expect(onChange).toHaveBeenCalledWith("Active");
  });

  // Tableros M-Roles, M-Empresas y M-Auditoria-Org: solo el filtro en la barra; M-Empresa, ni la lupa ni el filtro.
  it("cada lista lleva en la barra solo los íconos de su tablero", () => {
    const props = { label: "Filtrar roles", searchLabel: "Buscar roles", searchValue: "", onSearchChange: vi.fn(), clearLabel: "Limpiar", onClear: vi.fn(),
      filters: [{ key: "scope", label: "Vale en: todos", menuLabel: "Filtrar por dónde vale", value: "", active: false, onChange: vi.fn(), options: [{ value: "all", label: "Todos" }] }] };
    const { unmount } = render(<MemoryRouter><AppChromeProvider value={phone}><Page title="Roles"><FilterBar {...props} phoneTools="filter" /></Page></AppChromeProvider></MemoryRouter>);
    const bar = screen.getByRole("heading", { level: 1, name: "Roles" }).closest("header")!;
    expect(within(bar).queryByRole("button", { name: "Buscar roles" })).not.toBeInTheDocument();
    expect(within(bar).getByRole("button", { name: "Filtrar roles" })).toBeInTheDocument();
    unmount();

    render(<MemoryRouter><AppChromeProvider value={phone}><Page title="Delta S.A."><FilterBar {...props} phoneTools="none" /></Page></AppChromeProvider></MemoryRouter>);
    const company = screen.getByRole("heading", { level: 1, name: "Delta S.A." }).closest("header")!;
    expect(within(company).queryByRole("button", { name: "Buscar roles" })).not.toBeInTheDocument();
    expect(within(company).queryByRole("button", { name: "Filtrar roles" })).not.toBeInTheDocument();
  });

  it("el paginado es «Cargar más», que pide la página más grande que sigue", async () => {
    const onPageSizeChange = vi.fn();
    renderWithProviders(<AppChromeProvider value={phone}>
      <Pagination page={1} pageSize={10} totalCount={11} totalPages={2} hasPrevious={false} hasNext onPageChange={vi.fn()} onPageSizeChange={onPageSizeChange} />
    </AppChromeProvider>);

    await userEvent.click(screen.getByRole("button", { name: "Cargar más" }));
    expect(onPageSizeChange).toHaveBeenCalledWith(20);
  });
});
