import { Building2, ClipboardList, Globe, House, Key, ShieldCheck, SlidersHorizontal, Users } from "lucide-react";
import type { NavigationConfig } from "./types";

// Íconos del tablero Usuarios (v77), los mismos que las tarjetas del Inicio.
export const businessNavigation: NavigationConfig = {
  links: [{ labelKey: "navigation.dashboard", icon: House, to: "/org" }],
  moreTo: "/mas",
  administration: {
    labelKey: "navigation.administration",
    icon: ShieldCheck,
    links: [
      { labelKey: "navigation.companies", icon: Building2, to: "/org/empresas", permission: "companies.read" },
      { labelKey: "navigation.settings", icon: SlidersHorizontal, to: "/org/configuracion", permission: "settings.read" },
      { labelKey: "navigation.publicPage", icon: Globe, to: "/org/pagina", permission: "publicpage.manage" },
      { labelKey: "navigation.audit", icon: ClipboardList, to: "/org/auditoria", permission: "audit.read" },
    ],
    sections: [{
      labelKey: "navigation.userManagement",
      icon: Users,
      links: [
        { labelKey: "navigation.users", icon: Users, to: "/org/usuarios", permission: "users.read" },
        { labelKey: "navigation.roles", phoneLabelKey: "navigation.rolesShort", icon: Key, to: "/org/roles", permission: "roles.read" },
      ],
    }],
  },
};
