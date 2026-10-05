import { cloneElement, useId, type ReactElement, type ReactNode } from "react";
import { cn } from "cn";
import { Label } from "./label";

interface FormFieldProps {
  label: string;
  /// Id del control. Si no se pasa, se genera uno y se le enchufa al hijo.
  htmlFor?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  /// A la derecha del rótulo, en la misma línea: la casilla «Todos» de un desplegable de varios.
  aside?: ReactNode;
  variant?: "default" | "auth";
  children: ReactElement<{ id?: string; className?: string; "aria-invalid"?: boolean; "aria-describedby"?: string; "aria-required"?: boolean }>;
}

/// Etiqueta, control y mensaje de error, atados entre sí para lectores de pantalla (sección 7.4).
export function FormField({ label, htmlFor, hint, error, required, aside, variant = "default", children }: FormFieldProps): ReactNode {
  const generatedId = useId();
  const controlId = htmlFor ?? children.props.id ?? generatedId;
  const messageId = `${controlId}-message`;
  const message = error ?? hint;

  // «Criterio · Formularios»: rótulo de 12,5 a 6 del campo; en el teléfono de la app (tableros M-*), de 13,5. En ingreso y
  // registro (tableros Ingreso, Registro y sus M-*), de 12,5 en cualquier tamaño.
  const labelElement = <Label htmlFor={controlId} className={cn("gap-1! text-[12.5px] font-semibold text-[var(--t2)]", variant === "auth" ? "" : "max-md:text-[13.5px]")}>
    {label}
    {/* Tablero «Criterio · Formularios»: el asterisco de obligatorio va en rojo. */}
    {required ? <span aria-hidden="true" className="text-[var(--peligro)]">{" *"}</span> : null}
  </Label>;

  return (
    <div className="flex flex-col gap-1.5">
      {aside ? <div className="flex items-center justify-between gap-3">{labelElement}{aside}</div> : labelElement}
      {cloneElement(children, {
        id: controlId,
        // Ingreso y registro (tableros Ingreso, Registro y sus M-*, .in2.lg): 44 con radio 10 y letra de 15 en cualquier
        // tamaño; en el teléfono no toman los 48, 12 y 16 de los campos de la app.
        className: variant === "auth" ? cn(children.props.className, "h-11 rounded-[10px] px-3.5 text-[15px] max-md:h-11 max-md:rounded-[10px] max-md:text-[15px]") : children.props.className,
        "aria-invalid": error ? true : undefined,
        "aria-describedby": message ? messageId : undefined,
        "aria-required": required ? true : undefined,
      })}
      {message ? (
        <p
          id={messageId}
          role={error ? "alert" : undefined}
          className={error ? "text-[12.5px] text-[var(--peligro)]" : "text-[12.5px] text-[var(--t2)]"}
        >
          {message}
        </p>
      ) : null}
    </div>
  );
}
