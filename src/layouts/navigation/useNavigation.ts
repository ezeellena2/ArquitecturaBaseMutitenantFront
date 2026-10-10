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
import type { NavigationConfig, NavigationLink, NavigationSection } from "./types";
import { canOpen, visibleNavigation } from "./visible";

/** Aplica la misma contribución a la barra, Más y Administración. No conoce módulos concretos. */
export function composeNavigation(base: NavigationConfig, access: Access, me: MeResponse | undefined, permissions: Permissions, modules: readonly ModuleRegistration[]): NavigationConfig {
  const visible = visibleNavigation(base, permissions);
  const contributions = me?.access === access ? modules.flatMap((module) => module.routes)
    .filter((route) => route.access === access && route.navigation && route.guard(me) === "allowed") : [];
  const phone: NavigationLink[] = [];
  const sections: NavigationSection[] = [];
  const administration: NavigationLink[] = [];
  for (const route of contributions) {
    const nav = route.navigation!;
    const link = { path: route.path, labelKey: nav.labelKey, icon: nav.icon };
    if (nav.placement === "phone") { phone.push(link); continue; }
    if (!nav.section) { administration.push(link); continue; }
    const section = sections.find((entry) => entry.labelKey === nav.section!.labelKey);
    if (section) section.links = [...section.links, link];
    else sections.push({ ...nav.section, links: [link], moreGroup: true });
  }
  const home = visible.links.at(0);
  const existing = visible.bottomSections ?? (access === "consumer"
    ? visible.links.filter((link) => link === home || link.feature).map((link) => ({ link, icon: link === home ? AppHomeIcon : link.icon }))
    : home ? [{ link: home, icon: AppHomeIcon }] : []);
  const allSections = phone.length ? [...existing.slice(0, 1), ...phone.map((link) => ({ link, icon: link.icon })), ...existing.slice(1)] : existing;
  const more = [...(base.moreLinks ?? []).filter((link) => canOpen(link, permissions)), ...(access === "consumer" ? visible.links.filter((link) => link.feature) : []), ...allSections.slice(4).map((section) => section.link)];
  return { ...base,
    ...(phone.length ? { bottomSections: allSections.slice(0, 4) } : {}),
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
