import { ChevronDown, ChevronLeft } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useLocation } from "react-router";
import { findAdministrationEntry } from "../navigation/administration";
import type { NavigationPanel } from "../navigation/types";
import { menuGroupClass, menuLineClass, menuRowClass } from "./menuRow";

// Tablero Usuarios: las mismas opciones del menú lateral, con la sección en la que estás en blanco; las de «Gestión de
// usuarios», con sangría y la misma línea.
export function AdminPanel({ panel, open, onClose }: { panel: NavigationPanel | null; open: boolean; onClose: () => void }) {
  const { t } = useTranslation();
  const pathname = useLocation().pathname;
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  if (!panel || !open) return null;
  const activeLink = findAdministrationEntry(panel, pathname)?.link;
  const sections = panel.sections ?? [];

  return <nav aria-label={t(panel.labelKey)} className="relative flex h-full w-[232px] shrink-0 flex-col border-r border-[var(--lado-borde)] bg-[var(--panel)]">
    <div className="flex h-[52px] items-center border-b border-[var(--lado-borde)] px-4 text-[14px] font-bold text-[var(--t1)]">{t(panel.labelKey)}</div>
    <button type="button" aria-label={t("layout.sidebar.closeAdministration")} onClick={onClose} className="absolute -right-3.5 top-16 z-30 flex size-7 items-center justify-center rounded-full border border-[var(--borde2)] bg-[var(--lado-activo)] text-[var(--t1)] shadow-sm">
      <ChevronLeft size={15} aria-hidden="true" />
    </button>
    <ul className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto px-2 py-3">
      {sections.map((section, index) => {
        const expanded = expandedSections[section.labelKey] ?? true;
        return <li key={section.labelKey} className={menuLineClass(index)}>
          <button type="button" aria-expanded={expanded} onClick={() => setExpandedSections((current) => ({ ...current, [section.labelKey]: !expanded }))}
            className={`${menuGroupClass} w-full text-left`}>
            <section.icon size={18} strokeWidth={1.75} aria-hidden="true" />
            <span className="flex-1">{t(section.labelKey)}</span>
            <ChevronDown size={16} aria-hidden="true" className={expanded ? "" : "-rotate-90"} />
          </button>
          {expanded ? <ul className="mt-0.5 ml-[22px] flex flex-col gap-0.5 border-l border-[var(--lado-borde)] pl-3">
            {section.links.map((entry, childIndex) => <li key={entry.labelKey} className={menuLineClass(childIndex)}>
              <Link to={entry.path} aria-current={entry === activeLink ? "page" : undefined} className={menuRowClass(entry === activeLink)}>{t(entry.labelKey)}</Link>
            </li>)}
          </ul> : null}
        </li>;
      })}
      {panel.links.map((entry, index) => <li key={entry.labelKey} className={menuLineClass(sections.length + index)}>
        <Link to={entry.path} aria-current={entry === activeLink ? "page" : undefined} className={menuRowClass(entry === activeLink)}>
          <entry.icon size={18} strokeWidth={1.75} aria-hidden="true" />{t(entry.labelKey)}
        </Link>
      </li>)}
    </ul>
  </nav>;
}
