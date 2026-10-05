import { ChevronRight } from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "react-router";
import { cn } from "@/shared/lib/utils";

// Tableros M-* (.ap-gtit, .ap-grupo, .ap-it): en el teléfono los ajustes van en grupos blancos sobre fondo gris, con su
// título arriba y, a lo sumo, una acción en texto a la derecha. El título, con el interlineado normal del tablero.
export function GroupTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return <div className="mx-5 mt-[18px] mb-2 flex items-center justify-between gap-3 leading-[normal]">
    <span className="text-[13.5px] font-semibold text-[var(--t2)]">{children}</span>
    {action ? <span className="text-[14.5px] font-semibold text-[var(--marca-tx)] [&_a]:text-inherit [&_button]:text-inherit">{action}</span> : null}
  </div>;
}

export function SettingsGroup({ label, children, className }: { label: string; children: ReactNode; className?: string }) {
  return <ul aria-label={label} className={cn("mx-4 shrink-0 list-none overflow-hidden rounded-[14px] bg-[var(--lado-activo)] p-0 shadow-[0_0_0_1px_var(--borde)]", className)}>{children}</ul>;
}

const itemClass = "relative flex min-h-14 items-center gap-3 py-2 pr-3.5 pl-4 text-[var(--t1)]";
const lineClass = "relative [&+&]:before:absolute [&+&]:before:top-0 [&+&]:before:right-0 [&+&]:before:left-4 [&+&]:before:h-px [&+&]:before:bg-[var(--borde)]";

/// Una fila del grupo: el dato y, en gris debajo, lo que lo aclara; a la derecha, una flecha si lleva a otra pantalla,
/// o la acción que pida (⋮, «Verificar»).
export function SettingsItem({ title, detail, leading, to, onClick, trailing, tone }: {
  title: ReactNode;
  detail?: ReactNode;
  leading?: ReactNode;
  to?: string;
  onClick?: () => void;
  trailing?: ReactNode;
  tone?: "danger" | "muted";
}) {
  const content = <>
    {leading}
    <span className="flex min-w-0 flex-1 flex-col gap-px leading-tight">
      <span className={cn("truncate text-[15.5px] font-medium", tone === "danger" && "text-[var(--peligro)]")}>{title}</span>
      {detail ? <span className="truncate text-[13px] text-[var(--t3)]">{detail}</span> : null}
    </span>
    {trailing ?? (to || onClick ? <ChevronRight size={18} aria-hidden="true" className="shrink-0 text-[var(--t3)]" /> : null)}
  </>;
  return <li className={cn(lineClass, tone === "muted" && "opacity-55")}>
    {to ? <Link to={to} className={itemClass}>{content}</Link>
      : onClick ? <button type="button" onClick={onClick} className={cn(itemClass, "w-full text-left")}>{content}</button>
        : <div className={itemClass}>{content}</div>}
  </li>;
}
