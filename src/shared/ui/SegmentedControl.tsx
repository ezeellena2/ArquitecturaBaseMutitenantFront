import type { ReactNode } from "react";
import { cn } from "@/shared/lib/utils";

export interface SegmentedOption {
  key: string;
  label: ReactNode;
  /** El ícono que va antes del rótulo, como el sobre de «Correo» en el ingreso. */
  icon?: ReactNode;
  /** Lo que acompaña al rótulo en gris claro, como la cantidad de chats de cada bandeja («Clientes 5»). */
  detail?: ReactNode;
  pressed: boolean;
  onSelect: () => void;
}

/// Dos o tres vistas de lo mismo, o dos o tres opciones fijas que cambian lo que se pide abajo («Criterio · Menús»,
/// regla del 2026-10-13, y «Criterio · Formularios», «Lo elegido, sin dudas» (142)): las bandejas «Clientes | Internos»
/// de Chats, «Para consultas | Del sistema» en las plantillas de Plataforma, «Por día | Por persona» en Uso del asistente,
/// «Configuración | Recorrido» del bot, «Correo | WhatsApp» del ingreso y de «Agregar método». Es la pieza `.o-seg` de los
/// tableros: una vía blanca con su borde y las opciones en partes iguales; la elegida, rellena con la marca y la letra
/// blanca (3:1 contra las otras y 4,5:1 su letra). Mide 30 en la compu y, en el teléfono, cada opción mide 44 × 44 (187).
/// Un rótulo largo baja de renglón, entero (174).
///
/// Son botones con `aria-pressed` y no un grupo de radios porque cada uno actúa al apretarse, no al enviarse
/// un formulario. El nombre del grupo es obligatorio: sin él, el lector anuncia botones sueltos ("Clientes",
/// "Internos") y no dice qué están eligiendo.
///
/// `fullWidth` lo estira al ancho de su contenedor, como la columna de la bandeja de Chats. Sin eso, mide 300 en la
/// compu, como en Uso del asistente. `disabled` lo apaga entero mientras se manda algo.
export function SegmentedControl({
  options,
  fullWidth = false,
  disabled = false,
  "aria-label": label,
}: {
  options: readonly SegmentedOption[];
  fullWidth?: boolean;
  disabled?: boolean;
  "aria-label": string;
}): ReactNode {
  return (
    <div
      role="group"
      aria-label={label}
      data-slot="segmented"
      className={cn(
        "grid shrink-0 auto-cols-fr grid-flow-col gap-0.75 rounded-[0.625rem] bg-[var(--superficie)] p-0.75 shadow-[inset_0_0_0_1px_var(--borde2)] max-md:w-full max-md:rounded-[0.75rem]",
        fullWidth ? "w-full" : "w-75 self-start",
      )}
    >
      {options.map((option) => (
        <button
          key={option.key}
          // Sin `type`, adentro de un formulario (el editor de un rol) el botón lo enviaría.
          type="button"
          aria-pressed={option.pressed}
          disabled={disabled}
          onClick={option.onSelect}
          className={cn(
            "inline-flex min-h-7.5 min-w-0 items-center justify-center gap-1.5 rounded-[0.5rem] px-2 py-1 text-center text-[0.8125rem] leading-[1.25] font-semibold [overflow-wrap:anywhere] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--foco)] disabled:cursor-not-allowed max-md:min-h-11 max-md:min-w-11 max-md:rounded-[0.5625rem] max-md:text-[0.90625rem]",
            option.pressed
              ? "bg-[var(--marca)] text-[var(--superficie)]"
              : "text-[var(--t2)] enabled:hover:bg-[var(--s2)] enabled:hover:text-[var(--t1)] disabled:opacity-50",
          )}
        >
          {option.icon}
          <span className="min-w-0">{option.label}</span>
          {/* El espacio separa el rótulo de la cantidad en el nombre que lee el lector («Clientes 5», no «Clientes5»). */}
          {option.detail !== undefined ? <>{" "}<span data-slot="segmented-detail" className={cn("font-medium", !option.pressed && "text-[var(--t3)]")}>{option.detail}</span></> : null}
        </button>
      ))}
    </div>
  );
}
