import type { ReactNode } from "react";
import { cn } from "@/shared/lib/utils";

/** La franja de color arena con el nombre de una parte del diálogo de importar (.imp-cab). */
export function ImportBand({ id, children, aside }: { id?: string; children: ReactNode; aside?: ReactNode }) {
  return <div className="flex min-h-10 items-center justify-between gap-3 bg-[var(--cab)] px-5 text-[0.8125rem] font-semibold text-[var(--t2)]">
    <h3 id={id} className="inline-flex items-center gap-1">{children}</h3>
    {aside}
  </div>;
}

/** Una zona del diálogo de importar (.imp-z); mientras aplica, queda atenuada y fuera de alcance. */
export function ImportZone({ dimmed = false, children }: { dimmed?: boolean; children: ReactNode }) {
  return <div inert={dimmed || undefined} className={cn("flex flex-col gap-2.5 border-t border-[var(--borde)] px-5 py-3", dimmed && "opacity-55")}>{children}</div>;
}
