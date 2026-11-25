import type { TFunction } from "i18next";
import { schemaEnums } from "@/shared/api/generated/validation";
import type { Column } from "./DataTable";

/// El orden de una tabla (264): el encabezado y «Ordenar por» mueven el mismo, que va en la dirección como `sort=campo`
/// (de menor a mayor) o `sort=-campo` (de mayor a menor), con el `id` de la columna como campo.
export type SortDirection = "ascending" | "descending";

/// Cómo se dice y hacia dónde va primero el orden de una columna: el texto de la A a la Z, un código de menor a mayor,
/// los números de mayor a menor, las fechas de la más reciente a la más vieja, el «Sí» primero y un estado o un tipo
/// por su circuito.
export type SortKind = "text" | "code" | "number" | "date" | "boolean" | "status";

/// Lo que «Ordenar por» necesita de una columna: cualquier `Column` lo cumple.
export interface SortableColumn {
  readonly id: string;
  readonly header: string;
  readonly type: string;
  readonly sortable?: boolean;
  readonly sortAs?: SortKind;
}

export interface ParsedSort {
  readonly field: string;
  readonly direction: SortDirection;
}

export function parseSort(sort: string | undefined): ParsedSort | undefined {
  if (!sort) return undefined;
  return sort.startsWith("-") ? { field: sort.slice(1), direction: "descending" } : { field: sort, direction: "ascending" };
}

export function sortValue(field: string, direction: SortDirection): string {
  return direction === "descending" ? `-${field}` : field;
}

const kinds: Readonly<Record<string, SortKind>> = {
  text: "text", culture: "text", timeZone: "text", custom: "text",
  phone: "code", taxId: "code",
  integer: "number", quantity: "number", compact: "number", decimal: "number", percent: "number", money: "number",
  fileSize: "number", duration: "number",
  date: "date", dateTime: "date", time: "date", dateRange: "date",
  boolean: "boolean",
  status: "status", enum: "status",
};

export function sortKind(column: SortableColumn): SortKind {
  return column.sortAs ?? kinds[column.type] ?? "text";
}

/// El primer toque ordena en el sentido útil; el segundo lo invierte.
export function firstDirection(column: SortableColumn): SortDirection {
  const kind = sortKind(column);
  return kind === "number" || kind === "date" || kind === "boolean" ? "descending" : "ascending";
}

/// Lo que hace un toque en el encabezado de la columna: si ya ordena por ella, invierte; si no, el sentido útil.
export function nextSort(column: SortableColumn, sort: string | undefined): string {
  const current = parseSort(sort);
  if (current?.field === column.id) return sortValue(column.id, current.direction === "ascending" ? "descending" : "ascending");
  return sortValue(column.id, firstDirection(column));
}

export function sortableColumns<TColumn extends SortableColumn>(columns: readonly TColumn[]): TColumn[] {
  return columns.filter((column) => column.sortable === true && column.type !== "actions");
}

/// El sentido con palabras, como sigue a la columna: «de la A a la Z», «más reciente primero».
export function directionLabel(t: TFunction, column: SortableColumn, direction: SortDirection): string {
  return t(`sort.${sortKind(column)}.${direction}`);
}

/// Lo que dice «Ordenar por»: «Ordenar por: Recibida, más reciente primero», o solo «Ordenar por» si el orden no es una
/// columna (el compuesto con que abre la lista).
export function sortByLabel(t: TFunction, columns: readonly SortableColumn[], sort: string | undefined): string {
  const current = parseSort(sort);
  const column = current ? sortableColumns(columns).find((item) => item.id === current.field) : undefined;
  if (!current || !column) return t("sort.by");
  return t("sort.byValue", { column: column.header, direction: directionLabel(t, column, current.direction) });
}

type Comparable = string | number | boolean | null | undefined;

const declaredEnums: Readonly<Record<string, readonly (string | null)[] | undefined>> = schemaEnums;

/// El lugar de un valor en su circuito; uno que el circuito no nombra ordena por su texto, después de los que sí.
function circuitPosition(circuit: readonly (string | null)[] | undefined, value: string | null | undefined): Comparable {
  if (value == null) return undefined;
  const index = circuit?.indexOf(value) ?? -1;
  return index < 0 ? value : index;
}

function comparableOf<TRow>(column: Column<TRow>, row: TRow): Comparable {
  switch (column.type) {
    case "actions": return undefined;
    case "custom": return column.sortValue?.(row);
    case "money": return column.value(row)?.amount;
    case "dateRange": return column.value(row)?.start;
    case "taxId": return column.value(row)?.number;
    case "status": return circuitPosition(Object.keys(column.tones.tones), column.value(row));
    // Un tipo del contrato ordena por el orden en que lo declaró el back, igual que ApplySort, y nunca por su nombre.
    case "enum": return circuitPosition(declaredEnums[column.enum], column.value(row));
    default: return column.value(row);
  }
}

function compare(left: Exclude<Comparable, null | undefined>, right: Exclude<Comparable, null | undefined>): number {
  if (typeof left === "number" && typeof right === "number") return left - right;
  if (typeof left === "boolean" && typeof right === "boolean") return Number(left) - Number(right);
  return String(left).localeCompare(String(right), undefined, { sensitivity: "base", numeric: true });
}

/// Una tabla que llega entera ordena en el navegador con la misma pieza (264): lo vacío va al final en los dos sentidos y,
/// con el mismo valor, queda el orden en que llegó. Una lista paginada nunca: la ordena el servidor.
export function sortRows<TRow>(rows: readonly TRow[], columns: readonly Column<TRow>[], sort: string | undefined): readonly TRow[] {
  const current = parseSort(sort);
  const column = current ? columns.find((item) => item.id === current.field && item.sortable === true) : undefined;
  if (!current || !column) return rows;
  const sign = current.direction === "descending" ? -1 : 1;
  return rows
    .map((row, index) => ({ row, index, value: comparableOf(column, row) }))
    .sort((left, right) => {
      const leftEmpty = left.value == null || left.value === "", rightEmpty = right.value == null || right.value === "";
      if (leftEmpty || rightEmpty) return leftEmpty === rightEmpty ? left.index - right.index : leftEmpty ? 1 : -1;
      return sign * compare(left.value as Exclude<Comparable, null | undefined>, right.value as Exclude<Comparable, null | undefined>)
        || left.index - right.index;
    })
    .map((entry) => entry.row);
}
