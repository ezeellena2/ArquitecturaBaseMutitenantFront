import { useId, type ReactNode } from "react";
import { RadioGroup } from "radix-ui";
import { cn } from "@/shared/lib/utils";
import { InfoTip } from "./InfoTip";
import { Label } from "./label";

export interface RadioOption {
  value: string;
  label: string;
  /// La ayuda de la opción (116): una (i) al final, con su tooltip; es su descripción. En una opción apagada, es el
  /// porqué ("Cargá un correo para usar esta opción").
  help?: string;
  disabled?: boolean;
}

interface RadioGroupFieldProps {
  /** Formulario con pocas opciones a la vista (Config Asistente v115); conserva teclado de RadioGroup. */
  variant?: "list" | "segmented";
  id?: string;
  "aria-invalid"?: boolean;
  "aria-describedby"?: string;
  /// El nombre accesible del grupo. No se dibuja: en el tablero, lo que dice de qué se trata es la casilla de arriba
  /// ("Mandarle una invitación"), y las opciones se leen solas ("Por correo", "Por WhatsApp").
  label: string;
  options: readonly RadioOption[];
  /// Undefined es "ninguna elegida".
  value: string | undefined;
  onValueChange: (value: string) => void;
  error?: string;
}

/// Una elección entre pocas opciones («Criterio · Formularios», «Lo elegido, sin dudas» (142)). Es el Radio Group de
/// Radix, que da el rol `radiogroup`, las flechas para moverse y el foco en la elegida.
/// - `segmented` (`.seg`): dos o tres opciones fijas que cambian lo que se pide abajo, en una vía blanca con su borde;
///   la elegida, rellena con la marca y la letra blanca. Mide 36 como un campo y, en el teléfono, cada opción mide
///   44 × 44 (187). Un rótulo largo baja de renglón, entero (174).
/// - `list` («Tarjetas de opción», `.r311-cards2`): una tarjeta por opción, una debajo de la otra, con su punto; la
///   elegida suma un borde de 2 px y el tinte de la marca, sin moverse.
export function RadioGroupField({ label, options, value, onValueChange, error, variant = "list", id: fieldId,
  "aria-invalid": invalid, "aria-describedby": describedBy }: RadioGroupFieldProps): ReactNode {
  const id = useId();
  const errorId = `${id}-error`;

  return (
    <div className="flex flex-col gap-1.5">
      <RadioGroup.Root
        id={fieldId}
        aria-label={label}
        aria-invalid={invalid || !!error}
        aria-describedby={[describedBy, error ? errorId : undefined].filter(Boolean).join(" ") || undefined}
        // Radix toma `undefined` como "no controlado": la cadena vacía no coincide con ninguna opción.
        value={value ?? ""}
        onValueChange={onValueChange}
        orientation={variant === "segmented" ? "horizontal" : undefined}
        className={variant === "segmented"
          ? "grid auto-cols-fr grid-flow-col gap-0.75 rounded-[0.625rem] border border-[var(--borde2)] bg-[var(--superficie)] p-0.5 max-md:rounded-[0.75rem]"
          : "flex flex-col gap-2"}
      >
        {options.map((option) => {
          const optionId = `${id}-${option.value}`;
          const helpId = `${optionId}-help`;

          if (variant === "segmented") return <RadioGroup.Item key={option.value} value={option.value} disabled={option.disabled}
            className="relative flex min-h-7.5 min-w-0 items-center justify-center rounded-[0.5rem] px-2 py-1 text-center text-[0.8125rem] leading-[1.25] font-semibold text-[var(--t2)] [overflow-wrap:anywhere] outline-none focus-visible:ring-[3px] focus-visible:ring-[var(--foco-halo)] data-[state=unchecked]:enabled:hover:bg-[var(--s2)] data-[state=checked]:bg-[var(--marca)] data-[state=checked]:text-[var(--superficie)] disabled:cursor-not-allowed disabled:opacity-50 max-md:min-h-11 max-md:min-w-11 max-md:rounded-[0.5625rem] max-md:text-[0.90625rem]">
            {option.label}
          </RadioGroup.Item>;

          const checked = value === option.value;
          return (
            // `relative`: dentro de un formulario, Radix pone al lado del botón un input escondido y posicionado, para
            // que el valor viaje con el formulario. Sin un ancestro posicionado cerca, se ubica contra el diálogo. La
            // elegida cambia el borde de 1 a 2 y achica el relleno en 1, para no moverse.
            <div key={option.value} data-slot="option-card" data-state={checked ? "checked" : "unchecked"}
              className={cn("relative grid grid-cols-[1.125rem_minmax(0,1fr)] items-center gap-2.5 rounded-[0.625rem] text-[0.8125rem]",
                checked ? "border-2 border-[var(--marca)] bg-[var(--marca-t)] px-2.75 py-2.25" : "border border-[var(--borde)] bg-[var(--superficie)] px-3 py-2.5")}>
              <RadioGroup.Item
                id={optionId}
                value={option.value}
                disabled={option.disabled}
                aria-describedby={option.help ? helpId : undefined}
                className={cn(
                  "size-4 shrink-0 rounded-full border-[1.5px] border-[var(--borde2)] bg-[var(--superficie)] outline-none",
                  "focus-visible:ring-[3px] focus-visible:ring-[var(--foco-halo)] data-[state=checked]:border-[0.3125rem] data-[state=checked]:border-[var(--marca)]",
                  "disabled:cursor-not-allowed disabled:opacity-50",
                )}
              />
              <span className="flex min-w-0 items-center gap-1">
                {/* El rótulo cubre la tarjeta entera: tocarla en cualquier lado elige la opción. */}
                <Label
                  htmlFor={optionId}
                  className={cn(
                    "leading-[1.25] font-semibold [overflow-wrap:anywhere] after:absolute after:inset-0",
                    option.disabled ? "text-[var(--t2)]" : "cursor-pointer",
                  )}
                >
                  {option.label}
                </Label>
                {option.help ? <InfoTip id={helpId} text={option.help} title={option.label} /> : null}
              </span>
            </div>
          );
        })}
      </RadioGroup.Root>
      {error ? (
        <p id={errorId} role="alert" className="px-2.5 text-[0.8125rem] text-[var(--peligro)]">
          {error}
        </p>
      ) : null}
    </div>
  );
}
