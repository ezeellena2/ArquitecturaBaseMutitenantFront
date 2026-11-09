import type { ReactNode } from "react";
import { Link } from "react-router";
import { cn } from "@/shared/lib/utils";
import { Avatar } from "../Avatar";

// Tableros M-* (.ap-fila): filas de borde a borde con hasta tres líneas, con la altura normal de la letra; la línea fina
// de abajo arranca donde empieza el texto si hay un círculo a la izquierda. Un texto largo baja de renglón y la fila crece,
// sin «…» (174). A la derecha del nombre, un dato chico
// («1 usuario», «27/09 10:42»). El ⋮ va solo si la fila tiene acciones; tocar la fila abre su ficha. Con el círculo de
// una persona (M-Usuarios y M-Empresa, .w-conv), el círculo va arriba, el correo en gris claro y la tercera línea en 12,5.
export function ListRow({ leading, title, meta, lines = [], trailing, to, onClick, className }: {
  leading?: ReactNode;
  title: ReactNode;
  meta?: ReactNode;
  lines?: readonly ReactNode[];
  trailing?: ReactNode;
  to?: string;
  onClick?: () => void;
  className?: string;
}) {
  const person = Boolean(leading);
  const body = <>
    {leading}
    <span className="flex min-w-0 flex-1 flex-col gap-0.5 pr-2.5 leading-[normal]">
      <span className="flex items-start justify-between gap-2">
        <span className="min-w-0 flex-1 text-[0.96875rem] font-medium text-[var(--t1)] [overflow-wrap:anywhere]">{title}</span>
        {meta ? <span className="shrink-0 pt-0.5 text-[0.78125rem] text-[var(--t3)]">{meta}</span> : null}
      </span>
      {lines[0] ? <span className={cn("min-w-0 text-[0.875rem] [overflow-wrap:anywhere]", person ? "text-[var(--t3)]" : "text-[var(--t2)]")}>{lines[0]}</span> : null}
      {lines[1] ? <span className={cn("min-w-0 text-[var(--t3)] [overflow-wrap:anywhere]", person ? "text-[0.78125rem]" : "text-[0.8125rem]")}>{lines[1]}</span> : null}
    </span>
  </>;
  const bodyClass = cn("flex min-w-0 flex-1 gap-3.5 text-left", person ? "items-start" : "items-center");
  // Tableros M-Roles y M-Empresas (.ap-fila .ap-ib): en una fila sin círculo, el ⋮ va gris y 4 más afuera, a 14 del texto
  // (que guarda 10 más suyos: «1 usuario» queda a 24 del ⋮). En la de una persona (.w-conv) el texto llega a 14 del ⋮ con
  // esos 10 suyos.
  return <li className={cn("relative flex items-center gap-1 py-3 pr-1.5 pl-4 after:absolute after:right-0 after:bottom-0 after:h-px after:bg-[var(--borde)]",
    leading ? "after:left-18.5" : "gap-3.5 after:left-4 [&>[data-slot=row-actions]]:-mr-1 [&>[data-slot=row-actions]]:text-[var(--t2)]", className)}>
    {to ? <Link to={to} className={bodyClass}>{body}</Link>
      : onClick ? <button type="button" onClick={onClick} className={bodyClass}>{body}</button>
        : <span className={bodyClass}>{body}</span>}
    {trailing}
  </li>;
}

/// El círculo de una persona en una fila (`Avatar`, con el degradé de la marca); una invitación sin nombre lleva «@» en gris.
export function RowAvatar({ name, invitation }: { name: string; invitation?: boolean }) {
  return <Avatar size="row" muted={invitation} initials={invitation ? "@" : name.trim().charAt(0).toUpperCase()} />;
}
