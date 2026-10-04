import type { LucideIcon } from "lucide-react";

export interface NavigationLink {
  labelKey: string;
  /** En «Más» del teléfono, si el tablero la nombra más corto (M-WA-Menu: «Roles»). */
  phoneLabelKey?: string;
  icon: LucideIcon;
  to: string | null;
  permission?: string;
}

export interface NavigationPanel {
  labelKey: string;
  icon: LucideIcon;
  links: readonly NavigationLink[];
  sections?: readonly NavigationSection[];
}

export interface NavigationSection {
  labelKey: string;
  icon: LucideIcon;
  links: readonly NavigationLink[];
}

export interface NavigationConfig {
  links: readonly NavigationLink[];
  administration: NavigationPanel | null;
  /** En el teléfono, la pantalla «Más» de la barra de abajo: perfiles, Administración, Mi cuenta y Salir. */
  moreTo?: string;
}
