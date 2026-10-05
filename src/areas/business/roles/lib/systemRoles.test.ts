import { describe, expect, it } from "vitest";
import { displayRoleDescription, displayRoleName } from "./systemRoles";

const t = (key: string) => `«${key}»`;
const role = (name: string, isSystemRole: boolean, description: string | null = null) => ({ name, isSystemRole, description });

describe("systemRoles", () => {
  it("los roles de sistema se muestran con su nombre traducido; los propios, como se llaman", () => {
    expect(displayRoleName(role("TenantAdmin", true), t)).toBe("«roles:systemRoles.owner»");
    expect(displayRoleName(role("CompanyAdmin", true), t)).toBe("«roles:systemRoles.companyAdmin»");
    expect(displayRoleName(role("Solo lectura", false), t)).toBe("Solo lectura");
    // Un nombre interno solo se traduce si el rol es de sistema.
    expect(displayRoleName(role("TenantAdmin", false), t)).toBe("TenantAdmin");
  });

  it("la descripción es la del back; si un rol de sistema no la trae, la suya; si no hay, ninguna", () => {
    expect(displayRoleDescription(role("TenantAdmin", true, "Todo."), t)).toBe("Todo.");
    expect(displayRoleDescription(role("TenantAdmin", true), t)).toBe("«roles:systemRoles.ownerDescription»");
    expect(displayRoleDescription(role("CompanyAdmin", true), t)).toBe("«roles:systemRoles.companyAdminDescription»");
    expect(displayRoleDescription(role("Solo lectura", false), t)).toBeNull();
  });
});
