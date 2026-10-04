import type { NavigationLink, NavigationPanel, NavigationSection } from "./types";

/// La opción del panel de la que sale la ruta: la misma o una hija, como `/org/empresas/abc` de Empresas. La usan
/// el panel para marcar dónde estás, las migas para armar el camino y el marco para abrir el panel.
export function findAdministrationEntry(panel: NavigationPanel | null, pathname: string): { link: NavigationLink; section: NavigationSection | null } | null {
  const matches = (entry: NavigationLink) => pathname === entry.path || pathname.startsWith(`${entry.path}/`);

  for (const section of panel?.sections ?? []) {
    const link = section.links.find(matches);
    if (link) return { link, section };
  }

  const link = panel?.links.find(matches);
  return link ? { link, section: null } : null;
}
