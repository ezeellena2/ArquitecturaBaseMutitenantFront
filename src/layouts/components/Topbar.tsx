import type { ReactNode } from "react";
import { AccessMenu } from "@/tenancy/AccessMenu";

interface TopbarProps {
  breadcrumbs?: ReactNode;
}

/// La barra de arriba de la compu. En el teléfono no existe: la app lleva su barra con el título (tableros M-*).
export function Topbar({ breadcrumbs }: TopbarProps) {
  return (
    // «Criterio · Marco» (lienzo v104): la barra arena con las migas a la izquierda y tu menú a la derecha, con 16 de
    // margen. Nada más: sin ☰. El menú lateral se achica con la flecha redonda de su borde (`Sidebar`).
    <header className="flex h-[52px] items-center justify-between border-b border-[var(--lado-borde)] bg-[var(--lado)] px-4 text-[var(--t1)]">
      {breadcrumbs ? <div className="min-w-0">{breadcrumbs}</div> : <span />}
      <AccessMenu />
    </header>
  );
}
