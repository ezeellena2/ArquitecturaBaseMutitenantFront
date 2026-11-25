import { useId, useState } from "react";
import { ListFilter } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Popover as PopoverPrimitive } from "radix-ui";
import { ChevronDownIcon, ChevronLeftIcon, SearchIcon } from "./icons";
import { FilterChip } from "./FilterChip";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Surface } from "@/shared/ui/Surface";
import { AppIconButton } from "./app/AppBar";
import { AppBarTools } from "./app/AppBarTools";
import { useAppChrome } from "./app/AppChrome";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "./dialog";
import type { RemoteOptions } from "@/shared/hooks/useResourceOptions";
import { NumberText } from "./format/NumberText";
import { Picker } from "./Picker";
import { directionLabel, firstDirection, parseSort, sortByLabel, sortableColumns, sortValue, type SortDirection, type SortableColumn } from "./tableSort";

/// Una opción de un filtro. Sin cantidad (143): lo que trae cada una se ve en la tabla y en el paginado.
export interface FilterOption {
  value: string;
  label: string;
}

export interface FilterBarFilter {
  key: string;
  /** Lo que dice el desplegable sin nada elegido («Estado: todos»). Su nombre es lo que va antes de «:». */
  label: string;
  menuLabel: string;
  value: string;
  active: boolean;
  options: readonly FilterOption[];
  onChange: (value: string) => void;
  remote?: RemoteOptions;
  selectedLabel?: string;
}

/// «Ordenar por» (264): las columnas de la tabla, el orden de la dirección y quien lo cambia, el mismo que el encabezado.
export interface FilterBarSort {
  columns: readonly SortableColumn[];
  value: string | undefined;
  onChange: (sort: string) => void;
}

export interface FilterBarProps {
  label: string;
  searchLabel: string;
  searchValue: string;
  onSearchChange: (value: string) => void;
  /** Los tres primeros van a la vista; los demás, en un solo «Filtros» (144). */
  filters: readonly FilterBarFilter[];
  clearLabel: string;
  onClear: () => void;
  className?: string;
  /** En el teléfono, los íconos de la barra según el tablero de la lista: lupa y filtro (M-Usuarios), solo el filtro
   *  (M-Roles, M-Empresas, M-Auditoria-Org) o ninguno (M-Empresa). */
  phoneTools?: "search-and-filter" | "filter" | "none";
  /** En el teléfono, la bajada de «Filtros»: la lista que se filtra («Catálogos», tablero M-FRM-Catalogos). */
  screen?: string;
  /** El buscador y los filtros en una sola fila, el buscador con lo que queda: la columna de Chats (WA-Chats, .filtro). */
  singleRow?: boolean;
  /** «Ordenar por», último en la barra y separado de los filtros, porque no saca filas (264). */
  sort?: FilterBarSort;
}

/** Cuántos filtros van a la vista, al lado del buscador («Criterio · Menús», Filtros). */
const visibleFilters = 3;

/** El nombre de un filtro, sin lo que dice cuando no hay nada elegido: «Estado» de «Estado: todos». */
function filterName(filter: FilterBarFilter): string {
  return filter.label.split(":")[0]?.trim() || filter.label;
}

function selectedOf(filter: FilterBarFilter) {
  return filter.options.find((option) => option.value === filter.value);
}

/** Sin filtro, la primera opción («Todos») es la marcada. */
function checkedOf(filter: FilterBarFilter): string {
  return selectedOf(filter) ? filter.value : filter.options[0]?.value ?? "";
}

/** Lo elegido, como lo dice un chip: «Proveedor: Aceros Rosario». */
function chipText(filter: FilterBarFilter): string {
  return `${filterName(filter)}: ${selectedOf(filter)?.label ?? filter.selectedLabel ?? ""}`;
}

/// Lo que la pieza para elegir (262) necesita de un filtro: «Todos» primero y separada, lo elegido de otra página del
/// servidor y la guarda de elegir lo ya elegido, que no vuelve a filtrar ni lleva a la primera página.
function pickerOf(filter: FilterBarFilter) {
  const selected = selectedOf(filter);
  const [first, ...rest] = filter.options;
  const checked = checkedOf(filter);
  return {
    first, options: rest, value: checked, remote: filter.remote,
    selectedOptions: filter.selectedLabel && !selected && filter.value ? [{ value: filter.value, label: filter.selectedLabel }] : [],
    onChange: (value: string) => { if (value !== checked) filter.onChange(value); },
  };
}

