import { useState, type ReactNode } from "react";
import { ListFilter } from "lucide-react";
import { ChevronDownIcon, SearchIcon } from "./icons";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";
import { Input } from "@/shared/ui/input";
import { Surface } from "@/shared/ui/Surface";
import { AppIconButton } from "./app/AppBar";
import { AppBarTools } from "./app/AppBarTools";
import { useAppChrome } from "./app/AppChrome";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "./dialog";

export interface FilterOption {
  value: string;
  label: string;
  count?: ReactNode;
}

export interface FilterBarFilter {
  key: string;
  label: string;
  menuLabel: string;
  count?: ReactNode;
  value: string;
  active: boolean;
  options: readonly FilterOption[];
  onChange: (value: string) => void;
}

export interface FilterBarProps {
  label: string;
  searchLabel: string;
  searchValue: string;
  onSearchChange: (value: string) => void;
  filters: readonly FilterBarFilter[];
  clearLabel: string;
  onClear: () => void;
  className?: string;
  /** En el teléfono, los íconos de la barra según el tablero de la lista: lupa y filtro (M-Usuarios), solo el filtro
   *  (M-Roles, M-Empresas, M-Auditoria-Org) o ninguno (M-Empresa). */
  phoneTools?: "search-and-filter" | "filter" | "none";
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
}: FilterBarProps) {
  const hasFilters = searchValue.trim().length > 0 || filters.some((filter) => filter.active);
  const { phone } = useAppChrome();
  const [searchOpen, setSearchOpen] = useState(searchValue.trim().length > 0);
  const [sheetOpen, setSheetOpen] = useState(false);

  // Tablero M-Usuarios: en el teléfono la lupa y el filtro son íconos de la barra de arriba. La lupa abre el buscador
  // debajo de la barra; el filtro abre una hoja con cada filtro y sus opciones, con «Todos» marcado si no hay filtro.
  if (phone) return <>
    <AppBarTools>
      {phoneTools === "search-and-filter" ? <AppIconButton label={searchLabel} aria-pressed={searchOpen} onClick={() => setSearchOpen((open) => !open)}><SearchIcon /></AppIconButton> : null}
      {filters.length > 0 && phoneTools !== "none" ? <AppIconButton label={label} onClick={() => setSheetOpen(true)}>
        <ListFilter />
        {filters.some((filter) => filter.active) ? <span aria-hidden="true" className="absolute top-2 right-2 size-2 rounded-full bg-[var(--marca)]" /> : null}
      </AppIconButton> : null}
    </AppBarTools>
    {searchOpen && phoneTools === "search-and-filter" ? <div className="px-4 pt-1 pb-2">
      <label className="flex h-[46px] items-center gap-2.5 rounded-[12px] bg-[var(--s3)] px-3.5 text-[var(--t3)]">
        <SearchIcon className="size-[18px] shrink-0" />
        <input type="search" autoFocus value={searchValue} onChange={(event) => onSearchChange(event.target.value)} aria-label={searchLabel} placeholder={searchLabel}
          className="min-w-0 flex-1 bg-transparent text-[15.5px] text-[var(--t1)] outline-none placeholder:text-[var(--t3)]" />
      </label>
    </div> : null}
    <Dialog open={sheetOpen} onOpenChange={setSheetOpen}>
      <DialogContent>
        <DialogHeader><DialogTitle>{label}</DialogTitle></DialogHeader>
        <div className="flex flex-col pt-1 pb-2">
          {filters.map((filter) => {
            const selected = filter.options.find((option) => option.value === filter.value);
            const checked = selected ? filter.value : filter.options[0]?.value ?? "";
            return <fieldset key={filter.key} className="m-0 border-0 p-0">
              <legend className="px-5 pt-2.5 pb-1 text-[13px] font-semibold text-[var(--t3)]">{filter.label.split(":")[0]}</legend>
              {filter.options.map((option) => <label key={option.value} className="flex min-h-[54px] items-center gap-3 border-t border-[var(--borde)] px-5 text-[16px] text-[var(--t1)] first-of-type:border-t-0">
                <span className="min-w-0 flex-1 truncate">{option.label}</span>
                {option.count === undefined ? null : <span className="text-[13.5px] text-[var(--t3)]">{option.count}</span>}
                <input type="radio" name={filter.key} value={option.value} checked={checked === option.value} className="size-5 accent-[var(--marca)]"
                  onChange={() => { filter.onChange(option.value); setSheetOpen(false); }} />
              </label>)}
            </fieldset>;
          })}
        </div>
        {hasFilters ? <DialogFooter><button type="button" onClick={() => { onClear(); setSheetOpen(false); }}
          className="inline-flex items-center justify-center rounded-[12px] border border-[var(--borde2)] bg-[var(--lado-activo)] font-semibold text-[var(--t1)]">{clearLabel}</button></DialogFooter> : null}
      </DialogContent>
    </Dialog>
  </>;

  // Tableros Usuarios, Roles, Empresas, Empresa y Auditoría (lienzo v104): el buscador de 36 × 360 sobre gris claro con
  // el borde fino, la lupa de 16 a 12 del borde y el texto a 36, con letra de 13; los filtros en píldoras de 32 sin
  // negrita; el elegido, en petróleo.
  return (
    <Surface
      role="search"
      aria-label={label}
      className={cn("flex flex-col items-stretch gap-2 p-2.5 md:flex-row md:flex-wrap md:items-center md:px-3 md:py-2.5", className)}
    >
      <div className="relative w-full md:w-[360px]">
        <SearchIcon
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[var(--t3)]"
        />
        <Input
          type="search"
          value={searchValue}
          onChange={(event) => onSearchChange(event.target.value)}
          aria-label={searchLabel}
          placeholder={searchLabel}
          className="h-9 rounded-[8px] border-[var(--borde)] bg-[var(--s2)] pl-9 text-[13px]"
        />
      </div>
      <div data-slot="filter-pills" className="flex flex-wrap items-center gap-2">
      {filters.map((filter) => {
        const selected = filter.options.find((option) => option.value === filter.value);
        // Sin filtro, el botón dice su propio texto («Vale en: todos») y el menú marca la primera opción, «Todos».
        const checked = selected ? filter.value : filter.options[0]?.value ?? "";

        return (
          <DropdownMenu key={filter.key}>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="outline"
                className={cn(
                  "h-8 rounded-full px-3 text-[13px] shadow-none",
                  filter.active
                    ? "border-[var(--marca)] bg-[var(--marca-t)] font-medium text-[var(--marca-tx)]"
                    : "border-[var(--borde)] bg-[var(--lado-activo)] font-normal text-[var(--t2)]",
                )}
              >
                {selected?.label ?? filter.label}
                {filter.count === undefined ? null : (
                  <span className="text-xs text-[var(--t2)]">{filter.count}</span>
                )}
                <ChevronDownIcon strokeWidth={2} className="size-3.5" />
              </Button>
            </DropdownMenuTrigger>
            {/* Tablero Usuarios (filtro abierto, .menu): 4 de relleno alrededor de las opciones y 200 de ancho mínimo. */}
            <DropdownMenuContent align="start" aria-label={filter.menuLabel} className="min-w-[200px] p-1">
              <DropdownMenuRadioGroup value={checked} onValueChange={filter.onChange}>
                {filter.options.map((option) => (
                  <DropdownMenuRadioItem key={option.value} value={option.value}>
                    {option.label}
                    {option.count === undefined ? null : (
                      <span className="ml-auto pl-4 text-xs text-[var(--t3)] tabular-nums">
                        {option.count}
                      </span>
                    )}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      })}
      {hasFilters ? (
        <button
          type="button"
          onClick={onClear}
          // Tableros de listas (.fb-limpiar): gris de 14, que se oscurece con el mouse.
          className="min-h-11 rounded-[8px] px-2.5 py-1.5 text-[14px] text-[var(--t3)] hover:bg-[var(--s2)] hover:text-[var(--t1)] focus-visible:outline-2 focus-visible:outline-[var(--foco)] md:min-h-8"
        >
          {clearLabel}
        </button>
      ) : null}
      </div>
    </Surface>
  );
}
