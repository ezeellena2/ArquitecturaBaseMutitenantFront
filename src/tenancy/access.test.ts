import { describe, expect, it } from "vitest";
import type { MeResponse, OrganizationSummary } from "@/shared/api/types";
import { accessOfPath, activeOrganization, homeOf, isSelectable, isUnavailableCode, loginPathOf, parseAccess, unavailableCodeOf } from "./access";

const organization: OrganizationSummary = { id: "delta", name: "Grupo Delta", roleName: "Dueño", status: "Active", memberStatus: "Active", isSelectable: true };

describe("access", () => {
  it("lee el acceso del token y descarta lo que no es un acceso", () => {
    expect(parseAccess("consumer")).toBe("consumer");
    expect(parseAccess("business")).toBe("business");
    expect(parseAccess("platform")).toBe("platform");
    expect(parseAccess("Business")).toBeNull();
    expect(parseAccess(undefined)).toBeNull();
    expect(parseAccess(42)).toBeNull();
  });

  it("da el inicio de cada acceso", () => {
    expect(homeOf("consumer")).toBe("/");
    expect(homeOf("business")).toBe("/org");
    expect(homeOf("platform")).toBe("/plataforma");
  });

  // El operador no tiene puerta propia: entra por cualquiera de las dos.
  it("da la puerta de ingreso de cada acceso", () => {
    expect(loginPathOf("business")).toBe("/login/empresa");
    expect(loginPathOf("consumer")).toBe("/login");
    expect(loginPathOf("platform")).toBe("/login");
    expect(loginPathOf(null)).toBe("/login");
  });

  it("sabe de qué acceso es cada ruta; la cuenta y los términos valen en cualquiera", () => {
    expect(accessOfPath("/org")).toBe("business");
    expect(accessOfPath("/org/usuarios/abc")).toBe("business");
    expect(accessOfPath("/organizaciones")).toBe("consumer");
    expect(accessOfPath("/plataforma")).toBe("platform");
    expect(accessOfPath("/plataforma/cuentas")).toBe("platform");
    expect(accessOfPath("/")).toBe("consumer");
    expect(accessOfPath("/cuenta")).toBeNull();
    expect(accessOfPath("/aceptar-terminos")).toBeNull();
  });

  it("encuentra la organización activa de la sesión", () => {
    const me = { activeTenantId: "delta", organizations: [{ ...organization, id: "beta", name: "Beta" }, organization] } as Pick<MeResponse, "activeTenantId" | "organizations">;

    expect(activeOrganization(me)?.name).toBe("Grupo Delta");
    expect(activeOrganization({ ...me, activeTenantId: null })).toBeUndefined();
    expect(activeOrganization(undefined)).toBeUndefined();
  });

  it("una organización se puede elegir si está activa, con la membresía activa y habilitada", () => {
    expect(isSelectable(organization)).toBe(true);
    expect(isSelectable({ ...organization, status: "Suspended" })).toBe(false);
    expect(isSelectable({ ...organization, memberStatus: "Inactive" })).toBe(false);
    expect(isSelectable({ ...organization, isSelectable: false })).toBe(false);
    expect(isSelectable({ ...organization, isSelectable: undefined })).toBe(true);
  });

  // Tablero Perfil-Suspendido: cada estado no disponible tiene su código y su pantalla.
  it("da el código de una organización que no está disponible", () => {
    expect(unavailableCodeOf("Suspended")).toBe("Tenancy.Tenant.Suspended");
    expect(unavailableCodeOf("PendingApproval")).toBe("Tenancy.Tenant.PendingApproval");
    expect(unavailableCodeOf("Closed")).toBe("Tenancy.Tenant.Closed");
    expect(unavailableCodeOf("Active")).toBeNull();
    expect(unavailableCodeOf("Provisioning")).toBeNull();
    expect(isUnavailableCode("Tenancy.Tenant.Closed")).toBe(true);
    expect(isUnavailableCode("Tenancy.Access.NotMember")).toBe(false);
    expect(isUnavailableCode(undefined)).toBe(false);
  });
});
