import { describe, expect, it } from "vitest";
import type { AssistantLinkResponse, AssistantRouteKey } from "@/shared/api/types";
import { resolveAssistantLink } from "./assistantLinks";

const context = { scope: { access: "platform" as const, userId: "u", tenantId: null }, hasPermission: () => true };
const link = (routeKey: AssistantRouteKey): AssistantLinkResponse => ({ routeKey, parameters: {}, query: {}, labelKey: "untrusted.label" });
describe("enlaces del asistente", () => {
  it("rechaza rutas desconocidas, otro acceso, falta de permiso e identificadores inválidos", () => {
    expect(resolveAssistantLink(link("constructor" as AssistantRouteKey), context)).toBeNull();
    expect(resolveAssistantLink(link("business.users"), context)).toBeNull();
    expect(resolveAssistantLink(link("platform.accounts"), { ...context, hasPermission: () => false })).toBeNull();
    expect(resolveAssistantLink({ ...link("platform.accounts"), parameters: { userId: "../settings" } }, context)).toBeNull();
  });
  it("recuperaciones siempre enlaza al listado y traduce estados del contrato", () => {
    expect(resolveAssistantLink({ ...link("platform.recoveries"), parameters: { recoveryId: "anything" }, query: { status: "Pending" } }, context)?.to).toBe("/plataforma/recuperaciones?status=Pending");
    expect(resolveAssistantLink({ ...link("platform.organizations"), query: { status: "Pending" } }, context)?.to).toBe("/plataforma/organizaciones?status=PendingApproval");
    expect(resolveAssistantLink({ ...link("business.users"), query: { status: "Pending" } }, { ...context, scope: { ...context.scope, access: "business" } })?.to).toBe("/org/usuarios?state=Invited");
  });
  it("no usa labelKey del servidor y codifica la búsqueda", () => {
    const result = resolveAssistantLink({ ...link("platform.accounts"), query: { search: "a&x=1" } }, context);
    expect(result).toEqual({ to: "/plataforma/cuentas?search=a%26x%3D1", labelKey: "links.platform.accounts" });
  });
  it("una organización personal exige membresía y flujo real inyectado; no inventa página", () => {
    const id = "12345678-1234-1234-1234-123456789abc";
    const personal = { ...context, scope: { ...context.scope, access: "consumer" as const }, organizationIds: [id], onOpenOrganization: () => {} };
    expect(resolveAssistantLink(link("personal.organizations"), personal)).toBeNull();
    expect(resolveAssistantLink({ ...link("personal.organizations"), parameters: { tenantId: id } }, personal)).toEqual({ organizationId: id, labelKey: "links.personal.organizations" });
    expect(resolveAssistantLink({ ...link("personal.organizations"), parameters: { tenantId: id } }, { ...personal, organizationIds: [] })).toBeNull();
  });
});
