import type { ReactNode } from "react";
import { cn } from "@/shared/lib/utils";

/// Estado vacío de listados y páginas (sección 7.4).
///
/// `className` es para el vacío que vive adentro de una tarjeta que ya tiene su borde, como el del selector de
/// permisos: ahí el recuadro punteado sería una caja dentro de otra. `descriptionClassName`, para ponerle un ancho
/// máximo al motivo cuando repite lo que escribió el usuario: en una tarjeta ancha, una búsqueda larga lo
/// estiraría de punta a punta en una sola línea. `framed={false}`, para el que va dentro de una tabla, debajo de sus
/// encabezados («Criterio · Tablas», «Ninguno coincide»).
export function EmptyState({
  title,
  description,
  action,
  className,
  descriptionClassName,
  framed = true,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
  descriptionClassName?: string;
  framed?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-2 p-8 text-center",
        framed && "rounded-[12px] border border-dashed border-[var(--borde)]",
        className,
      )}
    >
      {/* Tableros de listas (.vacio strong): texto en negrita, no un encabezado; la pantalla ya tiene el suyo (axe). */}
      <p className="text-[14px] font-semibold">{title}</p>
      {description ? (
        <p className={cn("text-[13px] text-[var(--t2)]", descriptionClassName)}>{description}</p>
      ) : null}
      {action}
    </div>
  );
}
