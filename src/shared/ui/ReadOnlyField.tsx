import { useId, type ReactNode } from "react";
import { cn } from "@/shared/lib/utils";
import { ChevronDownIcon } from "./icons";

/// «Criterio · Formularios», regla A11 (v113, 07/10): lo que no se puede cambiar (sin permiso, o porque no cambia) va en el
/// mismo campo que al editar, apagado: fondo y texto grises (tableros: .o-txt y .ct.ro). Es el mismo trazo que SearchSelect
/// apagado: borde, fondo `--s2`, texto `--t2`, 36 de alto (48 y radio 12 en el teléfono). Nunca un rótulo con texto suelto.
/// - `control="select"`: un desplegable apagado, con su flechita en `--t3` («Vale en», «Estado», la moneda).
/// - `control="area"` (o `long`): un texto largo apagado, de tres líneas como el Textarea («Descripción»).
/// - `prefix`: lo de adelante del valor, como la moneda de MoneyField («USD»).
/// - `action`: un enlace adentro, a la derecha («Cambiar» la clave).
/// - `info`: el ⓘ junto al rótulo («Los fija la plataforma.»).
/// - `muted`: un valor vacío («Sin descripción»), en el gris de un campo vacío.
export function ReadOnlyField({ label, control = "text", long = false, prefix, action, info, muted = false, children }: {
  label: string;
  control?: "text" | "select" | "area";
  long?: boolean;
  prefix?: ReactNode;
  action?: ReactNode;
  info?: ReactNode;
  muted?: boolean;
  children: ReactNode;
}) {
  const labelId = useId();
  const area = long || control === "area";
  return <div role="group" aria-labelledby={labelId} className="flex min-w-0 flex-col gap-1.5">
    <span className="inline-flex items-center gap-1 text-[12.5px] font-semibold text-[var(--t2)] max-md:text-[13.5px] max-md:leading-[normal]">
      <span id={labelId}>{label}</span>{info}
    </span>
    <div data-slot="read-only-field" className={cn("flex w-full min-w-0 gap-2 rounded-[8px] border border-[var(--borde)] bg-[var(--s2)] px-3 text-[13px] text-[var(--t2)]",
      "max-md:rounded-[12px] max-md:px-3.5 max-md:text-[16px]",
      area ? "min-h-[84px] items-start py-2 leading-[1.5] max-md:py-3" : "h-9 items-center max-md:h-12")}>
      {prefix ? <span className="shrink-0">{prefix}</span> : null}
      <span className={cn("min-w-0 flex-1", area ? "whitespace-pre-wrap" : "truncate", muted && "text-[var(--t3)]")}>{children}</span>
      {action ? <span className="shrink-0">{action}</span> : null}
      {control === "select" ? <ChevronDownIcon strokeWidth={2} aria-hidden="true" className="size-3.5 shrink-0 text-[var(--t3)] max-md:size-[18px]" /> : null}
    </div>
  </div>;
}
