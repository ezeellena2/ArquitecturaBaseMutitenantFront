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
import { useRetryAfterOf } from "@/shared/api/useRetryAfterCountdown";

type OptionalValue<T> = T | null | undefined;
type MobileRole = "primary" | "status";

interface ColumnBase {
  /** Campo del backend usado también para el orden. */
  id: string;
  header: string;
  sortable?: boolean;
  /** Solo `low` desaparece también en tablet. */
  priority?: "low";
  mobile?: MobileRole;
  className?: string;
}

type ValueColumn<TRow, TType extends string, TValue> = TType extends string ? ColumnBase & {
  type: TType;
  value: (row: TRow) => OptionalValue<TValue>;
} : never;

type DateColumn<TRow> = ValueColumn<TRow, "date" | "dateTime" | "time" | "long", string>;
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
  | (ColumnBase & { type: "custom"; cell: (row: TRow) => ReactNode })
  | (ColumnBase & { type: "actions"; cell: (row: TRow) => ReactNode });

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
  /** El error de la consulta: si es un límite de uso (429), «Reintentar» dice «Reintentá en 0:41» y espera (P2). */
  failure?: unknown;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: ReactNode;
  sort?: string;
  onSortChange?: (field: string) => void;
  /** En el teléfono, cada fila es una fila de borde a borde (`ListRow`) en lugar de una fila de tabla (tableros M-*). */
  mobileRow?: (row: TRow) => ReactNode;
  /** Vistas previas: un encabezado de columnas y grupos con su total y salida al listado completo. */
  rowGroups?: readonly { key: string; rows: readonly TRow[]; header: ReactNode; footer?: ReactNode }[];
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
      // El texto largo se ve entero (174): la celda baja de renglón y la fila crece, sin «…» ni tooltip.
      const value = column.value(row);
      return value == null ? <EmptyValue /> : value;
    }
    case "date":
    case "dateTime":
    case "time":
    case "long":
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

function isNumericColumn<TRow>(column: Column<TRow>): boolean {
  return column.type === "integer" || column.type === "decimal" || column.type === "quantity"
    || column.type === "compact" || column.type === "percent" || column.type === "money"
    || column.type === "fileSize" || column.type === "duration";
}

// Tablero «Criterio · Tablas»: 16 px a los costados de la fila y 12 entre columnas (6 por celda), iguales en el
// encabezado y en las filas. El ⋮ va en una columna de 50, a 12 del borde, como en los tableros.
function edgeClass<TRow>(column: Column<TRow>): string {
  return column.type === "actions" ? "w-12.5 px-1.5 first:pl-4 last:pr-3" : "px-1.5 first:pl-4 last:pr-4";
}

// «Criterio · Tablas» (137): una línea fina entre columnas, del tono de la que separa las filas, en el encabezado y en el
// cuerpo. Es una línea interior de la celda y no un borde: una columna fija se la lleva al desplazar.
const headLine = "not-first:shadow-[inset_1px_0_0_var(--borde-cab)]";
const cellLine = "not-first:shadow-[inset_1px_0_0_var(--borde)]";

