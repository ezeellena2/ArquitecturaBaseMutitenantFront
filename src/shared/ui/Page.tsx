import { useEffect, useRef, useState, type ComponentType, type ReactNode } from "react";
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
import { TabCount, Tabs, TabsContent, TabsList, TabsTrigger } from "./tabs";

export interface PageOverflowAction {
  label: string;
  /** Recibe el ⋮ de la banda: un diálogo que se abre desde acá le devuelve el foco al cerrar (la opción se va con el menú). */
  onSelect: (trigger: HTMLButtonElement | null) => void;
  destructive?: boolean;
  hidden?: boolean;
}

/** Un grupo de datos de una ficha: su pestaña y su contenido. */
export interface PageTab {
  value: string;
  label: string;
  /** La cantidad, en gris al lado del nombre. */
  count?: ReactNode;
  content: ReactNode;
  /** Las clases del contenido del grupo. */
  className?: string;
  /** Un grupo que quien mira no puede ver (por permiso). */
  hidden?: boolean;
}

/** Los grupos de datos de una ficha y el que está abierto. */
export interface PageTabs {
  /** El nombre de la barra de pestañas para el lector de pantalla. */
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  items: readonly PageTab[];
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
  /** Los grupos de datos de una ficha («Criterio · Marco», Pestañas). Con dos o más, una pestaña por grupo: en la compu
   * abren el contenido, debajo de la banda (tablero Empresa); en el teléfono, en su banda blanca. Con uno solo, su
   * contenido va sin la barra de pestañas. El contenido de la ficha sale de los grupos y no de `children`. */
  tabs?: PageTabs;
  children?: ReactNode;
  bodyClassName?: string;
  /** En el teléfono, lo que dice debajo del título si no es el camino ni la organización (el correo de una persona). */
  phoneSubtitle?: ReactNode;
  /** En el teléfono, crear algo nuevo es un «+» flotante en lugar de la acción principal de la banda. */
  fab?: { label: string; onClick?: () => void; to?: string };
  /** En el teléfono: `padded` con margen de 20, `flush` para listas de borde a borde, `gray` para grupos de ajustes. */
  phoneBody?: "padded" | "flush" | "gray";
}

const phoneBodyClasses = {
  // M-Configuracion y M-Rol (.ap-cuerpo): 4 arriba, 20 a los costados y 14 entre bloques.
  padded: "flex flex-1 flex-col gap-3.5 px-5 pt-1 pb-6 text-[15px]",
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
  // Tablero M-Empresa («Administra solo la empresa»): una pantalla cuyo ‹ vuelve al Inicio es del Inicio, y la barra de
  // abajo lo marca a él y no a «Más».
  const { markHome } = chrome;
  const fromHome = chrome.phone && backTo !== undefined && backTo.to === chrome.homePath;
  useEffect(() => {
    if (!fromHome) return;
    markHome?.(true);
    return () => markHome?.(false);
  }, [fromHome, markHome]);
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

  // «Criterio · Marco», Pestañas (decisión del usuario del 2026-10-05): una pestaña por grupo de datos cuando hay dos o
  // más; con uno solo (el Administrador de empresa ve solo «Miembros»), su contenido va sin la barra.
  const groups = tabs?.items.filter((group) => !group.hidden) ?? [];
  const tabbed = tabs && groups.length > 1 ? tabs : undefined;
  const openGroup = groups.some((group) => group.value === tabs?.value) ? tabs?.value : groups[0]?.value;
  const tabList = tabbed ? <TabsList aria-label={tabbed.label}>
    {groups.map((group) => <TabsTrigger key={group.value} value={group.value}>
      {group.label}{group.count === undefined ? null : <TabCount>{group.count}</TabCount>}
    </TabsTrigger>)}
  </TabsList> : null;
  const content = tabbed
    ? groups.map((group) => <TabsContent key={group.value} value={group.value} className={group.className}>{group.content}</TabsContent>)
    : groups.length === 1 ? <div data-slot="page-group" className={groups[0].className}>{groups[0].content}</div> : children;
  const withTabs = (page: ReactNode) => tabbed
    ? <Tabs value={openGroup} onValueChange={tabbed.onValueChange} className="contents!">{page}</Tabs>
    : page;

  // Tableros M-* («Criterio · Marco»): en el teléfono la pantalla es de una app. Arriba, ‹ (si es una ficha o se
  // llega desde «Más») con el título y el camino; el ⋮ en la barra; crear es un «+» flotante y guardar va fijo abajo.
  if (chrome.phone) {
    const back = backTo ?? chrome.parent ?? undefined;
    return withTabs(<div className={cn("flex min-h-full flex-col", phoneBody === "gray" ? "bg-[var(--s2)]" : "bg-[var(--lado-activo)]")}>
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
      {tabList ? <div data-slot="page-tabs" className="border-b border-[var(--borde)] bg-[var(--lado-activo)]">{tabList}</div> : null}
      {banner}
      {/* M-Avisos (.ap-cuerpo): debajo de un cartel, el cuerpo con margen arranca a 14 y no a 4. */}
      <AppBarToolsProvider value={tools}><div className={cn(phoneBodyClasses[phoneBody], banner && phoneBody === "padded" ? "pt-3.5" : null)}>{content}</div></AppBarToolsProvider>
      {fab ? <Fab label={fab.label} onClick={fab.onClick} to={fab.to} /> : actions ? <FixedActions>{actions}</FixedActions> : null}
    </div>);
  }

  return withTabs(
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
              <ChevronLeftIcon strokeWidth={2} className="size-4" />
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
      <div className={bodyClassName}>{banner}{tabList ? <div className="flex min-w-0 flex-col">
        <div data-slot="page-tabs" className="border-b border-[var(--borde)] px-1 [&>[role=tablist]]:-mb-px">{tabList}</div>
        <div className="pt-4">{content}</div>
      </div> : content}</div>
    </>,
  );
}
