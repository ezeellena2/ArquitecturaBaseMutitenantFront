import { CheckIcon } from "lucide-react";
import { ChevronDownIcon, SearchIcon } from "./icons";
import { Popover as PopoverPrimitive } from "radix-ui";
import { useEffect, useId, useRef, useState, type ComponentProps, type KeyboardEvent, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "@/shared/lib/utils";
import { useAppChrome } from "./app/AppChrome";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./dialog";

export interface SearchSelectOption {
  value: string;
  label: string;
  /** Segunda línea gris, como la vista previa de un idioma y región. */
  description?: string;
  /** A la izquierda del nombre, como la bandera de un país. */
  icon?: ReactNode;
  /** A la derecha, en gris, como el prefijo de un país. */
  trailing?: string;
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
  selectedLabel?: ReactNode;
  /** Lo que muestra el control para la opción elegida, si no es su nombre (el teléfono muestra «AR +54»). */
  renderValue?: (option: SearchSelectOption) => ReactNode;
  /** El título de la hoja en el teléfono, si el control no tiene rótulo propio (el país de un teléfono). */
  title?: string;
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

/// El rótulo del campo, que `FormField` ata al control con el `id`, sin el asterisco de obligatorio.
function fieldLabel(id: string | undefined): string | undefined {
  const label = id ? document.querySelector(`label[for="${CSS.escape(id)}"]`) : null;
  if (!label) return undefined;
  const copy = label.cloneNode(true) as HTMLElement;
  copy.querySelectorAll("[aria-hidden='true']").forEach((node) => node.remove());
  return copy.textContent?.trim() || undefined;
}

/// Un desplegable con la altura de un campo para elegir una opción: un solo control por dato. Va adentro de
/// `FormField`, que ata el rótulo al botón con el `id`. Con más de 10 opciones, la lista suma un buscador
/// arriba, que filtra sin tildes ni mayúsculas. Se elige con el mouse o con flechas y Enter. En el teléfono la lista
/// es una hoja desde abajo, con el rótulo del campo como título (tablero M-Cuenta-Agregar, «País»).
export function SearchSelect({
  options, value, onChange, placeholder, searchLabel, selectedLabel, renderValue, title, id, disabled, busy, className,
  "aria-invalid": ariaInvalid, "aria-describedby": ariaDescribedBy, "aria-label": ariaLabel,
}: SearchSelectProps): ReactNode {
  const { t } = useTranslation();
  const { phone } = useAppChrome();
  const listId = useId();
  const listRef = useRef<HTMLUListElement>(null);
  const [open, setOpen] = useState(false);
  const [sheetTitle, setSheetTitle] = useState("");
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
    if (phone) setSheetTitle(title ?? fieldLabel(id) ?? placeholder);
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

  const trigger = <button
    type="button"
    role="combobox"
    id={id}
    disabled={disabled}
    aria-expanded={open}
    aria-haspopup={phone ? "dialog" : "listbox"}
    aria-controls={open ? listId : undefined}
    aria-busy={busy || undefined}
    aria-invalid={ariaInvalid}
    aria-describedby={ariaDescribedBy}
    aria-label={ariaLabel}
    onClick={phone ? () => changeOpen(true) : undefined}
    onKeyDown={(event) => {
      if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
      event.preventDefault();
      changeOpen(true);
    }}
    className={cn(
      "flex h-9 w-full min-w-0 items-center justify-between gap-2 rounded-[8px] border border-[var(--borde2)] bg-[var(--lado-activo)] px-3 text-left text-[13px] outline-none max-md:h-12 max-md:rounded-[12px] max-md:px-3.5 max-md:text-[16px]",
      "focus-visible:border-[var(--marca)] focus-visible:ring-[3px] focus-visible:ring-[var(--foco-halo)] aria-expanded:border-[var(--marca)] aria-expanded:ring-[3px] aria-expanded:ring-[var(--foco-halo)] disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive",
      className,
    )}
  >
    <span className={cn("flex min-w-0 items-center gap-2 truncate", shown ? "text-[var(--t1)]" : "text-[var(--t3)]")}>
      {selected?.icon && !renderValue ? selected.icon : null}
      <span className="truncate">{shown ?? placeholder}</span>
    </span>
    <ChevronDownIcon strokeWidth={2} className="size-3.5 shrink-0 text-[var(--t2)] max-md:size-[18px] max-md:text-[var(--t1)]" />
  </button>;

  const search = withSearch ? <div className={phone ? "relative px-5 pt-1 pb-2" : "relative border-b border-[var(--borde)] p-2"}>
    <SearchIcon className={cn("pointer-events-none absolute top-1/2 -translate-y-1/2 text-[var(--t3)]", phone ? "left-8.5 size-5" : "left-4.5 size-4")} />
    <input
      type="search"
      aria-label={searchLabel}
      placeholder={searchLabel}
      value={query}
      aria-controls={listId}
      aria-activedescendant={visible.length > 0 ? optionId(active) : undefined}
      onChange={(event) => { setQuery(event.target.value); setActive(0); }}
      onKeyDown={navigate}
      className={cn("w-full border border-[var(--borde2)] bg-[var(--s2)] pr-3 text-[var(--t1)] outline-none placeholder:text-[var(--t3)] focus-visible:border-[var(--marca)]",
        phone ? "h-11 rounded-[12px] pl-11 text-[16px]" : "h-8 rounded-[8px] pl-8 text-[13px]")}
    />
  </div> : null;

  const list = <>
    {visible.length === 0 ? <p className={cn("text-[var(--t2)]", phone ? "px-5 py-3 text-[15px]" : "px-3.5 py-3 text-[13px]")}>{t("fields.noMatches")}</p> : null}
    <ul
      ref={listRef}
      id={listId}
      role="listbox"
      aria-label={placeholder}
      tabIndex={withSearch ? -1 : 0}
      aria-activedescendant={!withSearch && visible.length > 0 ? optionId(active) : undefined}
      onKeyDown={withSearch ? undefined : navigate}
      className={cn("outline-none", phone ? "px-5 pt-2 pb-4" : "max-h-[280px] overflow-y-auto p-1", visible.length === 0 ? "hidden" : undefined)}
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
            // M-Cuenta-Agregar: en el teléfono, filas de 52 sin fondo; la elegida, en petróleo con el tilde.
            phone ? "flex min-h-[52px] cursor-pointer items-center gap-3 px-1 text-[16px]"
              : "flex min-h-9 cursor-pointer items-center gap-2.5 rounded-[6px] px-2.5 py-1.5",
            isSelected ? cn("font-medium text-[var(--marca-tx)]", phone ? undefined : "bg-[var(--marca-t)]") : "text-[var(--t1)]",
            index === active && !isSelected ? "bg-[var(--s2)]" : undefined,
          )}
        >
          {option.icon}
          <span className="flex min-w-0 flex-1 flex-col leading-[1.35]">
            <span className="truncate">{option.label}</span>
            {option.description ? <span className={cn("truncate text-[var(--t3)]", phone ? "text-[13px]" : "text-[12px]")}>{option.description}</span> : null}
          </span>
          {/* El espacio separa el nombre del prefijo también para los lectores de pantalla («Argentina +54»). */}
          {option.trailing ? <>{" "}<span className="ml-auto shrink-0 font-normal text-[var(--t2)]">{option.trailing}</span></> : null}
          {isSelected ? <CheckIcon aria-hidden="true" className={cn("shrink-0", phone ? "size-5" : "size-4")} /> : null}
        </li>;
      })}
    </ul>
  </>;

  if (phone) return <>
    {trigger}
    <Dialog open={open} onOpenChange={changeOpen}>
      <DialogContent aria-describedby={undefined}>
        <DialogHeader><DialogTitle>{sheetTitle}</DialogTitle></DialogHeader>
        {search}
        {list}
      </DialogContent>
    </Dialog>
  </>;

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={changeOpen}>
      <PopoverPrimitive.Trigger asChild>{trigger}</PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        {/* «Criterio · Formularios», Desplegable: debajo del campo, alineada a su izquierda y de su mismo ancho. */}
        <PopoverPrimitive.Content
          side="bottom"
          align="start"
          sideOffset={4}
          onOpenAutoFocus={(event) => {
            if (withSearch) return;
            event.preventDefault();
            listRef.current?.focus();
          }}
          className="z-50 w-(--radix-popover-trigger-width) min-w-0 overflow-hidden rounded-[10px] border border-[var(--borde)] bg-[var(--lado-activo)] text-[13px] shadow-[0_8px_24px_-12px_oklch(0.24_0.012_60/0.25)]"
        >
          {search}
          {list}
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}
