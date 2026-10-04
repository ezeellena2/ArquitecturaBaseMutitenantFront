import { ChevronLeft } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";
import { Link } from "react-router";
import { cn } from "@/shared/lib/utils";

// Tableros M-* (.ap-bar): barra de 60 debajo de la del teléfono. En una sección de la barra de abajo, el título grande
// de 24; en una pantalla interna, ‹ y el título de 20. Debajo, en gris, la organización o el camino.
export function AppBar({ title, subtitle, back, actions }: {
  title: string;
  subtitle?: ReactNode;
  back?: { to: string; label: string };
  actions?: ReactNode;
}) {
  return <header data-slot="app-bar" className={cn("sticky top-0 z-20 flex h-15 shrink-0 items-center gap-1 bg-[var(--lado-activo)] pr-1.5", back ? "pl-1" : "pl-4")}>
    {back ? <Link to={back.to} aria-label={back.label} title={back.label} className="inline-flex size-11 shrink-0 items-center justify-center rounded-full text-[var(--t1)] focus-visible:outline-2 focus-visible:outline-[var(--foco)]">
      <ChevronLeft size={26} strokeWidth={1.9} aria-hidden="true" />
    </Link> : null}
    <div className="min-w-0 flex-1">
      <h1 className={cn("truncate font-bold leading-[1.15] tracking-[-0.02em] text-[var(--t1)]", back ? "text-[20px]" : "text-[24px]")}>{title}</h1>
      {subtitle ? <span className="block truncate text-[12.5px] font-medium text-[var(--t3)]">{subtitle}</span> : null}
    </div>
    {actions ? <div className="flex shrink-0 items-center">{actions}</div> : null}
  </header>;
}

/// Los íconos de la barra (buscar, filtrar, ⋮): botones redondos de 44, siempre con nombre.
export function AppIconButton({ label, className, children, ...props }: ComponentProps<"button"> & { label: string }) {
  return <button type="button" aria-label={label} title={label} className={cn("relative inline-flex size-11 shrink-0 items-center justify-center rounded-full text-[var(--t1)] hover:bg-[var(--s2)] focus-visible:outline-2 focus-visible:outline-[var(--foco)] [&_svg:not([class*='size-'])]:size-[22px]", className)} {...props}>
    {children}
  </button>;
}
