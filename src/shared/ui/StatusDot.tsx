import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/shared/lib/utils";

export type StatusTone = "success" | "warning" | "danger" | "neutral" | "pending";

export interface StatusDotProps extends Omit<ComponentProps<"span">, "children"> {
  tone: StatusTone;
  label: ReactNode;
}

// Tablero «Criterio · Tablas»: punto de color y la palabra, sin fondo: verde activo, petróleo pendiente, ámbar
// atención, rojo error y gris apagado.
const tones: Record<StatusTone, string> = {
  success: "bg-[var(--ok)]",
  warning: "bg-[var(--alerta)]",
  danger: "bg-[var(--peligro)]",
  neutral: "bg-[var(--t3)]",
  pending: "bg-[var(--marca-tx)]",
};

export function StatusDot({ tone, label, className, ...props }: StatusDotProps) {
  return (
    <span className={cn("inline-flex w-fit items-center gap-1.5 text-[13px] text-[var(--t1)]", className)} {...props}>
      <span data-slot="status-dot" aria-hidden="true" className={cn("size-2 shrink-0 rounded-full", tones[tone])} />
      {label}
    </span>
  );
}
