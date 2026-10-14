import type { ReactNode } from "react";
import { cn } from "@/shared/lib/utils";

export interface SegmentedOption {
  key: string;
  label: ReactNode;
  /** Lo que acompaña al rótulo en gris claro, como la cantidad de chats de cada bandeja («Clientes 5»). */
  detail?: ReactNode;
  pressed: boolean;
  onSelect: () => void;
}

/// Dos vistas de lo mismo, arriba de la lista o de la configuración («Criterio · Menús», regla del 2026-10-13): las
/// bandejas «Clientes | Internos» de Chats, «Para consultas | Del sistema» en las plantillas de Plataforma, «Por día |
/// Por persona» en Uso del asistente y «Configuración | Recorrido» del bot. Es la pieza `.o-seg` de los tableros: una
/// vía gris con las opciones en partes iguales y la elegida en blanco, de 30 en la compu (36 en una columna angosta) y
/// de 38 en el teléfono, siempre a lo ancho.
///
/// Son botones con `aria-pressed` y no un grupo de radios porque cada uno actúa al apretarse, no al enviarse
/// un formulario. El nombre del grupo es obligatorio: sin él, el lector anuncia botones sueltos ("Clientes",
/// "Internos") y no dice qué están eligiendo.
///
/// `fullWidth` lo estira al ancho de su contenedor, como la columna de la bandeja de Chats. Sin eso, mide 300 en la
/// compu, como en Uso del asistente.
export function SegmentedControl({
  options,
  fullWidth = false,
  "aria-label": label,
}: {
  options: readonly SegmentedOption[];
  fullWidth?: boolean;
  "aria-label": string;
}): ReactNode {
  return (
    <div
      role="group"
      aria-label={label}
      className={cn(
        "grid shrink-0 auto-cols-fr grid-flow-col gap-[3px] rounded-[10px] bg-[var(--s3)] p-[3px] max-md:w-full max-md:rounded-[12px]",
        fullWidth ? "w-full" : "w-[300px] self-start",
      )}
    >
      {options.map((option) => (
        <button
          key={option.key}
          // Sin `type`, adentro de un formulario (el editor de un rol) el botón lo enviaría.
          type="button"
          aria-pressed={option.pressed}
          onClick={option.onSelect}
          className={cn(
            "inline-flex h-[30px] min-w-0 items-center justify-center gap-1.5 rounded-[8px] px-2 text-[13px] font-semibold whitespace-nowrap transition-colors focus-visible:outline-2 focus-visible:outline-[var(--foco)] max-md:h-[38px] max-md:rounded-[9px] max-md:text-[14.5px]",
            option.pressed
              ? "bg-[var(--lado-activo)] text-[var(--t1)] shadow-[var(--sombra-segmento)]"
              : "text-[var(--t2)] hover:text-[var(--t1)]",
          )}
        >
          <span className="truncate">{option.label}</span>
          {option.detail !== undefined ? <span className="font-medium text-[var(--t3)]">{option.detail}</span> : null}
        </button>
      ))}
    </div>
  );
}
