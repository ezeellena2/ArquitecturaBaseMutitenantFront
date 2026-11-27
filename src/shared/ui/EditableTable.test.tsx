import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { EditableTable, type EditableColumn } from "./EditableTable";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => ({ "states.empty": "No hay nada para mostrar" })[key as "states.empty"] ?? key }),
}));

interface Row { id: string; text: string; code: string; detail: string; value: string }

const rows: Row[] = [
  { id: "a", text: "Seguimiento", code: "SEG", detail: "Visita programada a un cliente actual", value: "10" },
  { id: "b", text: "Primera visita", code: "PRI", detail: "", value: "20" },
];

// La tabla de opciones de un catálogo (12-catalogos.md §11, 137): la casilla, el número y «Texto» fijos a la izquierda, y
// las acciones fijas a la derecha; Texto y Detalle de 12rem como mínimo, Código de 6rem y el valor de 8rem.
const columns: EditableColumn<Row>[] = [
  { id: "select", header: "Elegir", width: "3rem", pinned: "left", cell: (row) => <input type="checkbox" aria-label={`Elegir ${row.text}`} /> },
  { id: "number", header: "#", type: "number", width: "2.5rem", pinned: "left", cell: (_row, index) => index + 1 },
  { id: "text", header: "Texto", minWidth: "12rem", pinned: "left", cell: (row) => <input aria-label={`Texto de ${row.id}`} defaultValue={row.text} /> },
  { id: "code", header: "Código", minWidth: "6rem", cell: (row) => <input aria-label={`Código de ${row.id}`} defaultValue={row.code} /> },
  { id: "detail", header: "Detalle", minWidth: "12rem", cell: (row) => <input aria-label={`Detalle de ${row.id}`} defaultValue={row.detail} /> },
  { id: "value", header: "Valor", type: "number", minWidth: "8rem", cell: (row) => <input aria-label={`Valor de ${row.id}`} defaultValue={row.value} /> },
  { id: "actions", header: "Acciones", type: "actions", width: "9rem", pinned: "right", cell: (row) => <button type="button" aria-label={`Borrar ${row.text}`} /> },
];

function heads() {
  return screen.getAllByRole("columnheader");
}

function cellsOf(rowIndex: number) {
  return within(screen.getAllByRole("row")[rowIndex]).getAllByRole("cell");
}

