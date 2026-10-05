import { useQuery } from "@tanstack/react-query";
import { fetchAssignableCompanyRoles } from "../api/companies";

/// Los roles de la empresa, en una sola consulta (B4: por la ruta de la empresa si se ven sus miembros): los que se
/// asignan acá (los de cada empresa y los propios), para los filtros y los diálogos de Miembros, y los propios de esta
/// empresa, que son la pestaña Roles. El rol Dueño no se asigna en una empresa.
export function useCompanyRoles(companyId: string, { canReadRoles, canReadMembers }: { canReadRoles: boolean; canReadMembers: boolean }) {
  const query = useQuery({ queryKey: ["roles", "company-options", companyId, canReadMembers], queryFn: () => fetchAssignableCompanyRoles(companyId, canReadMembers),
    enabled: (canReadRoles || canReadMembers) && Boolean(companyId), meta: { silent: true } });
  const active = (query.data?.items ?? []).filter((role) => !role.isSystemRole || role.name !== "TenantAdmin");
  return {
    query,
    assignable: active.filter((role) => role.scope === "AnyCompany" || role.companyId === companyId),
    own: active.filter((role) => role.scope === "SpecificCompany" && role.companyId === companyId),
  };
}

export type CompanyRoles = ReturnType<typeof useCompanyRoles>;
