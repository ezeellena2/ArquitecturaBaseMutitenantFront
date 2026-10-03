import { Building2, Globe2, House, ScrollText, Settings2, SlidersHorizontal, Users } from "lucide-react";
import type { NavigationConfig } from "./types";

export const businessNavigation: NavigationConfig = {
  links: [{ labelKey: "navigation.dashboard", icon: House, to: "/org" }],
  administration: {
    labelKey: "navigation.administration",
    icon: Settings2,
    links: [
      { labelKey: "navigation.companies", icon: Building2, to: "/org/empresas", permission: "companies.read" },
      { labelKey: "navigation.settings", icon: SlidersHorizontal, to: "/org/configuracion", permission: "settings.read" },
      { labelKey: "navigation.publicPage", icon: Globe2, to: "/org/pagina", permission: "publicpage.manage" },
      { labelKey: "navigation.audit", icon: ScrollText, to: "/org/auditoria", permission: "audit.read" },
    ],
    sections: [{
      labelKey: "navigation.userManagement",
      links: [
        { labelKey: "navigation.users", icon: Users, to: "/org/usuarios", permission: "users.read" },
        { labelKey: "navigation.roles", icon: House, to: "/org/roles", permission: "roles.read" },
      ],
    }],
  },
};
