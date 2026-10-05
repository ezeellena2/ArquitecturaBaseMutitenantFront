import { useTranslation } from "react-i18next";
import type { CompanyResponse, RoleScope } from "@/shared/api/types";
import { FormField } from "@/shared/ui/FormField";
import { ReadOnlyField } from "@/shared/ui/ReadOnlyField";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { roleScopeLabel } from "../columns";

interface RoleScopeFieldProps {
  readonly scope: RoleScope | null;
  readonly companyId: string;
  /** Las empresas de la organización: se ofrecen las activas, y de cualquiera se lee el nombre. */
  readonly companies: readonly Pick<CompanyResponse, "id" | "name" | "status">[];
  readonly onChange: (value: { scope: RoleScope; companyId: string }) => void;
  /** Dónde vale un rol que ya existe no cambia: se lee como texto. */
  readonly readOnly?: boolean;
  readonly error?: string;
}

const companyPrefix = "company:";

/// «Vale en» (tableros Rol y M-Rol): toda la organización o una empresa por nombre. «Cada empresa» no se ofrece al crear
/// (queda para la API; enmienda de las ADR 0012 y 0034), pero un rol que ya vale en cada empresa lo dice. Sin asterisco,
/// como el tablero: si falta, lo dice al tocar «Crear rol».
export function RoleScopeField({ scope, companyId, companies, onChange, readOnly = false, error }: RoleScopeFieldProps) {
  const { t } = useTranslation("roles");
  const companyName = companies.find((company) => company.id === companyId)?.name;
  if (readOnly) return <ReadOnlyField label={t("roles:fields.scope")}>{scope ? roleScopeLabel(scope, t, companyName) : null}</ReadOnlyField>;

  const value = scope === "Organization" ? scope : scope === "SpecificCompany" && companyId ? `${companyPrefix}${companyId}` : "";
  return <FormField label={t("roles:fields.scope")} error={error}>
    <Select value={value} onValueChange={(next) => onChange(next.startsWith(companyPrefix)
      ? { scope: "SpecificCompany", companyId: next.slice(companyPrefix.length) }
      : { scope: "Organization", companyId: "" })}>
      <SelectTrigger className="w-full" aria-label={t("roles:fields.scope")}><SelectValue placeholder={t("roles:scope.choose")} /></SelectTrigger>
      <SelectContent position="popper">
        <SelectItem value="Organization" description={t("roles:scope.organizationDescription")}>{t("roles:scope.organization")}</SelectItem>
        {companies.filter((company) => company.status === "Active").map((company) => <SelectItem key={company.id} value={`${companyPrefix}${company.id}`}>{company.name}</SelectItem>)}
      </SelectContent>
    </Select>
  </FormField>;
}
