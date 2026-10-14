import type { ReactNode } from "react";
import { Link } from "react-router";
import { cn } from "@/shared/lib/utils";
import { Avatar } from "../Avatar";
import { NumberText } from "../format/NumberText";

export interface BottomNavItem {
  key: string;
  label: string;
  to: string;
  /** El ícono de la sección, de 24, como en los tableros (la casita de Inicio es `AppHomeIcon`). */
  icon?: ReactNode;
  /** «Más» lleva la inicial de la persona en lugar de un ícono. */
  avatar?: string;
  avatarMuted?: boolean;
  /** El contador sobre el ícono (M-WA-Chats: los chats sin tomar). */
  badge?: ReactNode;
  active: boolean;
}

/// El contador de una sección de la barra (`.ap-nav .b` de los tableros): petróleo, blanco, de 18, arriba a la derecha del ícono.
export function BottomNavBadge({ count }: { count: number }) {
  return <span data-slot="bottom-nav-badge" className="absolute -top-[3px] right-1 inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-[9px] bg-[var(--marca)] px-[5px] text-[11px] leading-none font-bold text-[var(--lado-activo)]">
    <NumberText value={count} />
  </span>;
}

// Tableros M-* (.ap-nav): hasta cuatro secciones y «Más». La elegida, en petróleo sobre una píldora clara.
export function BottomNav({ label, items }: { label: string; items: readonly BottomNavItem[] }) {
  return <nav aria-label={label} data-slot="bottom-nav" style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}
    className="grid shrink-0 border-t border-[var(--borde)] bg-[var(--lado-activo)] px-1 pt-2 pb-[calc(8px+env(safe-area-inset-bottom))]">
    {items.map((item) => {
      return <Link key={item.key} to={item.to} aria-current={item.active ? "page" : undefined}
        className={cn("flex flex-col items-center gap-1 text-[11.5px] font-medium text-[var(--t2)] focus-visible:outline-2 focus-visible:outline-[var(--foco)]", item.active && "font-semibold text-[var(--marca-tx)]")}>
        <span aria-hidden="true" className={cn("relative inline-flex h-[30px] w-14 items-center justify-center rounded-[15px]", item.active && "bg-[var(--marca-t)]")}>
          {item.avatar
            ? <Avatar size="nav" initials={item.avatar} muted={item.avatarMuted} className={item.active ? "shadow-[0_0_0_2px_var(--lado-activo),0_0_0_4px_var(--marca)]" : undefined} />
            : item.icon ?? null}
          {item.badge ?? null}
        </span>
        {item.label}
        {/* El ícono no se lee: la cantidad se repite para el lector, después del rótulo («Chats 2»). */}
        {item.badge ? <>{" "}<span className="sr-only">{item.badge}</span></> : null}
      </Link>;
    })}
  </nav>;
}
