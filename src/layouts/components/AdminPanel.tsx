import { ChevronDown, ChevronLeft } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useLocation } from "react-router";
import type { NavigationPanel } from "../navigation/types";

export function AdminPanel({ panel, open, isMobile, onClose }: { panel: NavigationPanel | null; open: boolean; isMobile: boolean; onClose: () => void }) {
  const { t } = useTranslation();
  const pathname = useLocation().pathname;
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  if (!panel || !open || isMobile) return null;

  return <nav aria-label={t(panel.labelKey)} className="relative flex h-full w-[232px] shrink-0 flex-col border-r border-[var(--lado-borde)] bg-[var(--panel)]">
    <div className="flex h-[52px] items-center border-b border-[var(--lado-borde)] px-4 text-sm font-bold text-[var(--t1)]">{t(panel.labelKey)}</div>
    <button type="button" aria-label={t("layout.sidebar.closeAdministration")} onClick={onClose} className="absolute -right-3.5 top-16 z-30 flex size-8 items-center justify-center rounded-full border border-[var(--borde2)] bg-[var(--lado-activo)] text-[var(--t1)] shadow-sm">
      <ChevronLeft size={15} aria-hidden="true" />
    </button>
    <div className="flex flex-col gap-3 px-2 py-3">
      {panel.sections?.map((section) => {
        const expanded = expandedSections[section.labelKey] ?? true;
        return <section key={section.labelKey}>
          <button type="button" aria-expanded={expanded} onClick={() => setExpandedSections((current) => ({ ...current, [section.labelKey]: !expanded }))}
            className="flex min-h-8 w-full items-center gap-2 rounded-lg px-2 text-left text-[13px] font-semibold text-[var(--t1)] hover:bg-[var(--lado-hover)]">
            <span className="flex-1">{t(section.labelKey)}</span><ChevronDown size={14} aria-hidden="true" className={expanded ? "" : "-rotate-90"} />
          </button>
          {expanded ? <div className="flex flex-col gap-0.5 pl-2">{section.links.map((entry) => {
            if (!entry.to) return null;
            const active = pathname === entry.to || pathname.startsWith(`${entry.to}/`);
            return <Link key={entry.labelKey} to={entry.to} aria-current={active ? "page" : undefined}
              className={`flex min-h-[32px] items-center rounded-lg px-2 text-[13px] ${active ? "bg-[var(--lado-activo)] font-semibold text-[var(--marca-tx)]" : "text-[var(--t2)] hover:bg-[var(--lado-hover)]"}`}>
              {t(entry.labelKey)}
            </Link>;
          })}</div> : null}
        </section>;
      })}
      {panel.links.map((entry) => entry.to ? <Link key={entry.labelKey} to={entry.to} className="flex min-h-[32px] items-center rounded-lg px-2 text-[13px] text-[var(--t2)] hover:bg-[var(--lado-hover)]">{t(entry.labelKey)}</Link> : null)}
    </div>
  </nav>;
}
