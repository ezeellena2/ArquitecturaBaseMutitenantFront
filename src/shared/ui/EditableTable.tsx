import type { FocusEvent, ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "@/shared/lib/utils";
import { EmptyState } from "./EmptyState";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, type TablePinned } from "./table";

type ColumnWidth =
  /** Un ancho que no cambia: la casilla, el número de la fila o las acciones. Vale también como mínimo. */
  | { width: string; minWidth?: never }
  /** Un dato: no baja de su mínimo (137) y toma el lugar que sobra. */
  | { minWidth: string; width?: never };

/**
 * Una columna de la tabla editable. A diferencia de `DataTable`, cada celda es su campo (`cell`): la tabla pone el lugar, el
 * ancho, la línea y lo fijo, y la pantalla pone el campo, con su error en el campo.
 */
export type EditableColumn<TRow> = ColumnWidth & {
  id: string;
  /** El título de la columna; en la de elegir, la casilla de «todas». */
  header: ReactNode;
  /** `number` y `actions` van a la derecha (137). */
  type?: "number" | "actions";
  /**
   * Fija al desplazar a lo ancho. Las fijas van juntas, al principio o al final, y una que tiene otra fija después, de su
   * mismo lado, necesita `width`: de ahí sale cuánto se corre la siguiente.
   */
  pinned?: "left" | "right";
  cell: (row: TRow, index: number) => ReactNode;
  className?: string;
};

interface EditableTableProps<TRow> {
  columns: readonly EditableColumn<TRow>[];
  rows: readonly TRow[];
  rowKey: (row: TRow) => string;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: ReactNode;
}

function widthOf<TRow>(column: EditableColumn<TRow>): string {
  if (column.width == null) {
    throw new Error(`EditableTable: la columna fija «${column.id}» tiene otra fija después y necesita width.`);
  }
  return column.width;
}

function offsetOf<TRow>(before: readonly EditableColumn<TRow>[]): string {
  const widths = before.map(widthOf);
  if (widths.length === 0) return "0px";
  return widths.length === 1 ? widths[0] : `calc(${widths.join(" + ")})`;
}

/** Dónde queda cada fija: corrida lo que ocupan las fijas que tiene antes, desde su lado. */
function pinnedLayout<TRow>(columns: readonly EditableColumn<TRow>[]): (TablePinned | undefined)[] {
  const left = columns.filter((column) => column.pinned === "left").length;
  const right = columns.filter((column) => column.pinned === "right").length;
  if (columns.slice(0, left).some((column) => column.pinned !== "left")
    || columns.slice(columns.length - right).some((column) => column.pinned !== "right")) {
    throw new Error("EditableTable: las columnas fijas van juntas, al principio o al final.");
  }
  return columns.map((column, index) => {
    if (column.pinned == null) return undefined;
    const before = column.pinned === "left" ? columns.slice(0, index) : columns.slice(index + 1);
    return { side: column.pinned, offset: offsetOf(before) };
  });
}

// «Criterio · Tablas» (137): una línea fina entre columnas, del tono de la que separa las filas, también en las fijas. Es una
// línea interior de la celda: cada una lleva la de su izquierda y la fija se la lleva al desplazar. La línea entre la última
// fija de la izquierda y la primera que pasa debajo es de la fija, para que no se vaya con la que pasa.
const lines = {
  head: {
    left: "shadow-[inset_1px_0_0_var(--borde-cab)]",
    right: "shadow-[inset_-1px_0_0_var(--borde-cab)]",
    both: "shadow-[inset_1px_0_0_var(--borde-cab),inset_-1px_0_0_var(--borde-cab)]",
  },
  cell: {
    left: "shadow-[inset_1px_0_0_var(--borde)]",
    right: "shadow-[inset_-1px_0_0_var(--borde)]",
    both: "shadow-[inset_1px_0_0_var(--borde),inset_-1px_0_0_var(--borde)]",
  },
} as const;

function lineOf(index: number, lastLeft: number): keyof typeof lines.cell | undefined {
  const ownsLeft = index > 0 && index !== lastLeft + 1;
  const ownsRight = index === lastLeft;
  if (ownsLeft && ownsRight) return "both";
  if (ownsLeft) return "left";
  return ownsRight ? "right" : undefined;
}