/// Un filtro de «Filtros», en la compu y en el teléfono: su nombre arriba y la pieza para elegir debajo, que se nombra con
/// él y abre la misma lista que el botón de la barra.
function FilterField({ filter, phone }: { filter: FilterBarFilter; phone: boolean }) {
  const id = useId();
  return <div className={cn("flex flex-col", phone ? "gap-2 px-4 pt-5" : "gap-1.5")}>
    <span id={`${id}-label`} className={phone ? "text-[0.8125rem] font-semibold text-[var(--t3)]" : "font-semibold text-[var(--t1)]"}>{filterName(filter)}</span>
    <Picker id={id} {...pickerOf(filter)} />
  </div>;
}

export function FilterBar({
  label,
  searchLabel,
  searchValue,
  onSearchChange,
  filters,
  clearLabel,
  onClear,
  className,
  phoneTools = "search-and-filter",
  screen,
  singleRow = false,
  sort,
}: FilterBarProps) {
  const { t } = useTranslation();
  const hasFilters = searchValue.trim().length > 0 || filters.some((filter) => filter.active);
  const { phone } = useAppChrome();
  const [searchOpen, setSearchOpen] = useState(searchValue.trim().length > 0);
  const [sheetOpen, setSheetOpen] = useState(false);
  const shown = filters.slice(0, visibleFilters);
  const more = filters.slice(visibleFilters);
  const applied = more.filter((filter) => filter.active);

  // Tableros M-Usuarios y M-FRM-Catalogos: en el teléfono la lupa y el filtro son íconos de la barra de arriba. La lupa
  // abre el buscador debajo de la barra; el filtro abre «Filtros» a pantalla completa, con cada filtro en la pieza para
  // elegir (262), sin cantidades, que se aplica al elegir, y «Limpiar todo» y «Listo» abajo. Con algo aplicado, el ícono
  // lleva un punto.
  if (phone) return <>
    <AppBarTools>
      {phoneTools === "search-and-filter" ? <AppIconButton label={searchLabel} aria-pressed={searchOpen} onClick={() => setSearchOpen((open) => !open)}><SearchIcon /></AppIconButton> : null}
      {filters.length > 0 && phoneTools !== "none" ? <AppIconButton label={label} onClick={() => setSheetOpen(true)}>
        <ListFilter />
        {filters.some((filter) => filter.active) ? <span data-slot="filter-dot" aria-hidden="true" className="absolute top-2 right-2 size-2 rounded-full bg-[var(--marca)]" /> : null}
      </AppIconButton> : null}
    </AppBarTools>
    {searchOpen && phoneTools === "search-and-filter" ? <div className="px-4 pt-1 pb-2">
      <label className="flex h-11.5 items-center gap-2.5 rounded-[0.75rem] bg-[var(--s3)] px-3.5 text-[var(--t3)]">
        <SearchIcon className="size-4.5 shrink-0" />
        <input type="search" autoFocus value={searchValue} onChange={(event) => onSearchChange(event.target.value)} aria-label={searchLabel} placeholder={searchLabel}
          className="min-w-0 flex-1 bg-transparent text-[0.96875rem] text-[var(--t1)] outline-none placeholder:text-[var(--t3)]" />
      </label>
    </div> : null}
    {sort && sortableColumns(sort.columns).length > 0 ? <SortBy sort={sort} phone /> : null}
    <Dialog open={sheetOpen} onOpenChange={setSheetOpen}>
      <DialogContent showCloseButton={false} {...(screen ? {} : { "aria-describedby": undefined })} data-slot="filters-screen"
        className="max-md:inset-0 max-md:h-dvh max-md:max-h-none max-md:grid-rows-[auto_minmax(0,1fr)_auto] max-md:rounded-none [&>[data-slot=dialog-handle]]:hidden">
        <header className="flex h-15 shrink-0 items-center gap-1 pt-[env(safe-area-inset-top)] pr-1.5 pl-1">
          <button type="button" onClick={() => setSheetOpen(false)} aria-label={t("actions.back")} title={t("actions.back")}
            className="inline-flex size-11 shrink-0 items-center justify-center rounded-full text-[var(--t1)] focus-visible:outline-2 focus-visible:outline-[var(--foco)]">
            <ChevronLeftIcon className="size-6.5" strokeWidth={1.9} />
          </button>
          <div className="min-w-0 flex-1">
            <DialogTitle className="text-[1.25rem] leading-[1.15] font-bold tracking-[-0.02em] text-[var(--t1)]">{t("filters.title")}</DialogTitle>
            {screen ? <DialogDescription className="block text-[0.78125rem] leading-[normal] font-medium text-[var(--t3)]">{screen}</DialogDescription> : null}
          </div>
        </header>
        <div className="min-h-0 overflow-y-auto pb-4">
          {filters.map((filter) => <FilterField key={filter.key} filter={filter} phone />)}
        </div>
        <div className="flex gap-2.5 border-t border-[var(--borde)] px-4 pt-3 pb-[max(1.75rem,env(safe-area-inset-bottom))]">
          <Button type="button" variant="outline" className="h-12 flex-1" disabled={!hasFilters} onClick={onClear}>{t("filters.clearAll")}</Button>
          <Button type="button" className="h-12 flex-1" onClick={() => setSheetOpen(false)}>{t("actions.done")}</Button>
        </div>
      </DialogContent>
    </Dialog>
  </>;

  // Tableros Usuarios, Roles, Empresas, Empresa y Auditoría, y «Criterio · Menús» (Filtros, 143 y 144): el buscador y hasta
  // tres desplegables en una fila, sin botón para aplicar ni cantidades; lo demás, en un solo «Filtros», con la cantidad
  // de aplicados como texto; lo aplicado en «Filtros», en chips con su ×, y «Limpiar todo». Todo con el radio de un
  // control, nunca en pastilla (173).
  return (
    <Surface
      role="search"
      aria-label={label}
      className={cn("flex flex-col items-stretch gap-2 p-2.5 md:px-3 md:py-2.5", className)}
    >
      <div className={cn("flex flex-col items-stretch gap-2 md:flex-row md:items-center", singleRow ? "md:flex-nowrap" : "md:flex-wrap")}>
        <div className={cn("relative w-full", singleRow ? "md:w-auto md:min-w-25 md:flex-1" : "md:w-90")}>
          <SearchIcon
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[var(--t3)]"
          />
          <Input
            type="search"
            value={searchValue}
            onChange={(event) => onSearchChange(event.target.value)}
            aria-label={searchLabel}
            placeholder={searchLabel}
            className="h-9 rounded-[0.5rem] border-[var(--borde)] bg-[var(--s2)] pl-9 text-[0.8125rem]"
          />
        </div>
        <div data-slot="filter-pills" className={cn("flex items-center gap-2", singleRow ? "shrink-0 flex-nowrap" : "flex-wrap", sort && !singleRow && "md:flex-1")}>
          {shown.map((filter) => <FilterMenu key={filter.key} filter={filter} />)}
          {more.length > 0 ? <MoreFilters filters={more} applied={applied.length} /> : null}
          {hasFilters && more.length === 0 ? <ClearButton onClick={onClear}>{clearLabel}</ClearButton> : null}
          {sort && sortableColumns(sort.columns).length > 0 ? <>
            {filters.length > 0 ? <span data-slot="sort-separator" aria-hidden="true" className="hidden w-px self-stretch bg-[var(--borde)] md:block" /> : null}
            <SortBy sort={sort} phone={false} />
          </> : null}
        </div>
      </div>
      {more.length > 0 && hasFilters ? <div data-slot="filter-chips" className="flex flex-wrap items-center gap-2">
        {applied.map((filter) => <FilterChip key={filter.key} removeLabel={t("filters.remove", { filter: chipText(filter) })}
          onRemove={() => filter.onChange(filter.options[0]?.value ?? "")}>
          {chipText(filter)}
        </FilterChip>)}
        <ClearButton onClick={onClear}>{t("filters.clearAll")}</ClearButton>
      </div> : null}
    </Surface>
  );
}

