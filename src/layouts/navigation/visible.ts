import type { Permissions } from "@/auth/usePermissions";
import type { AppRoute, NavigationConfig, NavigationPanel } from "./types";

/// Si la sesión abre una ruta del menú: su módulo prendido y su permiso. Sin eso, el menú no la muestra y las migas la
/// dejan sin enlace.
export function canOpen(route: AppRoute, permissions: Permissions): boolean {
  return (!route.feature || permissions.hasFeature(route.feature))
    && (!route.permission || permissions.can(route.permission))
    && (!route.platformPermission || permissions.canPlatform(route.platformPermission));
}

/// El menú que la sesión puede ver: sin los enlaces de módulos apagados ni sin permiso, sin las secciones que quedan
/// vacías y sin los paneles de Gestión o Administración si no queda nada. Lo usan el menú lateral y «Más».
export function visibleNavigation(navigation: NavigationConfig, permissions: Permissions): NavigationConfig {
  const visible = (route: AppRoute) => canOpen(route, permissions);
  const panel = (source: NavigationPanel | null | undefined): NavigationPanel | null => {
    const sections = source?.sections?.map((section) => ({ ...section, links: section.links.filter(visible) }))
      .filter((section) => section.links.length > 0);
    const links = source?.links.filter(visible) ?? [];
    return source && (links.length > 0 || (sections?.length ?? 0) > 0)
      ? { ...source, links, ...(sections ? { sections } : {}) } : null;
  };
  return { ...navigation, links: navigation.links.filter(visible),
    ...(navigation.bottomSections ? { bottomSections: navigation.bottomSections.filter((section) => visible(section.link)) } : {}),
    ...(navigation.management !== undefined ? { management: panel(navigation.management) } : {}),
    administration: panel(navigation.administration),
  };
}
