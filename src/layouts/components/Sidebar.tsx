import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useLocation } from "react-router";
import { Dialog, DialogContent, DialogTitle } from "@/shared/ui/dialog";
import { BrandMark } from "@/shared/ui/BrandMark";
import type { NavigationConfig } from "../navigation/types";

export interface SidebarProps {
  navigation: NavigationConfig;
  account: { name: string; email: string | null } | null;
  context: { title: string; detail: string } | null;
  isMobile: boolean;
  mobileOpen: boolean;
  collapsed: boolean;
  administrationOpen: boolean;
  onToggleAdministration: () => void;
  onToggleCollapsed: () => void;
  onCloseMobile: () => void;
}

function SidebarBody({ navigation, account, context, isMobile, collapsed, administrationOpen, onToggleAdministration, onToggleCollapsed, onCloseMobile }: SidebarProps) {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const [mobileAdministrationOpen, setMobileAdministrationOpen] = useState(false);
  const showLabels = isMobile || !collapsed;
  const adminExpanded = isMobile ? mobileAdministrationOpen : administrationOpen;

  return <>
    <div className="flex h-[52px] shrink-0 items-center gap-2.5 border-b border-[var(--lado-borde)] px-3 text-sm font-bold text-[var(--t1)]">
      <BrandMark />
      {showLabels ? <span>{t("app.name")}</span> : null}
    </div>
    {context && showLabels ? <div className="flex min-h-[56px] shrink-0 flex-col justify-center px-3 text-[13px] leading-[1.35]">
      <span className="font-semibold text-[var(--t1)]">{context.title}</span>
      <span className="mt-1 text-[var(--t3)]">{context.detail}</span>
    </div> : null}
    {!isMobile && !administrationOpen ? <button type="button" aria-label={t(collapsed ? "layout.sidebar.expand" : "layout.sidebar.collapse")} onClick={onToggleCollapsed} className="absolute -right-3.5 top-[78px] z-10 flex size-7 items-center justify-center rounded-full border border-[var(--lado-borde)] bg-[var(--lado)] text-[var(--t2)] shadow-sm">
      {collapsed ? <ChevronRight size={15} aria-hidden="true" /> : <ChevronLeft size={15} aria-hidden="true" />}
    </button> : null}
    <nav aria-label={t("navigation.general")} className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto px-2 py-[11px]">
      {navigation.links.map((entry) => {
        const Icon = entry.icon;
        const active = entry.to === pathname;
        const content = <><Icon size={18} strokeWidth={1.75} aria-hidden="true" /><span className={showLabels ? "" : "sr-only"}>{t(entry.labelKey)}</span></>;
        const rowClass = `flex min-h-[32px] items-center gap-2.5 rounded-[8px] px-2.5 text-[13px] ${active ? "bg-[var(--lado-activo)] font-semibold text-[var(--marca-tx)] ring-1 ring-[var(--borde)] shadow-sm" : "text-[var(--t2)] hover:bg-[var(--lado-hover)]"}`;
        return entry.to ? <Link key={entry.labelKey} to={entry.to} aria-current={active ? "page" : undefined} onClick={isMobile ? onCloseMobile : undefined} className={rowClass}>{content}</Link>
          : <span key={entry.labelKey} aria-disabled="true" className={rowClass}>{content}</span>;
      })}
      {navigation.administration ? <div className="mt-auto border-t border-[var(--lado-borde)] pt-2">
        <button type="button" aria-expanded={adminExpanded} aria-label={t(navigation.administration.labelKey)} onClick={isMobile ? () => setMobileAdministrationOpen((value) => !value) : onToggleAdministration} className={`flex min-h-[36px] w-full items-center gap-2.5 rounded-lg px-2.5 text-left text-[13px] font-semibold text-[var(--t1)] ${adminExpanded ? "bg-[var(--lado-activo)]" : "hover:bg-[var(--lado-hover)]"}`}>
          <navigation.administration.icon size={18} strokeWidth={1.75} aria-hidden="true" />
          <span className={showLabels ? "flex-1" : "sr-only"}>{t(navigation.administration.labelKey)}</span>
          {showLabels ? <ChevronRight size={15} className={adminExpanded ? "rotate-90" : ""} aria-hidden="true" /> : null}
        </button>
        {isMobile && mobileAdministrationOpen ? <div className="ml-5 border-l border-[var(--lado-borde)] pl-2">
          {navigation.administration.links.map((entry) => entry.to ? <Link key={entry.labelKey} to={entry.to} onClick={onCloseMobile} className="flex min-h-[32px] items-center rounded-lg px-2 text-[13px] text-[var(--t2)]">{t(entry.labelKey)}</Link> : null)}
        </div> : null}
      </div> : null}
    </nav>
    {account ? <div className="flex min-h-[60px] items-center gap-2.5 border-t border-[var(--lado-borde)] px-3">
      <span aria-hidden="true" className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[var(--marca)] text-sm font-semibold text-[var(--lado-activo)]">{account.name.charAt(0).toUpperCase()}</span>
      {showLabels ? <span className="flex min-w-0 flex-col text-[13px] leading-[1.3]"><span className="truncate font-semibold text-[var(--t1)]">{account.name}</span>{account.email ? <span className="truncate text-[var(--t3)]">{account.email}</span> : null}</span> : null}
    </div> : null}
  </>;
}

export function Sidebar(props: SidebarProps) {
  const { t } = useTranslation();
  if (props.isMobile) return <Dialog open={props.mobileOpen} onOpenChange={(open) => { if (!open) props.onCloseMobile(); }}>
    <DialogContent showCloseButton={false} aria-describedby={undefined} className="bottom-auto left-0 top-0 flex h-dvh max-h-dvh w-[280px] flex-col gap-0 rounded-none border-0 border-r border-[var(--lado-borde)] bg-[var(--lado)] p-0 shadow-none md:left-0 md:top-0 md:translate-x-0 md:translate-y-0 md:rounded-none">
      <DialogTitle className="sr-only">{t("layout.sidebar.navigation")}</DialogTitle>
      <SidebarBody {...props} />
    </DialogContent>
  </Dialog>;

  return <aside aria-label={t("layout.sidebar.navigation")} className={`relative flex h-full shrink-0 flex-col border-r border-[var(--lado-borde)] bg-[var(--lado)] ${props.collapsed ? "w-16" : "w-[232px]"}`}>
    <SidebarBody {...props} />
  </aside>;
}
