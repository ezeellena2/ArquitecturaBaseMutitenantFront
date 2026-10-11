import { describe, expect, it } from "vitest";
import { businessWithoutPermissions, consumerWithoutOrganizations, platformOperator } from "@/test/mocks/currentUsers";
import { assistantAccess, assistantRegistration } from "./registration";

describe("acceso del registro del asistente", () => {
  it("Uso está instalado sólo en Empresa y Plataforma y no amplía el permiso de chat", () => {
    const usage = assistantRegistration.routes.filter((route) => route.path.endsWith("/uso"));
    expect(usage.map((route) => [route.access, route.path])).toEqual([["business", "/org/asistente/uso"], ["platform", "/plataforma/asistente/uso"]]);
    const business = { ...businessWithoutPermissions, features: ["assistant"], effectivePermissions: { ...businessWithoutPermissions.effectivePermissions, organization: ["assistant.configure"] } };
    expect(usage[0].guard(business)).toBe("allowed"); expect(assistantAccess(business, "chat")).toBe("forbidden");
    expect(usage[0].guard({ ...business, features: [] })).toBe("unavailable");
    expect(usage[0].guard({ ...business, effectivePermissions: businessWithoutPermissions.effectivePermissions })).toBe("forbidden");
    expect(usage[1].guard({ ...platformOperator, moduleCapabilities: [{ key: "assistant", available: false, canConfigure: false, canReadUsage: true }] })).toBe("allowed");
  });
  it("Personal pide feature; Empresa pide además permiso efectivo, nunca roles", () => {
    expect(assistantAccess(consumerWithoutOrganizations, "chat")).toBe("unavailable");
    expect(assistantAccess({ ...consumerWithoutOrganizations, features: ["assistant"] }, "chat")).toBe("allowed");
    const business = { ...businessWithoutPermissions, features: ["assistant"] };
    expect(assistantAccess(business, "chat")).toBe("forbidden");
    expect(assistantAccess({ ...business, permissions: ["assistant.use"] }, "chat")).toBe("forbidden");
    expect(assistantAccess({ ...business, effectivePermissions: { ...business.effectivePermissions, organization: ["assistant.use"] } }, "chat")).toBe("allowed");
  });
  it("configuración y uso empresarial no dependen de assistant.use", () => {
    const me = { ...businessWithoutPermissions, features: ["assistant"], effectivePermissions: { ...businessWithoutPermissions.effectivePermissions, organization: ["assistant.configure"] } };
    expect(assistantAccess(me, "chat")).toBe("forbidden");
    expect(assistantAccess(me, "configure")).toBe("allowed");
    expect(assistantAccess(me, "usage")).toBe("allowed");
  });
  it("Plataforma sin instalación da 404; capability instalada conserva gestión sin chat", () => {
    expect(assistantAccess(platformOperator, "configure")).toBe("unavailable");
    const me = { ...platformOperator, moduleCapabilities: [{ key: "assistant", available: false, canConfigure: true, canReadUsage: false }] };
    expect(assistantAccess(me, "chat")).toBe("forbidden");
    expect(assistantAccess(me, "configure")).toBe("allowed");
    expect(assistantAccess(me, "usage")).toBe("forbidden");
    expect(assistantAccess({ ...me, moduleCapabilities: [{ key: "assistant", available: false, canConfigure: false, canReadUsage: true }] }, "usage")).toBe("allowed");
  });
});
