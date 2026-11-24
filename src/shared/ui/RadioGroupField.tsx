import { Fragment, useId, type MouseEvent, type ReactNode } from "react";
import { RadioGroup } from "radix-ui";
import { cn } from "@/shared/lib/utils";
import { GroupLabel } from "./GroupLabel";
import { InfoTip } from "./InfoTip";
import { InformativeTooltip } from "./InformativeTooltip";
import { Label } from "./label";

export interface RadioOption {
  value: string;
  label: string;
  /// La ayuda de la opción (116): una (i) al final, con su tooltip; es su descripción. Tocarla no la elige.
  help?: string;
  disabled?: boolean;
  /// Por qué está apagada, si no es obvio (211): un tooltip arriba de la opción, sin texto ni ícono al lado, y su
  /// descripción accesible. Solo cuenta mientras está apagada.
  disabledReason?: string;
}

interface RadioGroupFieldProps {
  /** Formulario con pocas opciones a la vista (Config Asistente v115); conserva teclado de RadioGroup. */
  variant?: "list" | "segmented";
  id?: string;
  "aria-invalid"?: boolean;
  "aria-describedby"?: string;
  /// El nombre accesible del grupo. Sin `showLabel` no se dibuja: en el tablero, lo que dice de qué se trata es la casilla
  /// de arriba ("Mandarle una invitación"), y las opciones se leen solas ("Por correo", "Por WhatsApp").
  label: string;
  /// Dibuja `label` como título del grupo (`GroupLabel`), y el grupo se llama como su título (213).
  showLabel?: boolean;
  /// La ayuda del grupo, en la (i) junto a su título, y su descripción, como en un campo (213). Solo con `showLabel`.
  help?: string;
  options: readonly RadioOption[];
  /// Undefined es "ninguna elegida".
  value: string | undefined;
  onValueChange: (value: string) => void;
  error?: string;
}

/// El clic solo muestra el motivo: Radix saltea la elección después de un `preventDefault`, también la que hace al
/// llegar con las flechas.
const showOnly = (event: MouseEvent) => event.preventDefault();

