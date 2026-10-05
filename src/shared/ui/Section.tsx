import { Plus } from "lucide-react";
import { createContext, useContext, useId, type ReactNode } from "react";
import { cn } from "@/shared/lib/utils";
import { useAppChrome } from "./app/AppChrome";
import { Button } from "./button";
import { Surface } from "./Surface";

type SectionPhone = "card" | "inset" | "untitled";

interface SectionProps {
  title: string;
  /** A lo sumo una acción chica: «Agregar dominio», «Sumar empresa». */
  action?: { label: string; onClick: () => void; disabled?: boolean };
  /** Lo que cuenta la caja, en gris a la derecha del título: «1 de 2 elegidos». */
  meta?: ReactNode;
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
export function Section({ title, action, meta, phone = "card", children }: SectionProps) {
  const id = useId();
  const chrome = useAppChrome();
  const body = <SectionPhoneContext.Provider value={phone}>{children}</SectionPhoneContext.Provider>;

  if (chrome.phone) {
    if (phone === "untitled") return <section aria-labelledby={id} className="flex flex-col">
      <h2 id={id} className="sr-only">{title}</h2>
      {body}
    </section>;
    return <section aria-labelledby={id} className="flex flex-col">
      <div className={cn("mb-2 flex items-center justify-between gap-3 leading-[normal]", phone === "card" ? "mx-5 mt-[18px]" : "mt-1.5")}>
        <h2 id={id} className="text-[13.5px] font-semibold text-[var(--t2)]">{title}</h2>
        {meta ? <span className="text-[13.5px] text-[var(--t3)]">{meta}</span> : null}
        {action ? <button type="button" onClick={action.onClick} disabled={action.disabled}
          className="text-[14.5px] font-semibold text-[var(--marca-tx)] disabled:opacity-45">{action.label}</button> : null}
      </div>
      <div className={cn("overflow-hidden rounded-[14px] bg-[var(--lado-activo)] shadow-[0_0_0_1px_var(--borde)]", phone === "card" ? "mx-4" : "")}>{body}</div>
    </section>;
  }

  return <Surface className="overflow-hidden">
    <section aria-labelledby={id}>
      <header className="flex min-h-10 items-center justify-between gap-3 border-b border-[var(--borde)] bg-[var(--cab)] px-4 text-[13px] font-semibold text-[var(--t1)]">
        <h2 id={id}>{title}</h2>
        {meta ? <span className="text-[12px] font-normal text-[var(--t3)]">{meta}</span> : null}
        {action ? <Button type="button" variant="outline" size="sm" onClick={action.onClick} disabled={action.disabled}><Plus aria-hidden="true" className="size-3.5" strokeWidth={2.25} />{action.label}</Button> : null}
      </header>
      {body}
    </section>
  </Surface>;
}

/// Los campos de una caja de formulario («Criterio · Formularios», «Adentro de la caja»): en la compu, 16 arriba y 20 a
/// los costados y abajo. En el teléfono, 14 arriba y abajo y 16 a los costados en una tarjeta, o nada si los campos van
/// sueltos (`untitled`). El orden de los campos y su separación los pone quien la usa (`className`).
export function SectionFields({ className, children }: { className?: string; children: ReactNode }) {
  const { phone } = useAppChrome();
  const mode = useContext(SectionPhoneContext);
  return <div className={cn(phone ? (mode === "untitled" ? "p-0" : "px-4 py-3.5") : "px-5 pt-4 pb-5", className)}>{children}</div>;
}
