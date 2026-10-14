import type { IconComponent } from "@/shared/ui/icons";
import type { CompanyPermission, OrganizationPermission, PlatformPermission } from "@/auth/usePermissions";
import type { ModuleBadge } from "@/shared/modules/types";

/// Una ruta del manifiesto de un área: su camino, el permiso y el módulo que pide para abrirse y, si va en el menú, su
/// rótulo y su ícono. De acá salen `app/routes.tsx` (con `RequirePermission`) y el menú: nada se declara dos veces.
export interface AppRoute {
  path: string;
  permission?: OrganizationPermission;
  platformPermission?: PlatformPermission;
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
  /** Fila de cierre del panel, después de los grupos aportados por módulos. */
  afterModuleGroups?: boolean;
  icon?: IconComponent;
}

/// Una ruta del manifiesto que va en el menú.
export interface NavigationLink extends AppRoute {
  labelKey: string;
  icon: IconComponent;
  /** La aporta un módulo: no es el Inicio del acceso aunque quede primera. */
  contributed?: boolean;
  /** El contador que acompaña la opción (los chats sin tomar). */
  Badge?: ModuleBadge;
}

export interface NavigationPanel {
  labelKey: string;
  icon: IconComponent;
  links: readonly NavigationLink[];
  sections?: readonly NavigationSection[];
}

/// El panel propio de un módulo de uso diario («Criterio · Menús»: WhatsApp, con Chats, Contactos y Difusiones). Se abre
/// desde su ítem del menú lateral, como Administración, y uno a la vez. En el teléfono, sus opciones van en la barra o en
/// el grupo del módulo en Más.
export interface NavigationModulePanel extends NavigationPanel {
  Badge?: ModuleBadge;
}

export interface NavigationSection {
  labelKey: string;
  icon: IconComponent;
  links: readonly NavigationLink[];
  /** Grupo propio de módulo: con título en Más y al final de Administración. */
  moreGroup?: boolean;
}

export interface BottomNavigationSection {
  /** La misma entrada de un panel: el permiso y el rótulo no se vuelven a declarar. */
  link: NavigationLink;
  /** El ícono de 24 de la barra inferior del tablero M-*, distinto del de escritorio. */
  icon: IconComponent;
}

export interface NavigationConfig {
  links: readonly NavigationLink[];
  /** Secciones móviles y desborde de la barra, desde la misma composición. */
  moreLinks?: readonly NavigationLink[];
  /** Un panel de uso diario, arriba: Gestión en Plataforma. Comparte el segundo panel con Administración. */
  management?: NavigationPanel | null;
  administration: NavigationPanel | null;
  /** Los paneles de los módulos, después de las opciones del menú. */
  panels?: readonly NavigationModulePanel[];
  /** La raíz de las migas cuando el inicio es una opción de un panel, como Organizaciones en Plataforma. */
  breadcrumbRoot?: { path: string; labelKey: string };
  /** Hasta cuatro secciones antes de Más. Sin esta declaración, Personal usa Inicio + módulos visibles; Empresa, Inicio. */
  bottomSections?: readonly BottomNavigationSection[];
  /** En el teléfono, la pantalla «Más» de la barra de abajo: perfiles, Administración, Mi cuenta y Salir. */
  moreTo?: string;
}
