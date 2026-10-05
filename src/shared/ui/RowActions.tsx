import { useRef, useState, type ComponentType, type ReactNode } from "react";
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
}

/// El nombre del disparador incluye el dato de la fila: "Acciones de Tomás Acosta".
/// Las opciones sin permiso se omiten y las destructivas quedan separadas al final. En el teléfono, el ⋮ abre una hoja
/// desde abajo con el dato de la fila (`title`, por ejemplo «Sofía Herrera») de título.
export function RowActions({ label, title, actions }: { label: string; title?: string; actions: readonly RowAction[] }): ReactNode {
  const trigger = useRef<HTMLButtonElement>(null);
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
    className="inline-flex size-8 items-center justify-center rounded-[8px] max-md:size-11 max-md:rounded-full max-md:text-[var(--t2)] border border-transparent bg-transparent text-[var(--t3)] hover:border-[var(--borde)] hover:bg-[var(--lado-activo)] hover:text-[var(--t1)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--foco)]"
  >
    <MoreVerticalIcon className="size-[18px]" />
  </button>;

  if (phone) return <>
    {button}
    <PhoneActionsSheet open={sheetOpen} onOpenChange={setSheetOpen} label={label} title={title ?? label} regular={regular} destructive={destructive}
      onSelect={(action) => { setSheetOpen(false); action.onSelect(trigger.current); }} />
  </>;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>{button}</DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {regular.map((action, index) => {
          const Icon = action.icon;
          return (
            <DropdownMenuItem key={index} aria-label={action.accessibleName} onSelect={() => action.onSelect(trigger.current)}>
              <Icon className="size-4" />
              {action.label}
            </DropdownMenuItem>
          );
        })}
        {regular.length > 0 && destructive.length > 0 ? <DropdownMenuSeparator /> : null}
        {destructive.map((action, index) => {
          const Icon = action.icon;
          return (
            <DropdownMenuItem key={index} aria-label={action.accessibleName} variant="destructive" onSelect={() => action.onSelect(trigger.current)}>
              <Icon className="size-4" />
              {action.label}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/// Tableros M-Empresa («Invitación: acciones») y M-Cuenta-Metodo (.ap-hoja .ap-acciones): en el teléfono el ⋮ abre una hoja
/// desde abajo, con el dato de la fila de título y sin ✕; cada opción mide 54, con letra de 16,5 y una línea entre ellas; las
/// de peligro van al final, en rojo, después de una franja gris. Un toque afuera la cierra, como un menú.
function PhoneActionsSheet({ open, onOpenChange, label, title, regular, destructive, onSelect }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  label: string;
  title: string;
  regular: readonly RowAction[];
  destructive: readonly RowAction[];
  onSelect: (action: RowAction) => void;
}) {
  const option = (action: RowAction, danger: boolean) => <button key={action.label} type="button" role="menuitem" aria-label={action.accessibleName}
    onClick={() => onSelect(action)}
    className={cn("flex min-h-[54px] w-full items-center border-t border-[var(--borde)] px-5 text-left text-[16.5px] first:border-t-0 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[var(--foco)]",
      danger ? "text-[var(--peligro)]" : "text-[var(--t1)]")}>{action.label}</button>;
  return <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent size="sm" showCloseButton={false} aria-describedby={undefined} onInteractOutside={() => onOpenChange(false)}>
      <DialogHeader><DialogTitle>{title}</DialogTitle></DialogHeader>
      <div role="menu" aria-label={label} className="flex flex-col pb-[calc(34px+env(safe-area-inset-bottom))]">
        {regular.map((action) => option(action, false))}
        {regular.length > 0 && destructive.length > 0 ? <div role="separator" className="h-2 border-t border-[var(--borde)] bg-[var(--s2)]" /> : null}
        {destructive.map((action) => option(action, true))}
      </div>
    </DialogContent>
  </Dialog>;
}
