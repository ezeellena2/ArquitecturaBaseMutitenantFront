import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { DataTable, type Column } from "./DataTable";

const formatDate = vi.hoisted(() => vi.fn(() => "27/09/2026"));
const formatDateTime = vi.hoisted(() => vi.fn(() => "27/09/2026 12:00"));
const formatMoney = vi.hoisted(() => vi.fn(() => "$ 1.234,50"));
const formatDecimal = vi.hoisted(() => vi.fn(() => "12,50"));
const formatPercent = vi.hoisted(() => vi.fn(() => "12,5 %"));
const formatEnum = vi.hoisted(() => vi.fn(() => "Activo"));

vi.mock("@/shared/format/useFormat", () => ({
  useFormat: () => ({
    isLoading: false,
    formatDate,
    formatDateTime,
    formatMoney,
    formatDecimal,
    formatPercent,
    formatEnum,
    formatEmpty: () => "—",
  }),
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => ({
      "actions.retry": "Reintentar",
      "states.empty": "No hay nada para mostrar",
      "states.loading": "Cargando…",
      "format:emptyLabel": "Sin dato",
    })[key as "actions.retry" | "states.empty" | "states.loading" | "format:emptyLabel"] ?? key,
  }),
}));

interface Row {
  id: string;
  name: string;
  status: string | null;
  email: string;
  createdAtUtc: string;
  total: { amount: number; currency: string } | null;
  score: number;
  rate: number;
}

const rows: Row[] = [{
  id: "1",
  name: "Ana García",
  status: "Active",
  email: "ana@example.com",
  createdAtUtc: "2026-09-27T15:00:00Z",
  total: { amount: 1234.5, currency: "ARS" },
  score: 12.5,
  rate: 0.125,
}];

const columns: Column<Row>[] = [
  { id: "name", header: "Nombre", type: "text", value: (row) => row.name, mobile: "primary", sortable: true },
  { id: "email", header: "Correo", type: "text", value: (row) => row.email, priority: "low" },
  { id: "status", header: "Estado", type: "status", tones: { enum: "TestStatus", tones: { Active: "success" } }, value: (row) => row.status, mobile: "status" },
  { id: "createdAtUtc", header: "Fecha", type: "date", value: (row) => row.createdAtUtc, sortable: true },
  { id: "total", header: "Total", type: "money", value: (row) => row.total },
  { id: "score", header: "Puntaje", type: "decimal", digits: 2, value: (row) => row.score },
  { id: "rate", header: "Tasa", type: "percent", value: (row) => row.rate },
  { id: "actions", header: "Acciones", type: "actions", cell: (row) => <button type="button" aria-label={`Acciones de ${row.name}`}>{"⋮"}</button> },
];

