import type { ComponentType, ReactNode } from "react";
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
  onSelect: () => void;
  destructive?: boolean;
  hidden?: boolean;
}

/// El nombre del disparador incluye el dato de la fila: "Acciones de Tomás Acosta".
/// Las opciones sin permiso se omiten y las destructivas quedan separadas al final.
export function RowActions({ label, actions }: { label: string; actions: readonly RowAction[] }): ReactNode {
  const visible = actions.filter((action) => !action.hidden);
  if (visible.length === 0) return null;

  const regular = visible.filter((action) => !action.destructive);
  const destructive = visible.filter((action) => action.destructive);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={label}
          title={label}
          className="inline-flex size-11 items-center justify-center rounded-[8px] border border-[var(--borde)] bg-[var(--lado-activo)] text-[var(--t2)] hover:bg-[var(--s2)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--foco)] md:size-8"
        >
          <MoreVerticalIcon className="size-[18px]" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {regular.map((action, index) => {
          const Icon = action.icon;
          return (
            <DropdownMenuItem key={index} aria-label={action.accessibleName} onSelect={action.onSelect}>
              <Icon className="size-4" />
              {action.label}
            </DropdownMenuItem>
          );
        })}
        {regular.length > 0 && destructive.length > 0 ? <DropdownMenuSeparator /> : null}
        {destructive.map((action, index) => {
          const Icon = action.icon;
          return (
            <DropdownMenuItem key={index} aria-label={action.accessibleName} variant="destructive" onSelect={action.onSelect}>
              <Icon className="size-4" />
              {action.label}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