/** La primera carga (160): el encabezado y el aro en el alto de ocho filas de 40, sin filas esqueleto. */
const firstLoadHeight = "h-80";

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
  failure,
  emptyTitle,
  emptyDescription,
  emptyAction,
  sort,
  onSortChange,
  mobileRow,
  rowGroups,
}: DataTableProps<TRow>) {
  const { t } = useTranslation();
  const { phone } = useAppChrome();
  const limit = useRetryAfterOf(failure);
  assertOneMobilePrimary(columns);

  const list = phone && mobileRow;
  const firstLoad = !error && isLoading === true;
  // El aviso de una lista vacía o que no cargó. En la compu va en la tabla, debajo de sus encabezados y sin recuadro
  // propio («Criterio · Tablas», «Ninguno coincide»; tablero Roles); en una lista del teléfono, solo.
  const notice = error
    ? <EmptyState title={error} description={errorDescription} action={onRetry ? <Button type="button" variant="outline" disabled={limit.isRunning} onClick={onRetry}>{limit.label ?? t("actions.retry")}</Button> : undefined} framed={Boolean(list)} />
    : rows.length === 0 && !isLoading ? <EmptyState title={emptyTitle ?? t("states.empty")} description={emptyDescription} action={emptyAction} framed={Boolean(list)} />
      : null;
  // La primera carga de una lista del teléfono: el aro en el lugar de la lista, debajo de la barra (160).
  if (firstLoad && list) return <div data-slot="first-load" className="flex min-h-90 items-center justify-center"><Spinner /></div>;
  // «Criterio · Tablas», Cuando vuelve a leer: lo que estaba queda atenuado y fuera de alcance, con la línea que corre.
  const refreshing = isFetching === true;
  if (list) return notice ?? <ul aria-busy={refreshing || undefined} inert={refreshing || undefined} data-line="top"
    className={cn("m-0 list-none p-0", refreshing && "tabla-relee [&>li]:opacity-50")}>
    {rowGroups ? rowGroups.map((group) => <Fragment key={group.key}>
      <li className="bg-[var(--s2)] px-5 py-2.5">{group.header}</li>
      {group.rows.map((row) => <Fragment key={rowKey(row)}>{mobileRow(row)}</Fragment>)}
      {group.footer ? <li className="px-5 py-3">{group.footer}</li> : null}
    </Fragment>) : rows.map((row) => <Fragment key={rowKey(row)}>{mobileRow(row)}</Fragment>)}
  </ul>;
  // «Criterio · Tablas»: un dato por celda y las filas de 40 como mínimo; un texto largo baja de renglón y la fila crece
  // (174). Un código con guiones no se parte (`TaxIdText`) y lo demás se corta solo donde no entra.
  const renderRow = (row: TRow) => <TableRow key={rowKey(row)} className="h-10">
    {columns.map((column) => <TableCell key={column.id} className={cn("whitespace-normal [overflow-wrap:anywhere]", column.type === "actions" ? "py-0" : "py-2",
      edgeClass(column), cellLine, column.className, columnVisibility(column), alignClass(column))}>
      {columnCell(column, row)}
    </TableCell>)}
  </TableRow>;
  const sorted = (column: Column<TRow>) => ariaSort(column, sort);

  return (
    <Table refreshing={refreshing} className="table-fixed text-[0.8125rem]">
      <TableHeader refreshing={refreshing}>
        <TableRow className="bg-[var(--s2)] hover:bg-[var(--s2)]">
          {columns.map((column) => (
            <TableHead
              key={column.id}
              scope="col"
              aria-sort={ariaSort(column, sort)}
              className={cn(
                "h-10 bg-[var(--cab)] py-0 text-[0.8125rem] font-semibold normal-case text-[var(--t2)] whitespace-normal",
                edgeClass(column),
                headLine,
                column.className,
                columnVisibility(column),
                alignClass(column),
              )}
            >
              {column.sortable && onSortChange ? (
                <button type="button" onClick={() => onSortChange(column.id)} className="-mx-1 inline-flex items-center gap-1 rounded-[0.375rem] px-1 text-[0.8125rem] font-semibold normal-case hover:text-[var(--t1)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--foco)]">
                  {column.header}
                  {/* La columna ordenada muestra ▲ o ▼; tocarla invierte el orden (`aria-sort` lo anuncia). */}
                  {sorted(column) === "ascending" ? <span data-slot="sort-arrow" aria-hidden="true">{"▲"}</span>
                    : sorted(column) === "descending" ? <span data-slot="sort-arrow" aria-hidden="true">{"▼"}</span> : null}
                </button>
              ) : column.type === "actions" ? <span className="sr-only">{column.header}</span> : column.header}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody refreshing={refreshing}>
        {firstLoad ? <TableRow className="border-b-0 hover:bg-transparent">
          <TableCell colSpan={columns.length} className={cn("p-0", firstLoadHeight)}>
            <div data-slot="first-load" className="flex h-full items-center justify-center"><Spinner /></div>
          </TableCell>
        </TableRow> : notice ? <TableRow className="border-b-0 hover:bg-transparent">
          <TableCell colSpan={columns.length} className="p-0 whitespace-normal">{notice}</TableCell>
        </TableRow> : rowGroups ? rowGroups.map((group) => <Fragment key={group.key}>
          <TableRow className="hover:bg-[var(--s2)]"><TableCell colSpan={columns.length} className="bg-[var(--s2)] px-5 py-2.5">{group.header}</TableCell></TableRow>
          {group.rows.map(renderRow)}
          {group.footer ? <TableRow><TableCell colSpan={columns.length} className="bg-[var(--lado-activo)] px-5 py-3">{group.footer}</TableCell></TableRow> : null}
        </Fragment>) : rows.map(renderRow)}
      </TableBody>
    </Table>
  );
}
