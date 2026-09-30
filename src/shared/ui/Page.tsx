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
  children,
  bodyClassName = "p-4 md:p-6",
}: PageProps): ReactNode {
  const visibleMoreActions = moreActions?.items.filter((action) => !action.hidden) ?? [];
  const regularActions = visibleMoreActions.filter((action) => !action.destructive);
  const destructiveActions = visibleMoreActions.filter((action) => action.destructive);

  return (
    <>
      <header className="sticky top-0 z-20 flex min-h-16 items-center justify-between gap-4 border-b border-[var(--borde)] bg-[var(--lado-activo)] px-4 py-3 md:px-6">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          {backTo ? (
            <Link
              to={backTo.to}
              aria-label={backTo.label}
              title={backTo.label}
              className="inline-flex size-11 shrink-0 items-center justify-center rounded-[7px] border border-[var(--borde)] text-[var(--t2)] hover:bg-[var(--s2)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--foco)] md:size-8"
            >
              <ChevronLeftIcon className="size-4" />
            </Link>
          ) : Icon ? (
            <span aria-hidden="true" className="inline-flex size-9 shrink-0 items-center justify-center rounded-[10px] bg-[var(--marca-t)] text-[var(--marca-tx)]">
              <Icon className="size-5" />
            </span>
          ) : null}
          <div className="min-w-0">
            <div className="flex min-w-0 items-center gap-2">
              <h1 className="truncate text-[18px] font-bold leading-tight text-[var(--t1)]">{title}</h1>
              {status ? <span className="flex shrink-0 items-center gap-2">{status}</span> : null}
            </div>
            {summary === null || summary === undefined ? null : (
              <p className="truncate text-[13px] text-[var(--t2)]">{summary}</p>
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
                    className="inline-flex size-11 items-center justify-center rounded-[8px] border border-[var(--borde)] text-[var(--t2)] hover:bg-[var(--s2)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--foco)] md:size-[34px]"
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
      <div className={bodyClassName}>{children}</div>
    </>
  );
}
