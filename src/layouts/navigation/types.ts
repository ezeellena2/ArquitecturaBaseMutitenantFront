import type { IconComponent } from "@/shared/ui/icons";
import type { CompanyPermission, OrganizationPermission } from "@/auth/usePermissions";

/// Una ruta del manifiesto de un área: su camino, el permiso y el módulo que pide para abrirse y, si va en el menú, su
/// rótulo y su ícono. De acá salen `app/routes.tsx` (con `RequirePermission`) y el menú: nada se declara dos veces.
export interface AppRoute {
  path: string;
  permission?: OrganizationPermission;
  /**
   * La alternativa de una ruta de una empresa (`:companyId`): también se abre con este permiso en esa empresa, como
   * `[HasCompanyPermission(…, organizationPermission: …)]` del back (B4, decisión 88).
   */
  companyPermission?: CompanyPermission;
  /** El módulo (`features` de /api/me): apagado, el enlace no aparece y la ruta no existe. */
  feature?: string;
  labelKey?: string;
  /** En «Más» del teléfono, si el tablero la nombra más corto (M-WA-Menu: «Roles»). */
  phoneLabelKey?: string;
  icon?: IconComponent;
}

/// Una ruta del manifiesto que va en el menú.
export interface NavigationLink extends AppRoute {
  labelKey: string;
  icon: IconComponent;
}

export interface NavigationPanel {
  labelKey: string;
  icon: IconComponent;
  links: readonly NavigationLink[];
  sections?: readonly NavigationSection[];
}

export interface NavigationSection {
  labelKey: string;
  icon: IconComponent;
  links: readonly NavigationLink[];
}

export interface NavigationConfig {
  links: readonly NavigationLink[];
  administration: NavigationPanel | null;
  /** En el teléfono, la pantalla «Más» de la barra de abajo: perfiles, Administración, Mi cuenta y Salir. */
  moreTo?: string;
}
