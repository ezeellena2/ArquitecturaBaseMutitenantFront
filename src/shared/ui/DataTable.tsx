import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import type { DateRangeValue, MoneyValue } from "@/shared/format/useFormat";
import { cn } from "@/shared/lib/utils";
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

interface ColumnBase {
  /** Campo del backend usado también para el orden. */
  id: string;
  header: string;
  sortable?: boolean;
  /** Solo `low` desaparece también en tablet. */
  priority?: "low";
  mobile?: MobileRole;
}

type ValueColumn<TRow, TType extends string, TValue> = TType extends string ? ColumnBase & {
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
  | (ValueColumn<TRow, "enum" | "status", string> & { enum: string })
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
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: ReactNode;
  sort?: string;
  onSortChange?: (field: string) => void;
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
      return <StatusBadge enum={column.enum} value={column.value(row)} />;
    case "boolean":
      return <BooleanText value={column.value(row)} />;
  }
}

function isNumericColumn<TRow>(column: Column<TRow>): boolean {
  return column.type === "integer" || column.type === "decimal" || column.type === "quantity"
    || column.type === "compact" || column.type === "percent" || column.type === "money"
    || column.type === "fileSize" || column.type === "duration";
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
}: DataTableProps<TRow>) {
  const { t } = useTranslation();
  assertOneMobilePrimary(columns);

  if (error) {
    return (
      <EmptyState
        title={error}
        description={errorDescription}
        action={onRetry ? <Button type="button" variant="outline" onClick={onRetry}>{t("actions.retry")}</Button> : undefined}
      />
    );
  }
  if (isLoading) return <div className="flex justify-center p-10"><Spinner /></div>;
  if (rows.length === 0) return <EmptyState title={emptyTitle ?? t("states.empty")} description={emptyDescription} action={emptyAction} />;

  return (
    <Table aria-busy={isFetching === true} className={cn("table-fixed", isFetching ? "opacity-60" : undefined)}>
      <TableHeader>
        <TableRow className="bg-[var(--s2)] hover:bg-[var(--s2)]">
          {columns.map((column) => (
            <TableHead
              key={column.id}
              scope="col"
              aria-sort={ariaSort(column, sort)}
              className={cn(
                "bg-[var(--s2)] px-3 text-[12px] font-semibold normal-case text-[var(--t2)]",
                columnVisibility(column),
                isNumericColumn(column) || column.mobile === "status" || column.type === "actions" ? "text-right tabular-nums" : undefined,
              )}
            >
              {column.sortable && onSortChange ? (
                <Button type="button" variant="ghost" size="sm" onClick={() => onSortChange(column.id)} className="-mx-2 px-2 text-[12px] font-semibold normal-case">
                  {column.header}
                </Button>
              ) : column.header}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={rowKey(row)} className="h-[42px]">
            {columns.map((column) => (
              <TableCell
                key={column.id}
                className={cn(
                  "overflow-hidden px-3 py-0 whitespace-nowrap",
                  columnVisibility(column),
                  isNumericColumn(column) || column.mobile === "status" || column.type === "actions" ? "text-right tabular-nums" : undefined,
                )}
              >
                {columnCell(column, row)}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
