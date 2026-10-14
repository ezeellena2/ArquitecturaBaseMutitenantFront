import { useTranslation } from "react-i18next";
import { companyOptions } from "@/shared/api/resourceOptions";
import { useResourceOptions } from "@/shared/hooks/useResourceOptions";
import { SearchSelect } from "@/shared/ui/SearchSelect";
import type { WhatsAppReferenceResponse } from "../../api/types";

/** El valor de «Toda la organización»: el número no atiende a una empresa en particular (`companyId` vacío). */
export const wholeOrganization = "organization";

/// «Atiende a» (WA-Alta y WA-Admin, «Cambiar a quién atiende»): «Toda la organización», una raya, y las empresas activas,
/// de a 10 con buscador (`shared/api/resourceOptions`). La empresa que ya atiende se muestra aunque no esté en la página.
export function CompanySelect({ id, value, onChange, current, "aria-describedby": describedBy, "aria-invalid": invalid }: {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  current?: WhatsAppReferenceResponse | null;
  "aria-describedby"?: string;
  "aria-invalid"?: boolean;
}) {
  const { t } = useTranslation(["whatsapp", "common"]);
  const companies = useResourceOptions(companyOptions);
  const known = companies.knownItems.find((item) => item.id === value)?.name ?? (current?.id === value ? current.name : undefined);
  return <SearchSelect id={id} value={value} onChange={onChange} remote={companies.remote} selectedLabel={known}
    placeholder={t("whatsapp:numbers.wholeOrganization")} searchLabel={t("common:actions.search")} aria-describedby={describedBy} aria-invalid={invalid}
    options={[{ value: wholeOrganization, label: t("whatsapp:numbers.wholeOrganization") },
      ...companies.items.filter((company) => company.status === "Active").map((company) => ({ value: company.id, label: company.name }))]} />;
}
