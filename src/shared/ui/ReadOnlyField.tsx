import type { ReactNode } from "react";
import { cn } from "@/shared/lib/utils";

/// Tablero «Criterio · Formularios»: lo que no se edita (sin permiso, o porque no cambia) se muestra como texto,
/// nunca como un campo gris. Rótulo arriba, como un campo, y el valor a la altura de un control de 36; en el teléfono
/// (tableros M-*, como «Vale en» de M-Rol), el valor con la letra de 16 de los campos y sin estirarse. Un texto largo
/// (`long`: la descripción de un rol de sistema) conserva sus renglones y no se estira a la altura de un control.
export function ReadOnlyField({ label, long = false, children }: { label: string; long?: boolean; children: ReactNode }) {
  return <div className="flex flex-col gap-1.5">
    <span className="text-[12.5px] font-semibold text-[var(--t2)] max-md:text-[13.5px]">{label}</span>
    <p className={cn("text-[13px] text-[var(--t1)] max-md:min-h-0 max-md:text-[16px]", long ? "whitespace-pre-wrap pt-0.5 leading-[1.5]" : "min-h-9 content-center")}>{children}</p>
  </div>;
}
