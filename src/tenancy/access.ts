import { accountPagePaths } from "@/shared/api/accountContract";
import type { ApiSchemas, MeResponse, OrganizationSummary } from "@/shared/api/types";

/// El acceso de la sesión, como lo emite el back: persona (`consumer`), empresa (`business`) u operador (`platform`).
/// Es el único lugar que sabe el inicio y la puerta de ingreso de cada uno: un acceso nuevo se suma acá.
export type Access = ApiSchemas["Access"];

/// El 403 de una organización que no se puede usar; cada uno tiene su estado en el tablero Perfil-Suspendido.
export type UnavailableCode = "Tenancy.Tenant.Suspended" | "Tenancy.Tenant.PendingApproval" | "Tenancy.Tenant.Closed";

const homes: Record<Access, string> = { consumer: "/", business: "/org", platform: "/plataforma" };
const businessLogin = "/login/empresa";
const consumerLogin = "/login";

const unavailableCodes: Partial<Record<ApiSchemas["TenantStatus"], UnavailableCode>> = {
  Suspended: "Tenancy.Tenant.Suspended",
  PendingApproval: "Tenancy.Tenant.PendingApproval",
  Closed: "Tenancy.Tenant.Closed",
};

/// El acceso que trae el token (`access`), o `null` si no es uno de los tres.
export function parseAccess(value: unknown): Access | null {
  return value === "consumer" || value === "business" || value === "platform" ? value : null;
}

/// Adonde se va al entrar a cada acceso: persona a `/`, empresa a `/org`, operador a `/plataforma`.
export function homeOf(access: Access): string {
  return homes[access];
}

/// La puerta de ingreso: empresa entra por `/login/empresa`; la persona, y el operador, que no tiene puerta propia, por
/// `/login`.
export function loginPathOf(access: Access | null | undefined): string {
  return access === "business" ? businessLogin : consumerLogin;
}

function isUnder(path: string, root: string): boolean {
  return path === root || path.startsWith(`${root}/`);
}

/// El acceso al que pertenece una ruta, para recuperar la sesión tras F5 o mandar a la puerta correcta. `null` en la
/// cuenta y en la aceptación de términos, que valen en cualquier acceso: ahí manda el que tenía la sesión.
export function accessOfPath(path: string): Access | null {
  if (isUnder(path, homes.business)) return "business";
  if (isUnder(path, homes.platform)) return "platform";
  if (path === accountPagePaths.account || path === accountPagePaths.acceptLegal) return null;
  return "consumer";
}

/// La organización en la que está la sesión de empresa, según `/api/me`.
export function activeOrganization(me: Pick<MeResponse, "activeTenantId" | "organizations"> | undefined): OrganizationSummary | undefined {
  return me?.organizations.find((organization) => organization.id === me.activeTenantId);
}

/// Si se puede entrar a una organización: activa, con la membresía activa y habilitada para elegir.
export function isSelectable(organization: OrganizationSummary): boolean {
  return organization.status === "Active" && organization.memberStatus === "Active" && organization.isSelectable !== false;
}

/// El código del estado no disponible de una organización (suspendida, en espera de aprobación o cerrada), o `null`.
export function unavailableCodeOf(status: ApiSchemas["TenantStatus"]): UnavailableCode | null {
  return unavailableCodes[status] ?? null;
}

/// Si un código de error dice que la organización no está disponible.
export function isUnavailableCode(code: string | null | undefined): code is UnavailableCode {
  return Object.values(unavailableCodes).some((unavailable) => unavailable === code);
}
