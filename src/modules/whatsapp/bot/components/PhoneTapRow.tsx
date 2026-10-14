import { ChevronRight } from "lucide-react";
import { useId, type ReactNode } from "react";

// Las mismas medidas que `SettingsItem` (M-WA-Respuestas, .ap-it): 56 de alto, 16 a la izquierda y la línea fina desde el
// texto, compartida con las filas de `SettingsItem` del mismo grupo.
const itemClass = "relative flex min-h-14 w-full items-center gap-3 py-2 pr-3.5 pl-4 text-left text-[var(--t1)]";
const lineClass = "relative [&+&]:before:absolute [&+&]:before:top-0 [&+&]:before:right-0 [&+&]:before:left-4 [&+&]:before:h-px [&+&]:before:bg-[var(--borde)]";

/// Una fila del bot que se toca para editarla (M-WA-Respuestas y M-WA-Editar): se nombra por su título («Bienvenida»,
/// «Hacer un pedido») y lo que la aclara va como descripción, así el lector dice primero qué se abre.
export function PhoneTapRow({ title, detail, leading, onClick }: { title: string; detail: ReactNode; leading?: ReactNode; onClick: () => void }) {
  const id = useId();
  return <li className={lineClass}>
    <button type="button" onClick={onClick} aria-labelledby={`${id}-title`} aria-describedby={`${id}-detail`} className={itemClass}>
      {leading}
      <span className="flex min-w-0 flex-1 flex-col gap-px leading-tight">
        <span id={`${id}-title`} className="truncate text-[15.5px] font-medium">{title}</span>
        <span id={`${id}-detail`} className="truncate text-[13px] text-[var(--t3)]">{detail}</span>
      </span>
      <ChevronRight size={18} aria-hidden="true" className="shrink-0 text-[var(--t3)]" />
    </button>
  </li>;
}
