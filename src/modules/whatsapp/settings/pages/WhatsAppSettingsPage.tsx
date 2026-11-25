import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { TFunction } from "i18next";
import { useMemo, useState } from "react";
import { useController } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { z } from "zod";
import { usePermissions } from "@/auth/usePermissions";
import { ApiError } from "@/shared/api/ApiError";
import { applyApiErrorToForm } from "@/shared/api/formErrors";
import { validationConstraints } from "@/shared/api/generated/validation";
import { useFormat, type FormatState } from "@/shared/format/useFormat";
import { useEditForm } from "@/shared/hooks/useEditForm";
import { useEditPage } from "@/shared/hooks/useEditPage";
import { Button } from "@/shared/ui/button";
import { FormField } from "@/shared/ui/FormField";
import { FormSkeleton } from "@/shared/ui/FormSkeleton";
import { LoadErrorPage } from "@/shared/ui/LoadErrorPage";
import { NumberField } from "@/shared/ui/fields/NumberField";
import { Page } from "@/shared/ui/Page";
import { Section, SectionFields } from "@/shared/ui/Section";
import type { WhatsAppOrganizationSettingsResponse } from "../../api/types";
import { fetchOrganizationWhatsAppSettings, organizationWhatsAppSettingsKey, updateOrganizationWhatsAppSettings } from "../api/settings";

/** El plazo de los chats, de 1 a 3650 días (B18). La respuesta no trae el máximo de la plataforma: el front usa el del
 *  contrato, que es el máximo que la plataforma puede fijar; si la plataforma bajó el suyo, el back lo dice en el campo. */
const bounds = validationConstraints.UpdateWhatsAppOrganizationSettingsHttpRequest.chatRetentionDays;

function settingsSchema(t: TFunction, format: FormatState) {
  const range = { min: format.formatInteger(bounds.minimum), max: format.formatInteger(bounds.maximum) };
  return z.object({ chatRetentionDays: z.number().nullable() }).superRefine(({ chatRetentionDays: value }, context) => {
    if (value !== null && Number.isInteger(value) && value >= bounds.minimum && value <= bounds.maximum) return;
    // Tablero WA-Config-Base2: debajo de 1, «Fuera de rango»; arriba del máximo, «Más que el máximo de la plataforma».
    const platformMaximum = value !== null && value > bounds.maximum;
    context.addIssue({ code: "custom", path: ["chatRetentionDays"], message: t(platformMaximum ? "whatsapp:settings.validation.platformMaximum" : "whatsapp:settings.validation.between", range) });
  });
}
type SettingsForm = z.infer<ReturnType<typeof settingsSchema>>;
const serverFields: Record<string, keyof SettingsForm> = { chatRetentionDays: "chatRetentionDays" };
const valuesFromSettings = (settings: WhatsAppOrganizationSettingsResponse): SettingsForm => ({ chatRetentionDays: settings.chatRetentionDays });

/** Administración › WhatsApp › Configuración (WA-Config-Base2 y M-WA-Config-Base2, 272): cuánto se guardan los chats. */
export function WhatsAppSettingsPage() {
  const { t } = useTranslation("whatsapp");
  const settings = useQuery({ queryKey: organizationWhatsAppSettingsKey, queryFn: ({ signal }) => fetchOrganizationWhatsAppSettings(signal), meta: { silent: true, blocksView: true } });
  if (settings.isError && !settings.data) return <LoadErrorPage screen={t("settings.title")} onRetry={() => { void settings.refetch(); }} />;
  if (!settings.data) return <Page title={t("settings.title")} summary={t("settings.summary")}><FormSkeleton zones={1} /></Page>;
  return <SettingsEditor settings={settings.data} reload={async () => (await settings.refetch()).data} />;
}

function SettingsEditor({ settings, reload }: { settings: WhatsAppOrganizationSettingsResponse; reload: () => Promise<WhatsAppOrganizationSettingsResponse | undefined> }) {
  const { t } = useTranslation("whatsapp");
  const client = useQueryClient();
  const format = useFormat();
  const { can } = usePermissions();
  const canManage = can("settings.manage");
  const schema = useMemo(() => settingsSchema(t, format), [t, format]);
  const { form, version, resetTo, wrote } = useEditForm({ read: settings, toValues: valuesFromSettings, resolver: zodResolver(schema) });
  const days = useController({ control: form.control, name: "chatRetentionDays" });
  const [failure, setFailure] = useState<unknown>();
  const isDirty = canManage && form.formState.isDirty;
  const edit = useEditPage({
    isDirty, error: failure,
    onSeeNew: () => { void reload().then((fresh) => { if (fresh) resetTo(fresh); setFailure(undefined); }); },
    onContinueEditing: () => setFailure(undefined),
    conflict: { message: t("settings.conflict.message"), seeNew: t("settings.conflict.seeNew") },
  });
  const save = useMutation({ mutationFn: updateOrganizationWhatsAppSettings });

  const submit = form.handleSubmit((values) => {
    setFailure(undefined);
    const sentVersion = version;
    save.mutate({ chatRetentionDays: values.chatRetentionDays, version: sentVersion }, {
      onSuccess: async (result) => {
        form.reset(values); toast.success(t("settings.saved"));
        await client.invalidateQueries({ queryKey: organizationWhatsAppSettingsKey });
        wrote(sentVersion, result.version, client.getQueryData<WhatsAppOrganizationSettingsResponse>(organizationWhatsAppSettingsKey));
      },
      onError: (error) => { if (!(error instanceof ApiError && applyApiErrorToForm(error, form.setError, serverFields))) setFailure(error); },
    });
  });
  function discard() { resetTo(settings); setFailure(undefined); }

  const value = days.field.value;
  return <>
    <Page title={t("settings.title")} summary={t("settings.summary")} banner={edit.banner}
      actions={canManage ? <>
        <Button type="button" variant="outline" onClick={discard}>{t("settings.discard")}</Button>
        <Button type="submit" form="whatsapp-settings-editor" disabled={!isDirty} pending={save.isPending} pendingLabel={t("settings.saving")}>{t("settings.save")}</Button>
      </> : undefined}>
      {edit.formError}
      <form id="whatsapp-settings-editor" noValidate aria-label={t("settings.title")} onSubmit={(event) => { void submit(event); }}>
        <Section title={t("settings.chatsTitle")} phone="inset"><SectionFields className="grid gap-3.5 lg:grid-cols-2 lg:gap-x-5">
          <FormField label={t("settings.fields.chatRetentionDays")} error={form.formState.errors.chatRetentionDays?.message}
            help={t("settings.help.chatRetentionDays", { min: format.formatInteger(bounds.minimum), max: format.formatInteger(bounds.maximum) })}>
            <NumberField name={days.field.name} value={value} unit={t("settings.units.days", { count: value ?? 2 })}
              disabled={!canManage} disabledReason={canManage ? undefined : t("settings.readOnly")}
              onChange={(next) => { form.clearErrors("chatRetentionDays"); setFailure(undefined); days.field.onChange(next); }} />
          </FormField>
        </SectionFields></Section>
      </form>
    </Page>
    {edit.leaveDialog}
  </>;
}
