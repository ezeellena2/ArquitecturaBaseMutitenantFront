import { useId, type ReactNode } from "react";
import { cn } from "@/shared/lib/utils";
import { Checkbox } from "./checkbox";
import { InfoTip } from "./InfoTip";
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
}

/// Una casilla con su etiqueta al lado. `FormField` pone la etiqueta arriba del control, que para una casilla
/// no sirve: acá van en la misma fila, atadas por el id, así la etiqueta es el nombre accesible de la casilla
/// y hacerle clic la marca.
///
/// La fila es la del selector de permisos del tablero ("Roles · Editar un rol"): se ilumina entera al pasar el
/// mouse, así que tiene que marcarse entera al hacerle clic. Para eso el `after` de la etiqueta se estira sobre
/// toda la fila; la (i) de la ayuda queda afuera del `<label>`, encima, para que su texto sea la descripción y no
/// parte del nombre accesible.
export function CheckboxField({
  label,
  checked,
  onCheckedChange,
  help,
  error,
  disabled,
}: CheckboxFieldProps): ReactNode {
  const id = useId();
  const helpId = `${id}-help`;
  const errorId = `${id}-error`;
  const describedBy = [help ? helpId : undefined, error ? errorId : undefined].filter(Boolean).join(" ");

  return (
    <div
      className={cn(
        "relative flex items-start gap-2.5 rounded-[0.625rem] px-2.5 py-2.25",
        disabled ? "" : "hover:bg-[var(--s2)]",
      )}
    >
      <Checkbox
        id={id}
        checked={checked}
        disabled={disabled}
        aria-describedby={describedBy || undefined}
        aria-invalid={error ? true : undefined}
        // Radix informa `boolean | "indeterminate"`; acá solo hay marcada o no.
        onCheckedChange={(value) => onCheckedChange(value === true)}
        // Sin marcar, el borde tenue casi no se ve sobre blanco: una casilla vacía tiene que
        // leerse como algo que se puede marcar, como la del tablero.
        className="mt-px border-[var(--t2)]"
      />
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
        {error ? (
          <p id={errorId} role="alert" className="text-[0.8125rem] text-[var(--peligro)]">
            {error}
          </p>
        ) : null}
      </div>
    </div>
  );
}
