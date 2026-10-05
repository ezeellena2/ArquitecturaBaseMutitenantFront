import { useId, type ComponentProps, type ReactNode } from "react";
import { ChevronDownIcon } from "lucide-react";
import { cn } from "@/shared/lib/utils";
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuTrigger } from "./dropdown-menu";

export interface MultiSelectOption {
  value: string;
  label: string;
  /// Línea de ayuda debajo de la opción.
  description?: string;
}

interface MultiSelectProps {
  options: readonly MultiSelectOption[];
  value: readonly string[];
  onChange: (value: string[]) => void;
  /// Lo que dice el control mientras no hay nada elegido.
  placeholder: string;
  id?: string;
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
  "aria-invalid": ariaInvalid,
  "aria-describedby": ariaDescribedBy,
}: MultiSelectProps): ReactNode {
  // En el orden de las opciones y no en el de los clics: así el texto no cambia según cómo se llegó.
  const picked = options.filter((option) => value.includes(option.value));
  const optionId = useId();

  function toggle(optionValue: string, checked: boolean) {
    onChange(checked ? [...value, optionValue] : value.filter((item) => item !== optionValue));
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        id={id}
        aria-invalid={ariaInvalid}
        aria-describedby={ariaDescribedBy}
        className={cn(
          "flex h-9 w-full min-w-0 items-center justify-between gap-2 rounded-[8px] border border-[var(--borde2)] bg-[var(--lado-activo)] px-3 text-left text-[13px] outline-none max-md:h-12 max-md:rounded-[12px] max-md:px-3.5 max-md:text-[16px]",
          // Tablero Usuario (.o-dd > button.ct[aria-expanded=true]): abierto, con el borde petróleo y el halo, como con foco.
          "focus-visible:border-[var(--marca)] focus-visible:ring-[3px] focus-visible:ring-[var(--foco-halo)] aria-expanded:border-[var(--marca)] aria-expanded:ring-[3px] aria-expanded:ring-[var(--foco-halo)]",
          // Tablero Usuario: lo vacío, como «Ninguno», en el gris de campo vacío.
          picked.length > 0 ? "text-[var(--t1)]" : "text-[var(--t3)]",
        )}
      >
        <span className="truncate">
          {picked.length > 0 ? picked.map((option) => option.label).join(", ") : placeholder}
        </span>
        <ChevronDownIcon aria-hidden="true" className="size-3.5 shrink-0 text-[var(--t2)]" />
      </DropdownMenuTrigger>
      {/* Tablero Usuario (.o-lst): la lista mide lo mismo que el campo, con 4 de margen adentro; cada opción, el nombre y
          debajo su descripción, en gris de 12 (.n2 y .d). */}
      <DropdownMenuContent align="start" className="w-(--radix-dropdown-menu-trigger-width) max-w-none min-w-48 p-1">
        {options.map((option, index) => (
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
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
