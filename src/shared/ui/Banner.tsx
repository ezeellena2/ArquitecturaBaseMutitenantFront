import type { ComponentType, ReactNode } from "react";
import { cn } from "@/shared/lib/utils";
import { AlertCircleIcon, AlertTriangleIcon, InfoIcon } from "./icons";

type Tone = "info" | "warning" | "danger";

interface BannerProps {
  /// `info` (por defecto) describe una condición que sigue vigente mientras la pantalla está abierta: es un
  /// `status`, que el lector de pantalla anuncia sin interrumpir. `warning` también es un `status`: avisa una
  /// consecuencia de algo que se puede hacer igual ("es su único medio de ingreso"), no algo que haya que corregir.
  /// `danger` es un error que hay que corregir: un `alert`, como cualquier error de formulario (fundamento visual,
  /// "Avisos y estados").
  tone?: Tone;
  /// Lo que se puede hacer al respecto ("Agregar correo"). Va a la derecha, sin partirse.
  action?: ReactNode;
  /// El 409 de una edición es de atención pero pide decidir ya («Ver lo nuevo» o «Seguir editando»): un `alert`.
  role?: "status" | "alert";
  children: ReactNode;
}

// «Criterio · Avisos»: cartel de información (petróleo), de atención (ámbar) y de problema (rojo). El ícono y el texto
// van en el color del aviso; el ícono, con el trazo 2 de los carteles del lienzo.
const tones: Record<Tone, { icon: ComponentType<{ className?: string; strokeWidth?: number }>; box: string }> = {
  info: { icon: InfoIcon, box: "bg-[var(--marca-t)] text-[var(--marca-tx)]" },
  warning: { icon: AlertTriangleIcon, box: "bg-[var(--alerta-t)] text-[var(--alerta-tx)]" },
  danger: { icon: AlertCircleIcon, box: "bg-[var(--peligro-t)] text-[var(--peligro-tx)]" },
};

/// Un aviso con su ícono, en el cuerpo de la pantalla o de un diálogo: el cartel de «Criterio · Avisos». Lo usan el
/// inicio y Mi cuenta (falta un correo propio), la invitación aceptada (el mismo aviso), la ficha de Usuario (pidió la
/// baja de su cuenta), el 409 de una edición en la compu (ConcurrencyBanner) y, en la compu, el error de guardado de una
/// ficha (`useEditPage`) y el de los permisos de un rol (tableros Usuario y Rol, .w-cartel.o-prob).
export function Banner({ tone = "info", action, role, className, children }: BannerProps & { className?: string }) {
  const { icon: Icon, box } = tones[tone];

  return (
    <div
      role={role ?? (tone === "danger" ? "alert" : "status")}
      className={cn(
        // «Criterio · Avisos» (.cartel) y tableros Inicio-Personal y Usuario (.w-cartel): sin borde, 44 de alto como
        // mínimo (el de un botón chico con su margen), padding 6/8/6/14, radio 10 y letra de 13.
        "flex min-h-11 items-center gap-2.5 rounded-[10px] py-1.5 pr-2 pl-3.5 text-[13px] leading-normal",
        box,
        className,
      )}
    >
      <Icon className="size-[18px] shrink-0" strokeWidth={2} />
      <p className="min-w-0 flex-1">{children}</p>
      {action ? <div className="flex shrink-0 items-center gap-2.5">{action}</div> : null}
    </div>
  );
}