describe("DataTable", () => {
  it("delega cada tipo a shared/ui/format y conserva tooltip, vacío y alineación", () => {
    render(<DataTable columns={columns} rows={[rows[0], { ...rows[0], id: "2", total: null }]} rowKey={(row) => row.id} />);

    expect(screen.getAllByRole("row")).toHaveLength(3);
    expect(screen.getAllByText("27/09/2026")[0]).toHaveAttribute("title", "27/09/2026 12:00");
    expect(formatDate).toHaveBeenCalledWith(rows[0].createdAtUtc);
    expect(formatMoney).toHaveBeenCalledWith(rows[0].total);
    expect(formatDecimal).toHaveBeenCalledWith(12.5, 2);
    expect(formatPercent).toHaveBeenCalledWith(0.125);
    expect(formatEnum).toHaveBeenCalledWith("TestStatus", "Active");
    expect(screen.getAllByText("$ 1.234,50")[0]).toHaveAccessibleName("$ 1.234,50 ARS");
    expect(screen.getByRole("img", { name: "Sin dato" })).toHaveTextContent("—");
    expect(screen.getAllByRole("cell")[4]).toHaveClass("text-right", "tabular-nums");
  });

  it("expone aria-sort y avisa el campo ordenable sin ordenar filas en el cliente", async () => {
    const onSortChange = vi.fn();
    const { rerender } = render(<DataTable columns={columns} rows={rows} rowKey={(row) => row.id} sort="name" onSortChange={onSortChange} />);
    expect(screen.getByRole("columnheader", { name: "Nombre" })).toHaveAttribute("aria-sort", "ascending");
    expect(screen.getByRole("columnheader", { name: "Fecha" })).toHaveAttribute("aria-sort", "none");
    expect(screen.getByRole("columnheader", { name: "Correo" })).not.toHaveAttribute("aria-sort");

    await userEvent.click(screen.getByRole("button", { name: "Nombre" }));
    expect(onSortChange).toHaveBeenCalledWith("name");
    rerender(<DataTable columns={columns} rows={rows} rowKey={(row) => row.id} sort="-name" onSortChange={onSortChange} />);
    expect(screen.getByRole("columnheader", { name: "Nombre" })).toHaveAttribute("aria-sort", "descending");
  });

  it("muestra carga, vacío y error con reintento traducido", async () => {
    const onRetry = vi.fn();
    const { rerender } = render(<DataTable columns={columns} rows={[]} rowKey={(row) => row.id} isLoading />);
    expect(screen.getByRole("status")).toHaveTextContent("Cargando…");

    rerender(<DataTable columns={columns} rows={[]} rowKey={(row) => row.id} emptyTitle="Sin usuarios" emptyAction={<button type="button">{"Limpiar"}</button>} />);
    expect(screen.getByText("Sin usuarios")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Limpiar" })).toBeInTheDocument();
    // «Criterio · Tablas» («Ninguno coincide») y tablero Roles: la tabla conserva sus encabezados y el aviso va debajo, en
    // el cuerpo de la tabla, sin un recuadro punteado propio.
    expect(screen.getByRole("columnheader", { name: "Nombre" })).toBeInTheDocument();
    expect(screen.getByRole("cell", { name: /Sin usuarios/ })).toHaveAttribute("colspan", String(columns.length));
    expect(screen.getByRole("cell", { name: /Sin usuarios/ }).closest("tr")).toHaveClass("border-b-0");
    expect(screen.getByText("Sin usuarios").parentElement).not.toHaveClass("border-dashed");

    rerender(<DataTable columns={columns} rows={[]} rowKey={(row) => row.id} error="No se pudo cargar" errorDescription="Código 123" onRetry={onRetry} />);
    expect(screen.getByText("No se pudo cargar")).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Nombre" })).toBeInTheDocument();
    expect(screen.getByText("Código 123")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Reintentar" }));
    expect(onRetry).toHaveBeenCalledOnce();
  });

  // «Criterio · Tablas», Cuando vuelve a leer (base de la 12): las filas quedan atenuadas y fuera de alcance, y una línea
  // corre bajo el encabezado hasta que llega lo nuevo.
  it("mientras vuelve a leer atenúa las filas, las deja fuera de alcance y corre la línea bajo el encabezado", () => {
    const { container, rerender } = render(<DataTable columns={columns} rows={rows} rowKey={(row) => row.id} isFetching />);
    const table = screen.getByRole("table", { hidden: true });
    expect(table).toHaveAttribute("aria-busy", "true");
    expect(within(table).getByText("Ana García")).toBeInTheDocument();
    const header = container.querySelector("thead")!;
    const body = container.querySelector("tbody")!;
    expect(header).toHaveClass("tabla-relee");
    expect(body).toHaveClass("opacity-50");
    expect(body).toHaveAttribute("inert");

    rerender(<DataTable columns={columns} rows={rows} rowKey={(row) => row.id} />);
    expect(screen.getByRole("table")).not.toHaveAttribute("aria-busy");
    expect(container.querySelector("thead")).not.toHaveClass("tabla-relee");
    expect(container.querySelector("tbody")).not.toHaveAttribute("inert");
  });

  // Tablero «Criterio · Tablas» y Usuarios: encabezado de 40, filas de 40 (52 con segunda línea), 16 px a los
  // costados y 12 entre columnas, iguales en el encabezado y en las filas, y ⋮ en una columna de 50.
  it("usa encabezado arena de 40, filas de 40 y los mismos márgenes que el tablero", () => {
    render(<DataTable columns={columns} rows={rows} rowKey={(row) => row.id} />);
    expect(screen.getByRole("table")).toHaveClass("text-[0.8125rem]");
    const header = screen.getByRole("columnheader", { name: "Nombre" });
    expect(header).toHaveClass("h-10", "bg-[var(--cab)]", "text-[0.8125rem]", "normal-case", "whitespace-normal", "px-1.5", "first:pl-4", "last:pr-4");
    // La cebra empieza con una fila blanca, como el tablero.
    expect(screen.getAllByRole("row")[1]).toHaveClass("h-10", "even:bg-[var(--fila-alterna)]");
    expect(screen.getAllByRole("row")[1]).not.toHaveClass("odd:bg-[var(--fila-alterna)]");
    // Con ⋮ la fila de una línea sigue midiendo 40: la celda del ⋮ no suma relleno arriba y abajo.
    expect(screen.getByRole("button", { name: "Acciones de Ana García" }).closest("td")).toHaveClass("py-0");
    expect(screen.getByRole("button", { name: "Acciones de Ana García" }).closest("td")).not.toHaveClass("py-2");
    expect(screen.getAllByRole("cell")[0]).toHaveClass("px-1.5", "py-2", "first:pl-4", "last:pr-4");
    expect(screen.getByRole("columnheader", { name: "Acciones" })).toHaveClass("w-12.5", "last:pr-3", "text-right");
  });

  // «Criterio · Tablas» (base de la 12): un dato por celda; un texto largo baja de renglón y la fila crece (174), sin «…»
  // ni tooltip, y las filas miden 40 como mínimo.
  it("un texto largo se ve entero: la celda baja de renglón, sin cortar con «…» ni tooltip", () => {
    const long = "Cerramos el pedido de octubre; la entrega queda para el lunes 9, después de las 14.";
    render(<DataTable columns={[columns[0], { id: "notes", header: "Observaciones", type: "text", value: () => long }]} rows={rows} rowKey={(row) => row.id} />);

    const cell = screen.getByText(long).closest("td")!;
    expect(cell).toHaveClass("whitespace-normal", "[overflow-wrap:anywhere]");
    expect(cell).not.toHaveClass("truncate", "whitespace-nowrap", "overflow-hidden");
    expect(cell.querySelector("[title]")).toBeNull();
    expect(cell.querySelector(".truncate")).toBeNull();
    expect(screen.getAllByRole("row")[1]).toHaveClass("h-10");
    expect(document.querySelector('[data-slot="cell-detail"]')).toBeNull();
  });

  // «Criterio · Tablas» (137): una línea fina entre columnas, en el encabezado y en el cuerpo, que una columna fija se
  // lleva al desplazar (es la de la celda, no un borde); la tabla cierra abajo con la línea de su última fila.
  it("dibuja la línea entre columnas y cierra abajo con la línea de la última fila", () => {
    const { container } = render(<div><DataTable columns={columns} rows={rows} rowKey={(row) => row.id} /><nav>{"1–1 de 1"}</nav></div>);

    const [firstHead, secondHead] = screen.getAllByRole("columnheader");
    expect(firstHead).toHaveClass("not-first:shadow-[inset_1px_0_0_var(--borde-cab)]");
    expect(secondHead).toHaveClass("not-first:shadow-[inset_1px_0_0_var(--borde-cab)]");
    expect(screen.getAllByRole("cell")[1]).toHaveClass("not-first:shadow-[inset_1px_0_0_var(--borde)]");
    expect(screen.getAllByRole("cell")[1]).not.toHaveClass("border-l");
    // La última fila conserva su línea; solo se la saca cuando la tabla toca el borde de su caja.
    expect(container.querySelector("tbody")).not.toHaveClass("[&_tr:last-child]:border-0");
    expect(container.querySelector("[data-slot='table-container']")).toHaveClass("last:[&_tbody>tr:last-child]:border-b-0");
  });

  // «Criterio · Tablas»: la columna ordenada muestra ▲ o ▼ y lo anuncia con `aria-sort`; las demás, sin flecha.
  it("la columna ordenada muestra ▲ o ▼", () => {
    const { rerender } = render(<DataTable columns={columns} rows={rows} rowKey={(row) => row.id} sort="name" onSortChange={vi.fn()} />);
    const header = screen.getByRole("columnheader", { name: /Nombre/ });
    expect(header).toHaveAttribute("aria-sort", "ascending");
    expect(within(header).getByText("▲")).toHaveAttribute("aria-hidden", "true");

    rerender(<DataTable columns={columns} rows={rows} rowKey={(row) => row.id} sort="-name" onSortChange={vi.fn()} />);
    expect(screen.getByRole("columnheader", { name: /Nombre/ })).toHaveAttribute("aria-sort", "descending");
    expect(within(screen.getByRole("columnheader", { name: /Nombre/ })).getByText("▼")).toBeInTheDocument();

    rerender(<DataTable columns={columns} rows={rows} rowKey={(row) => row.id} sort="email" onSortChange={vi.fn()} />);
    expect(screen.queryByText("▲")).toBeNull();
    expect(screen.queryByText("▼")).toBeNull();
  });

  // La primera carga (160): el encabezado y el aro en el alto de ocho filas, sin filas esqueleto; al llegar las filas, la
  // tabla no cambia de alto.
  it("la primera carga dibuja el encabezado y el aro en el alto de ocho filas", () => {
    const { container, rerender } = render(<DataTable columns={columns} rows={[]} rowKey={(row) => row.id} isLoading />);

    expect(screen.getAllByRole("columnheader").length).toBe(columns.length);
    const loading = container.querySelector("[data-slot='first-load']")!;
    expect(loading.closest("td")).toHaveClass("h-80");
    expect(loading.closest("td")).toHaveAttribute("colspan", String(columns.length));
    expect(within(loading as HTMLElement).getByRole("status")).toHaveTextContent("Cargando…");
    expect(container.querySelector("[data-slot='skeleton']")).toBeNull();

    rerender(<DataTable columns={columns} rows={rows} rowKey={(row) => row.id} />);
    expect(container.querySelector("[data-slot='first-load']")).toBeNull();
    expect(screen.getByText("Ana García")).toBeInTheDocument();
  });

  it("muestra el estado con un punto y texto, sin pastilla", () => {
    render(<DataTable columns={columns} rows={rows} rowKey={(row) => row.id} />);

    const state = screen.getByText("Activo").parentElement!;
    expect(state).toHaveClass("inline-flex", "items-center");
    expect(state).not.toHaveClass("rounded-full", "bg-[var(--ok-t)]");
    expect(state?.querySelector('[data-slot="status-dot"]')).toHaveClass("size-2", "bg-[var(--punto-ok)]");
  });

  it("los grupos comparten un encabezado y conservan filas y detalles de la tabla habitual", () => {
    render(<DataTable columns={columns} rows={rows} rowKey={(row) => row.id}
      rowGroups={[{ key: "pending", rows, header: <span>{"Invitaciones vencidas · Usuarios · 1000"}</span>, footer: <a href="/usuarios?state=Expired">{"Ver todos"}</a> }]} />);
    expect(screen.getAllByRole("columnheader")).toHaveLength(columns.length);
    expect(screen.getByText("Invitaciones vencidas · Usuarios · 1000").closest("td")).toHaveAttribute("colspan", String(columns.length));
    expect(screen.getByText("Ana García")).toBeVisible();
    expect(screen.getByRole("link", { name: "Ver todos" })).toHaveAttribute("href", "/usuarios?state=Expired");
  });

  it("a 390 px deja visibles el principal, estado y ⋮; a 768 oculta solo prioridad baja", () => {
    render(<DataTable columns={columns} rows={rows} rowKey={(row) => row.id} />);
    expect(screen.getByRole("columnheader", { name: "Nombre" })).not.toHaveClass("hidden");
    expect(screen.getByRole("columnheader", { name: "Estado" })).not.toHaveClass("hidden");
    expect(screen.getByRole("columnheader", { name: "Acciones" })).not.toHaveClass("hidden");
    expect(within(screen.getByRole("columnheader", { name: "Acciones" })).getByText("Acciones")).toHaveClass("sr-only");
    expect(screen.getByRole("columnheader", { name: "Fecha" })).toHaveClass("hidden", "md:table-cell");
    expect(screen.getByRole("columnheader", { name: "Correo" })).toHaveClass("hidden", "lg:table-cell");
    expect(screen.getByRole("button", { name: "Acciones de Ana García" }).closest("td")).not.toHaveClass("hidden");
    // El estado va a la izquierda, como en el tablero; solo los números y montos van a la derecha.
    expect(screen.getByRole("columnheader", { name: "Estado" })).not.toHaveClass("text-right");
  });
});
