import type { ReactNode } from "react";
import { cn } from "@/shared/lib/utils";
import { CloseIcon } from "./icons";

type FilterChipProps = { children: ReactNode } & (
  { removeLabel: string; onRemove: () => void } | { removeLabel?: never; onRemove?: never });

/// Un filtro aplicado («Criterio · Menús», Filtros): con el radio de un control, nunca en pastilla (173). Con `onRemove`,
/// la × lo quita y se llama por lo que quita («Quitar Estado: Aprobada»). Sin ella es de solo lectura y va sin × (213),
/// como los filtros que repite un diálogo: se lee igual y guarda a la derecha el margen de la izquierda.
export function FilterChip({ children, removeLabel, onRemove }: FilterChipProps) {
  return <span data-slot="filter-chip"
    className={cn("inline-flex h-7 items-center gap-1 rounded-[0.5rem] border border-[var(--borde2)] bg-[var(--superficie)] pl-2.5 text-[0.8125rem] text-[var(--t1)]",
      onRemove ? "pr-1" : "pr-2.5")}>
    {children}
    {onRemove ? <button type="button" aria-label={removeLabel} title={removeLabel} onClick={onRemove}
      className="inline-flex size-5 items-center justify-center rounded-[0.25rem] text-[var(--t3)] hover:bg-[var(--s2)] hover:text-[var(--t1)] focus-visible:outline-2 focus-visible:outline-[var(--foco)]">
      <CloseIcon className="size-3.5" strokeWidth={2} />
    </button> : null}
  </span>;
}
