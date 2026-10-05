import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/shared/lib/utils";

type Tone = "neutral" | "ok" | "warning" | "brand" | "danger";

// Tableros Ingreso, Registro, Registro-Empresa e Invitacion (.circulo): el fondo suave y el ícono en el color del estado.
const tones: Record<Tone, string> = {
  neutral: "bg-[var(--s3)] text-[var(--t2)]",
  ok: "bg-[var(--ok-t)] text-[var(--ok)]",
  warning: "bg-[var(--alerta-t)] text-[var(--alerta)]",
  brand: "bg-[var(--marca-t)] text-[var(--marca-tx)]",
  danger: "bg-[var(--peligro-t)] text-[var(--peligro)]",
};

export interface AuthStatusProps {
  icon: LucideIcon;
  tone?: Tone;
  title: ReactNode;
  detail?: ReactNode;
  /** Entre el título y los botones: el cartel de la invitación aceptada o la franja de un error. */
  children?: ReactNode;
  /** Los botones de 44 (`Button size="lg"`), uno debajo del otro: el principal arriba. */
  actions?: ReactNode;
  /** El tilde de «Te sumaste a …» va de 22 con trazo 2, como el tablero Invitacion; los demás íconos, de 20 con 1,75. */
  largeIcon?: boolean;
}

/// La pantalla de estado del ingreso, los dos registros y la invitación: lo que pasó, en un círculo de 52, el título de
/// 24 y su bajada centrados, y lo que se puede hacer (tableros Ingreso, Registro, Registro-Empresa e Invitacion).
export function AuthStatus({ icon: Icon, tone = "neutral", title, detail, children, actions, largeIcon = false }: AuthStatusProps) {
  return <div className="flex flex-col gap-[22px]">
    <span aria-hidden="true" className={cn("flex size-[52px] items-center justify-center self-center rounded-full", tones[tone])}>
      <Icon size={largeIcon ? 22 : 20} strokeWidth={largeIcon ? 2 : 1.75} />
    </span>
    <div className="text-center">
      <h1 className="text-[24px] leading-[1.2] font-bold tracking-[-0.02em]">{title}</h1>
      {/* .sub de los tableros: 14 a 6 del título; un correo largo se corta donde haga falta. */}
      {detail ? <p className="mt-1.5 text-sm leading-normal text-[var(--t2)] wrap-anywhere">{detail}</p> : null}
    </div>
    {children}
    {actions ? <div className="flex flex-col gap-2.5">{actions}</div> : null}
  </div>;
}
