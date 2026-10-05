import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import type { CompanyResponse } from "@/shared/api/types";
import { useReferenceData } from "@/shared/referenceData/useReferenceData";
import { FormField } from "@/shared/ui/FormField";
import { isValidTaxId } from "@/shared/ui/fields/TaxIdField";
import { TimeZoneSelect } from "@/shared/ui/fields/TimeZoneSelect";
import { Input } from "@/shared/ui/input";

/// Decisión 5 del usuario: como el tablero Empresas, «CUIT» solo con el número (se guarda como tipo + número)
/// y «Zona de negocio» que, sin elegir, es la de la organización (la API usa su zona predeterminada).
export interface CompanyDraft {
  name: string;
  taxNumber: string;
  timeZoneId: string;
}

export const emptyCompanyDraft: CompanyDraft = { name: "", taxNumber: "", timeZoneId: "" };

export function draftFromCompany(company: CompanyResponse): CompanyDraft {
  return { name: company.name, taxNumber: company.taxId?.number ?? "", timeZoneId: company.timeZoneId };
}

/// El tipo CUIT del catálogo de referencia, como el registro de empresa.
export function useCuitType() {
  const { data } = useReferenceData();
  return useMemo(() => data?.taxIdTypes
    .filter((type) => type.isEnabled && type.validatorKey === "ar-cuit-mod11"
      && type.countryCode === "AR" && (type.appliesTo === "Company" || type.appliesTo === "Both"))
    .sort((left, right) => (left.sortOrder ?? Number.MAX_SAFE_INTEGER) - (right.sortOrder ?? Number.MAX_SAFE_INTEGER))[0],
  [data]);
}

export function companyPayload(draft: CompanyDraft, cuitCode: string | undefined) {
  return {
    name: draft.name.trim(),
    taxIdType: draft.taxNumber ? cuitCode ?? null : null,
    taxIdNumber: draft.taxNumber || null,
    timeZoneId: draft.timeZoneId || null,
  };
}

/// Lo que el campo tiene que decir después de tocar Guardar: el nombre que falta o el CUIT que no es válido.
export interface CompanyFieldErrors {
  name: boolean;
  taxId: boolean;
}

export function CompanyFields({ draft, onChange, errors }: {
  draft: CompanyDraft;
  onChange: (draft: CompanyDraft) => void;
  errors: CompanyFieldErrors;
}) {
  const { t } = useTranslation("companies");
  return <>
    <div className="grid gap-3.5 md:grid-cols-2">
      {/* Tableros Empresas y Empresa: el nombre que falta lo dice el campo, con el texto del tablero, y no el aviso del
          navegador (el control no lleva `required`; FormField le pone `aria-required`). */}
      <FormField label={t("form.name")} required error={errors.name ? t("form.nameRequired") : undefined}>
        <Input maxLength={120} autoComplete="organization" value={draft.name} onChange={(event) => onChange({ ...draft, name: event.target.value })} />
      </FormField>
      <FormField label={t("form.taxId")} error={errors.taxId ? t("form.taxIdInvalid") : undefined}>
        <Input inputMode="numeric" autoComplete="off" placeholder={t("form.taxIdPlaceholder")} value={draft.taxNumber}
          onChange={(event) => onChange({ ...draft, taxNumber: event.target.value.replace(/\D/g, "").slice(0, 11) })} />
      </FormField>
    </div>
    <div className="grid gap-3.5 md:grid-cols-2">
      <FormField label={t("form.timeZone")}>
        <TimeZoneSelect value={draft.timeZoneId} onChange={(timeZoneId) => onChange({ ...draft, timeZoneId })} placeholder={t("form.organizationTimeZone")} />
      </FormField>
    </div>
  </>;
}

/// «Criterio · Formularios»: el nombre y el CUIT se revisan al tocar Guardar, no mientras se escribe; después del primer
/// error, se corrigen mientras escribís. `reset` vuelve a empezar al abrir el diálogo.
export function useCompanyValidation(draft: CompanyDraft) {
  const cuitType = useCuitType();
  const [checked, setChecked] = useState(false);
  const nameMissing = draft.name.trim() === "";
  const taxIdInvalid = draft.taxNumber !== "" && !isValidTaxId(cuitType, draft.taxNumber);
  return {
    cuitType,
    errors: { name: checked && nameMissing, taxId: checked && taxIdInvalid } satisfies CompanyFieldErrors,
    /** Al tocar Guardar: marca lo que hay que corregir y dice si se puede mandar. */
    validate: () => { setChecked(true); return !nameMissing && !taxIdInvalid; },
    reset: () => setChecked(false),
  };
}
