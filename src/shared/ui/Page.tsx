import type { ComponentType, ReactNode } from "react";
import { Link } from "react-router";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./dropdown-menu";
import { ChevronLeftIcon, MoreVerticalIcon } from "./icons";

export interface PageOverflowAction {
  label: string;
  onSelect: () => void;
  destructive?: boolean;
  hidden?: boolean;
}

interface PageProps {
  icon?: ComponentType<{ className?: string }>;
  title: string;
  summary?: ReactNode;
  backTo?: { to: string; label: string };
  status?: ReactNode;
  actions?: ReactNode;
  moreActions?: { label: string; items: readonly PageOverflowAction[] };
  /** Un cartel de algo que sigue pasando (tablero «Criterio · Avisos»): debajo de la banda, arriba del contenido. */
  banner?: ReactNode;
  children: ReactNode;
  bodyClassName?: string;
}

/// Banda de ancho completo y cuerpo con su propio margen. Las acciones adicionales se pasan ya
/// traducidas y van en el menú ⋮; la principal queda a la derecha.
export function Page({
  icon: Icon,
  title,
  summary,
  backTo,
  status,
  actions,
  moreActions,
  banner,
  children,
  bodyClassName = "flex flex-col gap-3.5 p-4 text-[13px] lg:px-6 lg:py-5",
}: PageProps): ReactNode {
  const visibleMoreActions = moreActions?.items.filter((action) => !action.hidden) ?? [];
  const regularActions = visibleMoreActions.filter((action) => !action.destructive);
  const destructiveActions = visibleMoreActions.filter((action) => action.destructive);

  return (
    <>
      <header className="flex min-h-16 flex-wrap items-center justify-between gap-4 border-b border-[var(--borde)] bg-[var(--lado-activo)] px-4 py-3 md:flex-nowrap md:px-6">
        <div className="flex min-w-0 flex-[1_1_12rem] items-center gap-3 md:flex-1">
          {backTo ? (
            <Link
              to={backTo.to}
              aria-label={backTo.label}
              title={backTo.label}
              className="inline-flex size-7 shrink-0 items-center justify-center rounded-[7px] border border-[var(--borde)] text-[var(--t2)] hover:bg-[var(--s2)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--foco)]"
            >
              <ChevronLeftIcon className="size-4" />
            </Link>
          ) : Icon ? (
            <span aria-hidden="true" className="inline-flex size-9 shrink-0 items-center justify-center rounded-[10px] bg-[var(--marca-t)] text-[var(--marca-tx)]">
              <Icon className="size-5" />
            </span>
          ) : null}
          <div className="min-w-0">
            <h1 className="truncate text-[18px] font-bold leading-tight tracking-[-0.015em] text-[var(--t1)]">{title}</h1>
            {summary === null || summary === undefined ? (
              status ? <p data-slot="page-subline" className="truncate text-[13px] text-[var(--t2)]">{status}</p> : null
            ) : (
              // Tableros Usuario y Rol: el estado va primero; después, el resumen.
              <p data-slot="page-subline" className="flex min-w-0 items-center gap-1 text-[13px] text-[var(--t2)]">
                {status ? <><span className="shrink-0">{status}</span><span aria-hidden="true">{"·"}</span></> : null}
                <span className="truncate">{summary}</span>
              </p>
            )}
          </div>
        </div>
        {visibleMoreActions.length > 0 || actions ? (
          <div className="flex shrink-0 items-center gap-2">
            {visibleMoreActions.length > 0 && moreActions ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    aria-label={moreActions.label}
                    title={moreActions.label}
                    className="inline-flex size-[34px] items-center justify-center rounded-[8px] border border-[var(--borde)] bg-[var(--lado-activo)] text-[var(--t2)] hover:bg-[var(--s2)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--foco)]"
                  >
                    <MoreVerticalIcon className="size-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {regularActions.map((action) => (
                    <DropdownMenuItem key={action.label} onSelect={action.onSelect}>
                      {action.label}
                    </DropdownMenuItem>
                  ))}
                  {regularActions.length > 0 && destructiveActions.length > 0 ? <DropdownMenuSeparator /> : null}
                  {destructiveActions.map((action) => (
                    <DropdownMenuItem key={action.label} variant="destructive" onSelect={action.onSelect}>
                      {action.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            ) : null}
            {actions ? <span className="flex shrink-0 items-center gap-2">{actions}</span> : null}
          </div>
        ) : null}
      </header>
      <div className={bodyClassName}>{banner}{children}</div>
    </>
  );
}
