import { useRef, useState, type ComponentType, type ReactNode } from "react";
import { Link } from "react-router";
import { cn } from "@/shared/lib/utils";
import { AppBar, AppIconButton } from "./app/AppBar";
import { useAppChrome } from "./app/AppChrome";
import { AppBarToolsProvider } from "./app/AppBarTools";
import { Fab } from "./app/Fab";
import { FixedActions } from "./app/FixedActions";
import { Button } from "./button";
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
  /** Recibe el ⋮ de la banda: un diálogo que se abre desde acá le devuelve el foco al cerrar (la opción se va con el menú). */
  onSelect: (trigger: HTMLButtonElement | null) => void;
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
  /** Ir a algo que vive afuera («Ver página»): en la compu, la primera de las acciones; en el teléfono, texto en la barra. */
  barAction?: { label: string; href?: string; onClick?: () => void };
  moreActions?: { label: string; items: readonly PageOverflowAction[] };
  /** Un cartel de algo que sigue pasando (tablero «Criterio · Avisos»): debajo de la banda, arriba del contenido. */
  banner?: ReactNode;
  /** Las pestañas: en la compu abren el contenido, debajo de la banda (tablero Empresa); en el teléfono, en su banda blanca. */
  tabs?: ReactNode;
  children: ReactNode;
  bodyClassName?: string;
  /** En el teléfono, lo que dice debajo del título si no es el camino ni la organización (el correo de una persona). */
  phoneSubtitle?: ReactNode;
  /** En el teléfono, crear algo nuevo es un «+» flotante en lugar de la acción principal de la banda. */
  fab?: { label: string; onClick?: () => void; to?: string };
  /** En el teléfono: `padded` con margen de 20, `flush` para listas de borde a borde, `gray` para grupos de ajustes. */
  phoneBody?: "padded" | "flush" | "gray";
}

const phoneBodyClasses = {
  padded: "flex flex-1 flex-col gap-4 px-5 pt-2 pb-6 text-[15px]",
  flush: "flex flex-1 flex-col text-[15px]",
  gray: "flex flex-1 flex-col pb-6 text-[15px]",
} as const;

// Tableros M-* (.ap-txt): una acción en texto petróleo a la derecha de la barra.
const barTextClass = "inline-flex h-10 shrink-0 items-center px-2.5 text-[15.5px] font-semibold text-[var(--marca-tx)] focus-visible:outline-2 focus-visible:outline-[var(--foco)]";

