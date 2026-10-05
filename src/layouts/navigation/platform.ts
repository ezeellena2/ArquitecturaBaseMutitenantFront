import { BuildingIcon, ClipboardIcon, DocumentIcon, GridIcon, KeyIcon, ShieldCheckIcon, SlidersHorizontalIcon, UsersIcon } from "@/shared/ui/icons";
import { homeOf } from "@/tenancy/access";
import type { AppRoute, NavigationConfig } from "./types";

/// Las rutas de Plataforma y su permiso individual: el menú y las guardas usan el mismo manifiesto.
export const platformRoutes = {
  organizations: { path: homeOf("platform"), platformPermission: "platform.tenants.read", labelKey: "navigation.organizations", icon: BuildingIcon },
  organization: { path: "/plataforma/organizaciones/:id", platformPermission: "platform.tenants.read" },
  accounts: { path: "/plataforma/cuentas", platformPermission: "platform.accounts.read", labelKey: "navigation.accounts", icon: UsersIcon },
  account: { path: "/plataforma/cuentas/:id", platformPermission: "platform.accounts.read" },
  recoveries: { path: "/plataforma/recuperaciones", platformPermission: "platform.recoveries.manage", labelKey: "navigation.recoveries", icon: KeyIcon },
  legal: { path: "/plataforma/legales", platformPermission: "platform.legal.manage", labelKey: "navigation.legalDocuments", icon: DocumentIcon },
  newLegal: { path: "/plataforma/legales/nueva", platformPermission: "platform.legal.manage" },
  audit: { path: "/plataforma/auditoria", platformPermission: "platform.audit.read", labelKey: "navigation.audit", icon: ClipboardIcon },
  settings: { path: "/plataforma/configuracion", platformPermission: "platform.settings.manage", labelKey: "navigation.settings", icon: SlidersHorizontalIcon },
} as const satisfies Record<string, AppRoute>;

export const platformNavigation: NavigationConfig = {
  links: [],
  breadcrumbRoot: { path: homeOf("platform"), labelKey: "navigation.platform" },
  management: {
    labelKey: "navigation.management", icon: GridIcon,
    links: [platformRoutes.organizations, platformRoutes.accounts, platformRoutes.recoveries],
  },
  administration: {
    labelKey: "navigation.administration", icon: ShieldCheckIcon,
    links: [platformRoutes.audit, platformRoutes.legal, platformRoutes.settings],
  },
};
