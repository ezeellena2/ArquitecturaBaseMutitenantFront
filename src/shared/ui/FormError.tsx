import type { ComponentProps, ComponentType, ReactNode } from "react";
import { cn } from "@/shared/lib/utils";
import { AlertCircleIcon, AlertTriangleIcon, InfoIcon } from "./icons";

type Tone = "danger" | "warning" | "info";

export interface FormErrorProps extends Omit<ComponentProps<"div">, "children"> {
  message: ReactNode;
  /** La de error (por defecto) es roja; la de atención, ámbar; la de información, petróleo («Tu sesión venció»). */
  tone?: Tone;
  /** Otro ícono que el del tono: el reloj de «Tu sesión venció» (tableros Ingreso y M-Ingreso). */
  icon?: ComponentType<{ className?: string }>;
}

// El texto y el ícono, en el color de los avisos (.aviso-mal, .msj.alerta y .msj.info).
const tones: Record<Tone, { icon: ComponentType<{ className?: string }>; box: string }> = {
  danger: { icon: AlertCircleIcon, box: "bg-[var(--peligro-t)] text-[var(--peligro-tx)]" },
  warning: { icon: AlertTriangleIcon, box: "bg-[var(--alerta-t)] text-[var(--alerta-tx)]" },
  info: { icon: InfoIcon, box: "bg-[var(--marca-t)] text-[var(--marca-tx)]" },
};

export function FormError({ message, tone = "danger", icon, role, className, ...props }: FormErrorProps) {
  if (!message) {
    return null;
  }

  const Icon = icon ?? tones[tone].icon;

  return (
    <div
      // Un error o una atención interrumpen al lector de pantalla; la información es algo que pasó y se anuncia sin
      // interrumpir (.msj.info de Ingreso, role="status").
      role={role ?? (tone === "info" ? "status" : "alert")}
      className={cn(
        // El ícono va con el primer renglón: si el texto ocupa dos líneas, queda arriba.
        "flex items-start gap-2.5",
        // «Criterio · Formularios» (.aviso-mal): en la compu, 13 con interlineado 1,5, padding 10/12 y radio 8 (40 de alto
        // con una línea). En el teléfono (lienzo v100, .aviso-mal.tel, y v104, .msj de M-Ingreso, M-Registro,
        // M-Registro-Empresa y M-Invitacion), la letra de sus avisos: 14,5 con interlineado 1,4, padding 12/14 y radio 12.
        // Va por el ancho de la pantalla y no por el marco de la app: las páginas públicas no lo tienen.
        "rounded-[8px] px-3 py-2.5 text-[13px] leading-normal max-md:rounded-xl max-md:px-3.5 max-md:py-3 max-md:text-[14.5px] max-md:leading-[1.4]",
        tones[tone].box,
        className,
      )}
      {...props}
    >
      {/* El ícono de 16 al medio de la primera línea, como .aviso-mal (el del teléfono, 1 px abajo, como .aviso-mal.tel). */}
      <Icon className="mt-0.5 size-4 shrink-0 max-md:mt-px" />
      <span className="min-w-0">{message}</span>
    </div>
  );
}
