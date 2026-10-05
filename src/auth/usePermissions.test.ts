import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import type { MeResponse } from "@/shared/api/types";
import { companyPermissions, organizationPermissions, platformPermissions, permissionsOf } from "./usePermissions";

type Session = Pick<MeResponse, "effectivePermissions" | "features" | "permissions">;

const owner: Session = {
  effectivePermissions: { platform: [], organization: ["users.read", "company.members.read", "company.members.manage"], companies: {} },
  features: [],
};

describe("permissionsOf", () => {
  it("canPlatform lee sólo el mapa de Plataforma, separado de la organización y de la lista plana", () => {
    const account: Session = { ...owner, permissions: ["platform.accounts.read"], effectivePermissions: {
      platform: ["platform.tenants.read"], organization: ["platform.accounts.read", "audit.read"], companies: {},
    } };
    const permissions = permissionsOf(account);
    expect(permissions.canPlatform("platform.tenants.read")).toBe(true);
    expect(permissions.canPlatform("platform.accounts.read")).toBe(false);
    expect(permissions.canPlatform("platform.audit.read")).toBe(false);
    expect(permissionsOf(undefined).canPlatform("platform.tenants.read")).toBe(false);
  });
  it("can mira los permisos de la organización de effectivePermissions, no la lista plana", () => {
    const withFlatList: Session = { ...owner, permissions: ["audit.read"] };
    const permissions = permissionsOf(withFlatList);

    expect(permissions.can("users.read")).toBe(true);
    expect(permissions.can("audit.read")).toBe(false);
    expect(permissionsOf(undefined).can("users.read")).toBe(false);
  });

  it("canInCompany usa los de la organización mientras el mapa por empresa llega vacío", () => {
    const permissions = permissionsOf(owner);

    expect(permissions.canInCompany("delta", "company.members.manage")).toBe(true);
    expect(permissionsOf({ ...owner, effectivePermissions: { platform: [], organization: ["users.read"], companies: {} } })
      .canInCompany("delta", "company.members.read")).toBe(false);
  });

  it("canInCompany usa los de la empresa cuando el mapa la trae", () => {
    // Un Administrador de empresa sin roles de la organización (B4): solo en su empresa.
    const companyAdmin = permissionsOf({ features: [], effectivePermissions: { platform: [],
      organization: [], companies: { delta: ["company.members.read", "company.members.manage"], sur: [] },
    } });

    expect(companyAdmin.canInCompany("delta", "company.members.manage")).toBe(true);
    expect(companyAdmin.canInCompany("sur", "company.members.read")).toBe(false);
    expect(companyAdmin.canInCompany("norte", "company.members.read")).toBe(false);
    expect(companyAdmin.can("users.read")).toBe(false);
  });

  it("hasFeature mira los módulos prendidos del acceso activo", () => {
    const permissions = permissionsOf({ ...owner, features: ["whatsapp"] });

    expect(permissions.hasFeature("whatsapp")).toBe(true);
    expect(permissions.hasFeature("reportes")).toBe(false);
  });
});

// Los códigos tipados del front son los del catálogo del back (Domain/Authorization/Permissions.cs).
const catalog = path.resolve(import.meta.dirname, "../../../ArquitecturaBaseMutitenant/src/ArquitecturaBaseMultitenant.Domain/Authorization/Permissions.cs");
const available = existsSync(catalog);

if (!available && !process.env.CI) {
  throw new Error("El repo hermano ArquitecturaBaseMutitenant es obligatorio para comprobar los códigos de permiso.");
}
if (!available) {
  console.warn("Se omite la paridad de los códigos de permiso en CI: falta el repo hermano ArquitecturaBaseMutitenant.");
}

describe("códigos de permiso", () => {
  it.skipIf(!available)("los nueve de Plataforma son los del catálogo del back", () => {
    const source = readFileSync(path.join(path.dirname(catalog), "PlatformPermissions.cs"), "utf8");
    const codes = [...source.matchAll(/const string \w+ = "([^"]+)";/g)].map((match) => match[1]);
    expect(platformPermissions).toHaveLength(9);
    expect([...platformPermissions].sort()).toEqual(codes.sort());
  });
  it.skipIf(!available)("son los mismos que el catálogo de organización y empresa del back", () => {
    const source = readFileSync(catalog, "utf8");
    const codes = [...source.matchAll(/const string (?!ClaimType\b)\w+ = "([^"]+)";/g)].map((match) => match[1]);

    expect([...organizationPermissions, ...companyPermissions].sort()).toEqual(codes.sort());
    expect(companyPermissions.every((code) => code.startsWith("company."))).toBe(true);
  });
});
