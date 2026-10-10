import { describe, expect, it } from "vitest";
import { HomeIcon } from "@/shared/ui/icons";
import type { ModuleRegistration } from "@/shared/modules/types";
import { permissionsOf } from "@/auth/usePermissions";
import { businessWithoutPermissions, platformOperator } from "@/test/mocks/currentUsers";
import { assistantAccess, assistantRegistration } from "@/modules/assistant/registration";
import { platformNavigationWithHome } from "@/layouts/navigation/platform";
import { businessNavigation } from "@/layouts/navigation/business";
import { composeNavigation } from "@/layouts/navigation/useNavigation";

const management: ModuleRegistration = {
  id: "management-test", routes: [
    { access: "platform", path: "/test/config", guard: (me) => assistantAccess(me, "configure"), Page: () => null, navigation: { placement: "administration", labelKey: "configuration", icon: HomeIcon, section: { labelKey: "assistant", icon: HomeIcon } } },
    { access: "platform", path: "/test/usage", guard: (me) => assistantAccess(me, "usage"), Page: () => null, navigation: { placement: "administration", labelKey: "usage", icon: HomeIcon, section: { labelKey: "assistant", icon: HomeIcon } } },
  ],
};
describe("navegación compuesta", () => {
  it("deja Organizaciones, Asistente y Cuentas en el teléfono; escritorio conserva sólo Inicio", () => {
    const me = { ...platformOperator, effectivePermissions: { ...platformOperator.effectivePermissions, platform: [...platformOperator.effectivePermissions.platform, "platform.assistant.use"] }, moduleCapabilities: [{ key: "assistant", available: true, canConfigure: false, canReadUsage: false }] };
    const nav = composeNavigation(platformNavigationWithHome, "platform", me, permissionsOf(me), [assistantRegistration]);
    expect(nav.bottomSections?.map((section) => section.link.path)).toEqual(["/plataforma/organizaciones", "/plataforma/asistente", "/plataforma/cuentas"]);
    expect(nav.moreLinks?.map((link) => link.path)).toContain("/plataforma/recuperaciones");
    expect(nav.moreLinks?.map((link) => link.path)).not.toContain("/plataforma/asistente");
    expect(nav.links.map((link) => link.path)).toEqual(["/plataforma"]);
  });
  it("Más conserva las contribuciones móviles que desbordan las cuatro pestañas", () => {
    const me = { ...platformOperator, moduleCapabilities: [] };
    const extra: ModuleRegistration = { id: "overflow", routes: Array.from({ length: 4 }, (_, index) => ({ access: "platform", path: `/extra/${index}`, guard: () => "allowed", Page: () => null,
      navigation: { placement: "phone", labelKey: "extra", icon: HomeIcon } })) };
    const nav = composeNavigation(platformNavigationWithHome, "platform", me, permissionsOf(me), [extra]);
    expect(nav.bottomSections?.map((section) => section.link.path)).toEqual(["/plataforma/organizaciones", "/extra/0", "/extra/1", "/extra/2"]);
    expect(nav.moreLinks?.map((link) => link.path)).toEqual(["/plataforma/recuperaciones", "/extra/3", "/plataforma/cuentas"]);
  });
  it.each([[true, false, ["/test/config"]], [false, true, ["/test/usage"]], [true, true, ["/test/config", "/test/usage"]]] as const)("la gestión instalada sin chat conserva sólo sus permisos %s/%s", (canConfigure, canReadUsage, paths) => {
    const me = { ...platformOperator, moduleCapabilities: [{ key: "assistant", available: false, canConfigure, canReadUsage }] };
    const nav = composeNavigation(platformNavigationWithHome, "platform", me, permissionsOf(me), [management]);
    expect(nav.administration?.sections?.find((section) => section.labelKey === "assistant")?.links.map((link) => link.path)).toEqual(paths);
  });
  it("Empresa sólo configure ve gestión sin chat; otro módulo conserva sus contribuciones", () => {
    const me = { ...businessWithoutPermissions, features: ["assistant"], effectivePermissions: { ...businessWithoutPermissions.effectivePermissions, organization: ["assistant.configure"] } };
    const module: ModuleRegistration = { ...management, routes: management.routes.map((route) => ({ ...route, access: "business" })) };
    const independent: ModuleRegistration = { id: "other", routes: [{ access: "business", path: "/other", guard: () => "allowed", Page: () => null, navigation: { placement: "administration", icon: HomeIcon, labelKey: "other" } }] };
    const nav = composeNavigation(businessNavigation, "business", me, permissionsOf(me), [assistantRegistration, module, independent]);
    expect(nav.bottomSections).toBeUndefined();
    expect(nav.administration?.sections?.find((section) => section.labelKey === "assistant")?.links).toHaveLength(2);
    expect(nav.administration?.links.map((link) => link.path)).toContain("/other");
    expect(composeNavigation(businessNavigation, "business", me, permissionsOf(me), [independent]).administration?.sections?.find((section) => section.labelKey === "assistant")).toBeUndefined();
  });
});

