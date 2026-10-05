import type { ReactNode } from "react";
import { Link } from "react-router";
import { cn } from "@/shared/lib/utils";
import { Avatar } from "../Avatar";

// Tableros M-* (.ap-fila): filas de borde a borde con hasta tres líneas, con la altura normal de la letra; la línea fina
// de abajo arranca donde empieza el texto si hay un círculo a la izquierda. A la derecha del nombre, un dato chico
// («1 usuario», «27/09 10:42»). El ⋮ va solo si la fila tiene acciones; tocar la fila abre su ficha. Con el círculo de
// una persona (M-Usuarios y M-Empresa, .w-conv), el círculo va arriba, el correo en gris claro y la tercera línea en 12,5.
export function ListRow({ leading, title, meta, lines = [], trailing, to, onClick, wrapTitle, wrapLines, className }: {
  leading?: ReactNode;
  title: ReactNode;
  meta?: ReactNode;
  lines?: readonly ReactNode[];
  trailing?: ReactNode;
  to?: string;
  onClick?: () => void;
  /** El título puede ocupar dos renglones (un movimiento de la auditoría). */
  wrapTitle?: boolean;
  /** La última línea sigue en el renglón de abajo en lugar de cortarse con «…» (M-Empresa, .w-conv .l3: los roles, el
   *  estado y hasta cuándo vale una invitación). */
  wrapLines?: boolean;
  className?: string;
}) {
  const person = Boolean(leading);
  const body = <>
    {leading}
    <span className="flex min-w-0 flex-1 flex-col gap-0.5 pr-2.5 leading-[normal]">
      <span className="flex items-start justify-between gap-2">
        <span className={cn("min-w-0 flex-1 text-[15.5px] font-medium text-[var(--t1)]", wrapTitle ? "[overflow-wrap:anywhere]" : "truncate")}>{title}</span>
        {meta ? <span className="shrink-0 pt-0.5 text-[12.5px] text-[var(--t3)]">{meta}</span> : null}
      </span>
      {lines[0] ? <span className={cn("truncate text-[14px]", person ? "text-[var(--t3)]" : "text-[var(--t2)]")}>{lines[0]}</span> : null}
      {lines[1] ? <span className={cn(wrapLines ? "min-w-0" : "truncate", "text-[var(--t3)]", person ? "text-[12.5px]" : "text-[13px]")}>{lines[1]}</span> : null}
    </span>
  </>;
  const bodyClass = cn("flex min-w-0 flex-1 gap-3.5 text-left", person ? "items-start" : "items-center");
  // Tableros M-Roles y M-Empresas (.ap-fila .ap-ib): en una fila sin círculo, el ⋮ va gris y 4 más afuera.
  return <li className={cn("relative flex items-center gap-1 py-3 pr-1.5 pl-4 after:absolute after:right-0 after:bottom-0 after:h-px after:bg-[var(--borde)]",
    leading ? "after:left-[74px]" : "after:left-4 [&>[data-slot=row-actions]]:-mr-1 [&>[data-slot=row-actions]]:text-[var(--t2)]", className)}>
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
