import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link, useLocation } from "react-router";
import { BrandMark } from "@/shared/ui/BrandMark";
import type { NavigationConfig } from "../navigation/types";

export interface SidebarProps {
  navigation: NavigationConfig;
  account: { name: string; email: string | null } | null;
  context: { title: string; detail: string } | null;
  collapsed: boolean;
  administrationOpen: boolean;
  onToggleAdministration: () => void;
  onToggleCollapsed: () => void;
}

// Tableros Inicio-Org y Usuarios (v77): opciones de 32 con ícono de 18 y una línea fina entre cada una;
// la opción en la que estás, y Administración abierta, en blanco.
const rowClass = (active: boolean) => `flex min-h-[32px] items-center gap-2.5 rounded-[8px] px-2.5 text-[13px] ${active
  ? "bg-[var(--lado-activo)] font-semibold text-[var(--marca-tx)] ring-1 ring-[var(--borde)] shadow-sm"
  : "text-[var(--t2)] hover:bg-[var(--lado-hover)] hover:text-[var(--t1)]"}`;

/// El menú lateral de la compu. En el teléfono no existe: la app lleva la barra de abajo y «Más» (tableros M-*).
export function Sidebar({ navigation, account, context, collapsed, administrationOpen, onToggleAdministration, onToggleCollapsed }: SidebarProps) {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const showLabels = !collapsed;

  return <aside aria-label={t("layout.sidebar.navigation")} className={`relative flex h-full shrink-0 flex-col border-r border-[var(--lado-borde)] bg-[var(--lado)] ${collapsed ? "w-16" : "w-[232px]"}`}>
    <div className="flex h-[52px] shrink-0 items-center gap-2.5 border-b border-[var(--lado-borde)] px-3 text-sm font-bold text-[var(--t1)]">
      <BrandMark />
      {showLabels ? <span>{t("app.name")}</span> : null}
    </div>
    {context && showLabels ? <div className="flex min-h-[56px] shrink-0 flex-col justify-center px-3 text-[13px] leading-[1.35]">
      <span className="font-semibold text-[var(--t1)]">{context.title}</span>
      <span className="mt-1 text-[var(--t3)]">{context.detail}</span>
    </div> : null}
    {!administrationOpen ? <button type="button" aria-label={t(collapsed ? "layout.sidebar.expand" : "layout.sidebar.collapse")} onClick={onToggleCollapsed} className="absolute -right-3.5 top-[78px] z-30 flex size-7 items-center justify-center rounded-full border border-[var(--lado-borde)] bg-[var(--lado-activo)] text-[var(--t2)] shadow-sm">
      {collapsed ? <ChevronRight size={15} aria-hidden="true" /> : <ChevronLeft size={15} aria-hidden="true" />}
    </button> : null}
    <nav aria-label={t("navigation.general")} className="flex min-h-0 flex-1 flex-col overflow-y-auto px-2 py-[11px]">
      <ul className="flex flex-col gap-1">
        {navigation.links.map((entry, index) => {
          const Icon = entry.icon;
          const active = entry.to === pathname;
          const content = <><Icon size={18} strokeWidth={1.75} aria-hidden="true" /><span className={showLabels ? "" : "sr-only"}>{t(entry.labelKey)}</span></>;
          return <li key={entry.labelKey} className={index > 0 ? "border-t border-[var(--lado-borde)] pt-0.5" : ""}>
            {entry.to ? <Link to={entry.to} aria-current={active ? "page" : undefined} className={rowClass(active)}>{content}</Link>
              : <span aria-disabled="true" className={rowClass(false)}>{content}</span>}
          </li>;
        })}
      </ul>
      {navigation.administration ? <div className="mt-auto border-t border-[var(--lado-borde)] pt-2">
        <button type="button" aria-expanded={administrationOpen} aria-label={t(navigation.administration.labelKey)} onClick={onToggleAdministration} className={`${rowClass(administrationOpen)} w-full text-left`}>
          <navigation.administration.icon size={18} strokeWidth={1.75} aria-hidden="true" />
          <span className={showLabels ? "flex-1" : "sr-only"}>{t(navigation.administration.labelKey)}</span>
          {!showLabels ? null : administrationOpen ? <ChevronLeft size={16} aria-hidden="true" /> : <ChevronRight size={16} aria-hidden="true" />}
        </button>
      </div> : null}
    </nav>
    {account ? <div className="flex min-h-[60px] items-center gap-2.5 border-t border-[var(--lado-borde)] px-3">
      <span aria-hidden="true" className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[var(--marca)] text-sm font-semibold text-[var(--lado-activo)]">{account.name.charAt(0).toUpperCase()}</span>
      {showLabels ? <span className="flex min-w-0 flex-col text-[13px] leading-[1.3]"><span className="truncate font-semibold text-[var(--t1)]">{account.name}</span>{account.email ? <span className="truncate text-[var(--t3)]">{account.email}</span> : null}</span> : null}
    </div> : null}
  </aside>;
}
