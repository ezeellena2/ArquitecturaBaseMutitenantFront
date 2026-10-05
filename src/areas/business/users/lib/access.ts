import type { OrganizationUserResponse } from "@/shared/api/types";

/// Una empresa de la persona con sus roles, como la manda el guardado de la ficha.
export interface CompanyAssignment {
  companyId: string;
  roleIds: string[];
}

/// Los roles de la organización de una persona, en el orden de la ficha (los de empresa van en sus empresas).
export function organizationRoleIds(user: Pick<OrganizationUserResponse, "roles">): string[] {
  return user.roles.filter((role) => role.scope === "Organization").map((role) => role.id);
}

/// Lo elegido, en el orden de lo guardado: lo que ya estaba conserva su lugar y lo nuevo va al final, en el orden en que
/// se eligió. Así, sacar un rol y volver a ponerlo no cuenta como un cambio.
export function orderLike(saved: readonly (string | undefined)[] | undefined, chosen: readonly string[]): string[] {
  const kept = (saved ?? []).filter((id): id is string => id !== undefined && chosen.includes(id));
  return [...kept, ...chosen.filter((id) => !kept.includes(id))];
}

/// Las empresas de la persona que se pueden cambiar desde la ficha: una inactiva, en la ficha o en el registro de
/// empresas, se conserva como está (tablero Usuario).
export function companyAssignments(
  companies: OrganizationUserResponse["companies"],
  registry: readonly { id: string; status: string }[],
): { preserved: Set<string>; changeable: CompanyAssignment[] } {
  const byId = new Map(registry.map((company) => [company.id, company]));
  const preserved = new Set(companies.filter((company) => company.status !== "Active" || byId.get(company.companyId)?.status === "Inactive")
    .map((company) => company.companyId));
  const changeable = companies.filter((company) => !preserved.has(company.companyId))
    .map((company) => ({ companyId: company.companyId, roleIds: company.roles.map((role) => role.id) }));
  return { preserved, changeable };
}

/// «Sumamos a Ana a Delta S.A.» no lleva otro punto: el nombre ya termina en uno (tablero Usuario).
export function sentence(text: string): string {
  return text.replace(/\.\.$/, ".");
}
