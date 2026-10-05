import { BuildingIcon, ClipboardIcon, GlobeIcon, HomeIcon, KeyIcon, ShieldCheckIcon, SlidersHorizontalIcon, UsersIcon } from "@/shared/ui/icons";
import type { AppRoute, NavigationConfig } from "./types";
import { homeOf } from "@/tenancy/access";

/// El manifiesto de las rutas de la organización: cada una con su permiso (y su módulo, si es de un módulo) y, si va
/// en el menú, su rótulo y su ícono. `app/routes.tsx` le suma la página a cada una. Íconos del marco de los tableros
/// (`shared/ui/icons`), los mismos que las tarjetas del Inicio.
export const businessRoutes = {
  home: { path: homeOf("business"), labelKey: "navigation.dashboard", icon: HomeIcon },
  users: { path: "/org/usuarios", permission: "users.read", labelKey: "navigation.users", icon: UsersIcon },
  user: { path: "/org/usuarios/:memberId", permission: "users.read" },
  roles: { path: "/org/roles", permission: "roles.read", labelKey: "navigation.roles", phoneLabelKey: "navigation.rolesShort", icon: KeyIcon },
  newRole: { path: "/org/roles/nuevo", permission: "roles.manage" },
  role: { path: "/org/roles/:roleId", permission: "roles.read" },
  companies: { path: "/org/empresas", permission: "companies.read", labelKey: "navigation.companies", icon: BuildingIcon },
  // B4: la ficha de una empresa también la abre quien ve los miembros de esa empresa (el Administrador de empresa).
  company: { path: "/org/empresas/:companyId", permission: "companies.read", companyPermission: "company.members.read" },
  settings: { path: "/org/configuracion", permission: "settings.read", labelKey: "navigation.settings", icon: SlidersHorizontalIcon },
  publicPage: { path: "/org/pagina", permission: "publicpage.manage", labelKey: "navigation.publicPage", icon: GlobeIcon },
  audit: { path: "/org/auditoria", permission: "audit.read", labelKey: "navigation.audit", icon: ClipboardIcon },
} as const satisfies Record<string, AppRoute>;

export const businessNavigation: NavigationConfig = {
  links: [businessRoutes.home],
  moreTo: "/mas",
  administration: {
    labelKey: "navigation.administration",
    icon: ShieldCheckIcon,
    links: [businessRoutes.companies, businessRoutes.settings, businessRoutes.publicPage, businessRoutes.audit],
    sections: [{ labelKey: "navigation.userManagement", icon: UsersIcon, links: [businessRoutes.users, businessRoutes.roles] }],
  },
};
