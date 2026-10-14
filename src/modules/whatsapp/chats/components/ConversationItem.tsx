import type { ReactNode } from "react";
import { Link } from "react-router";
import { cn } from "@/shared/lib/utils";

/// Una conversación de la bandeja (WA-Chats y M-WA-Chats, .w-conv): el círculo, el nombre con la hora, el último mensaje
/// con el punto de «Sin leer» y, debajo, el equipo y quién lo atiende. La abierta va sobre petróleo claro; una sin leer,
/// en negrita con la hora en petróleo. Toda la fila lleva a la conversación. Sirve también para «Mensajes» de la persona.
export function ConversationItem({ to, avatar, title, time, preview, assignment, assignmentTone, unread, unreadLabel, selected, phone }: {
  to: string;
  avatar: ReactNode;
  title: ReactNode;
  time: ReactNode;
  preview?: ReactNode;
  assignment?: ReactNode;
  /** «Sin tomar» va en ámbar (.l3.sin). */
  assignmentTone?: "untaken";
  unread?: boolean;
  unreadLabel?: string;
  selected?: boolean;
  phone: boolean;
}) {
  return <li className="border-b border-[var(--borde)]">
    <Link to={to} aria-current={selected ? "page" : undefined}
      className={cn("flex items-start gap-3 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[var(--foco)]",
        phone ? "px-4 py-3" : "px-3.5 py-3 hover:bg-[var(--s2)]", selected ? "bg-[var(--marca-t)] hover:bg-[var(--marca-t)]" : null)}>
      {avatar}
      <span className={cn("flex min-w-0 flex-1 flex-col gap-0.5", phone ? "leading-[normal]" : null)}>
        <span className="flex justify-between gap-2">
          <span className={cn("truncate", phone ? "text-[15.5px]" : null, unread ? "font-semibold text-[var(--t1)]" : "font-medium text-[var(--t1)]")}>{title}</span>
          <span className={cn("shrink-0 text-[12px]", unread ? "font-semibold text-[var(--marca-tx)]" : "text-[var(--t3)]")}>{time}</span>
        </span>
        {preview ? <span className={cn("flex justify-between gap-2", phone ? "text-[14px]" : "text-[12.5px]")}>
          <span className={cn("truncate", unread ? "font-semibold text-[var(--t1)]" : "text-[var(--t3)]")}>{preview}</span>
          {unread ? <span role="img" aria-label={unreadLabel} className="mt-[5px] size-2 shrink-0 rounded-full bg-[var(--marca)]" /> : null}
        </span> : null}
        {assignment ? <span className={cn("truncate", phone ? "text-[12.5px]" : "text-[12px]", assignmentTone === "untaken" ? "text-[var(--alerta)]" : "text-[var(--t3)]")}>{assignment}</span> : null}
      </span>
    </Link>
  </li>;
}
