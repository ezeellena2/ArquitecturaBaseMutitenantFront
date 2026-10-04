import type { ReactNode } from "react";
import { cn } from "@/shared/lib/utils";

// Tableros M-* (.ap-fila): filas de borde a borde con hasta tres líneas; la línea fina de abajo arranca donde empieza
// el texto si hay un círculo a la izquierda. El ⋮ va solo si la fila tiene acciones.
export function ListRow({ leading, title, lines = [], trailing, className }: {
  leading?: ReactNode;
  title: ReactNode;
  lines?: readonly ReactNode[];
  trailing?: ReactNode;
  className?: string;
}) {
  return <li className={cn("relative flex items-center gap-3.5 py-3 pr-1.5 pl-4 after:absolute after:right-0 after:bottom-0 after:h-px after:bg-[var(--borde)]", leading ? "after:left-[74px]" : "after:left-4", className)}>
    {leading}
    <div className="flex min-w-0 flex-1 flex-col gap-0.5 pr-2.5">
      <span className="truncate text-[15.5px] font-medium text-[var(--t1)]">{title}</span>
      {lines[0] ? <span className="truncate text-[14px] text-[var(--t2)]">{lines[0]}</span> : null}
      {lines[1] ? <span className="truncate text-[13px] text-[var(--t3)]">{lines[1]}</span> : null}
    </div>
    {trailing}
  </li>;
}
