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

/// El contador de una sección de la barra (`.ap-nav .b` de los tableros): verde, blanco, de 18, arriba a la derecha del ícono.
export function BottomNavBadge({ count }: { count: number }) {
  return <span data-slot="bottom-nav-badge" className="absolute -top-0.75 right-1 inline-flex h-4.5 min-w-4.5 items-center justify-center rounded-[0.5625rem] bg-[var(--marca)] px-1.25 text-[0.6875rem] leading-none font-bold text-[var(--superficie)]">
    <NumberText value={count} />
  </span>;
}

// Tableros M-* (.ap-nav): hasta cuatro secciones y «Más». La elegida, en verde sobre una píldora clara.
export function BottomNav({ label, items }: { label: string; items: readonly BottomNavItem[] }) {
  return <nav aria-label={label} data-slot="bottom-nav" style={{ gridTemplateColumns: `repeat(${items.length}, minmax(min-content, 1fr))` }}
    className="grid shrink-0 border-t border-[var(--borde)] bg-[var(--superficie)] px-1 pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))]">
    {items.map((item) => {
      return <Link key={item.key} to={item.to} aria-current={item.active ? "page" : undefined}
        className={cn("flex flex-col items-center gap-1 text-[0.71875rem] font-medium text-[var(--t2)] focus-visible:outline-2 focus-visible:outline-[var(--foco)]", item.active && "font-semibold text-[var(--marca-tx)]")}>
        <span aria-hidden="true" className={cn("relative inline-flex h-7.5 w-14 items-center justify-center rounded-[0.9375rem]", item.active && "bg-[var(--marca-t)]")}>
          {item.avatar
            ? <Avatar size="nav" initials={item.avatar} muted={item.avatarMuted} className={item.active ? "shadow-[0_0_0_2px_var(--superficie),0_0_0_4px_var(--marca)]" : undefined} />
            : item.icon ?? null}
          {item.badge ?? null}
        </span>
        {/* Columnas iguales, como el tablero; a 320, un rótulo largo («Organizaciones») ocupa lo que mide y las demás se
            reparten el resto, sin partir una palabra ni pisar la de al lado. */}
        <span className="text-center">{item.label}</span>
        {/* El ícono no se lee: la cantidad se repite para el lector, después del rótulo («Chats 2»). */}
        {item.badge ? <>{" "}<span className="sr-only">{item.badge}</span></> : null}
      </Link>;
    })}
  </nav>;
}
