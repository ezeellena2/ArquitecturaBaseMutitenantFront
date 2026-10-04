import type { ReactNode } from "react";

/// Tablero «Criterio · Formularios»: lo que no se edita (sin permiso, o porque no cambia) se muestra como texto,
/// nunca como un campo gris. Rótulo arriba, como un campo, y el valor a la altura de un control de 36.
export function ReadOnlyField({ label, children }: { label: string; children: ReactNode }) {
  return <div className="flex flex-col gap-1.5 lg:gap-2">
    <span className="text-[12px] font-semibold text-[var(--t2)] lg:text-[13px]">{label}</span>
    <p className="min-h-9 content-center text-[13px] text-[var(--t1)]">{children}</p>
  </div>;
}
