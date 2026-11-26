import type { ReactNode } from "react";
import { Link } from "react-router";
import { cn } from "@/shared/lib/utils";
import { Avatar } from "../Avatar";
import { PhoneIcon } from "../icons";

// Tableros M-* (.ap-fila): filas de borde a borde con hasta tres líneas, con la altura normal de la letra; la línea fina
// de abajo arranca donde empieza el texto si hay un círculo a la izquierda. Un texto largo baja de renglón y la fila crece,
// sin «…» (174). A la derecha del nombre, un dato chico
// («1 usuario», «27/09 10:42»). El ⋮ va solo si la fila tiene acciones; tocar la fila abre su ficha. Con el círculo de
// una persona (M-Usuarios y M-Empresa, .w-conv), el círculo va arriba, el correo en gris claro y la tercera línea en 12,5.
export function ListRow({ leading, title, meta, lines = [], trailing, to, onClick, className }: {
  leading?: ReactNode;
  title: ReactNode;
  meta?: ReactNode;
  lines?: readonly ReactNode[];
  trailing?: ReactNode;
  to?: string;
  onClick?: () => void;
  className?: string;
}) {
  const person = Boolean(leading);
  const body = <>
    {leading}
    <span className="flex min-w-0 flex-1 flex-col gap-0.5 pr-2.5 leading-[normal]">
      {/* Por debajo de 360 (el teléfono de 320), el dato de la derecha baja debajo del título: si no, lo aprieta y lo corta. */}
      <span className="flex items-start justify-between gap-2 max-[22.5rem]:flex-col max-[22.5rem]:gap-0.5">
        <span className="min-w-0 flex-1 text-[0.96875rem] font-medium text-[var(--t1)] [overflow-wrap:anywhere]">{title}</span>
        {meta ? <span className="shrink-0 pt-0.5 text-[0.78125rem] text-[var(--t3)]">{meta}</span> : null}
      </span>
      {lines[0] ? <span className={cn("min-w-0 text-[0.875rem] [overflow-wrap:anywhere]", person ? "text-[var(--t3)]" : "text-[var(--t2)]")}>{lines[0]}</span> : null}
      {lines[1] ? <span className={cn("min-w-0 text-[var(--t3)] [overflow-wrap:anywhere]", person ? "text-[0.78125rem]" : "text-[0.8125rem]")}>{lines[1]}</span> : null}
    </span>
  </>;
  const bodyClass = cn("flex min-w-0 flex-1 gap-3.5 text-left", person ? "items-start" : "items-center");
  // Tableros M-Roles y M-Empresas (.ap-fila .ap-ib): en una fila sin círculo, el ⋮ va gris y 4 más afuera, a 14 del texto
  // (que guarda 10 más suyos: «1 usuario» queda a 24 del ⋮). En la de una persona (.w-conv) el texto llega a 14 del ⋮ con
  // esos 10 suyos.
  return <li className={cn("relative flex items-center gap-1 py-3 pr-1.5 pl-4 after:absolute after:right-0 after:bottom-0 after:h-px after:bg-[var(--borde)]",
    leading ? "after:left-18.5" : "gap-3.5 after:left-4 [&>[data-slot=row-actions]]:-mr-1 [&>[data-slot=row-actions]]:text-[var(--t2)]", className)}>
    {to ? <Link to={to} className={bodyClass}>{body}</Link>
      : onClick ? <button type="button" onClick={onClick} className={bodyClass}>{body}</button>
        : <span className={bodyClass}>{body}</span>}
    {trailing}
  </li>;
}

export interface ListCardField {
  /** El nombre del dato, el mismo que el encabezado de su columna en la compu. */
  label: string;
  value: ReactNode;
  /** Un dato largo (una fecha y hora, un motivo, varias personas) ocupa las dos columnas. */
  wide?: boolean;
}

// Tableros M-Filas-Base2, M-Usuarios-Base2 y Criterio-Tablas-Base2 (.b2-tj, 263): en el teléfono, la fila de una lista es una
// tarjeta con el nombre en 16 y cada dato con su nombre, de a dos, sin datos unidos con «·» debajo del nombre. Si son muchos,
// lleva menos: los que se leen en la lista. El ⋮ va arriba a la derecha, con 44 para tocar; tocar la tarjeta abre su ficha.
// Debajo de 360 (a 320 no hay tablero propio) los datos van de a uno: de a dos, cada uno tenía unos 91 px y una palabra
// larga («Administrador») se partía al medio.
export function ListCard({ leading, title, fields, trailing, to, onClick, className }: {
  leading?: ReactNode;
  title: ReactNode;
  fields: readonly ListCardField[];
  trailing?: ReactNode;
  to?: string;
  onClick?: () => void;
  className?: string;
}) {
  const body = <>
    {leading ? <span className="shrink-0">{leading}</span> : null}
    <span className="flex min-w-0 flex-1 flex-col">
      <span className="text-base leading-[1.3] font-semibold text-[var(--t1)] [overflow-wrap:anywhere]">{title}</span>
      {fields.length > 0 ? <dl className="m-0 mt-2 grid grid-cols-2 gap-x-3.5 gap-y-2 max-[22.5rem]:grid-cols-1">
        {fields.map((field) => <div key={field.label} className={cn("min-w-0", field.wide && "col-span-2 max-[22.5rem]:col-span-1")}>
          <dt className="text-[0.78125rem] leading-[1.3] text-[var(--t2)]">{field.label}</dt>
          <dd className="m-0 text-[0.90625rem] leading-[1.35] text-[var(--t1)] [overflow-wrap:anywhere]">{field.value}</dd>
        </div>)}
      </dl> : null}
    </span>
  </>;
  const bodyClass = "flex min-w-0 gap-3.5 text-left";
  return <li className={cn("relative border-b border-[var(--borde)] bg-[var(--superficie)] py-3 pr-13 pl-4", className)}>
    {to ? <Link to={to} className={bodyClass}>{body}</Link>
      : onClick ? <button type="button" onClick={onClick} className={cn(bodyClass, "w-full")}>{body}</button>
        : <span className={bodyClass}>{body}</span>}
    {trailing ? <span className="absolute top-1 right-1 inline-flex [&>[data-slot=row-actions]]:text-[var(--t2)]">{trailing}</span> : null}
  </li>;
}

/// El cuadrado de una persona en una fila (`Avatar`, en la marca); una invitación sin nombre, en gris: «@» si es por correo
/// y el teléfono si es por teléfono (M-Usuarios).
export function RowAvatar({ name, invitation, phone }: { name: string; invitation?: boolean; phone?: boolean }) {
  if (invitation && phone) return <Avatar size="row" muted initials="" icon={<PhoneIcon className="size-5" />} />;
  return <Avatar size="row" muted={invitation} initials={invitation ? "@" : name.trim().charAt(0).toUpperCase()} />;
}
