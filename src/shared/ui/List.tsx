import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/shared/lib/utils";

// Tablero «Criterio · Tablas», Lista: para lo corto que vive dentro de una pantalla (hasta 10 elementos, sin
// filtros ni paginado; si pueden ser más, es una DataTable). Sin encabezado de columnas: la caja lleva su título.
export function List({ label, className, ...props }: ComponentProps<"ul"> & { label: string }) {
  return <ul aria-label={label} className={cn("m-0 list-none p-0", className)} {...props} />;
}

interface ListItemProps extends Omit<ComponentProps<"li">, "title"> {
  /** Ícono gris de 16 a la izquierda. */
  icon?: ReactNode;
  title: ReactNode;
  /** Lo que aclara la fila («Principal», «Sin verificar»): segunda línea en gris, nunca una etiqueta. */
  detail?: ReactNode;
  /** A la derecha: a lo sumo un enlace que pide el estado y el ⋮. */
  children?: ReactNode;
}

// Filas de 44, o de 56 con segunda línea; 16 a la izquierda y 8 a la derecha, para que el ⋮ quede cerca del borde. Lo que
// nombra la fila va en 500 (tableros Cuenta, Configuración, Usuario y Página pública).
// En el teléfono (tableros M-Configuracion y M-Cuenta, .ap-it), la fila de la app: 56, sin ícono, la línea fina desde
// el texto y la acción de la fila en texto petróleo (roja si es de peligro).
export function ListItem({ icon, title, detail, children, className, ...props }: ListItemProps) {
  return <li className={cn("flex items-center gap-3 border-b border-[var(--borde)] py-1.5 pr-2 pl-4 text-[13px] last:border-b-0",
    "max-md:relative max-md:min-h-14 max-md:border-0 max-md:py-2 max-md:pr-3.5 max-md:after:absolute max-md:after:right-0 max-md:after:bottom-0 max-md:after:left-4 max-md:after:h-px max-md:after:bg-[var(--borde)] max-md:last:after:hidden",
    detail ? "min-h-14" : "min-h-11", className)} {...props}>
    {icon ? <span className="inline-flex shrink-0 text-[var(--t3)] max-md:hidden [&_svg:not([class*='size-'])]:size-4">{icon}</span> : null}
    <span className="flex min-w-0 flex-1 flex-col leading-[1.35] max-md:gap-px max-md:leading-tight">
      <span className="truncate font-medium text-[var(--t1)] max-md:text-[15.5px]">{title}</span>
      {detail ? <span className="truncate text-[12px] text-[var(--t3)] max-md:text-[13px]">{detail}</span> : null}
    </span>
    {children ? <span className="flex shrink-0 items-center justify-end gap-1 max-md:[&>[data-variant=outline]]:border-0 max-md:[&>[data-variant=outline]]:bg-transparent max-md:[&>[data-variant=outline]]:px-1.5 max-md:[&>[data-variant=outline]]:text-[15px] max-md:[&>[data-variant=outline]]:text-[var(--marca-tx)] max-md:[&>[data-variant=danger]]:border-0 max-md:[&>[data-variant=danger]]:bg-transparent max-md:[&>[data-variant=danger]]:px-1.5 max-md:[&>[data-variant=danger]]:text-[15px] max-md:[&>[data-variant=danger]]:text-[var(--peligro)]">{children}</span> : null}
  </li>;
}
