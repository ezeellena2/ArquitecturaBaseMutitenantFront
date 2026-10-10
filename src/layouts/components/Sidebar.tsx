import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link, useLocation } from "react-router";
import { Avatar } from "@/shared/ui/Avatar";
import { BrandMark } from "@/shared/ui/BrandMark";
import type { NavigationConfig } from "../navigation/types";
import { menuLineClass, menuRowClass, panelEdgeButtonClass } from "./menuRow";

export interface SidebarProps {
  navigation: NavigationConfig;
  account: { name: string; email: string | null } | null;
  context: { title: string; detail: string } | null;
  collapsed: boolean;
  managementOpen?: boolean;
  onToggleManagement?: () => void;
  administrationOpen: boolean;
  onToggleAdministration: () => void;
  onToggleCollapsed: () => void;
}

/// El menú lateral de la compu. En el teléfono no existe: la app lleva la barra de abajo y «Más» (tableros M-*).
export function Sidebar({ navigation, account, context, collapsed, managementOpen = false, onToggleManagement, administrationOpen, onToggleAdministration, onToggleCollapsed }: SidebarProps) {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const showLabels = !collapsed;

  return <aside aria-label={t("layout.sidebar.navigation")} className={`relative flex h-full shrink-0 flex-col border-r border-[var(--lado-borde)] bg-[var(--lado)] ${collapsed ? "w-16" : "w-[232px]"}`}>
    <div className="flex h-[52px] shrink-0 items-center gap-2.5 border-b border-[var(--lado-borde)] px-3 text-sm font-bold text-[var(--t1)]">
      <BrandMark />
      {showLabels ? <span>{t("app.name")}</span> : null}
    </div>
    {/* «Criterio · Marco» y tableros Inicio-Personal y Configuración: el perfil en 14 y negrita, debajo «Organización» o
        «Tu perfil personal» en gris de 12,5, con 12 y 14 de margen. */}
    {context && showLabels ? <div className="flex shrink-0 flex-col px-3.5 py-3 leading-[1.35]">
      <span className="text-[14px] font-bold text-[var(--t1)]">{context.title}</span>
      <span className="mt-px text-[12.5px] text-[var(--t3)]">{context.detail}</span>
    </div> : null}
    {/* La flecha va en el borde del último panel: acá, solo si Administración está cerrada (lienzo v107). */}
    {!administrationOpen && !managementOpen ? <button type="button" aria-label={t(collapsed ? "layout.sidebar.expand" : "layout.sidebar.collapse")} onClick={onToggleCollapsed} className={panelEdgeButtonClass}>
      {collapsed ? <ChevronRight size={18} strokeWidth={1.75} aria-hidden="true" /> : <ChevronLeft size={18} strokeWidth={1.75} aria-hidden="true" />}
    </button> : null}
    <nav aria-label={t("navigation.general")} className="flex min-h-0 flex-1 flex-col overflow-y-auto px-2 pt-1">
      <ul className="flex flex-col gap-0.5">
        {navigation.management ? <li>
          <button type="button" aria-expanded={managementOpen} aria-label={t(navigation.management.labelKey)} onClick={onToggleManagement} className={`${menuRowClass(managementOpen)} w-full text-left`}>
            <navigation.management.icon className="size-[18px] shrink-0" />
            <span className={showLabels ? "flex-1" : "sr-only"}>{t(navigation.management.labelKey)}</span>
            {showLabels ? <ChevronRight size={16} aria-hidden="true" /> : null}
          </button>
        </li> : null}
        {navigation.links.map((entry, index) => {
          const Icon = entry.icon;
          const active = entry.path === pathname;
          const content = <><Icon className="size-[18px] shrink-0" /><span className={showLabels ? "" : "sr-only"}>{t(entry.labelKey)}</span></>;
          return <li key={entry.labelKey} className={menuLineClass(index + (navigation.management ? 1 : 0))}>
            <Link to={entry.path} aria-current={active ? "page" : undefined} className={menuRowClass(active)}>{content}</Link>
          </li>;
        })}
      </ul>
      {/* Abajo de todo, con una línea a todo el ancho del menú y 8 de aire arriba y abajo. */}
      {navigation.administration ? <div className="-mx-2 mt-auto border-t border-[var(--lado-borde)] p-2">
        <button type="button" aria-expanded={administrationOpen} aria-label={t(navigation.administration.labelKey)} onClick={onToggleAdministration} className={`${menuRowClass(administrationOpen)} w-full text-left`}>
          <navigation.administration.icon className="size-[18px] shrink-0" />
          <span className={showLabels ? "flex-1" : "sr-only"}>{t(navigation.administration.labelKey)}</span>
          {!showLabels ? null : administrationOpen && navigation.management === undefined ? <ChevronLeft size={16} aria-hidden="true" /> : <ChevronRight size={16} aria-hidden="true" />}
        </button>
      </div> : null}
    </nav>
    {/* «Criterio · Menús»: tu nombre en 13 y negrita y el correo en gris de 12, al lado de tu inicial. */}
    {account ? <div className="flex items-center gap-2.5 border-t border-[var(--lado-borde)] px-3.5 py-2.5">
      <Avatar initials={account.name.charAt(0).toUpperCase()} />
      {showLabels ? <span className="flex min-w-0 flex-col leading-[1.3]"><span className="truncate text-[13px] font-bold text-[var(--t1)]">{account.name || t("format:emptyLabel")}</span>{account.email ? <span className="truncate text-[12px] text-[var(--t3)]">{account.email}</span> : null}</span> : null}
    </div> : null}
  </aside>;
}
