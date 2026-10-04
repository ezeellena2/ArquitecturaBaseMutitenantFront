import type { LucideIcon } from "lucide-react";
import { Link } from "react-router";
import { cn } from "@/shared/lib/utils";

export interface BottomNavItem {
  key: string;
  label: string;
  to: string;
  icon?: LucideIcon;
  /** «Más» lleva la inicial de la persona en lugar de un ícono. */
  avatar?: string;
  active: boolean;
}

// Tableros M-* (.ap-nav): hasta cuatro secciones y «Más». La elegida, en petróleo sobre una píldora clara.
export function BottomNav({ label, items }: { label: string; items: readonly BottomNavItem[] }) {
  return <nav aria-label={label} data-slot="bottom-nav" style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}
    className="grid shrink-0 border-t border-[var(--borde)] bg-[var(--lado-activo)] px-1 pt-2 pb-[calc(8px+env(safe-area-inset-bottom))]">
    {items.map((item) => {
      const Icon = item.icon;
      return <Link key={item.key} to={item.to} aria-current={item.active ? "page" : undefined}
        className={cn("flex flex-col items-center gap-1 text-[11.5px] font-medium text-[var(--t2)] focus-visible:outline-2 focus-visible:outline-[var(--foco)]", item.active && "font-semibold text-[var(--marca-tx)]")}>
        <span aria-hidden="true" className={cn("relative inline-flex h-[30px] w-14 items-center justify-center rounded-[15px]", item.active && "bg-[var(--marca-t)]")}>
          {item.avatar
            ? <span className={cn("inline-flex size-[26px] items-center justify-center rounded-full bg-[var(--marca)] text-[12px] font-semibold text-[var(--lado-activo)]", item.active && "shadow-[0_0_0_2px_var(--lado-activo),0_0_0_4px_var(--marca)]")}>{item.avatar}</span>
            : Icon ? <Icon size={22} strokeWidth={1.75} /> : null}
        </span>
        {item.label}
      </Link>;
    })}
  </nav>;
}
