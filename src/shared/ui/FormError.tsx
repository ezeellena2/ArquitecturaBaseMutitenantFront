import type { ComponentProps, ComponentType, ReactNode } from "react";
import { cn } from "@/shared/lib/utils";
import { AlertTriangleIcon, ErrorIcon, InfoIcon } from "./icons";
import { noticeSurface, noticeTones, type NoticeTone } from "./noticeTones";

type Tone = Exclude<NoticeTone, "success">;

export interface FormErrorProps extends Omit<ComponentProps<"div">, "children"> {
  message: ReactNode;
  /** La de error (por defecto) lleva el filo rojo; la de atención, el ámbar; la de información, el gris («Tu sesión venció»). */
  tone?: Tone;
  /** Otro ícono que el del tono: el reloj de «Tu sesión venció» (tableros Ingreso y M-Ingreso). */
  icon?: ComponentType<{ className?: string; strokeWidth?: number }>;
}

// 210 («Criterio · Avisos», Avisos según el tipo): la franja es blanca y el tipo va en el filo y en el ícono, del mismo
// color (noticeTones): octógono, triángulo o (i). Los tableros dibujan el ícono del error y el de la información con trazo
// 2; el triángulo de la atención, con el del set.
const tones: Record<Tone, { icon: ComponentType<{ className?: string; strokeWidth?: number }>; stroke?: number }> = {
  danger: { icon: ErrorIcon, stroke: 2 },
  warning: { icon: AlertTriangleIcon },
  info: { icon: InfoIcon, stroke: 2 },
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
        "rounded-[0.5rem] px-3 py-2.5 text-[0.8125rem] leading-normal max-md:rounded-xl max-md:px-3.5 max-md:py-3 max-md:text-[0.90625rem] max-md:leading-[1.4]",
        noticeSurface,
        noticeTones[tone].edge,
        className,
      )}
      {...props}
    >
      {/* El ícono de 16 al medio de la primera línea, como .aviso-mal (el del teléfono, 1 px abajo, como .aviso-mal.tel). */}
      <Icon className={cn("mt-0.5 size-4 shrink-0 max-md:mt-px", noticeTones[tone].icon)} strokeWidth={tones[tone].stroke} />
      <span className="min-w-0">{message}</span>
    </div>
  );
}
