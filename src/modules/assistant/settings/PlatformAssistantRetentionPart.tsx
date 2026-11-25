import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { TFunction } from "i18next";
import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { useController } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { useCurrentUser } from "@/auth/useCurrentUser";
import { ApiError } from "@/shared/api/ApiError";
import { apiErrorMessage } from "@/shared/api/errorMessage";
import { applyApiErrorToForm } from "@/shared/api/formErrors";
import { useFormat, type FormatState } from "@/shared/format/useFormat";
import { useEditForm } from "@/shared/hooks/useEditForm";
import type { PlatformSettingsPartHandle, PlatformSettingsPartProps } from "@/shared/modules/types";
import { FormError } from "@/shared/ui/FormError";
import { FormField } from "@/shared/ui/FormField";
import { NumberField } from "@/shared/ui/fields/NumberField";
import type { PlatformAssistantSettingsResponse } from "../api/types";
import type { AssistantScope } from "../api/assistant";
import { assistantSettingsKey, fetchPlatformAssistantSettings, updateAssistantSettings } from "../api/settings";

/** De 1 a 30 días (Config-Plat-Base2). El contrato no publica el tope: el back solo pide 1 o más. */
const retention = { min: 1, max: 30 } as const;

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
  const client = useQueryClient(); const format = useFormat();
  const schema = useMemo(() => partSchema(t, format), [t, format]);
  const { form, version, resetTo, wrote } = useEditForm({ read: settings, toValues: valuesOf, resolver: zodResolver(schema) });
  const days = useController({ control: form.control, name: "retentionDays" });
  const isDirty = form.formState.isDirty;
  const settingsKey = assistantSettingsKey(scope);

  const latest = useRef<Omit<PlatformSettingsPartHandle, "isDirty"> | null>(null);
  useLayoutEffect(() => {
    latest.current = {
      validate: () => form.trigger(),
      save: async () => {
        const values = form.getValues(); const sentVersion = version;
        const { defaultModelId, allowedModelIds, effort, dailyMessageLimit, monthlyOrganizationBudget, personalEnabled } = settings;
        try {
          const result = await updateAssistantSettings(scope, { defaultModelId, allowedModelIds, effort, dailyMessageLimit, personalEnabled,
            monthlyOrganizationBudget: { amount: monthlyOrganizationBudget.amount, currency: monthlyOrganizationBudget.currency },
            retentionDays: values.retentionDays, keyAction: "keep", version: sentVersion }, crypto.randomUUID(), new AbortController().signal);
          form.reset(values);
          await client.invalidateQueries({ queryKey: settingsKey });
          wrote(sentVersion, result.version, client.getQueryData<PlatformAssistantSettingsResponse>(settingsKey));
          return true;
        } catch (error) {
          if (error instanceof ApiError && applyApiErrorToForm(error, form.setError, { retentionDays: "retentionDays" })) return false;
          throw error;
        }
      },
      discard: () => resetTo(settings),
      reload: async () => { const fresh = await reload(); if (fresh) resetTo(fresh); },
    };
  });
  useEffect(() => {
    register({ isDirty, validate: () => latest.current!.validate(), save: () => latest.current!.save(), discard: () => latest.current!.discard(), reload: () => latest.current!.reload() });
  }, [isDirty, register]);
  useEffect(() => () => register(null), [register]);

  return <FormField label={t("settings.retentionPart.label")} error={form.formState.errors.retentionDays?.message}
    help={t("settings.retentionPart.help", { min: format.formatInteger(retention.min), max: format.formatInteger(retention.max) })}>
    <NumberField name={days.field.name} value={days.field.value} unit={t("settings.retentionPart.days", { count: days.field.value ?? 2 })}
      onChange={(next) => { form.clearErrors("retentionDays"); onChange(); days.field.onChange(next); }} />
  </FormField>;
}
