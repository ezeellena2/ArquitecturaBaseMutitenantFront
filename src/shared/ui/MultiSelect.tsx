import { useId, type ComponentProps, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { ChevronDownIcon } from "./icons";
import { cn } from "@/shared/lib/utils";
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./dropdown-menu";
import type { RemoteOptions } from "@/shared/hooks/useResourceOptions";
import { RemoteOptionFooter, RemoteOptionSearch } from "./RemoteOptionControls";

export interface MultiSelectOption {
  value: string;
  label: string;
  /// Línea de ayuda debajo de la opción.
  description?: ReactNode;
}

interface MultiSelectProps {
  options: readonly MultiSelectOption[];
  value: readonly string[];
  onChange: (value: string[]) => void;
  /// Lo que dice el control mientras no hay nada elegido.
  placeholder: string;
  id?: string;
  remote?: RemoteOptions;
  selectedOptions?: readonly MultiSelectOption[];
  /// Con búsqueda remota, ofrece «Crear «VIP»» cuando lo buscado no está entre las opciones (sin distinguir mayúsculas):
  /// al elegirla queda marcado ese texto como valor nuevo. Sirve para lo que se crea al guardar, como una etiqueta.
  creatable?: boolean;
  disabled?: boolean;
  /// `list`: lo elegido como una enumeración que se parte en renglones y une el último con «y» («Ver organizaciones,
  /// Administrar cuentas, Recuperaciones y Ver la auditoría», tablero M-Cuenta-Plat). Por defecto, un renglón con comas.
  summary?: "line" | "list";
  "aria-invalid"?: ComponentProps<"button">["aria-invalid"];
  "aria-describedby"?: string;
}

/// Un control con la altura de un campo que, al abrirse, deja marcar varias opciones. Muestra lo elegido
/// separado por comas. Va adentro de `FormField`: el `id` que este le enchufa ata la etiqueta al botón, y así
/// "Roles" es su nombre accesible.
///
/// Elegir una opción no cierra el menú (`preventDefault` en `onSelect`): se marcan varias de una vez, y
/// cerrarlo en cada clic obligaría a reabrirlo por cada una.
export function MultiSelect({
  options,
  value,
  onChange,
  placeholder,
  id,
  remote,
  selectedOptions = options,
  creatable = false,
  disabled,
  summary = "line",
  "aria-invalid": ariaInvalid,
  "aria-describedby": ariaDescribedBy,
}: MultiSelectProps): ReactNode {
  const { t } = useTranslation();
  const known = new Map(selectedOptions.map((option) => [option.value, option]));
  // Lo creado acá todavía no es una opción del servidor: se muestra con su texto y se puede desmarcar arriba de la lista.
  const created = creatable ? value.filter((item) => !known.has(item) && !options.some((option) => option.value === item))
    .map((item): MultiSelectOption => ({ value: item, label: item })) : [];
  for (const option of created) known.set(option.value, option);
  // En el orden de las opciones y no en el de los clics: así el texto no cambia según cómo se llegó.
  const picked = [...known.values()].filter((option) => value.includes(option.value));
  const labels = picked.map((option) => option.label);
  const text = summary === "list" && labels.length > 1
    ? t("fields.selectedList", { rest: labels.slice(0, -1).join(", "), last: labels.at(-1) }) : labels.join(", ");
  const list = summary === "list";
  const optionId = useId();
  const typed = remote?.search.trim() ?? "";
  const same = (text: string) => text.localeCompare(typed, undefined, { sensitivity: "accent" }) === 0;
  // Se ofrece crear solo con la búsqueda ya respondida: así no se duplica una que existe y todavía no llegó.
  const offerCreate = creatable && remote !== undefined && typed !== "" && !remote.loading && !remote.error
    && ![...options, ...known.values()].some((option) => same(option.value) || same(option.label));

  function toggle(optionValue: string, checked: boolean) {
    onChange(checked ? [...value, optionValue] : value.filter((item) => item !== optionValue));
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        id={id}
        disabled={disabled}
        aria-busy={remote?.loading || undefined}
        aria-invalid={ariaInvalid}
        aria-describedby={ariaDescribedBy}
        className={cn(
          "flex h-9 w-full min-w-0 items-center justify-between gap-2 rounded-[8px] border border-[var(--borde2)] bg-[var(--lado-activo)] px-3 text-left text-[13px] outline-none max-md:h-12 max-md:rounded-[12px] max-md:px-3.5 max-md:text-[16px]",
          // Con la enumeración, el campo crece con sus renglones (M-Cuenta-Plat, .ct.sel).
          list && "h-auto min-h-9 py-1.5 max-md:h-auto max-md:min-h-12 max-md:py-2 max-md:leading-[1.3]",
          // Tablero Usuario (.o-dd > button.ct[aria-expanded=true]): abierto, con el borde petróleo y el halo, como con foco.
          "focus-visible:border-[var(--marca)] focus-visible:ring-[3px] focus-visible:ring-[var(--foco-halo)] aria-expanded:border-[var(--marca)] aria-expanded:ring-[3px] aria-expanded:ring-[var(--foco-halo)]",
          // Tablero Usuario: lo vacío, como «Ninguno», en el gris de campo vacío.
          picked.length > 0 ? "text-[var(--t1)]" : "text-[var(--t3)]",
        )}
      >
        <span className={list ? "min-w-0 break-words" : "truncate"}>
          {picked.length > 0 ? text : placeholder}
        </span>
        <ChevronDownIcon strokeWidth={2} className="size-3.5 shrink-0 text-[var(--t2)] max-md:size-[18px] max-md:text-[var(--t1)]" />
      </DropdownMenuTrigger>
      {/* Tablero Usuario (.o-lst) y «Criterio · Formularios», Desplegable: la lista se abre debajo del campo y mide lo mismo
          que él, con 4 de margen adentro; cada opción, el nombre y debajo su descripción, en gris de 12 (.n2 y .d). */}
      <DropdownMenuContent side="bottom" align="start" className="w-(--radix-dropdown-menu-trigger-width) max-w-none min-w-0 p-1">
        {remote ? <RemoteOptionSearch remote={remote} /> : null}
        {offerCreate ? <DropdownMenuItem onSelect={(event) => {
          event.preventDefault();
          // La opción desaparece al crearla: el foco vuelve al buscador para que la lista siga abierta.
          if (event.target instanceof HTMLElement) event.target.closest('[role="menu"]')?.querySelector<HTMLInputElement>('input[type="search"]')?.focus();
          onChange([...value, typed]);
          remote?.onSearch("");
        }}>{t("fields.createOption", { value: typed })}</DropdownMenuItem> : null}
        {[...created, ...options].map((option, index) => (
          // El nombre de la opción es el rol; la descripción la acompaña como descripción, no como parte del nombre.
          <DropdownMenuCheckboxItem
            key={option.value}
            checked={value.includes(option.value)}
            onCheckedChange={(checked) => toggle(option.value, checked)}
            onSelect={(event) => event.preventDefault()}
            aria-labelledby={`${optionId}-${index}`}
            aria-describedby={option.description ? `${optionId}-${index}-description` : undefined}
          >
            <span className="flex min-w-0 flex-col leading-[1.35]">
              <span id={`${optionId}-${index}`}>{option.label}</span>
              {option.description ? (
                <span id={`${optionId}-${index}-description`} className="text-[12px] text-[var(--t3)]">{option.description}</span>
              ) : null}
            </span>
          </DropdownMenuCheckboxItem>
        ))}
        {remote ? <RemoteOptionFooter remote={remote} /> : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
