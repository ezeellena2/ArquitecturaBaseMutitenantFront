import { screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { moduleComposition } from "@/app/moduleComposition";
import { platformPermissions } from "@/auth/usePermissions";
import { changeCulture, configureI18n } from "@/shared/i18n";
import { ModuleRegistryProvider } from "@/shared/modules/ModuleRegistry";
import es from "@/locales/es/platformAccounts.json";
import en from "@/locales/en/platformAccounts.json";
import { referenceDataFixture } from "@/test/mocks/handlers";
import { renderWithProviders } from "@/test/utils/renderWithProviders";
import { AccountPermissionsTab } from "../tabs/AccountPermissionsTab";
import i18n from "i18next";
import { platformPermissionsFixture } from "@/test/mocks/platformPermissions";
import { platformPermissionCatalog, platformPermissionGroups } from "./permissionCatalog";

beforeEach(async () => {
  await configureI18n(referenceDataFixture().cultures);
  await changeCulture("es-AR");
});

// R03 (ADR 0048): los permisos de un operador son los del núcleo y los de los módulos instalados, con los textos del módulo.
describe("catálogo de permisos de un operador", () => {
  it("con los módulos instalados son catorce, en el orden de Cuenta-Plat", () => {
    const codes = platformPermissionCatalog(moduleComposition).map((permission) => permission.code);
    expect(codes).toHaveLength(14);
    expect(codes.slice(0, 8)).toEqual(platformPermissions.filter((code) => code !== "platform.settings.manage"));
    expect(codes.at(-1)).toBe("platform.settings.manage");
    expect(codes).toEqual(expect.arrayContaining(["platform.whatsapp.manage", "platform.whatsapp.attend", "platform.assistant.use", "platform.assistant.configure", "platform.assistant.read"]));
  });

  it("sin un módulo, sus permisos no aparecen y el núcleo no tiene textos suyos", async () => {
    const withoutWhatsApp = moduleComposition.filter((module) => module.id !== "whatsapp");
    expect(platformPermissionCatalog(withoutWhatsApp).map((permission) => permission.code).filter((code) => code.startsWith("platform.whatsapp."))).toEqual([]);
    expect(platformPermissionCatalog([]).map((permission) => permission.code)).toEqual([...platformPermissions]);
    for (const catalog of [es.permissions, en.permissions]) expect(Object.keys(catalog).sort()).toEqual([...platformPermissions].sort());

    renderWithProviders(<ModuleRegistryProvider value={withoutWhatsApp}><AccountPermissionsTab permissions={["platform.whatsapp.attend"]} /></ModuleRegistryProvider>);
    // Sin el módulo, la ficha no nombra sus permisos ni su área, aunque el operador los tenga guardados.
    expect(await screen.findByRole("table", { name: "Permisos" })).toBeVisible();
    expect(screen.queryByRole("button", { name: "Abrir o cerrar WhatsApp" })).not.toBeInTheDocument();
    expect(screen.queryByText("Atender consultas")).not.toBeInTheDocument();
  });

  // 260 (Cuentas-Base2 y Cuenta-Plat-Base2): las áreas, en el orden del catálogo, con los nombres del front y, del back, solo
  // lo que incluye cada permiso y si quien pide lo puede dar.
  it("arma las áreas de un operador con lo incluido y lo que se puede dar", () => {
    const groups = platformPermissionGroups(platformPermissionCatalog(moduleComposition), platformPermissionsFixture(["platform.settings.manage"]), i18n.t);
    expect(groups.map((group) => group.name)).toEqual(["Organizaciones", "Cuentas", "Recuperaciones", "Documentos legales", "Operadores", "Auditoría", "WhatsApp", "Asistente", "Configuración"]);
    const accounts = groups.find((group) => group.area === "platform.accounts")!;
    expect(accounts.permissions.map((permission) => [permission.name, permission.includes])).toEqual([["Ver cuentas", []], ["Administrar cuentas", ["platform.accounts.read"]]]);
    expect(groups.at(-1)!.permissions[0]).toMatchObject({ code: "platform.settings.manage", grantable: false });
    // Sin la respuesta del back, nada incluye nada y el back decide al guardar.
    expect(platformPermissionGroups(platformPermissionCatalog(moduleComposition), undefined, i18n.t)[1].permissions[1]).toMatchObject({ includes: [], grantable: true });
  });
});
