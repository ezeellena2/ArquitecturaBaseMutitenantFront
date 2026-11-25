import { Fragment, type KeyboardEvent, type MouseEvent, type RefObject } from "react";
import { CheckIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { RemoteOptions } from "@/shared/hooks/useResourceOptions";
import { cn } from "@/shared/lib/utils";
import { Button } from "./button";
import { SearchIcon } from "./icons";
import { pickerOptionId, type PickerList as PickerListModel, type PickerRow } from "./pickerRows";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./tooltip";

/** Un botón adentro de la lista deja el foco en el buscador o en la lista: lo que se escribe después sigue buscando. */
const keepFocus = { onMouseDown: (event: MouseEvent) => event.preventDefault() };

export interface PickerListProps {
  readonly uid: string;
  readonly listboxId: string;
  /** El id de lo que nombra la lista. */
  readonly nameId: string;
  /** El nombre de la lista: el buscador se llama «Buscar en <nombre>». */
  readonly title: string;
  readonly list: PickerListModel;
  readonly multiple: boolean;
  readonly searchable: boolean;
  readonly search: string;
  readonly open: boolean;
  readonly current: number;
  readonly phone: boolean;
  /** Cuántas son todas las opciones de la pieza, sin buscar. */
  readonly optionCount: number;
  readonly chosenCount: number;
  readonly max?: number;
  readonly total?: number;
  readonly pageSize?: number;
  readonly countLabel?: (count: number) => string;
  readonly remote?: RemoteOptions;
  readonly listRef: RefObject<HTMLUListElement | null>;
  readonly searchRef: RefObject<HTMLInputElement | null>;
  readonly onSearch: (text: string) => void;
  readonly onListKeyDown: (event: KeyboardEvent<HTMLElement>) => void;
  readonly onHover: (index: number) => void;
  readonly onChoose: (row: PickerRow, index: number) => void;
}

/**
 * Lo de adentro de la lista abierta, igual en la hoja del teléfono y debajo del campo: el buscador con la cantidad y el tope,
 * las filas, lo que dice cuando no hay ninguna (busca, falló o no responde nada) y «Mostrar N más» del servidor.
 */
export function PickerList({ uid, listboxId, nameId, title, list, multiple, searchable, search, open, current, phone, optionCount, chosenCount,
  max, total, pageSize, countLabel, remote, listRef, searchRef, onSearch, onListKeyDown, onHover, onChoose }: PickerListProps) {
  const { t } = useTranslation();
  const { rows, shown, create, searching, full } = list;
  const optionId = (index: number) => pickerOptionId(uid, index);

  // La cantidad habla de las opciones: del servidor, sin ninguna, la lista dice por qué en su lugar (sin «0 opciones»).
  const countOf = (count: number) => countLabel?.(count) ?? t("picker.count", { count });
  const countText = remote ? shown.length > 0 && !remote.loading && total !== undefined ? countOf(total) : null
    : searchable ? (searching ? (shown.length > 0 ? countOf(shown.length) : null) : countOf(optionCount)) : null;
  const limitText = multiple && max !== undefined
    ? full ? t("picker.chosenOf", { count: chosenCount, max: max }) : t("picker.upTo", { count: max }) : null;
  const searchBox = searchable
    ? <div className="relative">
      <SearchIcon aria-hidden="true" className={cn("pointer-events-none absolute top-1/2 -translate-y-1/2 text-[var(--t3)]", phone ? "left-3 size-5" : "left-2.5 size-4")} />
      <input ref={searchRef} type="search" role="combobox" aria-expanded="true" aria-controls={listboxId} aria-autocomplete="list"
        aria-activedescendant={current >= 0 ? optionId(current) : undefined} aria-label={t("picker.search", { label: title })}
        placeholder={t("actions.search")} autoComplete="off" spellCheck={false} value={search}
        onChange={(event) => onSearch(event.target.value)}
        onKeyDown={onListKeyDown}
        // En el teléfono, de 44 con letra de 16: tocarlo no agranda la pantalla en iOS.
        className={cn("w-full border border-[var(--borde2)] bg-[var(--superficie)] pr-3 text-[var(--t1)] outline-none placeholder:text-[var(--t3)] focus-visible:border-[var(--marca)] focus-visible:ring-1 focus-visible:ring-[var(--marca)]",
          phone ? "h-11 rounded-[0.625rem] pl-10 text-[1rem]" : "h-8.5 rounded-[0.375rem] pl-8 text-[0.8125rem]")} />
    </div> : null;
  const countRow = countText !== null || limitText !== null
    ? <div className={cn("flex items-center justify-between gap-3 text-[var(--t2)]", phone ? "pt-2 text-[0.8125rem]" : "px-1.5 pt-1.5 text-[0.78125rem]")}>
      <span role="status">{countText}</span>{limitText ? <span role="status" className="shrink-0">{limitText}</span> : null}
    </div> : null;
  const header = searchBox || countRow
    ? <div className={cn("border-b border-[var(--borde)]", phone ? "px-4 pt-2.5 pb-2" : "p-1.5")}>{searchBox}{countRow}</div> : null;
  const options = <ul ref={listRef} id={listboxId} role="listbox" aria-labelledby={nameId} aria-multiselectable={multiple || undefined}
    tabIndex={searchable ? undefined : -1} aria-activedescendant={!searchable && current >= 0 ? optionId(current) : undefined}
    onKeyDown={searchable ? undefined : onListKeyDown}
    className={cn("relative min-h-0 flex-1 overflow-y-auto outline-none [scrollbar-width:thin]", phone ? "" : "max-h-80 p-1", rows.length === 0 && "hidden")}>
    {rows.map((row, index) => <Fragment key={`${row.option === create ? "create:" : ""}${row.option.value}`}>
      {row.separated ? <li role="presentation" className={phone ? "h-px bg-[var(--borde2)]" : "-mx-1 my-1 h-px bg-[var(--borde2)]"} /> : null}
      <OptionRow row={row} id={optionId(index)} active={index === current && open} multiple={multiple} touch={phone}
        position={remote && total !== undefined ? { index: index + 1, size: rows.length - shown.length + total } : undefined}
        onHover={() => onHover(index)} onChoose={() => onChoose(row, index)} />
    </Fragment>)}
  </ul>;
  // El estado habla de las opciones: «Todas» o una elegida de otra página no esconden que buscan o que fallaron.
  const state = shown.length > 0 || create ? null
    : remote?.loading ? <p role="status" className={cn("text-[var(--t2)]", phone ? "px-4 py-4 text-[0.9375rem]" : "px-3 py-2.5")}>{t("picker.searching")}</p>
      : remote?.error ? <div className={cn("flex flex-wrap items-center justify-between gap-2 text-[var(--t1)]", phone ? "px-4 py-4 text-[0.9375rem]" : "px-3 py-2")}>
        <span>{t("picker.failed")}</span>
        <Button type="button" variant="link" {...keepFocus} onClick={remote.onRetry}>{t("actions.retry")}</Button>
      </div>
        : <p role="status" className={cn("text-[var(--t2)]", phone ? "px-4 py-4 text-[0.9375rem]" : "px-3 py-2.5")}>
          {searching ? t("picker.noMatches", { search: search.trim() }) : t("picker.empty")}
        </p>;
  const more = remote?.hasMore
    ? <button type="button" {...keepFocus} onClick={remote.onLoadMore} disabled={remote.loading}
      className={cn("block w-full border-t border-[var(--borde)] text-left font-semibold text-[var(--marca-tx)] outline-none hover:bg-[var(--s2)] focus-visible:bg-[var(--s2)] disabled:text-[var(--t3)]",
        phone ? "min-h-14 px-4 text-[0.9375rem]" : "min-h-9 px-3 text-[0.8125rem]")}>
      {remote.loading ? t("states.loading") : t("picker.more", { count: pageSize ?? remote?.pageSize ?? 50 })}
    </button> : null;
  return <>{header}{options}{state}{more}</>;
}

/** Una opción: la tilde o la casilla a la izquierda, el nombre y su línea gris debajo. Apagada, su motivo se abre en un
 * tooltip mientras es la marcada (con el mouse encima, con las flechas o al tocarla) y es su descripción. */
function OptionRow({ row, id, active, multiple, touch, position, onHover, onChoose }: {
  row: PickerRow; id: string; active: boolean; multiple: boolean; touch: boolean; position?: { index: number; size: number };
  onHover: () => void; onChoose: () => void;
}) {
  const { label, description, icon, trailing } = row.option;
  const describedBy = [description ? `${id}-description` : null, row.reason ? `${id}-reason` : null].filter(Boolean).join(" ");
  const item = <li role="option" id={id} aria-labelledby={`${id}-label${trailing ? ` ${id}-trailing` : ""}`} aria-describedby={describedBy || undefined}
    aria-selected={row.selected} aria-disabled={row.disabled || undefined} aria-posinset={position?.index} aria-setsize={position?.size}
    data-active={active || undefined}
    // El foco queda en el buscador o en la lista: un clic solo elige.
    onMouseDown={(event) => event.preventDefault()} onMouseMove={onHover} onClick={onChoose}
    className={cn("flex cursor-default items-start text-[var(--t1)] select-none data-[active]:bg-[var(--marca-t)] aria-disabled:text-[var(--t3)]",
      touch ? "min-h-14 items-center gap-3 border-b border-[var(--borde)] px-4 py-2 text-[1rem]" : "min-h-9 gap-2.5 rounded-[0.375rem] px-2.5 py-1.5 leading-[1.35]")}>
    {multiple
      ? <span aria-hidden="true" className={cn("flex shrink-0 items-center justify-center rounded-[0.25rem] border-[1.5px] border-[var(--borde2)] bg-[var(--superficie)] text-[var(--superficie)]",
        touch ? "size-5.5" : "mt-px size-4",
        row.selected && "border-[var(--marca)] bg-[var(--marca)]", row.disabled && !row.selected && "border-[var(--borde)] bg-[var(--s3)]")}>
        {row.selected ? <CheckIcon strokeWidth={3} className={touch ? "size-4" : "size-3"} /> : null}
      </span>
      : <span aria-hidden="true" className={cn("flex shrink-0 items-center justify-center text-[var(--marca-tx)]", touch ? "size-5.5" : "mt-px size-4")}>
        {row.selected ? <CheckIcon strokeWidth={2.25} className={touch ? "size-5" : "size-3.5"} /> : null}
      </span>}
    {icon ? <span aria-hidden="true" className={cn("flex shrink-0", touch ? "" : "mt-0.5")}>{icon}</span> : null}
    <span className="flex min-w-0 flex-1 flex-col">
      <span id={`${id}-label`} className="[overflow-wrap:anywhere]">{label}</span>
      {description ? <span id={`${id}-description`} className={cn("[overflow-wrap:anywhere]", row.disabled ? "text-[var(--t3)]" : "text-[var(--t2)]", touch ? "text-[0.8125rem]" : "text-[0.75rem]")}>{description}</span> : null}
    </span>
    {/* El espacio separa el nombre del prefijo también para los lectores de pantalla («Argentina +54»). */}
    {trailing ? <>{" "}<span id={`${id}-trailing`} className="ml-auto shrink-0 text-[var(--t2)]">{trailing}</span></> : null}
    {row.reason ? <span id={`${id}-reason`} hidden>{row.reason}</span> : null}
  </li>;
  if (!row.reason) return item;
  return <TooltipProvider>
    <Tooltip open={active}>
      <TooltipTrigger asChild>{item}</TooltipTrigger>
      <TooltipContent side="top" align="start" collisionPadding={8}>{row.reason}</TooltipContent>
    </Tooltip>
  </TooltipProvider>;
}
