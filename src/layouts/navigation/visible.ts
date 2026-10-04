import type { Permissions } from "@/auth/usePermissions";
import type { AppRoute, NavigationConfig } from "./types";

/// Si un enlace del menú se muestra: su módulo prendido y su permiso.
function isVisible(route: AppRoute, permissions: Permissions): boolean {
  return (!route.feature || permissions.hasFeature(route.feature)) && (!route.permission || permissions.can(route.permission));
}

/// El menú que la sesión puede ver: sin los enlaces de módulos apagados ni sin permiso, sin las secciones que quedan
/// vacías y sin el panel de Administración si no queda nada. Lo usan el menú lateral y «Más».
export function visibleNavigation(navigation: NavigationConfig, permissions: Permissions): NavigationConfig {
  const visible = (route: AppRoute) => isVisible(route, permissions);
  const source = navigation.administration;
  const sections = source?.sections?.map((section) => ({ ...section, links: section.links.filter(visible) }))
    .filter((section) => section.links.length > 0);
  const panelLinks = source?.links.filter(visible) ?? [];
  const administration = source && (panelLinks.length > 0 || (sections?.length ?? 0) > 0)
    ? { ...source, links: panelLinks, ...(sections ? { sections } : {}) }
    : null;
  return { ...navigation, links: navigation.links.filter(visible), administration };
}