describe("EditableTable", () => {
  it("se desplaza a lo ancho sin aplastarse: cada columna tiene su ancho mínimo y la tabla no reparte un ancho fijo", () => {
    render(<EditableTable columns={columns} rows={rows} rowKey={(row) => row.id} />);

    const table = screen.getByRole("table");
    // La caja desplaza a lo ancho y la tabla mide lo que piden sus columnas: con `table-fixed` se aplastarían.
    expect(table.closest("[data-slot=table-container]")).toHaveClass("overflow-x-auto");
    expect(table).toHaveClass("w-full");
    expect(table).not.toHaveClass("table-fixed");
    // Un dato no baja de su mínimo; la casilla, el número y las acciones tienen un ancho que no cambia, también como mínimo,
    // porque una tabla angosta achica hasta las columnas con ancho.
    const [select, number, text, code, detail, value, actions] = heads();
    expect([text, code, detail, value].map((head) => [head.style.minWidth, head.style.width])).toEqual([
      ["12rem", ""], ["6rem", ""], ["12rem", ""], ["8rem", ""],
    ]);
    expect([select, number, actions].map((head) => [head.style.width, head.style.minWidth])).toEqual([
      ["3rem", "3rem"], ["2.5rem", "2.5rem"], ["9rem", "9rem"],
    ]);
    // Sin ningún «hay más columnas a la derecha».
    expect(table.closest("[data-slot=table-container]")?.querySelector("[data-slot=scroll-hint]")).toBeNull();
  });

  it("deja fijas la casilla, el número y «Texto» a la izquierda y las acciones a la derecha, cada una corrida lo que ocupan las de antes", () => {
    render(<EditableTable columns={columns} rows={rows} rowKey={(row) => row.id} />);

    const [select, number, text, code, detail, value, actions] = heads();
    expect(select).toHaveAttribute("data-pinned", "left");
    expect(select).toHaveClass("sticky");
    expect(select.style.left).toBe("0px");
    expect(number.style.left).toBe("3rem");
    // 3rem + 2.5rem: el navegador de los tests ya hace la suma.
    expect(text.style.left).toBe("calc(5.5rem)");
    expect(actions).toHaveAttribute("data-pinned", "right");
    expect(actions.style.right).toBe("0px");
    for (const head of [code, detail, value]) {
      expect(head).not.toHaveAttribute("data-pinned");
      expect(head).not.toHaveClass("sticky");
    }

    const cells = cellsOf(1);
    expect(cells[0]).toHaveClass("sticky");
    expect(cells[2].style.left).toBe("calc(5.5rem)");
    expect(cells[6].style.right).toBe("0px");
    expect(cells[3]).not.toHaveClass("sticky");
    // Una fija lleva el fondo de su fila sobre la superficie de la caja: lo que pasa debajo no se ve a través.
    // Sin degradés ni variables propias (173 y tema.md): la fila es el grupo y la fija repite sus estados con los mismos tokens.
    expect(cells[0]).toHaveClass("bg-[var(--superficie)]", "group-even/fila:bg-[var(--fila-alterna)]", "group-hover/fila:bg-[var(--fila-hover)]",
      "group-data-[state=selected]/fila:bg-[var(--marca-t)]");
    expect(cells[3]).not.toHaveClass("bg-[var(--superficie)]");
    expect(screen.getAllByRole("row")[2]).toHaveClass("group/fila", "even:bg-[var(--fila-alterna)]");
  });

  it("lleva la línea entre columnas también en las fijas: la última de la izquierda dibuja la de su derecha", () => {
    render(<EditableTable columns={columns} rows={rows} rowKey={(row) => row.id} />);

    const head = heads();
    const cells = cellsOf(1);
    const left = "shadow-[inset_1px_0_0_var(--borde)]";
    // La primera no lleva línea a su izquierda; el número sí.
    expect(cells[0].className).not.toContain("shadow-");
    expect(cells[1]).toHaveClass(left);
    // «Texto» se queda con las dos: al desplazar, la de su derecha va con ella y no con la columna que pasa debajo.
    expect(cells[2]).toHaveClass("shadow-[inset_1px_0_0_var(--borde),inset_-1px_0_0_var(--borde)]");
    expect(cells[3].className).not.toContain("shadow-");
    expect(cells[4]).toHaveClass(left);
    expect(cells[5]).toHaveClass(left);
    // La fija de la derecha trae su línea de la izquierda.
    expect(cells[6]).toHaveClass(left);
    // En el encabezado, del tono del encabezado.
    expect(head[2]).toHaveClass("shadow-[inset_1px_0_0_var(--borde-cab),inset_-1px_0_0_var(--borde-cab)]");
    expect(head[3].className).not.toContain("shadow-");
    expect(head[6]).toHaveClass("shadow-[inset_1px_0_0_var(--borde-cab)]");
  });

  it("cada celda es su campo, con el número de la fila, y los números y las acciones van a la derecha", () => {
    render(<EditableTable columns={columns} rows={rows} rowKey={(row) => row.id} />);

    expect(screen.getByRole("textbox", { name: "Texto de a" })).toHaveValue("Seguimiento");
    expect(screen.getByRole("textbox", { name: "Código de b" })).toHaveValue("PRI");
    const cells = cellsOf(2);
    expect(cells[1]).toHaveTextContent("2");
    expect(cells[1]).toHaveClass("text-right", "tabular-nums");
    expect(cells[5]).toHaveClass("text-right");
    expect(cells[6]).toHaveClass("text-right");
    expect(cells[2]).not.toHaveClass("text-right");
    expect(heads()[6]).toHaveTextContent("Acciones");
  });

  it("sin filas muestra el vacío debajo de los encabezados", () => {
    render(<EditableTable columns={columns} rows={[]} rowKey={(row) => row.id} emptyTitle="Todavía no hay opciones" />);

    expect(heads()).toHaveLength(7);
    const notice = screen.getByText("Todavía no hay opciones").closest("td");
    expect(notice).toHaveAttribute("colspan", "7");
  });

  it("frena las columnas fijas que no se pueden ubicar", () => {
    const silence = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const withoutWidth: EditableColumn<Row>[] = [
      { id: "text", header: "Texto", minWidth: "12rem", pinned: "left", cell: (row) => row.text },
      { id: "code", header: "Código", minWidth: "6rem", pinned: "left", cell: (row) => row.code },
    ];
    expect(() => render(<EditableTable columns={withoutWidth} rows={rows} rowKey={(row) => row.id} />)).toThrow(/width/);
    const apart: EditableColumn<Row>[] = [
      { id: "text", header: "Texto", minWidth: "12rem", cell: (row) => row.text },
      { id: "code", header: "Código", width: "6rem", pinned: "left", cell: (row) => row.code },
    ];
    expect(() => render(<EditableTable columns={apart} rows={rows} rowKey={(row) => row.id} />)).toThrow(/juntas/);
    silence.mockRestore();
  });
});
