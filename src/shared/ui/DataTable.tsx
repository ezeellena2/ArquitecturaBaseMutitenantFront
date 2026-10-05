import { Fragment, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import type { StatusTones } from "@/shared/format/statusTones";
import type { DateRangeValue, MoneyValue } from "@/shared/format/useFormat";
import { cn } from "@/shared/lib/utils";
import { useAppChrome } from "./app/AppChrome";
import { Button } from "./button";
import { EmptyState } from "./EmptyState";
import { Spinner } from "./Spinner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./table";
import { BooleanText } from "./format/BooleanText";
import { CultureText } from "./format/CultureText";
import { DateRangeText } from "./format/DateRangeText";
import { DateText } from "./format/DateText";
import { DurationText } from "./format/DurationText";
import { EmptyValue } from "./format/EmptyValue";
import { EnumText } from "./format/EnumText";
import { FileSizeText } from "./format/FileSizeText";
import { MoneyText } from "./format/MoneyText";
import { NumberText } from "./format/NumberText";
import { PercentText } from "./format/PercentText";
import { PhoneText } from "./format/PhoneText";
import { StatusBadge } from "./format/StatusBadge";
import { TaxIdText } from "./format/TaxIdText";
import { TimeZoneText } from "./format/TimeZoneText";

type OptionalValue<T> = T | null | undefined;
type MobileRole = "primary" | "status";

interface ColumnBase<TRow> {
  /** Campo del backend usado también para el orden. */
  id: string;
  header: string;
  sortable?: boolean;
  /** Solo `low` desaparece también en tablet. */
  priority?: "low";
  mobile?: MobileRole;
  className?: string;
  /**
   * Lo que aclara la celda, en una segunda línea gris de 12 («Criterio · Tablas», lienzo v92): el correo debajo del
   * nombre, los roles debajo de la empresa, cuándo vence debajo del estado. Sin nada que aclarar, `null`. Si alguna fila
   * la tiene, todas las filas de la tabla miden 52.
   */
  detail?: (row: TRow) => ReactNode;
}

type ValueColumn<TRow, TType extends string, TValue> = TType extends string ? ColumnBase<TRow> & {
  type: TType;
  value: (row: TRow) => OptionalValue<TValue>;
} : never;

type DateColumn<TRow> = ValueColumn<TRow, "date" | "dateTime" | "time" | "long" | "relative", string>;
type NumberColumn<TRow> = ValueColumn<TRow, "integer" | "quantity" | "compact" | "percent" | "fileSize" | "duration", number>;
type StringColumn<TRow> = ValueColumn<TRow, "text" | "phone" | "timeZone" | "culture", string>;

export type Column<TRow> =
  | DateColumn<TRow>
  | NumberColumn<TRow>
  | StringColumn<TRow>
  | (ValueColumn<TRow, "decimal", number> & { digits: number })
  | ValueColumn<TRow, "money", MoneyValue>
  | ValueColumn<TRow, "dateRange", DateRangeValue>
  | ValueColumn<TRow, "taxId", { country?: string; type: string; number: string }>
  | ValueColumn<TRow, "boolean", boolean>
  | (ValueColumn<TRow, "enum", string> & { enum: string })
  // Un estado: el punto del tono que registró la feature (`defineStatusTones`) y la palabra de su enum.
  | (ValueColumn<TRow, "status", string> & { tones: StatusTones })
  | (ColumnBase<TRow> & { type: "custom"; cell: (row: TRow) => ReactNode })
  | (ColumnBase<TRow> & { type: "actions"; cell: (row: TRow) => ReactNode });

interface DataTableProps<TRow> {
  columns: readonly Column<TRow>[];
  rows: readonly TRow[];
  rowKey: (row: TRow) => string;
  isLoading?: boolean;
  /** `placeholderData` mantiene filas previas durante una nueva consulta. */
  isFetching?: boolean;
  error?: string;
  errorDescription?: string;
  onRetry?: () => void;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: ReactNode;
  sort?: string;
  onSortChange?: (field: string) => void;
  /** En el teléfono, cada fila es una fila de borde a borde (`ListRow`) en lugar de una fila de tabla (tableros M-*). */
  mobileRow?: (row: TRow) => ReactNode;
}

/** También valida las columnas de features que todavía no existen en E1. */
function assertOneMobilePrimary<TRow>(columns: readonly Column<TRow>[]): void {
  if (columns.filter((column) => column.mobile === "primary").length !== 1) {
    throw new Error('DataTable necesita exactamente una columna mobile: "primary".');
  }
}

function columnVisibility<TRow>(column: Column<TRow>): string | undefined {
  if (column.type === "actions" || column.mobile === "primary" || column.mobile === "status") return undefined;
  return column.priority === "low" ? "hidden lg:table-cell" : "hidden md:table-cell";
}

function ariaSort<TRow>(column: Column<TRow>, sort: string | undefined): "ascending" | "descending" | "none" | undefined {
  if (!column.sortable) return undefined;
  if (sort === column.id) return "ascending";
  return sort === `-${column.id}` ? "descending" : "none";
}

function columnCell<TRow>(column: Column<TRow>, row: TRow): ReactNode {
  if (column.type === "custom" || column.type === "actions") return column.cell(row);

  switch (column.type) {
    case "text": {
      const value = column.value(row);
      return value == null ? <EmptyValue /> : <span className="block truncate" title={value}>{value}</span>;
    }
    case "date":
    case "dateTime":
    case "time":
    case "long":
    case "relative":
      return <DateText value={column.value(row)} kind={column.type} />;
    case "dateRange":
      return <DateRangeText value={column.value(row)} />;
    case "integer":
    case "quantity":
    case "compact":
      return <NumberText value={column.value(row)} kind={column.type} />;
    case "decimal":
      return <NumberText value={column.value(row)} kind="decimal" digits={column.digits} />;
    case "money":
      return <MoneyText value={column.value(row)} />;
    case "percent":
      return <PercentText value={column.value(row)} />;
    case "fileSize":
      return <FileSizeText value={column.value(row)} />;
    case "duration":
      return <DurationText value={column.value(row)} />;
    case "phone":
      return <PhoneText value={column.value(row)} />;
    case "timeZone":
      return <TimeZoneText value={column.value(row)} />;
    case "culture":
      return <CultureText value={column.value(row)} />;
    case "taxId":
      return <TaxIdText value={column.value(row)} />;
    case "enum":
      return <EnumText enum={column.enum} value={column.value(row)} />;
    case "status":
      return <StatusBadge tones={column.tones} value={column.value(row)} />;
    case "boolean":
      return <BooleanText value={column.value(row)} />;
  }
}

function hasContent(node: ReactNode): boolean {
  return node !== null && node !== undefined && node !== false && node !== "";
}

function isNumericColumn<TRow>(column: Column<TRow>): boolean {
  return column.type === "integer" || column.type === "decimal" || column.type === "quantity"
    || column.type === "compact" || column.type === "percent" || column.type === "money"
    || column.type === "fileSize" || column.type === "duration";
}

// Tablero «Criterio · Tablas»: 16 px a los costados de la fila y 12 entre columnas (6 por celda), iguales en el
// encabezado y en las filas. El ⋮ va en una columna de 50, a 12 del borde, como en los tableros.
function edgeClass<TRow>(column: Column<TRow>): string {
  return column.type === "actions" ? "w-[50px] px-1.5 first:pl-4 last:pr-3" : "px-1.5 first:pl-4 last:pr-4";
}

// Números y montos a la derecha; el estado, como el resto del texto, a la izquierda.
function alignClass<TRow>(column: Column<TRow>): string | undefined {
  return isNumericColumn(column) || column.type === "actions" ? "text-right tabular-nums" : undefined;
}

/** Tabla de datos tipados: el componente de formato y la visibilidad salen de cada columna. */
export function DataTable<TRow>({
  columns,
  rows,
  rowKey,
  isLoading,
  isFetching,
  error,
  errorDescription,
  onRetry,
  emptyTitle,
  emptyDescription,
  emptyAction,
  sort,
  onSortChange,
  mobileRow,
}: DataTableProps<TRow>) {
  const { t } = useTranslation();
  const { phone } = useAppChrome();
  assertOneMobilePrimary(columns);

  const list = phone && mobileRow;
  // El aviso de una lista vacía o que no cargó. En la compu va en la tabla, debajo de sus encabezados y sin recuadro
  // propio («Criterio · Tablas», «Ninguno coincide»; tablero Roles); en una lista del teléfono, solo.
  const notice = error
    ? <EmptyState title={error} description={errorDescription} action={onRetry ? <Button type="button" variant="outline" onClick={onRetry}>{t("actions.retry")}</Button> : undefined} framed={Boolean(list)} />
    : rows.length === 0 && !isLoading ? <EmptyState title={emptyTitle ?? t("states.empty")} description={emptyDescription} action={emptyAction} framed={Boolean(list)} />
      : null;
  if (!error && isLoading) return <div className="flex justify-center p-10"><Spinner /></div>;
  if (list) return notice ?? <ul aria-busy={isFetching === true} className={cn("m-0 list-none p-0", isFetching ? "opacity-60" : undefined)}>
    {rows.map((row) => <Fragment key={rowKey(row)}>{mobileRow(row)}</Fragment>)}
  </ul>;
  // «Criterio · Tablas»: las filas miden 40; si alguna lleva segunda línea, todas las de la tabla miden 52.
  const details = notice ? [] : rows.map((row) => columns.map((column) => column.detail?.(row)));
  const twoLines = details.some((cells) => cells.some(hasContent));

  return (
    <Table aria-busy={isFetching === true} className={cn("table-fixed text-[13px]", isFetching ? "opacity-60" : undefined)}>
      <TableHeader>
        <TableRow className="bg-[var(--s2)] hover:bg-[var(--s2)]">
          {columns.map((column) => (
            <TableHead
              key={column.id}
              scope="col"
              aria-sort={ariaSort(column, sort)}
              className={cn(
                "h-10 bg-[var(--cab)] py-0 text-[13px] font-semibold normal-case text-[var(--t2)] whitespace-normal",
                edgeClass(column),
                column.className,
                columnVisibility(column),
                alignClass(column),
              )}
            >
              {column.sortable && onSortChange ? (
                <button type="button" onClick={() => onSortChange(column.id)} className="-mx-1 rounded-[6px] px-1 text-[13px] font-semibold normal-case hover:text-[var(--t1)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--foco)]">
                  {column.header}
                </button>
              ) : column.type === "actions" ? <span className="sr-only">{column.header}</span> : column.header}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {notice ? <TableRow className="hover:bg-transparent">
          <TableCell colSpan={columns.length} className="p-0 whitespace-normal">{notice}</TableCell>
        </TableRow> : rows.map((row, rowIndex) => (
          <TableRow key={rowKey(row)} className={twoLines ? "h-[52px]" : "h-10"}>
            {columns.map((column, columnIndex) => {
              const detail = details[rowIndex][columnIndex];
              return (
                <TableCell
                  key={column.id}
                  className={cn(
                    // El ⋮ (32) entra en una fila de 40 sin relleno; el texto lleva 8 arriba y abajo (52 con dos líneas).
                    "overflow-hidden whitespace-nowrap",
                    column.type === "actions" ? "py-0" : "py-2",
                    edgeClass(column),
                    column.className,
                    columnVisibility(column),
                    alignClass(column),
                  )}
                >
                  {hasContent(detail) ? <span className="flex min-w-0 flex-col leading-[1.35]">
                    {columnCell(column, row)}
                    <span data-slot="cell-detail" className="block truncate text-[12px] text-[var(--t3)]">{detail}</span>
                  </span> : columnCell(column, row)}
                </TableCell>
              );
            })}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
