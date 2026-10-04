import { CheckIcon, ChevronDownIcon, SearchIcon } from "lucide-react";
import { Popover as PopoverPrimitive } from "radix-ui";
import { useEffect, useId, useRef, useState, type ComponentProps, type KeyboardEvent, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "@/shared/lib/utils";

export interface SearchSelectOption {
  value: string;
  label: string;
  /** Segunda línea gris, como la vista previa de un idioma y región. */
  description?: string;
  /** A la izquierda del nombre, como la bandera de un país. */
  icon?: ReactNode;
  /** Más texto para encontrarla con el buscador: el código, el prefijo. */
  keywords?: string;
}

interface SearchSelectProps {
  options: readonly SearchSelectOption[];
  value: string;
  onChange: (value: string) => void;
  /** Lo que dice el control mientras no hay nada elegido. */
  placeholder: string;
  /** Nombre del buscador, que aparece con más de 10 opciones. */
  searchLabel: string;
  /** El texto del control cuando el valor no está entre las opciones (por ejemplo, una zona ya deshabilitada). */
  selectedLabel?: string;
  /** Lo que muestra el control para la opción elegida, si no es su nombre (el teléfono muestra «AR +54»). */
  renderValue?: (option: SearchSelectOption) => ReactNode;
  id?: string;
  disabled?: boolean;
  busy?: boolean;
  className?: string;
  "aria-invalid"?: ComponentProps<"button">["aria-invalid"];
  "aria-describedby"?: string;
  "aria-label"?: string;
}

/** Con más de 10 opciones, el buscador aparece arriba de la lista (tablero «Criterio · Formularios»). */
const SEARCH_THRESHOLD = 10;

function normalize(text: string): string {
  return text.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
}

/// Un desplegable con la altura de un campo para elegir una opción: un solo control por dato. Va adentro de
/// `FormField`, que ata el rótulo al botón con el `id`. Con más de 10 opciones, la lista suma un buscador
/// arriba, que filtra sin tildes ni mayúsculas. Se elige con el mouse o con flechas y Enter.
export function SearchSelect({
  options, value, onChange, placeholder, searchLabel, selectedLabel, renderValue, id, disabled, busy, className,
  "aria-invalid": ariaInvalid, "aria-describedby": ariaDescribedBy, "aria-label": ariaLabel,
}: SearchSelectProps): ReactNode {
  const { t } = useTranslation();
  const listId = useId();
  const listRef = useRef<HTMLUListElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const withSearch = options.length > SEARCH_THRESHOLD;
  const term = normalize(query.trim());
  const visible = term === "" ? options : options.filter((option) => normalize(`${option.label} ${option.value} ${option.keywords ?? ""}`).includes(term));
  const selected = options.find((option) => option.value === value);
  const optionId = (index: number) => `${listId}-${index}`;

  function changeOpen(next: boolean) {
    setOpen(next);
    if (!next) return;
    setQuery("");
    setActive(Math.max(0, options.findIndex((option) => option.value === value)));
  }

  function choose(option: SearchSelectOption | undefined) {
    if (!option) return;
    onChange(option.value);
    setOpen(false);
  }

  function navigate(event: KeyboardEvent) {
    const last = visible.length - 1;
    if (event.key === "ArrowDown") setActive((index) => Math.min(index + 1, last));
    else if (event.key === "ArrowUp") setActive((index) => Math.max(index - 1, 0));
    else if (event.key === "Home") setActive(0);
    else if (event.key === "End") setActive(Math.max(last, 0));
    else if (event.key === "Enter") choose(visible[active]);
    else return;
    event.preventDefault();
  }

  useEffect(() => {
    if (open) listRef.current?.querySelector(`#${CSS.escape(optionId(active))}`)?.scrollIntoView?.({ block: "nearest" });
  });

  const shown = selected ? (renderValue?.(selected) ?? selected.label) : selectedLabel;

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={changeOpen}>
      <PopoverPrimitive.Trigger asChild>
        <button
          type="button"
          role="combobox"
          id={id}
          disabled={disabled}
          aria-expanded={open}
          aria-haspopup="listbox"
          aria-controls={open ? listId : undefined}
          aria-busy={busy || undefined}
          aria-invalid={ariaInvalid}
          aria-describedby={ariaDescribedBy}
          aria-label={ariaLabel}
          onKeyDown={(event) => {
            if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
            event.preventDefault();
            changeOpen(true);
          }}
          className={cn(
            "flex h-9 w-full min-w-0 items-center justify-between gap-2 rounded-[8px] border border-[var(--borde2)] bg-[var(--lado-activo)] px-3 text-left text-[13px] outline-none",
            "focus-visible:border-[var(--marca)] focus-visible:ring-[3px] focus-visible:ring-[var(--foco-halo)] disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive",
            className,
          )}
        >
          <span className={cn("flex min-w-0 items-center gap-2 truncate", shown ? "text-[var(--t1)]" : "text-[var(--t3)]")}>
            {selected?.icon && !renderValue ? selected.icon : null}
            <span className="truncate">{shown ?? placeholder}</span>
          </span>
          <ChevronDownIcon aria-hidden="true" className="size-4 shrink-0 text-[var(--t2)]" />
        </button>
      </PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          align="start"
          sideOffset={4}
          onOpenAutoFocus={(event) => {
            if (withSearch) return;
            event.preventDefault();
            listRef.current?.focus();
          }}
          className="z-50 w-(--radix-popover-trigger-width) min-w-[220px] overflow-hidden rounded-[10px] border border-[var(--borde)] bg-[var(--lado-activo)] text-[13px] shadow-[0_8px_24px_-12px_oklch(0.24_0.012_60/0.25)]"
        >
          {withSearch ? <div className="relative border-b border-[var(--borde)] p-2">
            <SearchIcon aria-hidden="true" className="pointer-events-none absolute top-1/2 left-4.5 size-4 -translate-y-1/2 text-[var(--t3)]" />
            <input
              type="search"
              aria-label={searchLabel}
              placeholder={searchLabel}
              value={query}
              aria-controls={listId}
              aria-activedescendant={visible.length > 0 ? optionId(active) : undefined}
              onChange={(event) => { setQuery(event.target.value); setActive(0); }}
              onKeyDown={navigate}
              className="h-8 w-full rounded-[8px] border border-[var(--borde2)] bg-[var(--s2)] pr-3 pl-8 text-[13px] text-[var(--t1)] outline-none placeholder:text-[var(--t3)] focus-visible:border-[var(--marca)]"
            />
          </div> : null}
          {visible.length === 0 ? <p className="px-3.5 py-3 text-[13px] text-[var(--t2)]">{t("fields.noMatches")}</p> : null}
          <ul
            ref={listRef}
            id={listId}
            role="listbox"
            aria-label={placeholder}
            tabIndex={withSearch ? -1 : 0}
            aria-activedescendant={!withSearch && visible.length > 0 ? optionId(active) : undefined}
            onKeyDown={withSearch ? undefined : navigate}
            className={cn("max-h-[280px] overflow-y-auto p-1 outline-none", visible.length === 0 ? "hidden" : undefined)}
          >
            {visible.map((option, index) => {
              const isSelected = option.value === value;
              return <li
                key={option.value}
                id={optionId(index)}
                role="option"
                aria-selected={isSelected}
                onMouseMove={() => setActive(index)}
                onClick={() => choose(option)}
                className={cn(
                  "flex min-h-9 cursor-pointer items-center gap-2 rounded-[6px] px-2.5 py-1.5",
                  isSelected ? "bg-[var(--marca-t)] text-[var(--marca-tx)]" : "text-[var(--t1)]",
                  index === active && !isSelected ? "bg-[var(--s2)]" : undefined,
                )}
              >
                {option.icon}
                <span className="flex min-w-0 flex-1 flex-col leading-[1.35]">
                  <span className="truncate">{option.label}</span>
                  {option.description ? <span className="truncate text-[12px] text-[var(--t3)]">{option.description}</span> : null}
                </span>
                {isSelected ? <CheckIcon aria-hidden="true" className="size-4 shrink-0" /> : null}
              </li>;
            })}
          </ul>
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}
