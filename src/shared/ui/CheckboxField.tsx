import { useId, type MouseEvent, type ReactNode } from "react";
import { cn } from "@/shared/lib/utils";
import { Checkbox } from "./checkbox";
import { InfoTip } from "./InfoTip";
import { InformativeTooltip } from "./InformativeTooltip";
import { Label } from "./label";

interface CheckboxFieldProps {
  label: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  /// La ayuda que sirve para decidir (116): una (i) al final de la etiqueta, con su tooltip; es la descripción de la
  /// casilla. Sin línea de ayuda debajo.
  help?: string;
  /// Debajo de la etiqueta: dice qué falta.
  error?: string;
  disabled?: boolean;
  /// Por qué está apagada, si no es obvio (211): un tooltip arriba del cuadradito, sin texto ni ícono al lado, y la
  /// descripción accesible de la casilla. Solo cuenta mientras está apagada.
  disabledReason?: string;
}

/// El clic solo muestra el motivo: Radix saltea el cambio de la casilla después de un `preventDefault`.
const showOnly = (event: MouseEvent) => event.preventDefault();

/// Una casilla con su etiqueta al lado. `FormField` pone la etiqueta arriba del control, que para una casilla
/// no sirve: acá van en la misma fila, atadas por el id, así la etiqueta es el nombre accesible de la casilla
/// y hacerle clic la marca.
///
/// La fila es la del selector de permisos del tablero ("Roles · Editar un rol"): se ilumina entera al pasar el
/// mouse, así que tiene que marcarse entera al hacerle clic. Para eso el `after` de la etiqueta se estira sobre
/// toda la fila; la (i) de la ayuda queda afuera del `<label>`, encima, para que su texto sea la descripción y no
/// parte del nombre accesible. La casilla va en su capa, encima de ese `after` (como en `PermissionPicker`): el puntero
/// da en ella y no en la etiqueta que la cubre.
///
/// Apagada con su motivo (211), responde la fila entera: el envoltorio del cuadradito se estira sobre ella, como la
/// etiqueta de una casilla encendida, y es el que abre el motivo, que se ancla en el cuadradito. La casilla queda con
/// `aria-disabled` en lugar de `disabled`: se alcanza con Tab, el lector dice su nombre, «no disponible» y el motivo, y
/// el clic, el toque, Enter o Espacio solo muestran el motivo.
export function CheckboxField({
  label,
  checked,
  onCheckedChange,
  help,
  error,
  disabled,
  disabledReason,
}: CheckboxFieldProps): ReactNode {
  const id = useId();
  const helpId = `${id}-help`;
  const errorId = `${id}-error`;
  const reasonId = `${id}-reason`;
  const off = disabled === true && disabledReason !== undefined;
  const describedBy = [help ? helpId : undefined, error ? errorId : undefined, off ? reasonId : undefined].filter(Boolean).join(" ");

  const checkbox = (
    <Checkbox
      id={id}
      checked={checked}
      disabled={disabled && !off}
      aria-disabled={off || undefined}
      aria-describedby={describedBy || undefined}
      aria-invalid={error ? true : undefined}
      // Radix informa `boolean | "indeterminate"`; acá solo hay marcada o no.
      onCheckedChange={(value) => onCheckedChange(value === true)}
      onClick={off ? showOnly : undefined}
      // Sin marcar, el borde tenue casi no se ve sobre blanco: una casilla vacía tiene que
      // leerse como algo que se puede marcar, como la del tablero. Va encima del `after` de la etiqueta; apagada con motivo,
      // el puntero lo recibe su envoltorio.
      className={cn("relative z-[1] mt-px border-[var(--t2)]", off && "pointer-events-none")}
    />
  );

  return (
    <div
      className={cn(
        "relative flex items-start gap-2.5 rounded-[0.625rem] px-2.5 py-2.25",
        disabled ? "" : "hover:bg-[var(--s2)]",
      )}
    >
      {off ? (
        <InformativeTooltip text={disabledReason}>
          <span data-slot="disabled-reason" className="inline-flex cursor-not-allowed after:absolute after:inset-0">{checkbox}</span>
        </InformativeTooltip>
      ) : checkbox}
      <div className="flex flex-col gap-0.5">
        <span className="inline-flex items-center gap-1">
          <Label
            htmlFor={id}
            className={cn(
              "text-[0.84375rem] leading-[1.2]",
              disabled ? "text-[var(--t2)]" : "cursor-pointer after:absolute after:inset-0",
            )}
          >
            {label}
          </Label>
          {help ? <InfoTip id={helpId} text={help} title={label} /> : null}
        </span>
        {off ? <span id={reasonId} hidden>{disabledReason}</span> : null}
        {error ? (
          <p id={errorId} role="alert" className="text-[0.8125rem] text-[var(--peligro)]">
            {error}
          </p>
        ) : null}
      </div>
    </div>
  );
}