/// Una elección entre pocas opciones («Criterio · Formularios», «Lo elegido, sin dudas» (142)). Es el Radio Group de
/// Radix, que da el rol `radiogroup`, las flechas para moverse y el foco en la elegida.
/// - `segmented` (`.seg`): dos o tres opciones fijas que cambian lo que se pide abajo, en una vía blanca con su borde;
///   la elegida, rellena con la marca y la letra blanca. Mide 36 como un campo y, en el teléfono, cada opción mide
///   44 × 44 (187). Un rótulo largo baja de renglón, entero (174).
/// - `list` («Tarjetas de opción», `.r311-cards2`): una tarjeta por opción, una debajo de la otra, con su punto; la
///   elegida suma un borde de 2 px y el tinte de la marca, sin moverse.
///
/// Una opción apagada con su motivo (211) sigue en el Tab y en las flechas del grupo, con `aria-disabled` en lugar de
/// `disabled`: el lector dice su nombre, «no disponible» y el motivo, y el clic, el toque, Enter o Espacio solo muestran
/// el motivo. Responde la tarjeta o el segmento entero: su envoltorio toma el puntero y abre el motivo, que se ancla en el
/// punto o en el segmento.
export function RadioGroupField({ label, showLabel = false, help, options, value, onValueChange, error, variant = "list", id: fieldId,
  "aria-invalid": invalid, "aria-describedby": describedBy }: RadioGroupFieldProps): ReactNode {
  const id = useId();
  const errorId = `${id}-error`;
  const labelId = `${id}-label`;
  // El texto de la (i) del título es la descripción del grupo, como en un campo (`GroupLabel`).
  const groupHelp = showLabel && help ? `${labelId}-help` : undefined;

  return (
    <div className="flex flex-col gap-1.5">
      {showLabel ? <GroupLabel id={labelId} help={help}>{label}</GroupLabel> : null}
      <RadioGroup.Root
        id={fieldId}
        aria-label={showLabel ? undefined : label}
        aria-labelledby={showLabel ? labelId : undefined}
        aria-invalid={invalid || !!error}
        aria-describedby={[groupHelp, describedBy, error ? errorId : undefined].filter(Boolean).join(" ") || undefined}
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
          const reasonId = `${optionId}-reason`;
          const off = option.disabled === true && option.disabledReason !== undefined;
          const reason = off ? <span id={reasonId} hidden>{option.disabledReason}</span> : null;
          const offProps = off ? { "aria-disabled": true, onClick: showOnly } : {};
          // Apagada con motivo, el envoltorio toma el puntero y abre el motivo; el punto o el segmento, no.
          const withReason = (item: ReactNode, className: string) => off
            ? <InformativeTooltip text={option.disabledReason}><span data-slot="disabled-reason" className={cn("cursor-not-allowed", className)}>{item}</span></InformativeTooltip>
            : item;

          if (variant === "segmented") return <Fragment key={option.value}>
            {withReason(<RadioGroup.Item value={option.value} disabled={option.disabled && !off} {...offProps}
              aria-describedby={off ? reasonId : undefined}
              className={cn("relative flex min-h-7.5 min-w-0 items-center justify-center rounded-[0.5rem] px-2 py-1 text-center text-[0.8125rem] leading-[1.25] font-semibold text-[var(--t2)] [overflow-wrap:anywhere] outline-none focus-visible:ring-[3px] focus-visible:ring-[var(--foco-halo)] data-[state=unchecked]:enabled:hover:bg-[var(--s2)] data-[state=checked]:bg-[var(--marca)] data-[state=checked]:text-[var(--superficie)] disabled:cursor-not-allowed disabled:opacity-50 aria-disabled:opacity-50 max-md:min-h-11 max-md:min-w-11 max-md:rounded-[0.5625rem] max-md:text-[0.90625rem]",
                off && "pointer-events-none")}>
              {option.label}
            </RadioGroup.Item>, "grid min-w-0")}
            {reason}
          </Fragment>;

          const checked = value === option.value;
          const describedByOption = [option.help ? helpId : undefined, off ? reasonId : undefined].filter(Boolean).join(" ");
          return (
            // `relative`: dentro de un formulario, Radix pone al lado del botón un input escondido y posicionado, para
            // que el valor viaje con el formulario. Sin un ancestro posicionado cerca, se ubica contra el diálogo. La
            // elegida cambia el borde de 1 a 2 y achica el relleno en 1, para no moverse.
            <div key={option.value} data-slot="option-card" data-state={checked ? "checked" : "unchecked"}
              className={cn("relative grid grid-cols-[1.125rem_minmax(0,1fr)] items-center gap-2.5 rounded-[0.625rem] text-[0.8125rem]",
                checked ? "border-2 border-[var(--marca)] bg-[var(--marca-t)] px-2.75 py-2.25" : "border border-[var(--borde)] bg-[var(--superficie)] px-3 py-2.5")}>
              {withReason(<RadioGroup.Item
                id={optionId}
                value={option.value}
                disabled={option.disabled && !off}
                {...offProps}
                aria-describedby={describedByOption || undefined}
                className={cn(
                  "size-4 shrink-0 rounded-full border-[1.5px] border-[var(--borde2)] bg-[var(--superficie)] outline-none",
                  "focus-visible:ring-[3px] focus-visible:ring-[var(--foco-halo)] data-[state=checked]:border-[0.3125rem] data-[state=checked]:border-[var(--marca)]",
                  "disabled:cursor-not-allowed disabled:opacity-50 aria-disabled:opacity-50",
                  off && "pointer-events-none",
                )}
              />, "inline-flex after:absolute after:inset-0")}
              <span className="flex min-w-0 items-center gap-1">
                {/* El rótulo cubre la tarjeta entera: tocarla en cualquier lado elige la opción. */}
                <Label
                  htmlFor={optionId}
                  className={cn(
                    "leading-[1.25] font-semibold [overflow-wrap:anywhere]",
                    option.disabled ? "text-[var(--t2)]" : "cursor-pointer after:absolute after:inset-0",
                  )}
                >
                  {option.label}
                </Label>
                {option.help ? <InfoTip id={helpId} text={option.help} title={option.label} /> : null}
              </span>
              {reason}
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
