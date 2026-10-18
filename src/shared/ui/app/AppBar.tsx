import { ChevronLeft } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";
import { Link } from "react-router";
import { cn } from "@/shared/lib/utils";
import { useHostedNotices } from "./AppNotices";

// Tableros M-* (.ap-bar): barra de 60 debajo de la del teléfono. En una sección de la barra de abajo, el título grande
// de 24; en una pantalla interna, ‹ y el título de 20. Debajo, en gris, la organización o el camino. Debajo de la
// barra, lo que sigue pasando en toda la app (M-Avisos: sin conexión, versión nueva). Queda fija arriba y, con
// `viewport-fit=cover`, deja libre la barra de estado (.ap-est) con el margen seguro, como la de abajo la raya de inicio.
export function AppBar({ title, subtitle, back, actions, leading }: {
  title: string;
  subtitle?: ReactNode;
  back?: { to: string; label: string };
  actions?: ReactNode;
  leading?: ReactNode;
}) {
  const notices = useHostedNotices();
  return <><header data-slot="app-bar" className={cn("sticky top-0 z-20 box-content flex h-15 shrink-0 items-center gap-1 bg-[var(--lado-activo)] pt-[env(safe-area-inset-top)] pr-1.5", back ? "pl-1" : "pl-4")}>
    {back ? <Link to={back.to} aria-label={back.label} title={back.label} className="inline-flex size-11 shrink-0 items-center justify-center rounded-full text-[var(--t1)] focus-visible:outline-2 focus-visible:outline-[var(--foco)]">
      <ChevronLeft size={26} strokeWidth={1.9} aria-hidden="true" />
    </Link> : null}
    {leading}
    <div className="min-w-0 flex-1">
      {/* .ap-bar h1 y .sub: el interlineado va después del tamaño, o tailwind-merge lo borra (y el título tomaba el 1.5 de
          la página: la bajada quedaba 4 a 6 px más abajo). La bajada, con el interlineado normal. */}
      <h1 className={cn("truncate font-bold tracking-[-0.02em] text-[var(--t1)]", back ? "text-[20px]" : "text-[24px]", "leading-[1.15]")}>{title}</h1>
      {subtitle ? <span className="block truncate text-[12.5px] leading-[normal] font-medium text-[var(--t3)]">{subtitle}</span> : null}
    </div>
    {actions ? <div className="flex shrink-0 items-center">{actions}</div> : null}
  </header>
  {notices ? <div data-slot="app-notices" className="shrink-0">{notices}</div> : null}</>;
}

/// Los íconos de la barra (buscar, filtrar, ⋮): botones redondos de 44, siempre con nombre.
export function AppIconButton({ label, className, children, ...props }: ComponentProps<"button"> & { label: string }) {
  return <button type="button" aria-label={label} title={label} className={cn("relative inline-flex size-11 shrink-0 items-center justify-center rounded-full text-[var(--t1)] hover:bg-[var(--s2)] focus-visible:outline-2 focus-visible:outline-[var(--foco)] [&_svg:not([class*='size-'])]:size-[22px]", className)} {...props}>
    {children}
  </button>;
}
