import { describe, expect, it } from "vitest";
import { findAdministrationEntry, findNavigationPanelEntry } from "./administration";
import { platformNavigation, platformRoutes } from "./platform";

describe("los paneles de Plataforma", () => {
  it.each([
    ["/plataforma", "management", "organizations"],
    ["/plataforma/organizaciones/delta", "management", "organizations"],
    ["/plataforma/cuentas/ana", "management", "accounts"],
    ["/plataforma/legales/nueva", "administration", "legal"],
    ["/plataforma/configuracion", "administration", "settings"],
  ] as const)("encuentra la opción más específica en %s", (path, panel, route) => {
    expect(findNavigationPanelEntry(platformNavigation, path)).toMatchObject({ panel, link: platformRoutes[route] });
  });
  it("el inicio no tapa una opción más específica de Gestión", () => {
    expect(findAdministrationEntry(platformNavigation.management ?? null, "/plataforma/cuentas/ana")?.link).toBe(platformRoutes.accounts);
  });
});
