import { useId, useRef, useState, type ComponentType, type ReactNode } from "react";
import { cn } from "@/shared/lib/utils";
import { useAppChrome } from "./app/AppChrome";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./dropdown-menu";
import { MoreVerticalIcon } from "./icons";

export interface RowAction {
  label: string;
  accessibleName: string;
  icon: ComponentType<{ className?: string }>;
  /** Recibe el ⋮ de la fila: un diálogo que se abre desde acá le devuelve el foco al cerrar (la opción se va con el menú). */
  onSelect: (trigger: HTMLButtonElement | null) => void;
  destructive?: boolean;
  hidden?: boolean;
  /** Por qué no se puede usar ahora, cuando se puede resolver: la opción va apagada y con el motivo debajo, en gris
   *  («Criterio · Menús», decisión del 2026-10-13). */
  disabledReason?: string;
}

/// El nombre del disparador incluye el dato de la fila: "Acciones de Tomás Acosta".
/// Las opciones sin permiso se omiten y las destructivas quedan separadas al final. En el teléfono, el ⋮ abre una hoja
/// desde abajo con el dato de la fila (`title`, por ejemplo «Sofía Herrera») de título.
export function RowActions({ label, title, actions }: { label: string; title?: string; actions: readonly RowAction[] }): ReactNode {
  const trigger = useRef<HTMLButtonElement>(null);
  const reasonId = useId();
  const [sheetOpen, setSheetOpen] = useState(false);
  const { phone } = useAppChrome();
  const visible = actions.filter((action) => !action.hidden);
  if (visible.length === 0) return null;

  const regular = visible.filter((action) => !action.destructive);
  const destructive = visible.filter((action) => action.destructive);
  const button = <button
    ref={trigger}
    type="button"
    aria-label={label}
    title={label}
    aria-haspopup={phone ? "dialog" : undefined}
    aria-expanded={phone ? sheetOpen : undefined}
    onClick={phone ? () => setSheetOpen(true) : undefined}
    data-slot="row-actions"
    // En el teléfono (tableros M-Usuarios, M-Empresa y M-Configuracion, .ap-ib): el ⋮ de 20, casi negro, en un botón de 44;
    // en una fila sin círculo (M-Roles, M-Empresas), ListRow lo pasa a gris.
    className="inline-flex size-8 items-center justify-center rounded-[8px] max-md:size-11 max-md:rounded-full max-md:text-[var(--t1)] border border-transparent bg-transparent text-[var(--t3)] hover:border-[var(--borde)] hover:bg-[var(--lado-activo)] hover:text-[var(--t1)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--foco)]"
  >
    <MoreVerticalIcon className="size-[18px] max-md:size-5" />
  </button>;

  // Apagada, la opción sigue en el recorrido del teclado para que se lea su motivo, pero no hace nada ni cierra el menú.
  const menuItem = (action: RowAction, id: string, danger: boolean) => {
    const Icon = action.icon;
    const off = action.disabledReason !== undefined;
    return (
      <DropdownMenuItem key={id} aria-label={action.accessibleName} variant={danger && !off ? "destructive" : "default"}
        aria-disabled={off || undefined} aria-describedby={off ? id : undefined}
        className={off ? "flex-col items-start gap-0.5 text-[var(--t3)] focus:bg-transparent focus:text-[var(--t3)] [&_svg:not([class*='text-'])]:text-[var(--t3)]" : undefined}
        onSelect={(event) => { if (off) event.preventDefault(); else action.onSelect(trigger.current); }}>
        <span className="inline-flex items-center gap-2"><Icon className="size-4" />{action.label}</span>
        {off ? <span id={id} className="pl-6 text-[12px] leading-[1.35] whitespace-normal">{action.disabledReason}</span> : null}
      </DropdownMenuItem>
    );
  };

  if (phone) return <>
    {button}
    <PhoneActionsSheet open={sheetOpen} onOpenChange={setSheetOpen} label={label} title={title ?? label} regular={regular} destructive={destructive} reasonId={reasonId}
      onSelect={(action) => { setSheetOpen(false); action.onSelect(trigger.current); }} />
  </>;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{button}</DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {regular.map((action, index) => menuItem(action, `${reasonId}-r${index}`, false))}
        {regular.length > 0 && destructive.length > 0 ? <DropdownMenuSeparator /> : null}
        {destructive.map((action, index) => menuItem(action, `${reasonId}-d${index}`, true))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** Lo que la hoja del teléfono necesita de una opción: su texto y, si va apagada, su motivo. */
export type PhoneSheetAction = Pick<RowAction, "label" | "accessibleName" | "disabledReason">;

/// Tableros M-Empresa («Invitación: acciones»), M-Cuenta-Metodo y M-Cuenta-Plat («Operador: acciones») (.ap-hoja
/// .ap-acciones): en el teléfono el ⋮ abre una hoja desde abajo, con el dato de la fila o de la ficha de título y sin ✕;
/// cada opción mide 54, con letra de 16,5 y una línea entre ellas; las de peligro van al final, en rojo, después de una
/// franja gris. Un toque afuera la cierra, como un menú. La usan RowActions y el ⋮ de la barra de una ficha (Page).
export function PhoneActionsSheet<T extends PhoneSheetAction>({ open, onOpenChange, label, title, regular, destructive, reasonId, onSelect }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  label: string;
  title: string;
  regular: readonly T[];
  destructive: readonly T[];
  reasonId: string;
  onSelect: (action: T) => void;
}) {
  // Tablero M-WA-Chats-Formulario (.ap-menu span.off): apagada, en gris y con el motivo debajo, de 13.
  const option = (action: T, danger: boolean, id: string) => {
    const off = action.disabledReason !== undefined;
    return <button key={action.label} type="button" role="menuitem" aria-label={action.accessibleName}
      aria-disabled={off || undefined} aria-describedby={off ? id : undefined}
      onClick={off ? undefined : () => onSelect(action)}
      className={cn("flex min-h-[54px] w-full items-center border-t border-[var(--borde)] px-5 text-left text-[16.5px] first:border-t-0 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[var(--foco)]",
        off ? "cursor-default flex-col items-start justify-center gap-0.5 py-2.5 text-[var(--t3)]" : danger ? "text-[var(--peligro)]" : "text-[var(--t1)]")}>
      {action.label}
      {off ? <span id={id} className="text-[13px] leading-[1.35]">{action.disabledReason}</span> : null}
    </button>;
  };
  return <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent size="sm" showCloseButton={false} aria-describedby={undefined} onInteractOutside={() => onOpenChange(false)}>
      <DialogHeader><DialogTitle>{title}</DialogTitle></DialogHeader>
      <div role="menu" aria-label={label} className="flex flex-col pb-[calc(34px+env(safe-area-inset-bottom))]">
        {regular.map((action, index) => option(action, false, `${reasonId}-r${index}`))}
        {regular.length > 0 && destructive.length > 0 ? <div role="separator" className="h-2 border-t border-[var(--borde)] bg-[var(--s2)]" /> : null}
        {destructive.map((action, index) => option(action, true, `${reasonId}-d${index}`))}
      </div>
    </DialogContent>
  </Dialog>;
}
