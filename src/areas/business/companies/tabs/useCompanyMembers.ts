import type { CompanyMemberState } from "@/shared/api/types";
import { usePagedQuery } from "@/shared/hooks/usePagedQuery";
import { companyMembersQueryKey, fetchCompanyMembers, type CompanyMembersQuery } from "../api/companies";

// Orden del filtro «Estado» del tablero Empresa.
export const memberStates = [undefined, "Active", "Inactive", "PendingDeletion"] as const satisfies readonly (CompanyMemberState | undefined)[];
const memberFilterKeys = ["state", "roleId"] as const;

/// Los miembros de la empresa (paginado-y-listados.md): los filtros, la página, el orden y la búsqueda viven en la URL.
/// La ficha la pide para la cantidad de su pestaña; la pestaña muestra todo lo demás.
export function useCompanyMembers(companyId: string, enabled: boolean) {
  return usePagedQuery({
    filterKeys: memberFilterKeys,
    defaultSort: "displayName",
    toQuery: (page, values): CompanyMembersQuery => ({
      ...page,
      state: values.state === "Expired" ? "Expired" : memberStates.find((item) => item === values.state),
      roleId: values.roleId === "none" ? undefined : values.roleId,
      withoutRoles: values.roleId === "none" ? true : undefined,
    }),
    queryKey: (query) => companyMembersQueryKey(companyId, query), queryFn: (query) => fetchCompanyMembers(companyId, query),
    enabled: enabled && Boolean(companyId), meta: { silent: true },
  });
}

export type CompanyMembersList = ReturnType<typeof useCompanyMembers>;
