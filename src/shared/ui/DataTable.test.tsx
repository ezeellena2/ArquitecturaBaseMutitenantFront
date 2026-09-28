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
  { id: "status", header: "Estado", type: "status", enum: "TestStatus", value: (row) => row.status, mobile: "status" },
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
    expect(screen.getByRole("heading", { name: "Sin usuarios" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Limpiar" })).toBeInTheDocument();

    rerender(<DataTable columns={columns} rows={[]} rowKey={(row) => row.id} error="No se pudo cargar" errorDescription="Código 123" onRetry={onRetry} />);
    expect(screen.getByRole("heading", { name: "No se pudo cargar" })).toBeInTheDocument();
    expect(screen.getByText("Código 123")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Reintentar" }));
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it("mantiene filas anteriores atenuadas y marca aria-busy durante la siguiente página", () => {
    render(<DataTable columns={columns} rows={rows} rowKey={(row) => row.id} isFetching />);
    const table = screen.getByRole("table");
    expect(table).toHaveAttribute("aria-busy", "true");
    expect(within(table).getByText("Ana García")).toBeInTheDocument();
    expect(table).toHaveClass("opacity-60");
  });

  it("usa encabezado gris, texto normal y filas de 42 px", () => {
    render(<DataTable columns={columns} rows={rows} rowKey={(row) => row.id} />);
    expect(screen.getByRole("columnheader", { name: "Nombre" })).toHaveClass("bg-[var(--s2)]", "text-[12px]", "normal-case");
    expect(screen.getAllByRole("row")[1]).toHaveClass("h-[42px]");
  });

  it("a 390 px deja visibles el principal, estado y ⋮; a 768 oculta solo prioridad baja", () => {
    render(<DataTable columns={columns} rows={rows} rowKey={(row) => row.id} />);
    expect(screen.getByRole("columnheader", { name: "Nombre" })).not.toHaveClass("hidden");
    expect(screen.getByRole("columnheader", { name: "Estado" })).not.toHaveClass("hidden");
    expect(screen.getByRole("columnheader", { name: "Acciones" })).not.toHaveClass("hidden");
    expect(screen.getByRole("columnheader", { name: "Fecha" })).toHaveClass("hidden", "md:table-cell");
    expect(screen.getByRole("columnheader", { name: "Correo" })).toHaveClass("hidden", "lg:table-cell");
    expect(screen.getByRole("button", { name: "Acciones de Ana García" }).closest("td")).not.toHaveClass("hidden");
    expect(screen.getByRole("columnheader", { name: "Estado" })).toHaveClass("text-right");
  });
});
