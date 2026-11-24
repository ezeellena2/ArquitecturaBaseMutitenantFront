import type { ReactNode } from "react";
import { cn } from "@/shared/lib/utils";
import { InfoTip } from "./InfoTip";

/// El título de un grupo de opciones o de casillas, con su (i) («Criterio · Formularios», «Una cosa, una zona», 213):
/// con la letra del rótulo de un campo, no la de un título de zona, y la (i) después, a la misma distancia que en un
/// campo. Quien arma el grupo lo nombra con este título (`aria-labelledby` con `id`) y, si hay ayuda, la usa de
/// descripción (`aria-describedby` con `${id}-help`, el texto de la (i)), como un campo con su (i). La (i) va fuera del
/// título: no se suma al nombre del grupo, y tocarla no marca ni elige nada.
export function GroupLabel({ id, children, help, className }: { id: string; children: string; help?: string; className?: string }): ReactNode {
  const title = <span id={id} className={cn("text-[0.78125rem] leading-none font-semibold text-[var(--t2)] max-md:text-[0.84375rem] max-md:leading-[normal]", className)}>{children}</span>;
  if (!help) return title;
  return <span className="flex items-center gap-1">{title}<InfoTip id={`${id}-help`} text={help} title={children} /></span>;
}
