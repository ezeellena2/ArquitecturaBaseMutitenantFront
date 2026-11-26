import { useEffect, type ReactNode } from "react";
import { useAppChrome } from "./AppChrome";

// Tableros M-* (.ap-fijo): la acción de una tarea va fija abajo, con botones de 50 a lo ancho, y la barra de abajo se
// esconde mientras tanto. A 320 cada botón mide unos 138 px: un texto largo («Descartar cambios») baja a dos renglones
// dentro de los 50, en lugar de salirse del botón (responsive.md: a 320 no se corta nada).
export function FixedActions({ children, notice }: { children: ReactNode; notice?: ReactNode }) {
  const { hideBottomNav } = useAppChrome();
  useEffect(() => {
    hideBottomNav(true);
    return () => hideBottomNav(false);
  }, [hideBottomNav]);

  const bar = <div data-slot="fixed-actions" className="sticky bottom-0 z-20 mt-auto flex items-center gap-3 border-t border-[var(--borde)] bg-[var(--superficie)] px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] [&>*]:h-12.5 [&>*]:min-w-0 [&>*]:flex-1 [&>*]:rounded-[0.75rem] [&>*]:px-2 [&>*]:text-[1rem] [&>*]:leading-tight [&>*]:whitespace-normal">
    {children}
  </div>;
  if (!notice) return bar;
  // Un aviso pegado a la acción (M-Rol, .ap-cartel): arriba de la barra, con 16 a los costados y 10 hasta ella.
  return <div className="sticky bottom-0 z-20 mt-auto flex flex-col [&>[data-slot=fixed-actions]]:static [&>[data-slot=fixed-actions]]:mt-0">
    <div data-slot="fixed-actions-notice" className="bg-[var(--superficie)] px-4 pb-2.5">{notice}</div>
    {bar}
  </div>;
}
