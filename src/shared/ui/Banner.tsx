import type { ComponentType, ReactNode } from "react";
import { cn } from "@/shared/lib/utils";
import { AlertTriangleIcon, CircleCheckIcon, ErrorIcon, InfoIcon } from "./icons";
import { noticeSurface, noticeTones, type NoticeTone } from "./noticeTones";

type Tone = NoticeTone;

interface BannerProps {
  /// `info` (por defecto) describe una condición que sigue vigente mientras la pantalla está abierta: es un
  /// `status`, que el lector de pantalla anuncia sin interrumpir. `warning` también es un `status`: avisa una
  /// consecuencia de algo que se puede hacer igual ("es su único medio de ingreso"), no algo que haya que corregir.
  /// `danger` es un error que hay que corregir: un `alert`, como cualquier error de formulario (fundamento visual,
  /// "Avisos y estados"). `success` dice algo que ya pasó y sigue valiendo («Ya se guardó.», de una propuesta del
  /// asistente que otra pestaña guardó): también un `status`.
  tone?: Tone;
  /// Lo que se puede hacer al respecto ("Agregar correo"). Va a la derecha, sin partirse.
  action?: ReactNode;
  /// El 409 de una edición es de atención pero pide decidir ya («Ver lo nuevo» o «Seguir editando»): un `alert`.
  role?: "status" | "alert";
  children: ReactNode;
}

// «Criterio · Avisos» (210): cartel de información (i), de atención (triángulo) y de problema (octógono), blanco, con el
// filo y el ícono del color de su tipo (noticeTones); el ícono, con el trazo 2 de los carteles del lienzo.
const icons: Record<Tone, ComponentType<{ className?: string; strokeWidth?: number }>> = {
  success: CircleCheckIcon,
  info: InfoIcon,
  warning: AlertTriangleIcon,
  danger: ErrorIcon,
};

/// Un aviso con su ícono, en el cuerpo de la pantalla o de un diálogo: el cartel de «Criterio · Avisos». Lo usan el
/// inicio y Mi cuenta (falta un correo propio), la invitación aceptada (el mismo aviso), la ficha de Usuario (pidió la
/// baja de su cuenta), el 409 de una edición en la compu (ConcurrencyBanner) y, en la compu, el error de guardado de una
/// ficha (`useEditPage`) y el de los permisos de un rol (tableros Usuario y Rol, .w-cartel.o-prob).
export function Banner({ tone = "info", action, role, className, children }: BannerProps & { className?: string }) {
  const Icon = icons[tone];

  return (
    <div
      role={role ?? (tone === "danger" ? "alert" : "status")}
      className={cn(
        // «Criterio · Avisos» (.cartel) y tableros Inicio-Personal y Usuario (.w-cartel): 44 de alto como mínimo (el de un
        // botón chico con su margen), padding 6/8/6/14, radio 10 y letra de 13; blanco, con el borde de las cajas y el
        // filo de su tipo (210).
        "flex min-h-11 items-center gap-2.5 rounded-[0.625rem] py-1.5 pr-2 pl-3.5 text-[0.8125rem] leading-normal",
        noticeSurface,
        noticeTones[tone].edge,
        className,
      )}
    >
      <Icon className={cn("size-4.5 shrink-0", noticeTones[tone].icon)} strokeWidth={2} />
      <p className="min-w-0 flex-1">{children}</p>
      {action ? <div className="flex shrink-0 items-center gap-2.5">{action}</div> : null}
    </div>
  );
}
