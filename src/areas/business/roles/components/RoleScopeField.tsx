import { useTranslation } from "react-i18next";
import type { CompanyResponse, RoleScope } from "@/shared/api/types";
import { FormField } from "@/shared/ui/FormField";
import { SearchSelect } from "@/shared/ui/SearchSelect";
import type { RemoteOptions } from "@/shared/hooks/useResourceOptions";
import { roleScopeLabel } from "../columns";

interface RoleScopeFieldProps {
  readonly scope: RoleScope | null;
  readonly companyId: string;
  /** Las empresas de la organización: se ofrecen las activas, y de cualquiera se lee el nombre. */
  readonly companies: readonly Pick<CompanyResponse, "id" | "name" | "status">[];
  readonly onChange: (value: { scope: RoleScope; companyId: string }) => void;
  /** Dónde vale un rol que ya existe no cambia: el mismo campo, deshabilitado («Criterio · Formularios», A11). */
  readonly readOnly?: boolean;
  readonly error?: string;
  readonly remote?: RemoteOptions;
  readonly knownCompanies?: readonly Pick<CompanyResponse, "id" | "name">[];
}

const companyPrefix = "company:";

/// «Vale en» (tableros Rol y M-Rol): toda la organización o una empresa por nombre. «Cada empresa» no se ofrece al crear
/// (queda para la API; enmienda de las ADR 0012 y 0034), pero un rol que ya vale en cada empresa lo dice. Sin asterisco,
/// como el tablero: si falta, lo dice al tocar «Crear rol».
export function RoleScopeField({ scope, companyId, companies, onChange, readOnly = false, error, remote, knownCompanies = companies }: RoleScopeFieldProps) {
  const { t } = useTranslation("roles");
  const companyName = knownCompanies.find((company) => company.id === companyId)?.name;
  // Tableros Rol y M-Rol («Delta S.A. ⌄» apagado): el mismo desplegable, deshabilitado, con fondo y texto grises.
  if (readOnly) return <FormField label={t("roles:fields.scope")}>
    <SearchSelect disabled value="" options={[]} onChange={() => {}} selectedLabel={scope ? roleScopeLabel(scope, t, companyName) : undefined}
      placeholder={t("roles:scope.choose")} searchLabel={t("common:actions.search")} aria-label={t("roles:fields.scope")} />
  </FormField>;

  const value = scope === "Organization" ? scope : scope === "SpecificCompany" && companyId ? `${companyPrefix}${companyId}` : "";
  return <FormField label={t("roles:fields.scope")} error={error}>
    <SearchSelect value={value} onChange={(next) => onChange(next.startsWith(companyPrefix)
      ? { scope: "SpecificCompany", companyId: next.slice(companyPrefix.length) }
      : { scope: "Organization", companyId: "" })} remote={remote} selectedLabel={companyName}
      placeholder={t("roles:scope.choose")} searchLabel={t("common:actions.search")} aria-label={t("roles:fields.scope")}
      options={[{ value: "Organization", label: t("roles:scope.organization"), description: t("roles:scope.organizationDescription") },
        ...companies.filter((company) => company.status === "Active").map((company) => ({ value: `${companyPrefix}${company.id}`, label: company.name }))]} />
  </FormField>;
}