function ClearButton({ onClick, children }: { onClick: () => void; children: string }) {
  // Tableros de listas (.fb-limpiar): gris de 13 con 6 y 8 de relleno, que se oscurece con el mouse.
  return <button type="button" onClick={onClick}
    className="min-h-11 rounded-[0.5rem] px-2 py-1.5 text-[0.8125rem] leading-[normal] text-[var(--t3)] hover:bg-[var(--s2)] hover:text-[var(--t1)] focus-visible:outline-2 focus-visible:outline-[var(--foco)] md:min-h-7">
    {children}
  </button>;
}

const filterButtonClass = (active: boolean) => cn(
  "h-8 rounded-[0.5rem] px-3 text-[0.8125rem] shadow-none",
  active
    ? "border-[var(--marca)] bg-[var(--marca-t)] font-medium text-[var(--marca-tx)]"
    : "border-[var(--borde)] bg-[var(--superficie)] font-normal text-[var(--t2)]",
);

/// Un filtro de opciones es la pieza para elegir (262) con su botón de la barra: cerrado dice «Estado: todos» o la elegida;
/// abierta, «Todos» primero y separada, la elegida con su tilde a la izquierda, sin cantidades, del ancho de sus nombres.
/// Con muchas opciones o del servidor, se busca adentro de la lista.
function FilterMenu({ filter }: { filter: FilterBarFilter }) {
  const selected = selectedOf(filter);
  return (
    <Picker trigger="button" active={filter.active} label={filterName(filter)} {...pickerOf(filter)}
      // Sin filtro, el botón dice su propio texto («Estado: todos»).
      triggerLabel={selected?.label ?? filter.selectedLabel ?? filter.label} />
  );
}

