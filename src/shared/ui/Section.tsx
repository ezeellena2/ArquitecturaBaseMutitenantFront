import { Plus } from "lucide-react";
import { createContext, useContext, useId, type ReactNode } from "react";
import { cn } from "@/shared/lib/utils";
import { useAppChrome } from "./app/AppChrome";
import { Button } from "./button";
import { InfoTip } from "./InfoTip";

type SectionPhone = "card" | "inset" | "untitled";

interface SectionProps {
  title: string;
  /** A lo sumo una acción chica: «Agregar dominio», «Sumar empresa». Apagada por algo que no es obvio, `disabledReason` dice
   * por qué, como en `Button` (211). */
  action?: { label: string; onClick: () => void; disabled?: boolean; disabledReason?: string };
  /** Lo que cuenta la caja, en gris a la derecha del título: «1 de 2 elegidos». */
  meta?: ReactNode;
  /** La ayuda que sirve (116): una (i) junto al título, con su tooltip; es la descripción de la caja. */
  help?: string;
  /**
   * En el teléfono: `card` es una tarjeta blanca sobre gris (M-Pagina-Org, M-Usuario, M-Cuenta); `inset`, la tarjeta
   * dentro de una página blanca con margen (M-Configuracion, M-Rol); `untitled`, los campos sueltos sin título a la
   * vista (los datos de M-Configuracion y M-Rol).
   */
  phone?: SectionPhone;
  children: ReactNode;
}

const SectionPhoneContext = createContext<SectionPhone>("card");

/// Una caja por tema («Criterio · Formularios»): en la compu, con el título en el encabezado arena de 40 y la acción
/// chica a la derecha; en el teléfono (tableros M-*, .ap-gtit y .ap-grupo), el título gris arriba, la acción en texto
/// y debajo una tarjeta blanca o los campos sueltos.
export function Section({ title, action, meta, help, phone = "card", children }: SectionProps) {
  const id = useId();
  const helpId = `${id}-help`;
  const describedBy = help ? helpId : undefined;
  // Con ayuda, la (i) va junto al título; sin ayuda, el título va solo, como siempre.
  const titled = (heading: ReactNode) => help ? <span className="inline-flex items-center gap-1">{heading}<InfoTip id={helpId} text={help} title={title} /></span> : heading;
  const chrome = useAppChrome();
  const body = <SectionPhoneContext.Provider value={phone}>{children}</SectionPhoneContext.Provider>;

  if (chrome.phone) {
    if (phone === "untitled") return <section aria-labelledby={id} className="flex flex-col">
      <h2 id={id} className="sr-only">{title}</h2>
      {body}
    </section>;
    return <section aria-labelledby={id} aria-describedby={describedBy} className="flex flex-col">
      <div className={cn("mb-2 flex items-center justify-between gap-3 leading-[normal]", phone === "card" ? "mx-5 mt-4.5" : "mt-1.5")}>
        {titled(<h2 id={id} className="text-[0.84375rem] font-semibold text-[var(--t2)]">{title}</h2>)}
        {meta ? <span className="text-[0.84375rem] text-[var(--t3)]">{meta}</span> : null}
        {action ? <Button type="button" variant="link" onClick={action.onClick} disabled={action.disabled} disabledReason={action.disabledReason}
          className="text-[0.90625rem] font-semibold text-[var(--marca-tx)] disabled:opacity-45">{action.label}</Button> : null}
      </div>
      <div className={cn("overflow-hidden rounded-[0.875rem] bg-[var(--superficie)] shadow-[0_0_0_1px_var(--borde)]", phone === "card" ? "mx-4" : "")}>{body}</div>
    </section>;
  }

  // «Criterio · Formularios» (.caja2) y tableros Configuración y Página pública (.w-caja): la caja de un formulario lleva
  // borde y 12 de radio, sin sombra; la sombra suave es de las tablas (Surface).
  return <div className="overflow-hidden rounded-[0.75rem] border border-[var(--borde)] bg-[var(--superficie)]">
    <section aria-labelledby={id} aria-describedby={describedBy}>
      {/* «Criterio · Tablas» (.lista .cab) y tableros Cuenta, Usuario y Configuración (.w-cab): 16 a la izquierda y 4 a la
          derecha, con el botón chico a 4 del borde; lo que cuenta la caja, a 16 (4 y 12 suyos). */}
      <header className="flex min-h-10 items-center justify-between gap-3 border-b border-[var(--borde-cab)] bg-[var(--cab)] pr-1 pl-4 text-[0.8125rem] font-semibold text-[var(--t1)]">
        {titled(<h2 id={id}>{title}</h2>)}
        {/* Tablero Rol (.w-cab > span): lo que cuenta la caja, en 13 y peso 500, gris claro. */}
        {meta ? <span className="pr-3 text-[0.8125rem] font-medium text-[var(--t3)]">{meta}</span> : null}
        {action ? <Button type="button" variant="outline" size="sm" onClick={action.onClick} disabled={action.disabled} disabledReason={action.disabledReason}><Plus aria-hidden="true" className="size-3.5" strokeWidth={2.25} />{action.label}</Button> : null}
      </header>
      {body}
    </section>
  </div>;
}

/// Los campos de una caja de formulario («Criterio · Formularios», «Adentro de la caja»): en la compu, 16 arriba y 20 a
/// los costados y abajo. En el teléfono, 14 arriba y abajo y 16 a los costados en una tarjeta, o nada si los campos van
/// sueltos (`untitled`). El orden de los campos y su separación los pone quien la usa (`className`).
export function SectionFields({ className, children }: { className?: string; children: ReactNode }) {
  const { phone } = useAppChrome();
  const mode = useContext(SectionPhoneContext);
  return <div className={cn(phone ? (mode === "untitled" ? "p-0" : "px-4 py-3.5") : "px-5 pt-4 pb-5", className)}>{children}</div>;
}
