import { cloneElement, useId, type ReactElement, type ReactNode } from "react";
import { cn } from "cn";
import { InfoTip } from "./InfoTip";
import { Label } from "./label";

interface FormFieldProps {
  label: string;
  /// Id del control. Si no se pasa, se genera uno y se le enchufa al hijo.
  htmlFor?: string;
  /// La ayuda que sirve para decidir (116): va en una (i) junto al rótulo, con su tooltip, y es la descripción del
  /// campo. Sin leyendas debajo: el renglón de abajo es solo para el error.
  help?: string;
  error?: string;
  /// Lo que conviene revisar sin ser un error: el motivo de «Revisá» en lo que propone el asistente (tableros
  /// *-Propuesta, .acc-dudam), en el renglón del error y con el color de atención. Con un error, va el error.
  warning?: string;
  required?: boolean;
  /// A la derecha del rótulo, en la misma línea: la casilla «Todos» de un desplegable de varios.
  aside?: ReactNode;
  variant?: "default" | "auth";
  children: ReactElement<{ id?: string; className?: string; "aria-invalid"?: boolean; "aria-describedby"?: string; "aria-required"?: boolean }>;
}

/// Etiqueta, control y mensaje de error, atados entre sí para lectores de pantalla (sección 7.4).
export function FormField({ label, htmlFor, help, error, warning, required, aside, variant = "default", children }: FormFieldProps): ReactNode {
  const generatedId = useId();
  const controlId = htmlFor ?? children.props.id ?? generatedId;
  const messageId = `${controlId}-message`;
  const helpId = `${controlId}-help`;
  const message = error ?? warning;
  const describedBy = [help ? helpId : undefined, message ? messageId : undefined].filter(Boolean).join(" ") || undefined;

  // «Criterio · Formularios»: rótulo de 12,5 a 6 del campo; en el teléfono de la app (tableros M-*, .ap-cmp .rt), de 13,5
  // con el interlineado normal. En ingreso y registro (tableros Ingreso, Registro y sus M-*), de 12,5 en cualquier tamaño.
  // La etiqueta lleva el id `<control>-label`: la pieza para elegir (262) se nombra con ella.
  const labelText = <Label id={`${controlId}-label`} htmlFor={controlId} className={cn("gap-1! text-[0.78125rem] font-semibold text-[var(--t2)]", variant === "auth" ? "" : "max-md:text-[0.84375rem] max-md:leading-[normal]")}>
    {label}
    {/* Tablero «Criterio · Formularios»: el asterisco de obligatorio va en rojo. */}
    {required ? <span aria-hidden="true" className="text-[var(--peligro)]">{" *"}</span> : null}
  </Label>;
  // «Criterio · Formularios» (.i-ay): la (i), después del asterisco, a la misma distancia. Va fuera del rótulo: es un botón
  // (211), y adentro se sumaría al nombre del campo y tocarla le pasaría el foco.
  const labelElement = help ? <span className="flex items-center gap-1">{labelText}<InfoTip id={helpId} text={help} title={label} /></span> : labelText;

  return (
    <div className="flex flex-col gap-1.5">
      {aside ? <div className="flex items-center justify-between gap-3">{labelElement}{aside}</div> : labelElement}
      {cloneElement(children, {
        id: controlId,
        // Ingreso y registro (tableros Ingreso, Registro y sus M-*, .in2.lg): 44 con radio 10 y letra de 15 en cualquier
        // tamaño; en el teléfono no toman los 48, 12 y 16 de los campos de la app.
        className: variant === "auth" ? cn(children.props.className, "h-11 rounded-[0.625rem] px-3.5 text-[0.9375rem] max-md:h-11 max-md:rounded-[0.625rem] max-md:text-[0.9375rem]") : children.props.className,
        "aria-invalid": error ? true : undefined,
        "aria-describedby": describedBy,
        "aria-required": required ? true : undefined,
      })}
      {error ? (
        <p id={messageId} role="alert" className="text-[0.78125rem] text-[var(--peligro)]">
          {error}
        </p>
      ) : warning ? <p id={messageId} className="text-[0.78125rem] text-[var(--alerta-tx)]">{warning}</p> : null}
    </div>
  );
}
