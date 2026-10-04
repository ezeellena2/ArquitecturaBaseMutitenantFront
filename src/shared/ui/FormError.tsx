import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/shared/lib/utils";
import { useAppChrome } from "./app/AppChrome";
import { AlertCircleIcon, AlertTriangleIcon } from "./icons";

export interface FormErrorProps extends Omit<ComponentProps<"div">, "children"> {
  message: ReactNode;
  tone?: "danger" | "warning";
}

export function FormError({ message, tone = "danger", className, ...props }: FormErrorProps) {
  const { phone } = useAppChrome();
  if (!message) {
    return null;
  }

  const Icon = tone === "warning" ? AlertTriangleIcon : AlertCircleIcon;

  return (
    <div
      role="alert"
      className={cn(
        // El ícono va con el primer renglón: si el texto ocupa dos líneas, queda arriba.
        "flex items-start gap-2.5",
        // «Criterio · Formularios» (.aviso-mal): en la compu y en las páginas públicas, 13 con padding 10/12 y radio 8.
        // En la app del teléfono (lienzo v100, .aviso-mal.tel), la letra de sus avisos: 14,5 con interlineado 1,4,
        // padding 12/14 y radio 12.
        phone ? "rounded-xl px-3.5 py-3 text-[14.5px] leading-[1.4]" : "rounded-[8px] px-3 py-2.5 text-[13px] leading-[normal]",
        // El texto y el ícono, en el color de los avisos (.aviso-mal, .msj.alerta).
        tone === "warning" ? "bg-[var(--alerta-t)] text-[var(--alerta-tx)]" : "bg-[var(--peligro-t)] text-[var(--peligro-tx)]",
        className,
      )}
      {...props}
    >
      <Icon className={cn("size-4 shrink-0", phone && "mt-px")} />
      <span className="min-w-0">{message}</span>
    </div>
  );
}
