import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import type { TFunction } from "i18next";
import { useMemo } from "react";
import { useController } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { useCurrentUser } from "@/auth/useCurrentUser";
import { apiErrorMessage } from "@/shared/api/errorMessage";
import { validationConstraints } from "@/shared/api/generated/validation";
import { useFormat, type FormatState } from "@/shared/format/useFormat";
import { useEditForm } from "@/shared/hooks/useEditForm";
import type { PlatformSettingsPartProps } from "@/shared/modules/types";
import { usePlatformSettingsPart } from "@/shared/modules/usePlatformSettingsPart";
import { FormError } from "@/shared/ui/FormError";
import { FormField } from "@/shared/ui/FormField";
import { NumberField } from "@/shared/ui/fields/NumberField";
import type { PlatformAssistantSettingsResponse } from "../api/types";
import { assistantStateQueryKey, type AssistantScope } from "../api/assistant";
import { assistantSettingsKey, fetchPlatformAssistantSettings, updateAssistantSettings } from "../api/settings";

/** De 1 a 30 días (Config-Plat-Base2), como los publica el contrato y los valida el back. */
const bounds = validationConstraints.UpdatePlatformAssistantSettingsHttpRequest.retentionDays;
const retention = { min: bounds.minimum, max: bounds.maximum } as const;

function partSchema(t: TFunction, format: FormatState) {
  return z.object({ retentionDays: z.number().nullable().refine((value) => value !== null && Number.isInteger(value) && value >= retention.min && value <= retention.max,
    t("assistant:settings.retentionPart.validation", { min: format.formatInteger(retention.min), max: format.formatInteger(retention.max) })) });
}
type PartForm = z.infer<ReturnType<typeof partSchema>>;
const valuesOf = (settings: PlatformAssistantSettingsResponse): PartForm => ({ retentionDays: settings.retentionDays });

/** «Conversaciones del Inicio» en «Privacidad y retención» de Plataforma › Configuración (Config-Plat-Base2, 272): el
 *  `retentionDays` del asistente. Su guardado manda la configuración entera como se leyó, con la clave como está. */
export function PlatformAssistantRetentionPart(props: PlatformSettingsPartProps) {
  const { t } = useTranslation(["assistant", "common"]);
  const { data: me } = useCurrentUser();
  // La misma lectura que Asistente › Configuración de Plataforma.
  const scope: AssistantScope = { access: "platform", tenantId: me?.activeTenantId ?? null, userId: me?.id ?? "" };
  const settings = useQuery({ queryKey: assistantSettingsKey(scope), queryFn: ({ signal }) => fetchPlatformAssistantSettings(signal), meta: { silent: true } });
  if (settings.isError && !settings.data) return <FormError message={apiErrorMessage(settings.error, t)} />;
  if (!settings.data) return null;
  return <PartEditor {...props} scope={scope} settings={settings.data} reload={async () => (await settings.refetch()).data} />;
}

function PartEditor({ scope, settings, reload, register, onChange }: PlatformSettingsPartProps & { scope: AssistantScope;
  settings: PlatformAssistantSettingsResponse; reload: () => Promise<PlatformAssistantSettingsResponse | undefined> }) {
  const { t } = useTranslation("assistant");
  const format = useFormat();
  const schema = useMemo(() => partSchema(t, format), [t, format]);
  const edit = useEditForm({ read: settings, toValues: valuesOf, resolver: zodResolver(schema) });
  const { form } = edit;
  const days = useController({ control: form.control, name: "retentionDays" });
  usePlatformSettingsPart({ register, edit, settings, reload, queryKey: assistantSettingsKey(scope), serverFields: { retentionDays: "retentionDays" },
    // El Inicio dice el plazo en la (i) del historial y en el diálogo de retención: lo relee al volver.
    shownIn: [assistantStateQueryKey(scope)],
    send: (values, version) => {
      const { defaultModelId, allowedModelIds, effort, dailyMessageLimit, monthlyOrganizationBudget, personalEnabled } = settings;
      return updateAssistantSettings(scope, { defaultModelId, allowedModelIds, effort, dailyMessageLimit, personalEnabled,
        monthlyOrganizationBudget: { amount: monthlyOrganizationBudget.amount, currency: monthlyOrganizationBudget.currency },
        retentionDays: values.retentionDays, keyAction: "keep", version }, crypto.randomUUID(), new AbortController().signal);
    } });

  return <FormField label={t("settings.retentionPart.label")} error={form.formState.errors.retentionDays?.message}
    help={t("settings.retentionPart.help", { min: format.formatInteger(retention.min), max: format.formatInteger(retention.max) })}>
    <NumberField name={days.field.name} value={days.field.value} unit={t("settings.retentionPart.days", { count: days.field.value ?? 2 })}
      onChange={(next) => { form.clearErrors("retentionDays"); onChange(); days.field.onChange(next); }} />
  </FormField>;
}
