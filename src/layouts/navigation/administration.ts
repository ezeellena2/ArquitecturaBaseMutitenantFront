import type { NavigationConfig, NavigationLink, NavigationPanel, NavigationSection } from "./types";

export type NavigationPanelKey = "management" | "administration";

/// La opción del panel de la que sale la ruta: la misma o una hija, como `/org/empresas/abc` de Empresas. La usan
/// el panel para marcar dónde estás, las migas para armar el camino y el marco para abrir el panel.
export function findAdministrationEntry(panel: NavigationPanel | null, pathname: string): { link: NavigationLink; section: NavigationSection | null } | null {
  const matches = (entry: NavigationLink) => pathname === entry.path || pathname.startsWith(`${entry.path}/`);

  const entries = [
    ...(panel?.sections ?? []).flatMap((section) => section.links.map((link) => ({ link, section }))),
    ...(panel?.links ?? []).map((link) => ({ link, section: null })),
  ];
  // Organizaciones usa el inicio /plataforma: una opción más específica, como Cuentas, siempre gana.
  return entries.filter((entry) => matches(entry.link)).sort((a, b) => b.link.path.length - a.link.path.length).at(0) ?? null;
}

export function findNavigationPanelEntry(navigation: NavigationConfig, pathname: string) {
  const panels: NavigationPanelKey[] = ["management", "administration"];
  return panels.flatMap((panel) => {
    const entry = findAdministrationEntry(navigation[panel] ?? null, pathname);
    return entry ? [{ ...entry, panel }] : [];
  }).sort((a, b) => b.link.path.length - a.link.path.length).at(0) ?? null;
}
