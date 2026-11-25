import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import type { TFunction } from "i18next";
import { useMemo, useState } from "react";
import { useController, type Control } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { apiErrorMessage } from "@/shared/api/errorMessage";
import { validationConstraints } from "@/shared/api/generated/validation";
import { useFormat, type FormatState } from "@/shared/format/useFormat";
import { useEditForm } from "@/shared/hooks/useEditForm";
import type { PlatformSettingsPartProps } from "@/shared/modules/types";
import { usePlatformSettingsPart } from "@/shared/modules/usePlatformSettingsPart";
import { enabledOptions } from "@/shared/referenceData/referenceData";
import { useReferenceData } from "@/shared/referenceData/useReferenceData";
import { FormError } from "@/shared/ui/FormError";
import { FormField } from "@/shared/ui/FormField";
import { FormSkeleton } from "@/shared/ui/FormSkeleton";
import { NumberField } from "@/shared/ui/fields/NumberField";
import { Picker } from "@/shared/ui/Picker";
import { Section, SectionFields } from "@/shared/ui/Section";
import type { PlatformWhatsAppSettingsResponse } from "../../api/types";
import { fetchPlatformWhatsAppSettings, platformWhatsAppSettingsKey, updatePlatformWhatsAppSettings } from "../api/settings";

const bounds = validationConstraints.UpdatePlatformWhatsAppSettingsHttpRequest;
type DaysField = "chatRetentionDays" | "maxOrganizationChatRetentionDays";
const daysFields: readonly DaysField[] = ["chatRetentionDays", "maxOrganizationChatRetentionDays"];

function partSchema(t: TFunction, format: FormatState) {
  const days = (field: DaysField) => {
    const { minimum: min, maximum: max } = bounds[field];
    return z.number().nullable().refine((value) => value !== null && Number.isInteger(value) && value >= min && value <= max,
      t("whatsapp:settings.validation.between", { min: format.formatInteger(min), max: format.formatInteger(max) }));
  };
  return z.object({ allowedCountries: z.array(z.string()).min(1, t("whatsapp:settings.platform.validation.countries")),
    chatRetentionDays: days("chatRetentionDays"), maxOrganizationChatRetentionDays: days("maxOrganizationChatRetentionDays") });
}
type PartForm = z.infer<ReturnType<typeof partSchema>>;
const serverFields: Record<string, keyof PartForm> = { allowedCountries: "allowedCountries", chatRetentionDays: "chatRetentionDays", maxOrganizationChatRetentionDays: "maxOrganizationChatRetentionDays" };
const valuesOf = (settings: PlatformWhatsAppSettingsResponse): PartForm => ({ allowedCountries: [...settings.allowedCountries],
  chatRetentionDays: settings.chatRetentionDays, maxOrganizationChatRetentionDays: settings.maxOrganizationChatRetentionDays });

/** La sección «WhatsApp» de Plataforma › Configuración (Config-Plat-Base2, 270 y 272): los países que reciben códigos y los
 *  plazos de los chats. Se guarda con «Guardar cambios» de la página, con su propia versión y sin motivo. */
export function PlatformWhatsAppSettingsPart(props: PlatformSettingsPartProps) {
  const { t } = useTranslation(["whatsapp", "common"]);
  const settings = useQuery({ queryKey: platformWhatsAppSettingsKey, queryFn: ({ signal }) => fetchPlatformWhatsAppSettings(signal), meta: { silent: true } });
  if (!settings.data) return <Section title={t("whatsapp:settings.platform.title")} phone="inset">
    {settings.isError ? <FormError message={apiErrorMessage(settings.error, t)} /> : <FormSkeleton zones={1} />}
  </Section>;
  return <PartEditor {...props} settings={settings.data} reload={async () => (await settings.refetch()).data} />;
}

function PartEditor({ settings, reload, register, onChange }: PlatformSettingsPartProps & {
  settings: PlatformWhatsAppSettingsResponse; reload: () => Promise<PlatformWhatsAppSettingsResponse | undefined> }) {
  const { t } = useTranslation(["whatsapp", "common"]);
  const format = useFormat();
  const { data: reference } = useReferenceData();
  const schema = useMemo(() => partSchema(t, format), [t, format]);
  const edit = useEditForm({ read: settings, toValues: valuesOf, resolver: zodResolver(schema) });
  const { form } = edit;
  const countries = useController({ control: form.control, name: "allowedCountries" });
  // El aviso de costo: el último país que se sumó, hasta que se guarda, se descarta o se lo saca.
  const [added, setAdded] = useState<string | null>(null);
  usePlatformSettingsPart({ register, edit, settings, reload, queryKey: platformWhatsAppSettingsKey, serverFields,
    send: (values, version) => updatePlatformWhatsAppSettings({ ...values, version }), onReset: () => setAdded(null) });

  const enabled = enabledOptions(reference?.countries ?? [])
    .sort((left, right) => (left.sortOrder ?? Number.MAX_SAFE_INTEGER) - (right.sortOrder ?? Number.MAX_SAFE_INTEGER) || left.name.localeCompare(right.name, reference?.culture));
  const options = enabled.map((country) => ({ value: country.code, label: country.name,
    description: country.callingCode ? t("whatsapp:settings.platform.callingCode", { code: country.callingCode }) : undefined,
    keywords: country.callingCode ? `${country.code} +${country.callingCode}` : country.code }));
  const nameOf = (code: string) => reference?.countries.find((country) => country.code === code)?.name ?? code;
  const errors = form.formState.errors;
  const help = (field: DaysField) => t(`whatsapp:settings.platform.fieldHelp.${field}`, { min: format.formatInteger(bounds[field].minimum), max: format.formatInteger(bounds[field].maximum) });

  return <Section title={t("whatsapp:settings.platform.title")} help={t("whatsapp:settings.platform.help")} phone="inset">
    <SectionFields className="grid gap-3.5 lg:grid-cols-2 lg:gap-x-5">
      <div className="flex flex-col lg:col-span-2">
        <FormField label={t("whatsapp:settings.platform.fields.allowedCountries")} help={t("whatsapp:settings.platform.fieldHelp.allowedCountries")} error={errors.allowedCountries?.message}>
          <Picker multiple options={options} value={countries.field.value} placeholder={t("whatsapp:settings.platform.noCountries")}
            countLabel={(count) => t("whatsapp:settings.platform.countries", { count })}
            onChange={(next) => {
              const sum = next.find((code) => !countries.field.value.includes(code));
              setAdded(sum ?? (added !== null && next.includes(added) ? added : null));
              form.clearErrors("allowedCountries"); onChange(); countries.field.onChange(next);
            }} />
        </FormField>
        <FormError tone="warning" role="status" className="mt-2" message={added ? t("whatsapp:settings.platform.cost", { country: nameOf(added) }) : null} />
      </div>
      {daysFields.map((field) => <DaysInput key={field} field={field} control={form.control} help={help(field)} error={errors[field]?.message}
        onChange={() => { form.clearErrors(field); onChange(); }} />)}
    </SectionFields>
  </Section>;
}

function DaysInput({ field, control, help, error, onChange }: { field: DaysField; control: Control<PartForm>; help: string; error?: string; onChange: () => void }) {
  const { t } = useTranslation("whatsapp");
  const days = useController({ control, name: field });
  return <FormField label={t(`settings.platform.fields.${field}`)} help={help} error={error}>
    <NumberField name={days.field.name} value={days.field.value} unit={t("settings.units.days", { count: days.field.value ?? 2 })}
      onChange={(next) => { onChange(); days.field.onChange(next); }} />
  </FormField>;
}
