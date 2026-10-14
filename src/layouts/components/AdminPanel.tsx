import { ChevronDown, ChevronLeft } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useLocation } from "react-router";
import { findAdministrationEntry } from "../navigation/administration";
import type { NavigationLink, NavigationPanel, NavigationSection } from "../navigation/types";
import { MenuBadge } from "./MenuBadge";
import { menuGroupClass, menuLineClass, menuRowClass, panelEdgeButtonClass } from "./menuRow";

// «Criterio · Menús» (lienzo v102): las mismas opciones del menú lateral, con la sección en la que estás en blanco. Un
// grupo («Gestión de usuarios») arranca abierto solo si estás en una de sus pantallas, con sus opciones a 18 de sangría;
// si no, va cerrado, con la flechita a la derecha, y lleva a su primera opción. Lo que la persona abre o cierra a mano
// vale mientras está en esa pantalla, como el panel mismo.
export function AdminPanel({ panel, open, onClose, currentLink }: { panel: NavigationPanel | null; open: boolean; onClose: () => void; currentLink?: NavigationLink | null }) {
  const { t } = useTranslation();
  const pathname = useLocation().pathname;
  const [toggled, setToggled] = useState<{ pathname: string; sections: Record<string, boolean> }>({ pathname, sections: {} });
  if (!panel || !open) return null;
  // El marco resuelve la opción sobre ambos paneles: al abrir otro a mano, ninguna opción de ese panel está activa.
  const activeLink = currentLink === undefined ? findAdministrationEntry(panel, pathname)?.link : currentLink;
  const sections = panel.sections ?? [];
  const coreSections = sections.filter((section) => !section.moreGroup);
  const moduleSections = sections.filter((section) => section.moreGroup);
  const links = panel.links.filter((entry) => !entry.afterModuleGroups);
  const closingLinks = panel.links.filter((entry) => entry.afterModuleGroups);
  const byHand = toggled.pathname === pathname ? toggled.sections : {};

  const renderSection = (section: NavigationSection, index: number) => {
        const here = activeLink != null && section.links.includes(activeLink);
        const expanded = here && (byHand[section.labelKey] ?? true);
        const label = <><section.icon className="size-[18px] shrink-0" /><span className="flex-1">{t(section.labelKey)}</span>
          <ChevronDown size={14} aria-hidden="true" className={`text-[var(--t3)] ${expanded ? "" : "-rotate-90"}`} /></>;
        const first = section.links.at(0);
        return <li key={section.labelKey} className={menuLineClass(index)}>
          {here ? <button type="button" aria-expanded={expanded} className={`${menuGroupClass} w-full text-left`}
            onClick={() => setToggled({ pathname, sections: { ...byHand, [section.labelKey]: !expanded } })}>{label}</button>
            : first ? <Link to={first.path} className={menuGroupClass}>{label}</Link> : null}
          {expanded ? <ul className="mt-0.5 ml-[18px] flex flex-col gap-0.5 border-l border-[var(--lado-guia)] pl-2.5">
            {section.links.map((entry, childIndex) => <li key={entry.labelKey} className={menuLineClass(childIndex)}>
              <Link to={entry.path} aria-current={entry === activeLink ? "page" : undefined} className={menuRowClass(entry === activeLink)}>{t(entry.labelKey)}</Link>
            </li>)}
          </ul> : null}
        </li>;
      };

  return <nav aria-label={t(panel.labelKey)} className="relative flex h-full w-[232px] shrink-0 flex-col border-r border-[var(--lado-borde)] bg-[var(--panel)]">
    <div className="flex h-[52px] items-center border-b border-[var(--lado-borde)] px-3.5 text-[14px] font-bold text-[var(--t1)]">{t(panel.labelKey)}</div>
    <button type="button" aria-label={t("layout.sidebar.closePanel", { name: t(panel.labelKey) })} onClick={onClose} className={panelEdgeButtonClass}>
      <ChevronLeft size={18} strokeWidth={1.75} aria-hidden="true" />
    </button>
    <ul className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto px-2 py-2.5">
      {coreSections.map(renderSection)}
      {links.map((entry, index) => <li key={entry.labelKey} className={menuLineClass(coreSections.length + index)}>
        <Link to={entry.path} aria-current={entry === activeLink ? "page" : undefined} className={menuRowClass(entry === activeLink)}>
          <entry.icon className="size-[18px] shrink-0" />{t(entry.labelKey)}<MenuBadge Badge={entry.Badge} />
        </Link>
      </li>)}
      {moduleSections.map((section, index) => renderSection(section, coreSections.length + links.length + index))}
      {closingLinks.map((entry, index) => <li key={entry.labelKey} className={menuLineClass(coreSections.length + links.length + moduleSections.length + index)}>
        <Link to={entry.path} aria-current={entry === activeLink ? "page" : undefined} className={menuRowClass(entry === activeLink)}>
          <entry.icon className="size-[18px] shrink-0" />{t(entry.labelKey)}
        </Link>
      </li>)}
    </ul>
  </nav>;
}
