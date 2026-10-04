import { Building2, ClipboardList, Globe, House, Key, ShieldCheck, SlidersHorizontal, Users } from "lucide-react";
import type { AppRoute, NavigationConfig } from "./types";
import { homeOf } from "@/tenancy/access";

/// El manifiesto de las rutas de la organización: cada una con su permiso (y su módulo, si es de un módulo) y, si va
/// en el menú, su rótulo y su ícono. `app/routes.tsx` le suma la página a cada una. Íconos del tablero Usuarios (v77),
/// los mismos que las tarjetas del Inicio.
export const businessRoutes = {
  home: { path: homeOf("business"), labelKey: "navigation.dashboard", icon: House },
  users: { path: "/org/usuarios", permission: "users.read", labelKey: "navigation.users", icon: Users },
  user: { path: "/org/usuarios/:memberId", permission: "users.read" },
  roles: { path: "/org/roles", permission: "roles.read", labelKey: "navigation.roles", phoneLabelKey: "navigation.rolesShort", icon: Key },
  newRole: { path: "/org/roles/new", permission: "roles.manage" },
  role: { path: "/org/roles/:roleId", permission: "roles.read" },
  companies: { path: "/org/empresas", permission: "companies.read", labelKey: "navigation.companies", icon: Building2 },
  company: { path: "/org/empresas/:companyId", permission: "companies.read" },
  settings: { path: "/org/configuracion", permission: "settings.read", labelKey: "navigation.settings", icon: SlidersHorizontal },
  publicPage: { path: "/org/pagina", permission: "publicpage.manage", labelKey: "navigation.publicPage", icon: Globe },
  audit: { path: "/org/auditoria", permission: "audit.read", labelKey: "navigation.audit", icon: ClipboardList },
} as const satisfies Record<string, AppRoute>;

export const businessNavigation: NavigationConfig = {
  links: [businessRoutes.home],
  moreTo: "/mas",
  administration: {
    labelKey: "navigation.administration",
    icon: ShieldCheck,
    links: [businessRoutes.companies, businessRoutes.settings, businessRoutes.publicPage, businessRoutes.audit],
    sections: [{ labelKey: "navigation.userManagement", icon: Users, links: [businessRoutes.users, businessRoutes.roles] }],
  },
};
