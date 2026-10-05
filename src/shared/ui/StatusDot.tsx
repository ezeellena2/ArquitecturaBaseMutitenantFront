import type { ComponentProps, ReactNode } from "react";
import type { StatusTone } from "@/shared/format/statusTones";
import { cn } from "@/shared/lib/utils";

export type { StatusTone };

export interface StatusDotProps extends Omit<ComponentProps<"span">, "children"> {
  tone: StatusTone;
  label: ReactNode;
}

// Tablero «Criterio · Tablas»: punto de color y la palabra, sin fondo: verde activo, petróleo pendiente, ámbar
// atención, rojo error y gris apagado.
const tones: Record<StatusTone, string> = {
  success: "bg-[var(--punto-ok)]",
  warning: "bg-[var(--punto-alerta)]",
  danger: "bg-[var(--peligro)]",
  neutral: "bg-[var(--punto-apagado)]",
  pending: "bg-[var(--marca)]",
};

export function StatusDot({ tone, label, className, ...props }: StatusDotProps) {
  return (
    <span className={cn("inline-flex w-fit max-w-full items-center gap-1.5 text-[13px] text-[var(--t1)]", className)} {...props}>
      <span data-slot="status-dot" aria-hidden="true" className={cn("size-2 shrink-0 rounded-full", tones[tone])} />
      <span className="min-w-0 truncate">{label}</span>
    </span>
  );
}

/// Lo que aclara un estado en la segunda línea de una fila («Vence 02/10/2026»): debajo de la palabra y no del punto
/// («Criterio · Tablas», `.l2.sang`), corrido lo que miden el punto (8) y su espacio (6).
export function StatusDetail({ children }: { children: ReactNode }) {
  return <span className="pl-3.5">{children}</span>;
}
