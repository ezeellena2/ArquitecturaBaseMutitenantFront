import { useController, type UseFormReturn } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { FormField } from "@/shared/ui/FormField";
import { TimeZoneSelect } from "@/shared/ui/fields/TimeZoneSelect";
import { Input } from "@/shared/ui/input";

/// Decisión 5 del usuario: como el tablero Empresas, «CUIT» solo con el número (se guarda como tipo + número) y «Zona de
/// negocio» que, sin elegir, es la de la organización (la API usa su zona predeterminada).
export interface CompanyFieldsForm {
  name: string;
  taxNumber: string;
  timeZoneId: string;
}

/// Nombre y CUIT en una fila y «Zona de negocio» debajo, atados al formulario de `CompanyDialog`. Cada error, el del
/// esquema o el que rechaza el back, va debajo de su campo; `onEdit` avisa cada cambio, para que se vaya el error del
/// guardado anterior.
export function CompanyFields({ form, onEdit }: { form: UseFormReturn<CompanyFieldsForm>; onEdit: () => void }) {
  const { t } = useTranslation("companies");
  const { errors } = form.formState;
  const taxNumber = useController({ control: form.control, name: "taxNumber" });
  const timeZone = useController({ control: form.control, name: "timeZoneId" });
  return <>
    <div className="grid gap-3.5 md:grid-cols-2">
      {/* Tableros Empresas y Empresa: el nombre que falta lo dice el campo, con el texto del tablero, y no el aviso del
          navegador (el control no lleva `required`; FormField le pone `aria-required`). */}
      <FormField label={t("form.name")} required error={errors.name?.message}>
        <Input maxLength={120} autoComplete="organization" {...form.register("name", { onChange: onEdit })} />
      </FormField>
      <FormField label={t("form.taxId")} error={errors.taxNumber?.message}>
        <Input inputMode="numeric" autoComplete="off" placeholder={t("form.taxIdPlaceholder")} name={taxNumber.field.name}
          value={taxNumber.field.value} onBlur={taxNumber.field.onBlur}
          onChange={(event) => { taxNumber.field.onChange(event.target.value.replace(/\D/g, "").slice(0, 11)); onEdit(); }} />
      </FormField>
    </div>
    <div className="grid gap-3.5 md:grid-cols-2">
      <FormField label={t("form.timeZone")} error={errors.timeZoneId?.message}>
        <TimeZoneSelect value={timeZone.field.value} onChange={(timeZoneId) => { timeZone.field.onChange(timeZoneId); onEdit(); }}
          placeholder={t("form.organizationTimeZone")} />
      </FormField>
    </div>
  </>;
}
