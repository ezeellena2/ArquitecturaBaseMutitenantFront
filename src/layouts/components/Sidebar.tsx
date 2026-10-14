import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link, useLocation } from "react-router";
import type { AccountIdentity } from "@/auth/accountIdentity";
import { Avatar } from "@/shared/ui/Avatar";
import { BrandMark } from "@/shared/ui/BrandMark";
import { findNavigationPanelEntry, modulePanelKey, type NavigationPanelKey } from "../navigation/administration";
import type { NavigationConfig, NavigationLink } from "../navigation/types";
import { MenuBadge } from "./MenuBadge";
import { menuLineClass, menuRowClass, panelEdgeButtonClass } from "./menuRow";

export interface SidebarProps {
  navigation: NavigationConfig;
  account: AccountIdentity | null;
  context: { title: string; detail: string } | null;
  collapsed: boolean;
  managementOpen?: boolean;
  onToggleManagement?: () => void;
  administrationOpen: boolean;
  onToggleAdministration: () => void;
  /** El panel de un módulo que está abierto (WhatsApp), uno a la vez con Gestión y Administración. */
  openModulePanel?: NavigationPanelKey | null;
  onToggleModulePanel?: (panel: NavigationPanelKey) => void;
  onToggleCollapsed: () => void;
}


/// El menú lateral de la compu. En el teléfono no existe: la app lleva la barra de abajo y «Más» (tableros M-*).
export function Sidebar({ navigation, account, context, collapsed, managementOpen = false, onToggleManagement, administrationOpen, onToggleAdministration, openModulePanel = null, onToggleModulePanel, onToggleCollapsed }: SidebarProps) {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const showLabels = !collapsed;
  // «Criterio · Menús» (Plat-WA-Chats): Inicio, Gestión y después las opciones de los módulos («WhatsApp»).
  const home = navigation.links.find((link) => !link.contributed);
  const others = navigation.links.filter((link) => link !== home);
  const inPanel = findNavigationPanelEntry(navigation, pathname) !== null;
  const isActive = (entry: NavigationLink) => entry.path === pathname || (!!entry.contributed && !inPanel && pathname.startsWith(`${entry.path}/`));
  const anyPanelOpen = administrationOpen || managementOpen || openModulePanel !== null;
  const ManagementIcon = navigation.management?.icon;

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
    {!anyPanelOpen ? <button type="button" aria-label={t(collapsed ? "layout.sidebar.expand" : "layout.sidebar.collapse")} onClick={onToggleCollapsed} className={panelEdgeButtonClass}>
      {collapsed ? <ChevronRight size={18} strokeWidth={1.75} aria-hidden="true" /> : <ChevronLeft size={18} strokeWidth={1.75} aria-hidden="true" />}
    </button> : null}
    <nav aria-label={t("navigation.general")} className="flex min-h-0 flex-1 flex-col overflow-y-auto px-2 pt-1">
      <ul className="flex flex-col gap-0.5">
        {/* «Criterio · Menús» (Plat-WA-Chats): Inicio, Gestión y después las opciones y los paneles de los módulos. */}
        {[...(home ? [home] : []), ...(navigation.management ? ["management" as const] : []), ...others, ...(navigation.panels ?? [])].map((entry, index) => {
          if (entry === "management") return <li key="management" className={menuLineClass(index)}>
            <button type="button" aria-expanded={managementOpen} aria-label={t(navigation.management!.labelKey)} onClick={onToggleManagement} className={`${menuRowClass(managementOpen)} w-full text-left`}>
              {ManagementIcon ? <ManagementIcon className="size-[18px] shrink-0" /> : null}
              <span className={showLabels ? "flex-1" : "sr-only"}>{t(navigation.management!.labelKey)}</span>
              {showLabels ? <ChevronRight size={16} aria-hidden="true" /> : null}
            </button>
          </li>;
          const Icon = entry.icon;
          if (!("path" in entry)) {
            const key = modulePanelKey(entry);
            const open = openModulePanel === key;
            return <li key={key} className={menuLineClass(index)}>
              <button type="button" aria-expanded={open} onClick={() => onToggleModulePanel?.(key)} className={`${menuRowClass(open)} w-full text-left`}>
                <Icon className="size-[18px] shrink-0" />
                <span className={showLabels ? "flex-1" : "sr-only"}>{t(entry.labelKey)}</span>
                <MenuBadge Badge={entry.Badge} hidden={!showLabels} />
                {showLabels ? <ChevronRight size={16} aria-hidden="true" /> : null}
              </button>
            </li>;
          }
          const active = isActive(entry);
          return <li key={entry.labelKey} className={menuLineClass(index)}>
            <Link to={entry.path} aria-current={active ? "page" : undefined} className={menuRowClass(active)}>
              <Icon className="size-[18px] shrink-0" /><span className={showLabels ? "" : "sr-only"}>{t(entry.labelKey)}</span>
              <MenuBadge Badge={entry.Badge} hidden={!showLabels} />
            </Link>
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
    {/* «Criterio · Menús»: identidad en 13 y negrita, contacto en gris de 12 y avatar de la cuenta global. */}
    {account ? <div className="flex items-center gap-2.5 border-t border-[var(--lado-borde)] px-3.5 py-2.5">
      <Avatar initials={account.avatarInitials} muted={account.avatarMuted} />
      {showLabels ? <span className="flex min-w-0 flex-col leading-[1.3]"><span className="truncate text-[13px] font-bold text-[var(--t1)]">{account.name || t("format:emptyLabel")}</span>{account.detail ? <span className="truncate text-[12px] text-[var(--t3)]">{account.detail}</span> : null}</span> : null}
    </div> : null}
  </aside>;
}