// Como `DataTable`: 16 px a los costados de la fila y 12 entre columnas (6 por celda).
function edgeClass<TRow>(column: EditableColumn<TRow>): string {
  return column.type === "actions" ? "px-1.5 first:pl-4 last:pr-3" : "px-1.5 first:pl-4 last:pr-4";
}

function alignClass<TRow>(column: EditableColumn<TRow>): string | undefined {
  return column.type === "number" || column.type === "actions" ? "text-right tabular-nums" : undefined;
}

/**
 * El campo que toma el foco en una celda que pasa debajo de las fijas queda a la vista entero, entre ellas (accesibilidad): el
 * navegador lo lleva al borde de la caja, que es donde están las fijas, así que la caja se corre lo que lo tapan. Las fijas se
 * miden en el momento, porque «Texto» crece más que su mínimo.
 */
function keepFocusedCellInView(event: FocusEvent<HTMLTableElement>) {
  const cell = event.target instanceof Element ? event.target.closest("td, th") : null;
  const box = event.currentTarget.parentElement;
  if (!cell || !box || cell.hasAttribute("data-pinned") || !cell.parentElement) return;
  const pinned = (side: "left" | "right") => [...cell.parentElement!.children].filter((other) => other.getAttribute("data-pinned") === side)
    .map((other) => other.getBoundingClientRect());
  const boxRect = box.getBoundingClientRect();
  const start = Math.max(boxRect.left, ...pinned("left").map((rect) => rect.right));
  const end = Math.min(boxRect.right, ...pinned("right").map((rect) => rect.left));
  const rect = cell.getBoundingClientRect();
  if (rect.left < start) box.scrollLeft -= start - rect.left;
  else if (rect.right > end) box.scrollLeft += Math.min(rect.right - end, rect.left - start);
}

/**
 * La tabla editable (E12, las opciones de un catálogo): sus filas no son de solo lectura, cada celda es un campo. No se
 * aplasta: cada columna tiene su ancho mínimo y, si no entran, la tabla se desplaza a lo ancho dentro de su caja, con las
 * fijas pegadas a su lado y sin ningún «hay más columnas a la derecha» (137). No ordena por columnas: su orden es un dato.
 */
export function EditableTable<TRow>({ columns, rows, rowKey, emptyTitle, emptyDescription, emptyAction }: EditableTableProps<TRow>) {
  const { t } = useTranslation();
  const pinned = pinnedLayout(columns);
  const lastLeft = columns.findLastIndex((column) => column.pinned === "left");

  return (
    <Table className="text-[0.8125rem]" onFocus={keepFocusedCellInView}>
      <TableHeader>
        <TableRow className="bg-[var(--s2)] hover:bg-[var(--s2)]">
          {columns.map((column, index) => {
            const line = lineOf(index, lastLeft);
            return (
              <TableHead
                key={column.id}
                scope="col"
                pinned={pinned[index]}
                style={{ width: column.width, minWidth: column.width ?? column.minWidth }}
                className={cn(
                  "h-10 bg-[var(--cab)] py-0 text-[0.8125rem] font-semibold normal-case text-[var(--t2)] whitespace-normal",
                  edgeClass(column),
                  line && lines.head[line],
                  column.className,
                  alignClass(column),
                )}
              >
                {column.header}
              </TableHead>
            );
          })}
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.length === 0 ? (
          <TableRow className="border-b-0 hover:bg-transparent">
            <TableCell colSpan={columns.length} className="p-0 whitespace-normal">
              <EmptyState title={emptyTitle ?? t("states.empty")} description={emptyDescription} action={emptyAction} framed={false} />
            </TableCell>
          </TableRow>
        ) : rows.map((row, rowIndex) => (
          <TableRow key={rowKey(row)} className="h-10">
            {columns.map((column, index) => {
              const line = lineOf(index, lastLeft);
              return (
                <TableCell
                  key={column.id}
                  pinned={pinned[index]}
                  className={cn(
                    "whitespace-normal [overflow-wrap:anywhere]",
                    column.type === "actions" ? "py-0" : "py-1.5",
                    edgeClass(column),
                    line && lines.cell[line],
                    column.className,
                    alignClass(column),
                  )}
                >
                  {column.cell(row, rowIndex)}
                </TableCell>
              );
            })}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