/// Banda de ancho completo y cuerpo con su propio margen. Las acciones adicionales se pasan ya
/// traducidas y van en el menú ⋮; la principal queda a la derecha.
export function Page({
  icon: Icon,
  title,
  summary,
  backTo,
  status,
  actions,
  barAction,
  moreActions,
  banner,
  tabs,
  children,
  bodyClassName = "flex flex-col gap-3.5 p-4 text-[13px] lg:px-6 lg:py-5",
  phoneSubtitle,
  fab,
  phoneBody = "padded",
}: PageProps): ReactNode {
  const chrome = useAppChrome();
  const [tools, setTools] = useState<HTMLDivElement | null>(null);
  const moreTrigger = useRef<HTMLButtonElement>(null);
  const visibleMoreActions = moreActions?.items.filter((action) => !action.hidden) ?? [];
  const regularActions = visibleMoreActions.filter((action) => !action.destructive);
  const destructiveActions = visibleMoreActions.filter((action) => action.destructive);
  const moreMenuItems = <>
    {regularActions.map((action) => (
      <DropdownMenuItem key={action.label} onSelect={() => action.onSelect(moreTrigger.current)}>
        {action.label}
      </DropdownMenuItem>
    ))}
    {regularActions.length > 0 && destructiveActions.length > 0 ? <DropdownMenuSeparator /> : null}
    {destructiveActions.map((action) => (
      <DropdownMenuItem key={action.label} variant="destructive" onSelect={() => action.onSelect(moreTrigger.current)}>
        {action.label}
      </DropdownMenuItem>
    ))}
  </>;

  // Tableros M-* («Criterio · Marco»): en el teléfono la pantalla es de una app. Arriba, ‹ (si es una ficha o se
  // llega desde «Más») con el título y el camino; el ⋮ en la barra; crear es un «+» flotante y guardar va fijo abajo.
  if (chrome.phone) {
    const back = backTo ?? chrome.parent ?? undefined;
    return <div className={cn("flex min-h-full flex-col", phoneBody === "gray" ? "bg-[var(--s2)]" : "bg-[var(--lado-activo)]")}>
      <AppBar title={title} back={back} subtitle={phoneSubtitle ?? status ?? chrome.subtitle ?? undefined}
        actions={<>
          <div ref={setTools} className="flex items-center" />
          {barAction ? barAction.href
            ? <a href={barAction.href} target="_blank" rel="noreferrer" className={barTextClass}>{barAction.label}</a>
            : <button type="button" onClick={barAction.onClick} className={barTextClass}>{barAction.label}</button> : null}
          {visibleMoreActions.length > 0 && moreActions ? <DropdownMenu>
            <DropdownMenuTrigger asChild><AppIconButton ref={moreTrigger} label={moreActions.label}><MoreVerticalIcon /></AppIconButton></DropdownMenuTrigger>
            <DropdownMenuContent align="end">{moreMenuItems}</DropdownMenuContent>
          </DropdownMenu> : null}
        </>} />
      {tabs ? <div data-slot="page-tabs" className="border-b border-[var(--borde)] bg-[var(--lado-activo)]">{tabs}</div> : null}
      {banner}
      <AppBarToolsProvider value={tools}><div className={phoneBodyClasses[phoneBody]}>{children}</div></AppBarToolsProvider>
      {fab ? <Fab label={fab.label} onClick={fab.onClick} to={fab.to} /> : actions ? <FixedActions>{actions}</FixedActions> : null}
    </div>;
  }

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
              status ? <p data-slot="page-subline" className="mt-0.5 truncate text-[13px] text-[var(--t2)]">{status}</p> : null
            ) : (
              // Tableros Usuario y Rol: el estado va primero; después, el resumen.
              <p data-slot="page-subline" className="mt-0.5 flex min-w-0 items-center gap-1 text-[13px] text-[var(--t2)]">
                {status ? <><span className="shrink-0">{status}</span><span aria-hidden="true">{"·"}</span></> : null}
                <span className="truncate">{summary}</span>
              </p>
            )}
          </div>
        </div>
        {visibleMoreActions.length > 0 || actions || barAction ? (
          <div className="flex shrink-0 items-center gap-2">
            {visibleMoreActions.length > 0 && moreActions ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    ref={moreTrigger}
                    type="button"
                    aria-label={moreActions.label}
                    title={moreActions.label}
                    className="inline-flex size-[34px] items-center justify-center rounded-[8px] border border-[var(--borde)] bg-[var(--lado-activo)] text-[var(--t2)] hover:bg-[var(--s2)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--foco)]"
                  >
                    <MoreVerticalIcon className="size-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">{moreMenuItems}</DropdownMenuContent>
              </DropdownMenu>
            ) : null}
            {barAction ? barAction.href
              ? <Button type="button" variant="outline" asChild><a href={barAction.href} target="_blank" rel="noreferrer">{barAction.label}</a></Button>
              : <Button type="button" variant="outline" onClick={barAction.onClick}>{barAction.label}</Button> : null}
            {actions ? <span className="flex shrink-0 items-center gap-2">{actions}</span> : null}
          </div>
        ) : null}
      </header>
      {/* Tableros Empresa, Organizacion y Cuenta-Plat: las pestañas abren el contenido, dentro de su margen, con la línea
          a lo ancho del contenido y 16 hasta lo de abajo. */}
      <div className={bodyClassName}>{banner}{tabs ? <div className="flex min-w-0 flex-col">
        <div data-slot="page-tabs" className="border-b border-[var(--borde)] px-1 [&>[role=tablist]]:-mb-px">{tabs}</div>
        <div className="pt-4">{children}</div>
      </div> : children}</div>
    </>
  );
}
