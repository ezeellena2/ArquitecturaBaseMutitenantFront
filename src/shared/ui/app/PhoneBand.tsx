import type { ReactNode } from "react";
import { cn } from "@/shared/lib/utils";
import { noticeTones } from "@/shared/ui/noticeTones";

type Tone = "danger" | "warning";

/// Tableros M-Avisos, M-Usuario y M-Pagina-Org (.f-banda): en el teléfono, lo que sigue pasando va en una banda a todo
/// el ancho debajo de la barra de arriba, sin esquinas, con la letra de los avisos del teléfono (14,5 con interlineado
/// 1,4), 12 arriba y abajo y 16 a los costados. El ícono va con la primera línea. La usan «Sin conexión», el 409 de una
/// edición y el error de guardado de una ficha. 210 (tema.md, Avisos según el tipo): la banda es blanca, con la tinta de
/// siempre y la línea de las cajas abajo; el tipo va en el filo de 3 a la izquierda y en el ícono, del mismo color.
export function PhoneBand({ tone, icon, role, label, children }: {
  tone: Tone;
  icon: ReactNode;
  role: "status" | "alert";
  label?: string;
  children: ReactNode;
}) {
  return <div role={role} aria-label={label} className={cn(
    "flex items-start gap-2.5 border-b border-l-[3px] border-[var(--borde)] bg-[var(--superficie)] px-4 py-3 text-[0.90625rem] leading-[1.4] text-[var(--t1)]",
    noticeTones[tone].edge,
  )}>
    {/* El ícono toma el color de su tipo sin que la caja cuente en la fila (contents). */}
    <span data-slot="band-icon" className={cn("contents", noticeTones[tone].icon)}>{icon}</span>
    {children}
  </div>;
}
