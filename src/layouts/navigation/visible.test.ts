import { BarChart3, House, Shield } from "lucide-react";
import { describe, expect, it } from "vitest";
import { permissionsOf } from "@/auth/usePermissions";
import { businessNavigation, businessRoutes } from "./business";
import { platformNavigation, platformRoutes } from "./platform";
import { platformPermissions } from "@/auth/usePermissions";
import type { AppRoute, NavigationConfig } from "./types";
import { visibleNavigation } from "./visible";

const reports = { path: "/org/reportes", permission: "audit.read", feature: "reportes", labelKey: "navigation.audit", icon: BarChart3 } as const;
const navigation: NavigationConfig = {
  links: [{ path: "/org", labelKey: "navigation.dashboard", icon: House }, reports],
  administration: { labelKey: "navigation.administration", icon: Shield, links: [businessRoutes.audit], sections: [
    { labelKey: "navigation.userManagement", icon: Shield, links: [businessRoutes.users, businessRoutes.roles] },
  ] },
};

function session(organization: string[], features: string[] = []) {
  return permissionsOf({ features, effectivePermissions: { platform: [], organization, companies: {} } });
}

describe("visibleNavigation", () => {
  it("los dos paneles de Plataforma usan el manifiesto y cada enlace exige sólo su permiso", () => {
    const links = [...(platformNavigation.management?.links ?? []), ...(platformNavigation.administration?.links ?? [])];
    expect(links).toHaveLength(6);
    expect(links.every((link) => Object.values<AppRoute>(platformRoutes).includes(link))).toBe(true);
    for (const permission of platformPermissions) {
      const shown = visibleNavigation(platformNavigation, permissionsOf({ features: [], effectivePermissions: {
        platform: [permission], organization: [], companies: {},
      } }));
      const visible = [...(shown.management?.links ?? []), ...(shown.administration?.links ?? [])];
      expect(visible).toEqual(links.filter((link) => link.platformPermission === permission));
      expect(Boolean(shown.management)).toBe(links.some((link) => platformNavigation.management?.links.includes(link) && link.platformPermission === permission));
      expect(Boolean(shown.administration)).toBe(links.some((link) => platformNavigation.administration?.links.includes(link) && link.platformPermission === permission));
    }
    const empty = visibleNavigation(platformNavigation, session(["audit.read", "settings.manage"]));
    expect(empty.management).toBeNull();
    expect(empty.administration).toBeNull();
  });
  it("deja cada enlace solo con su permiso y su módulo", () => {
    const visible = visibleNavigation(navigation, session(["audit.read", "users.read"]));

    expect(visible.links.map((link) => link.path)).toEqual(["/org"]);
    expect(visible.administration?.links.map((link) => link.path)).toEqual(["/org/auditoria"]);
    expect(visible.administration?.sections?.[0].links.map((link) => link.path)).toEqual(["/org/usuarios"]);
    expect(visibleNavigation(navigation, session(["audit.read"], ["reportes"])).links.map((link) => link.path)).toEqual(["/org", "/org/reportes"]);
  });

  it("saca las secciones vacías y el panel entero si no queda nada", () => {
    expect(visibleNavigation(navigation, session(["audit.read"])).administration?.sections).toEqual([]);
    expect(visibleNavigation(navigation, session([])).administration).toBeNull();
  });

  it("el menú de la organización son rutas del manifiesto, con su permiso", () => {
    const panel = businessNavigation.administration;
    const links = [...businessNavigation.links, ...(panel?.links ?? []), ...(panel?.sections ?? []).flatMap((section) => section.links)];

    expect(links.every((link) => Object.values<AppRoute>(businessRoutes).includes(link))).toBe(true);
  });
});
