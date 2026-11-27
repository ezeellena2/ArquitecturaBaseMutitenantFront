import { useLayoutEffect, useRef, type ClipboardEvent } from "react";
import { useTranslation } from "react-i18next";
import { countOf } from "@/shared/format/countOf";
import { useFormat } from "@/shared/format/useFormat";
import { cn } from "@/shared/lib/utils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./table";

export interface PasteGridColumn {
  key: string;
  label: string;
  /** La celda de cada fila pegada que la llena; sin ella, la columna queda vacía. */
  cell?: number;
  /** Una columna que no se toma: su encabezado y sus celdas van en rojo. */
  invalid?: boolean;
  /** Un número: va a la derecha, como en toda tabla (137). */
  numeric?: boolean;
  /** Un código: en letra de ancho fijo y gris, como en la revisión. */
  mono?: boolean;
}

// Miles de filas pegadas serían miles de celdas: la grilla muestra las primeras y dice cuántas más hay.
const shownRows = 100;
// «Criterio · Tablas» (137): la línea fina entre columnas, del tono de la que separa las filas.
const headLine = "[&:not(:first-child)]:shadow-[inset_1px_0_0_var(--borde-cab)]";
const cellLine = "[&:not(:first-child)]:shadow-[inset_1px_0_0_var(--borde)]";

/**
 * La grilla para pegar filas copiadas de una planilla (FRM-Catalogo-Importar, «Pegar desde Excel»): los encabezados ya
 * armados y la línea entre columnas (137). Vacía, su primera celda toma lo pegado, con Ctrl+V o el «Pegar» del celular; al
 * pegar, el foco pasa a la grilla llena, donde otro pegado reemplaza las filas. Es la excepción a «sin tabla en un diálogo»
 * de la ficha de formularios.
 *
 * No lee lo pegado: lo entrega como texto (`onPaste`), y quien la usa arma las filas y dice qué celda llena cada columna.
 * Muestra las primeras 100 filas y cuántas más hay. `disabled` no toma pegados mientras su dueño trabaja.
 */
export function PasteGrid({ label, columns, rows, describedBy, invalid = false, disabled = false, onPaste }: {
  label: string;
  columns: readonly PasteGridColumn[];
  /** Las filas pegadas; sin ellas, la grilla vacía. */
  rows: readonly (readonly string[])[] | null;
  describedBy?: string;
  /** Falta lo pegado: la celda que lo toma queda marcada, con el mensaje en `describedBy`. */
  invalid?: boolean;
  disabled?: boolean;
  onPaste: (text: string) => void;
}) {
  const { t } = useTranslation();
  const format = useFormat();
  const root = useRef<HTMLDivElement>(null), refocus = useRef(false);
  // La primera celda se va con lo pegado: el foco no se pierde, pasa a la grilla.
  useLayoutEffect(() => {
    if (!rows || !refocus.current) return;
    refocus.current = false;
    root.current?.querySelector<HTMLElement>("[data-slot=table]")?.focus();
  }, [rows]);
  const take = (text: string) => { refocus.current = true; onPaste(text); };
  const replace = (event: ClipboardEvent) => { event.preventDefault(); onPaste(event.clipboardData.getData("text/plain")); };
  const tone = (column: PasteGridColumn) => column.invalid ? "text-[var(--peligro)]" : undefined;
  const filled = rows !== null && rows.length > 0;

  return <div ref={root} onPaste={filled && !disabled ? replace : undefined}
    className="overflow-hidden rounded-[0.625rem] border border-[var(--borde)] [&_[data-slot=table]]:outline-none [&_[data-slot=table]:focus-visible]:shadow-[inset_0_0_0_2px_var(--marca)]">
    <Table tabIndex={filled ? 0 : undefined} aria-label={label} aria-describedby={filled ? describedBy : undefined}>
      <TableHeader><TableRow className="border-b-[var(--borde-cab)]">
        {columns.map((column) => <TableHead key={column.key} className={cn("h-8.5 px-3 text-[0.78125rem]", headLine, column.numeric && "text-right", tone(column))}>{column.label}</TableHead>)}
      </TableRow></TableHeader>
      <TableBody>
        {filled ? rows.slice(0, shownRows).map((cells, row) => <TableRow key={row} className="h-9.5">
          {columns.map((column) => <TableCell key={column.key} className={cn("px-3 py-1 whitespace-normal break-words", cellLine, column.numeric && "text-right tabular-nums",
            column.mono && !column.invalid && "font-mono text-[0.78125rem] text-[var(--t2)]", tone(column))}>
            {column.cell === undefined ? null : cells[column.cell]}
          </TableCell>)}
        </TableRow>) : <TableRow className="h-9.5">
          {columns.map((column, index) => <TableCell key={column.key} className={cn("px-3 py-1", cellLine)}>
            {index === 0 ? <textarea aria-label={t("pasteGrid.target")} placeholder={t("pasteGrid.placeholder")} value="" rows={1} autoFocus disabled={disabled}
              aria-invalid={invalid || undefined} aria-describedby={describedBy}
              onPaste={(event) => { event.preventDefault(); take(event.clipboardData.getData("text/plain")); }}
              onChange={(event) => { if (event.target.value.trim()) take(event.target.value); }}
              className={cn("block h-6.5 w-max min-w-36 resize-none overflow-hidden rounded-[0.25rem] border-2 border-[var(--marca)] bg-transparent px-2 py-0.5 text-[0.8125rem] outline-none placeholder:text-[var(--t3)] focus-visible:ring-[3px] focus-visible:ring-[var(--foco-halo)] disabled:cursor-not-allowed disabled:border-[var(--borde2)]",
                invalid && "border-[var(--peligro)]")} /> : null}
          </TableCell>)}
        </TableRow>}
        {filled && rows.length > shownRows ? <TableRow className="h-9.5">
          <TableCell colSpan={columns.length} className="px-3 text-[var(--t3)]">{t("pasteGrid.moreRows", countOf(format, rows.length - shownRows))}</TableCell>
        </TableRow> : null}
      </TableBody>
    </Table>
  </div>;
}
