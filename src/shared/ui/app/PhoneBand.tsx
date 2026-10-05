import type { ReactNode } from "react";
import { cn } from "@/shared/lib/utils";

// .f-banda.mal: el rosa de la banda, un poco más oscuro que el de la franja de un diálogo (--peligro-t).
const tones = {
  danger: "bg-[var(--peligro-banda)] text-[var(--peligro-tx)]",
  warning: "bg-[var(--alerta-t)] text-[var(--alerta-tx)]",
} as const;

/// Tableros M-Avisos, M-Usuario y M-Pagina-Org (.f-banda): en el teléfono, lo que sigue pasando va en una banda a todo
/// el ancho debajo de la barra de arriba, sin bordes ni esquinas, con la letra de los avisos del teléfono (14,5 con
/// interlineado 1,4), 12 arriba y abajo y 16 a los costados. El ícono va con la primera línea. La usan «Sin conexión»,
/// el 409 de una edición y el error de guardado de una ficha.
export function PhoneBand({ tone, icon, role, label, children }: {
  tone: keyof typeof tones;
  icon: ReactNode;
  role: "status" | "alert";
  label?: string;
  children: ReactNode;
}) {
  return <div role={role} aria-label={label} className={cn("flex items-start gap-2.5 px-4 py-3 text-[14.5px] leading-[1.4]", tones[tone])}>
    {icon}
    {children}
  </div>;
}
