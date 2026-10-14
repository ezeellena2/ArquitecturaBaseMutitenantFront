import { useCurrentUser } from "@/auth/useCurrentUser";
import { usePermissions, type Permissions } from "@/auth/usePermissions";
import type { MeResponse } from "@/shared/api/types";
import { useModuleRegistry } from "@/shared/modules/useModules";
import type { ModuleRegistration } from "@/shared/modules/types";
import { AppHomeIcon, ShieldCheckIcon } from "@/shared/ui/icons";
import type { Access } from "@/tenancy/access";
import { businessNavigation } from "./business";
import { personalNavigation } from "./personal";
import { platformNavigation, platformNavigationWithHome } from "./platform";
import type { BottomNavigationSection, NavigationConfig, NavigationLink, NavigationModulePanel, NavigationSection } from "./types";
import { canOpen, visibleNavigation } from "./visible";

/**
 * Aplica la misma contribución a la barra, Más, el menú lateral, los paneles de los módulos y Administración. No conoce
 * módulos concretos. En el teléfono, la barra lleva el Inicio, las secciones solo del teléfono (el Asistente), las del
 * núcleo y, al final, las opciones de menú y de panel de los módulos (M-WA-Chats, M-Mas-Plat y M-WA-Mensajes).
 */
export function composeNavigation(base: NavigationConfig, access: Access, me: MeResponse | undefined, permissions: Permissions, modules: readonly ModuleRegistration[]): NavigationConfig {
  const visible = visibleNavigation(base, permissions);
  const contributions = me?.access === access ? modules.flatMap((module) => module.routes)
    .filter((route) => route.access === access && route.navigation && route.guard(me) === "allowed") : [];
  const phoneOnly: BottomNavigationSection[] = [];
  const phoneTail: BottomNavigationSection[] = [];
  const menu: NavigationLink[] = [];
  const panels: NavigationModulePanel[] = [];
  const sections: NavigationSection[] = [];
  const administration: NavigationLink[] = [];
  for (const route of contributions) {
    const nav = route.navigation!;
    const link: NavigationLink = { path: route.path, labelKey: nav.labelKey, icon: nav.icon, contributed: true,
      ...(nav.phoneLabelKey ? { phoneLabelKey: nav.phoneLabelKey } : {}), ...(nav.Badge ? { Badge: nav.Badge } : {}) };
    const phoneSection = { link, icon: nav.phoneIcon ?? nav.icon };
    if (nav.placement === "phone") { phoneOnly.push(phoneSection); continue; }
    if (nav.placement === "menu") { menu.push(link); phoneTail.push(phoneSection); continue; }
    if (nav.placement === "panel" && nav.panel) {
      const panel = panels.find((entry) => entry.labelKey === nav.panel!.labelKey);
      if (panel) panel.links = [...panel.links, link];
      else panels.push({ labelKey: nav.panel.labelKey, icon: nav.panel.icon, links: [link], ...(nav.panel.Badge ? { Badge: nav.panel.Badge } : {}) });
      if (nav.phone) phoneTail.push(phoneSection);
      continue;
    }
    if (!nav.section) { administration.push(link); continue; }
    const section = sections.find((entry) => entry.labelKey === nav.section!.labelKey);
    if (section) section.links = [...section.links, link];
    else sections.push({ ...nav.section, links: [link], moreGroup: true });
  }
  const home = visible.links.at(0);
  const existing = visible.bottomSections ?? (access === "consumer"
    ? visible.links.filter((link) => link === home || link.feature).map((link) => ({ link, icon: link === home ? AppHomeIcon : link.icon }))
    : home ? [{ link: home, icon: AppHomeIcon }] : []);
  const phone = phoneOnly.length > 0 || phoneTail.length > 0;
  const allSections = phone ? [...existing.slice(0, 1), ...phoneOnly, ...existing.slice(1), ...phoneTail] : existing;
  const more = [...(base.moreLinks ?? []).filter((link) => canOpen(link, permissions)), ...(access === "consumer" ? visible.links.filter((link) => link.feature) : []), ...allSections.slice(4).map((section) => section.link)];
  return { ...base,
    // Las opciones de menú de los módulos van después del Inicio: «Inicio, Mensajes, Mi cuenta» (WA-Mensajes).
    ...(menu.length ? { links: [...base.links.slice(0, 1), ...menu, ...base.links.slice(1)] } : {}),
    ...(panels.length ? { panels } : {}),
    ...(phone ? { bottomSections: allSections.slice(0, 4) } : {}),
    moreLinks: [...new Map(more.map((link) => [link.path, link])).values()],
    administration: administration.length || sections.length ? {
      ...(base.administration ?? { labelKey: "navigation.administration", icon: ShieldCheckIcon, links: [] }),
      links: [...(base.administration?.links ?? []), ...administration],
      sections: [...(base.administration?.sections ?? []), ...sections],
    } : base.administration,
  };
}

export function useNavigation(access: Access): NavigationConfig {
  const { data: me } = useCurrentUser();
  const modules = useModuleRegistry();
  const permissions = usePermissions();
  const hasHome = me?.access === access && modules.some((module) => module.home?.guard(me) === "allowed");
  const base = access === "business" ? businessNavigation : access === "consumer" ? personalNavigation
    : hasHome ? platformNavigationWithHome : platformNavigation;
  return composeNavigation(base, access, me, permissions, modules);
}
