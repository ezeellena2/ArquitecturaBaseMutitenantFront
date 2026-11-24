import { useState } from "react";
import { ListFilter } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Popover as PopoverPrimitive } from "radix-ui";
import { CheckIcon, ChevronLeftIcon, SearchIcon } from "./icons";
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
import { RemoteOptionFooter, RemoteOptionSearch } from "./RemoteOptionControls";
import { NumberText } from "./format/NumberText";
import { Picker } from "./Picker";

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

/// La tilde de lo elegido, a la izquierda de cada opción (142); las demás guardan su lugar.
function Tilde({ on }: { on: boolean }) {
  return <span data-slot="tilde" aria-hidden="true" className="inline-flex size-4 shrink-0 items-center justify-center text-[var(--marca-tx)]">
    {on ? <CheckIcon strokeWidth={2.25} className="size-3.5" /> : null}
  </span>;
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
  // abre el buscador debajo de la barra; el filtro abre «Filtros» a pantalla completa, con cada filtro y sus opciones sin
  // cantidades, que se aplican al tocarlas, y «Limpiar todo» y «Listo» abajo. Con algo aplicado, el ícono lleva un punto.
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
          {filters.map((filter) => {
            const checked = checkedOf(filter);
            return <fieldset key={filter.key} className="m-0 border-0 p-0">
              <legend className="px-4 pt-5 pb-2 text-[0.8125rem] font-semibold text-[var(--t3)]">{filterName(filter)}</legend>
              {filter.remote ? <RemoteOptionSearch remote={filter.remote} label={filter.menuLabel} /> : null}
              {filter.options.map((option) => <label key={option.value} className={cn("flex min-h-13 items-center gap-3 border-b border-[var(--borde)] px-4 text-[1rem] text-[var(--t1)] has-[input:focus-visible]:outline-2 has-[input:focus-visible]:-outline-offset-2 has-[input:focus-visible]:outline-[var(--foco)]", checked === option.value && "font-semibold")}>
                <input type="radio" name={filter.key} value={option.value} checked={checked === option.value} className="sr-only"
                  onChange={() => filter.onChange(option.value)} />
                <Tilde on={checked === option.value} />
                <span className="min-w-0 flex-1">{option.label}</span>
              </label>)}
              {filter.remote ? <RemoteOptionFooter remote={filter.remote} /> : null}
            </fieldset>;
          })}
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
        <div data-slot="filter-pills" className={cn("flex items-center gap-2", singleRow ? "shrink-0 flex-nowrap" : "flex-wrap")}>
          {shown.map((filter) => <FilterMenu key={filter.key} filter={filter} />)}
          {more.length > 0 ? <MoreFilters filters={more} applied={applied.length} /> : null}
          {hasFilters && more.length === 0 ? <ClearButton onClick={onClear}>{clearLabel}</ClearButton> : null}
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
  const [first, ...rest] = filter.options;
  const others = filter.selectedLabel && !selected && filter.value ? [{ value: filter.value, label: filter.selectedLabel }] : [];
  return (
    <Picker trigger="button" active={filter.active} label={filterName(filter)} value={checkedOf(filter)} onChange={filter.onChange}
      first={first} options={rest} selectedOptions={others} remote={filter.remote}
      // Sin filtro, el botón dice su propio texto («Estado: todos»).
      triggerLabel={selected?.label ?? filter.selectedLabel ?? filter.label} />
  );
}

/// «Filtros» (144): lo que no entra en la fila, en un solo botón con la cantidad de aplicados. Se despliega como
/// «Columnas»: a la izquierda lo que se filtra (con un punto si tiene algo elegido), a la derecha sus opciones, y cada
/// cambio se aplica enseguida, sin «Aplicar».
function MoreFilters({ filters, applied }: { filters: readonly FilterBarFilter[]; applied: number }) {
  const { t } = useTranslation();
  const [current, setCurrent] = useState(filters[0]?.key ?? "");
  const filter = filters.find((item) => item.key === current) ?? filters[0];
  if (!filter) return null;
  const checked = checkedOf(filter);
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
          <div role="tabpanel" aria-label={filterName(filter)} className="flex min-w-0 flex-1 flex-col overflow-y-auto p-1">
            <span className="px-2.5 pt-1.5 pb-1 font-semibold text-[var(--t1)]">{filterName(filter)}</span>
            {filter.remote ? <RemoteOptionSearch remote={filter.remote} label={filter.menuLabel} /> : null}
            <div role="radiogroup" aria-label={filter.menuLabel}>
              {filter.options.map((option) => <label key={option.value}
                className={cn("flex min-h-8.5 cursor-default items-center gap-2 rounded-[0.5rem] px-2.5 py-1.5 hover:bg-[var(--s2)] has-[input:focus-visible]:outline-2 has-[input:focus-visible]:outline-[var(--foco)]",
                  checked === option.value && "font-medium text-[var(--marca-tx)]")}>
                <input type="radio" name={`mas-${filter.key}`} value={option.value} checked={checked === option.value} className="sr-only"
                  onChange={() => filter.onChange(option.value)} />
                <Tilde on={checked === option.value} />
                <span className="min-w-0 flex-1">{option.label}</span>
              </label>)}
            </div>
            {filter.remote ? <RemoteOptionFooter remote={filter.remote} /> : null}
          </div>
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}
