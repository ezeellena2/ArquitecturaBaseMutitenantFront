import type { NavigationConfig, NavigationLink, NavigationPanel, NavigationSection } from "./types";

/// Gestión y Administración, o el panel de un módulo por su rótulo (`module:whatsapp:title`).
export type NavigationPanelKey = "management" | "administration" | `module:${string}`;

export const modulePanelKey = (panel: NavigationPanel): NavigationPanelKey => `module:${panel.labelKey}`;

/// El panel de esa clave, si la sesión lo tiene.
export function navigationPanel(navigation: NavigationConfig, key: NavigationPanelKey): NavigationPanel | null {
  if (key === "management" || key === "administration") return navigation[key] ?? null;
  return navigation.panels?.find((panel) => modulePanelKey(panel) === key) ?? null;
}

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
  const panels: NavigationPanelKey[] = ["management", "administration", ...(navigation.panels ?? []).map(modulePanelKey)];
  return panels.flatMap((panel) => {
    const source = navigationPanel(navigation, panel);
    const entry = findAdministrationEntry(source, pathname);
    // En el panel de un módulo, el panel mismo hace de grupo: «Inicio / WhatsApp / Chats».
    if (entry && source && panel.startsWith("module:")) return [{ link: entry.link, section: { labelKey: source.labelKey, icon: source.icon, links: source.links }, panel }];
    return entry ? [{ ...entry, panel }] : [];
  }).sort((a, b) => b.link.path.length - a.link.path.length).at(0) ?? null;
}
