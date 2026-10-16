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
import { platformPermissionCatalog } from "./permissionCatalog";

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
    expect(await screen.findByText("Ver el uso del asistente")).toBeVisible();
    expect(screen.getByRole("list", { name: "Permisos" }).children).toHaveLength(12);
    expect(screen.queryByText("Atender consultas")).not.toBeInTheDocument();
  });
});