/// «Filtros» (144): lo que no entra en la fila, en un solo botón con la cantidad de aplicados. Se despliega como
/// «Columnas»: a la izquierda lo que se filtra (con un punto si tiene algo elegido), a la derecha la pieza para elegir
/// (262), y cada cambio se aplica enseguida, sin «Aplicar».
function MoreFilters({ filters, applied }: { filters: readonly FilterBarFilter[]; applied: number }) {
  const { t } = useTranslation();
  const [current, setCurrent] = useState(filters[0]?.key ?? "");
  const filter = filters.find((item) => item.key === current) ?? filters[0];
  if (!filter) return null;
  return (
    <PopoverPrimitive.Root>
      <PopoverPrimitive.Trigger asChild>
        <Button type="button" variant="outline" className={filterButtonClass(applied > 0)}>
          <ListFilter aria-hidden="true" className="size-3.5" />
          {t("filters.title")}
          {applied > 0 ? <span data-slot="filter-count" className="text-[var(--marca-tx)]"><NumberText value={applied} /></span> : null}
        </Button>
      </PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content align="start" sideOffset={4} aria-label={t("filters.title")} role="dialog"
          className="z-50 flex max-h-[min(26rem,var(--radix-popover-content-available-height))] w-130 max-w-[calc(100vw-2rem)] overflow-hidden rounded-[0.625rem] border border-[var(--borde2)] bg-[var(--superficie)] text-[0.8125rem] shadow-[var(--sombra-menu)]">
          {/* .r311-panel .izq: lo que se filtra, con una línea entre cada uno; el que se está eligiendo lleva el tinte de la
              marca, la barra de 3 y la letra en 600 (142). */}
          <div role="tablist" aria-orientation="vertical" aria-label={t("filters.title")} className="flex w-55 shrink-0 flex-col overflow-y-auto border-r border-[var(--borde)]">
            {filters.map((item) => <button key={item.key} type="button" role="tab" aria-selected={item.key === filter.key} onClick={() => setCurrent(item.key)}
              className={cn("flex min-h-10 items-center justify-between gap-2 px-3.5 py-2 text-left text-[var(--t1)] not-first:border-t not-first:border-[var(--borde)] hover:bg-[var(--s2)] focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[var(--foco)]",
                item.key === filter.key && "bg-[var(--marca-t)] font-semibold text-[var(--marca-tx)] shadow-[inset_3px_0_0_var(--marca)] hover:bg-[var(--marca-t)]")}>
              <span className="min-w-0 flex-1">{filterName(item)}</span>
              {item.active ? <span data-slot="filter-dot" aria-hidden="true" className="size-1.5 shrink-0 rounded-full bg-[var(--marca)]" /> : null}
            </button>)}
          </div>
          <div role="tabpanel" aria-label={filterName(filter)} className="flex min-w-0 flex-1 flex-col overflow-y-auto p-3">
            <FilterField key={filter.key} filter={filter} phone={false} />
          </div>
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}

const capitalized = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

/// Las dos piezas de «Ordenar por» (264): «Columna» elige por cuál, en el sentido útil, y «Orden» elige el sentido, el
/// útil primero. Elegir lo ya elegido no vuelve a ordenar ni lleva a la primera página.
function SortFields({ sort, phone }: { sort: FilterBarSort; phone: boolean }) {
  const { t } = useTranslation();
  const columnId = useId(), orderId = useId();
  const columns = sortableColumns(sort.columns);
  const current = parseSort(sort.value);
  const column = current ? columns.find((item) => item.id === current.field) : undefined;
  const first = column ? firstDirection(column) : "ascending";
  const directions: SortDirection[] = first === "ascending" ? ["ascending", "descending"] : ["descending", "ascending"];
  const fieldClass = cn("flex flex-col", phone ? "gap-2 px-4 pt-5" : "gap-1.5");
  const labelClass = cn("text-[0.8125rem] font-semibold", phone ? "text-[var(--t3)]" : "text-[var(--t2)]");
  return <>
    <div className={fieldClass}>
      <span id={`${columnId}-label`} className={labelClass}>{t("sort.column")}</span>
      <Picker id={columnId} value={column?.id ?? null}
        options={columns.map((item) => ({ value: item.id, label: item.header }))}
        onChange={(id) => {
          const chosen = columns.find((item) => item.id === id);
          if (chosen && chosen.id !== column?.id) sort.onChange(sortValue(chosen.id, firstDirection(chosen)));
        }} />
    </div>
    <div className={fieldClass}>
      <span id={`${orderId}-label`} className={labelClass}>{t("sort.order")}</span>
      <Picker id={orderId} value={column && current ? current.direction : null} disabled={!column}
        options={column ? directions.map((direction) => ({ value: direction, label: capitalized(directionLabel(t, column, direction)) })) : []}
        onChange={(direction) => {
          if (column && current && direction !== current.direction) sort.onChange(sortValue(column.id, direction as SortDirection));
        }} />
    </div>
  </>;
}

/// «Ordenar por» (264, «Criterio · Tablas · base 2»): dice el orden con palabras («Ordenar por: Recibida, más reciente
/// primero») y abre la pieza con «Columna» y «Orden». En la compu va último en la barra, a la derecha; en el teléfono ocupa
/// el ancho, arriba de la lista, y abre la pieza a pantalla completa.
function SortBy({ sort, phone }: { sort: FilterBarSort; phone: boolean }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const label = sortByLabel(t, sort.columns, sort.value);
  if (phone) return <>
    <div className="px-4 pt-1 pb-2">
      <button type="button" data-slot="sort-by" aria-haspopup="dialog" onClick={() => setOpen(true)}
        className="flex h-11 w-full items-center justify-between gap-2 rounded-[0.625rem] border border-[var(--borde2)] px-3.5 text-left text-[0.875rem] text-[var(--t1)] focus-visible:outline-2 focus-visible:outline-[var(--foco)]">
        <span className="min-w-0 flex-1">{label}</span>
        <ChevronDownIcon aria-hidden="true" className="size-3.5 shrink-0 text-[var(--t2)]" />
      </button>
    </div>
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent showCloseButton={false} aria-describedby={undefined} data-slot="sort-screen"
        className="max-md:inset-0 max-md:h-dvh max-md:max-h-none max-md:grid-rows-[auto_minmax(0,1fr)_auto] max-md:rounded-none [&>[data-slot=dialog-handle]]:hidden">
        <header className="flex h-15 shrink-0 items-center gap-1 pt-[env(safe-area-inset-top)] pr-1.5 pl-1">
          <button type="button" onClick={() => setOpen(false)} aria-label={t("actions.back")} title={t("actions.back")}
            className="inline-flex size-11 shrink-0 items-center justify-center rounded-full text-[var(--t1)] focus-visible:outline-2 focus-visible:outline-[var(--foco)]">
            <ChevronLeftIcon className="size-6.5" strokeWidth={1.9} />
          </button>
          <DialogTitle className="min-w-0 flex-1 text-[1.25rem] leading-[1.15] font-bold tracking-[-0.02em] text-[var(--t1)]">{t("sort.by")}</DialogTitle>
        </header>
        <div className="min-h-0 overflow-y-auto pb-4"><SortFields sort={sort} phone /></div>
        <div className="flex border-t border-[var(--borde)] px-4 pt-3 pb-[max(1.75rem,env(safe-area-inset-bottom))]">
          <Button type="button" className="h-12 flex-1" onClick={() => setOpen(false)}>{t("actions.done")}</Button>
        </div>
      </DialogContent>
    </Dialog>
  </>;
  return (
    <PopoverPrimitive.Root open={open} onOpenChange={setOpen}>
      <PopoverPrimitive.Trigger asChild>
        <Button type="button" variant="outline" data-slot="sort-by" className={cn(filterButtonClass(false), "ml-auto whitespace-nowrap", open && "border-[var(--marca)]")}>
          {label}
          <ChevronDownIcon aria-hidden="true" className="size-3.5" />
        </Button>
      </PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content align="end" sideOffset={4} aria-label={t("sort.by")} role="dialog"
          className="z-50 grid w-105 max-w-[calc(100vw-2rem)] grid-cols-2 gap-3 rounded-[0.625rem] border border-[var(--borde2)] bg-[var(--superficie)] p-3 text-[0.8125rem] shadow-[var(--sombra-menu)]">
          <SortFields sort={sort} phone={false} />
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}
