import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Sparkles } from "lucide-react";
import { useEffect, useEffectEvent, useMemo, useRef, useState } from "react";
import { Controller, useWatch } from "react-hook-form";
import { Trans, useTranslation } from "react-i18next";
import { useNavigation, useSearchParams } from "react-router";
import { toast } from "sonner";
import { ApiError } from "@/shared/api/ApiError";
import { AddLoginMethodDialog } from "@/shared/account/AddLoginMethodDialog";
import { apiErrorMessage } from "@/shared/api/errorMessage";
import { applyApiErrorToForm } from "@/shared/api/formErrors";
import type { MeResponse } from "@/shared/api/types";
import type { AssistantModelPriceResponse, UpdateOrganizationAssistantSettingsRequest, UpdatePlatformAssistantSettingsRequest } from "@/modules/assistant/api/types";
import { useFormat } from "@/shared/format/useFormat";
import { useEditForm } from "@/shared/hooks/useEditForm";
import { useEditPage } from "@/shared/hooks/useEditPage";
import { useAppChrome } from "@/shared/ui/app/AppChrome";
import { Button } from "@/shared/ui/button";
import { CheckboxField } from "@/shared/ui/CheckboxField";
import { MoneyField } from "@/shared/ui/fields/MoneyField";
import { NumberField } from "@/shared/ui/fields/NumberField";
import { MoneyText } from "@/shared/ui/format/MoneyText";
import { NumberText } from "@/shared/ui/format/NumberText";
import { FormError } from "@/shared/ui/FormError";
import { FormField } from "@/shared/ui/FormField";
import { Input } from "@/shared/ui/input";
import { MultiSelect, type MultiSelectOption } from "@/shared/ui/MultiSelect";
import { Page } from "@/shared/ui/Page";
import { ReadOnlyField } from "@/shared/ui/ReadOnlyField";
import { RadioGroupField } from "@/shared/ui/RadioGroupField";
import { InfoButton } from "@/shared/ui/InfoButton";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/shared/ui/dialog";
import { useRestoreFocusOnClose } from "@/shared/hooks/useRestoreFocusOnClose";
import { Section, SectionFields } from "@/shared/ui/Section";
import { activeOrganization } from "@/tenancy/access";
import { assistantModelsRoot, fetchAssistantModelOptions } from "../api/models";
import { assistantSettingsKey, updateAssistantSettings } from "../api/settings";
import { ModelCatalog } from "./ModelCatalog";
import { ModelEditorDialog } from "./ModelEditorDialog";
import { ModelSelect } from "./ModelSelect";
import { assistantKeyMaxLength, settingsSchema, settingsValues, type SettingsRead, type SettingsValues } from "./settingsForm";
import { usePrivateSettingsOperation } from "./usePrivateSettingsOperation";

const tabKeys = ["tab"] as const;
const fieldMap: Record<string, keyof SettingsValues> = { mode: "mode", modelId: "modelId", defaultModelId: "modelId", effort: "effort", dailyMessageLimit: "dailyMessageLimit",
  monthlyBudget: "monthlyBudget", monthlyOrganizationBudget: "monthlyBudget", allowedModelIds: "allowedModelIds", personalEnabled: "personalEnabled", retentionDays: "retentionDays", keyAction: "keyAction", apiKey: "keyAction" };
type SettingsOperation = { request: UpdateOrganizationAssistantSettingsRequest | UpdatePlatformAssistantSettingsRequest; values: SettingsValues; read: SettingsRead };

export function AssistantSettingsEditor({ me, settings, loadError, reload }: {
  me: MeResponse; settings: SettingsRead; loadError: unknown; reload: () => Promise<SettingsRead | undefined>;
}) {
  const { t } = useTranslation(["assistant", "common", "enums"]); const client = useQueryClient(); const format = useFormat(); const { phone } = useAppChrome();
  const platform = "defaultModelId" in settings;
  const scope = { access: me.access, tenantId: me.activeTenantId ?? null, userId: me.id };
  const settingsKey = assistantSettingsKey(scope);
  const navigation = useNavigation();
  const [navigationOwner, setNavigationOwner] = useState(() => new AbortController());
  const [params, setParams] = useSearchParams(); const tab = platform && params.get("tab") === "catalog" ? "catalog" : "general";
  const catalog = useQuery({ queryKey: [...assistantModelsRoot(scope), "options"], queryFn: ({ signal }) => fetchAssistantModelOptions(signal), enabled: platform, meta: { silent: true } });
  const schema = useMemo(() => settingsSchema(t, platform), [t, platform]);
  const { form, version, wrote, resetTo } = useEditForm({ read: settings, toValues: settingsValues, resolver: zodResolver(schema) });
  const values = useWatch({ control: form.control });
  const ownKey = !platform && values.mode === "OwnKey";
  const models = platform ? catalog.data ?? [] : ownKey ? settings.ownKeyModels : settings.platformKeyModels;
  const billingCurrency = platform ? settings.monthlyOrganizationBudget.currency : settings.monthlyBudget?.currency ?? models[0]?.inputPricePerMillion.currency;
  const [failure, setFailure] = useState<unknown>();
  const [changingKey, setChangingKey] = useState(false);
  const [formEpoch, setFormEpoch] = useState(0);
  const budgetValid = useRef(true);
  const [modelDialog, setModelDialog] = useState<{ model?: AssistantModelPriceResponse; trigger: HTMLElement | null } | null>(null);
  const [addEmailOpen, setAddEmailOpen] = useState(false);
  const [info, setInfo] = useState<"ownKey" | "limits" | null>(null);
  // Version es xmin: token opaco. Sólo guardamos tokens sustituidos, no lecturas históricas.
  const [ownRead, setOwnRead] = useState<{ replacedVersions: ReadonlySet<SettingsRead["version"]>; saved: SettingsRead } | null>(null);
  if (ownRead && settings.version === ownRead.saved.version && settings !== ownRead.saved) {
    setOwnRead({ ...ownRead, saved: settings });
  }
  const confirmOwnRead = useEffectEvent(() => {
    if (ownRead?.saved !== settings) return;
    // El mismo token confirma valores efectivos del servidor, conservando cualquier edición nueva.
    wrote(settings.version, settings.version, settings);
  });
  useEffect(() => { confirmOwnRead(); }, [settings, ownRead?.saved.version]);
  const revision = useRef(0);
  const keyRead = ownRead?.saved ?? settings;
  const savedHasKey = keyRead.hasKey;
  const modeChanged = !platform && "mode" in keyRead && values.mode !== keyRead.mode;
  const inputKey = changingKey || !savedHasKey || values.keyAction === "replace" || modeChanged;
  function fieldError(name: keyof SettingsValues, message: string) { form.setError(name, { type: "server", message }); }

  function policyAllows(sent?: SettingsOperation) {
    const live = client.getQueryData<SettingsRead>(settingsKey);
    if (!live) return false;
    if ("defaultModelId" in live) return true;
    return (sent?.values.mode ?? form.getValues("mode")) !== "OwnKey" || (live.allowOwnKey && live.hasAlertRecipient);
  }
  const { password, pending, submit: sendSettings, abandon, eligible } = usePrivateSettingsOperation<SettingsOperation>({ scope, cancellationSignal: navigationOwner.signal, queryRoot: settingsKey, allowed: policyAllows,
    execute: (sent, key, signal) => updateAssistantSettings(scope, sent.request, key, signal),
    success: (sent, response) => {
      // La respuesta propia fija la base ANTES del refetch. No se adopta una versión ajena.
      wrote(sent.request.version!, response.version, undefined);
      const clean = { ...sent.values, keyAction: "keep" as const }; form.reset(clean); resetFields();
      const saved: SettingsRead = "defaultModelId" in sent.read
        ? { ...sent.read, defaultModelId: clean.modelId, allowedModelIds: clean.allowedModelIds, effort: clean.effort, dailyMessageLimit: clean.dailyMessageLimit!, monthlyOrganizationBudget: clean.monthlyBudget!, personalEnabled: clean.personalEnabled, retentionDays: clean.retentionDays!, version: response.version }
        : { ...sent.read, mode: clean.mode, modelId: clean.modelId, effort: clean.effort, ...(clean.mode === "OwnKey" ? { dailyMessageLimit: clean.dailyMessageLimit!, monthlyBudget: clean.monthlyBudget } : {}), version: response.version };
      if (sent.request.keyAction !== "keep") { saved.hasKey = sent.request.keyAction === "replace"; saved.maskedKeySuffix = null; }
      setOwnRead((previous) => ({ replacedVersions: new Set([...(previous?.replacedVersions ?? []), sent.request.version!]), saved }));
      setChangingKey(false); setFailure(undefined);
      toast.success(t("assistant:settings.saved"));
      void client.invalidateQueries({ queryKey: settingsKey });
    },
    failure: (error) => {
      if (error instanceof ApiError) {
        if (error.code === "Assistant.Settings.KeyRejected") { fieldError("keyAction", t("assistant:settings.validation.keyRejected")); return; }
        if (error.code === "Assistant.Settings.AlertRecipientRequired") { form.setError("mode", { type: "alertRecipient", message: t("assistant:settings.recipientRequired", { organization: activeOrganization(me)?.name }) }); return; }
        if (error.code === "Assistant.Model.NotAllowed") { fieldError("modelId", t("assistant:settings.validation.model")); return; }
        if (applyApiErrorToForm(error, form.setError, fieldMap)) return;
      }
      setFailure(error);
    },
  });
  function changed(field?: keyof SettingsValues, clearPassword = true) {
    revision.current++; abandon(clearPassword); setFailure(undefined);
    if (field) form.clearErrors(field);
  }
  function resetFields() { budgetValid.current = true; setFormEpoch((epoch) => epoch + 1); }
  function adoptRead(read: SettingsRead) {
    // Un GET intercalado puede traer cualquiera de las versiones que ya reemplazamos.
    if (ownRead && ownRead.saved.version === read.version) { setOwnRead({ ...ownRead, saved: read }); resetTo(read); }
    else if (ownRead?.replacedVersions.has(read.version)) resetTo(ownRead.saved);
    else { setOwnRead(null); resetTo(read); }
  }
  function discard() {
    changed(); adoptRead(settings);
    setChangingKey(false); resetFields();
  }
  const previousTab = useRef(tab);
  const discardForTab = useEffectEvent(discard);
  useEffect(() => {
    if (previousTab.current !== tab) { previousTab.current = tab; discardForTab(); }
  }, [tab]);
  async function seeNew() {
    changed(); const at = revision.current;
    const fresh = await reload();
    if (!eligible() || at !== revision.current || !fresh) return;
    adoptRead(fresh); setChangingKey(false); resetFields();
  }
  const edit = useEditPage({ isDirty: form.formState.isDirty, error: failure, searchKeys: tabKeys, onSeeNew: () => { void seeNew(); }, onContinueEditing: () => { changed(); },
    onNavigationAttempt: () => { revision.current++; navigationOwner.abort(); },
  });
  if (!edit.isBlocked && navigation.state === "idle" && navigationOwner.signal.aborted) {
    setNavigationOwner(new AbortController());
  }
  function submit(event: React.FormEvent<HTMLFormElement>) {
    const at = revision.current;
    void form.handleSubmit((sent) => {
      if (at !== revision.current || !eligible()) return;
      setFailure(undefined);
      if ((platform || ownKey) && !budgetValid.current) { fieldError("monthlyBudget", t("assistant:settings.validation.money")); return; }
      if (sent.mode === "OwnKey" && !platform && (!settings.allowOwnKey || !settings.hasAlertRecipient)) {
        fieldError("mode", t(settings.allowOwnKey ? "assistant:settings.recipientRequired" : "assistant:settings.ownKeyUnavailable", { organization: activeOrganization(me)?.name })); return;
      }
      if (!models.some((model) => model.id === sent.modelId && model.isActive)) { fieldError("modelId", t("assistant:settings.validation.model")); return; }
      if (platform && sent.allowedModelIds.some((id) => !models.some((model) => model.id === id && model.isActive))) { fieldError("allowedModelIds", t("assistant:settings.validation.model")); return; }
      if ((platform || ownKey) && sent.monthlyBudget && (sent.monthlyBudget.currency !== billingCurrency || format.isLoading || !format.referenceData.currencies.some((currency) => currency.isEnabled && currency.code === sent.monthlyBudget?.currency))) {
        fieldError("monthlyBudget", t("assistant:settings.validation.money")); return;
      }
      const keyAction = platform || ownKey ? sent.keyAction : "keep";
      const apiKey = keyAction === "replace" ? password.current?.value : undefined;
      if ((keyAction === "replace" && (!apiKey?.trim() || apiKey.length > assistantKeyMaxLength)) || ((platform || ownKey) && !savedHasKey && keyAction === "keep")) {
        fieldError("keyAction", t("assistant:settings.validation.key")); return;
      }
      const request: SettingsOperation["request"] = platform
        ? { defaultModelId: sent.modelId, allowedModelIds: [...sent.allowedModelIds], effort: sent.effort, dailyMessageLimit: sent.dailyMessageLimit, monthlyOrganizationBudget: sent.monthlyBudget, personalEnabled: sent.personalEnabled, retentionDays: sent.retentionDays, keyAction, apiKey, version }
        : { mode: sent.mode, modelId: sent.modelId, effort: sent.effort, ...(sent.mode === "OwnKey" ? { dailyMessageLimit: sent.dailyMessageLimit, monthlyBudget: sent.monthlyBudget } : {}), keyAction, apiKey, version };
      // Congela también la metadata confirmada (hasKey/suffix) de la versión editada.
      sendSettings({ request, values: sent, read: ownRead && ownRead.saved.version === version ? ownRead.saved : settings });
    })(event);
  }
  const errors = form.formState.errors;
  const general = <form id="assistant-settings" autoComplete="off" noValidate aria-label={t("assistant:settings.title")} onSubmit={submit} className="flex flex-col gap-3.5">
    {loadError ? <FormError message={apiErrorMessage(loadError, t)} /> : null}{edit.formError}
    <Section title={t("assistant:settings.keyAndModel")} phone="inset"><SectionFields className="grid gap-3.5 md:grid-cols-2 md:gap-x-5">
      {!platform ? settings.allowOwnKey || ownKey ? <div>
        <FormField label={t("assistant:settings.mode")} error={errors.mode?.message}>
          <RadioGroupField variant="segmented" label={t("assistant:settings.mode")} value={values.mode}
            options={(["PlatformKey", "OwnKey"] as const).map((mode) => ({ value: mode, label: t(`assistant:settings.modeLabels.${mode}`), disabled: mode === "OwnKey" && !settings.allowOwnKey }))}
            onValueChange={(mode) => { changed("mode"); form.setValue("mode", mode as SettingsValues["mode"], { shouldDirty: true }); }} />
        </FormField>
        {ownKey && (!settings.hasAlertRecipient || errors.mode?.type === "alertRecipient") ? <>{!errors.mode ? <p role="alert" className="mt-1 text-[13px] text-[var(--peligro)]">{t("assistant:settings.recipientRequired", { organization: activeOrganization(me)?.name })}</p> : null}<Button type="button" variant="link" onClick={() => setAddEmailOpen(true)}>{t("assistant:settings.addEmail")}</Button></> : null}
      </div> : <ReadOnlyField label={t("assistant:settings.mode")}><span className="inline-flex items-center gap-1.5">{t("assistant:settings.modeLabels.PlatformKey")}<InfoButton label={t("assistant:settings.ownKeyUnavailable", { organization: activeOrganization(me)?.name })} onClick={() => setInfo("ownKey")} /></span></ReadOnlyField> : null}
      <ReadOnlyField label={t("assistant:settings.provider")}>{t("enums:AssistantProvider.Anthropic")}</ReadOnlyField>
      {platform || ownKey ? <div>
        {inputKey ? <FormField label={t(platform ? "assistant:settings.platformKey" : "assistant:settings.key")} required error={errors.keyAction?.message}>
          <Input ref={password} type="text" autoComplete="off" spellCheck={false} autoCapitalize="none" autoCorrect="off"
            data-1p-ignore="true" data-lpignore="true" data-bwignore="true" className="[-webkit-text-security:disc]" maxLength={assistantKeyMaxLength}
            onChange={() => { changed("keyAction", false); form.setValue("keyAction", "replace", { shouldDirty: true }); }} />
        </FormField> : <ReadOnlyField label={t(platform ? "assistant:settings.platformKey" : "assistant:settings.key")}>
          <span>{t("assistant:settings.maskedKey", { suffix: settings.maskedKeySuffix ?? "" })}</span>{" "}<Button type="button" variant="link" onClick={() => { changed("keyAction"); setChangingKey(true); }}>{t("assistant:settings.changeKey")}</Button>
        </ReadOnlyField>}
      </div> : null}
      <FormField label={t(platform ? "assistant:settings.defaultModel" : "assistant:settings.model")} error={errors.modelId?.message}>
        <ModelSelect models={models} value={values.modelId ?? ""} onChange={(value) => { changed("modelId"); form.setValue("modelId", value, { shouldDirty: true }); }} />
      </FormField>
      {platform ? <>
        <FormField label={t("assistant:settings.effort")} error={errors.effort?.message}><RadioGroupField variant="segmented" label={t("assistant:settings.effort")} value={values.effort}
          options={(["low", "medium", "high"] as const).map((effort) => ({ value: effort, label: t(`enums:AssistantEffort.${effort}`) }))}
          onValueChange={(value) => { changed("effort"); form.setValue("effort", value as SettingsValues["effort"], { shouldDirty: true }); }} /></FormField>
        <div className="md:col-span-2"><FormField label={t("assistant:settings.allowedModels")} error={errors.allowedModelIds?.message}><MultiSelect
          options={models.filter((model) => model.isActive || values.allowedModelIds?.includes(model.id)).map((model): MultiSelectOption => ({ value: model.id, label: model.isActive ? model.name : `${model.name} · ${t("assistant:settings.unavailableModel")}`,
            description: <Trans i18nKey="assistant:settings.modelPriceDescription" components={{ inputPrice: <MoneyText value={model.inputPricePerMillion} />, outputPrice: <MoneyText value={model.outputPricePerMillion} /> }} />,
          })).concat((values.allowedModelIds ?? []).filter((id) => !models.some((model) => model.id === id)).map((id) => ({ value: id, label: `${id} · ${t("assistant:settings.unavailableModel")}` })))}
          value={values.allowedModelIds ?? []} placeholder={t("assistant:settings.noModels")} onChange={(ids) => { changed("allowedModelIds"); form.setValue("allowedModelIds", ids, { shouldDirty: true }); }} /></FormField></div>
        {catalog.isLoading ? <p role="status">{t("assistant:loading")}</p> : null}{catalog.isError ? <><FormError message={apiErrorMessage(catalog.error, t)} /><Button type="button" variant="outline" onClick={() => { void catalog.refetch(); }}>{t("assistant:retry")}</Button></> : null}
      </> : null}
    </SectionFields></Section>
    <Section title={t("assistant:settings.limits")} phone="inset" meta={!platform && !ownKey ? <InfoButton label={t("assistant:settings.platformLimits")} onClick={() => setInfo("limits")} /> : undefined}><SectionFields className="grid gap-3.5 md:grid-cols-2 md:gap-x-5">
      {platform || ownKey ? <>
        <Controller control={form.control} name="dailyMessageLimit" render={({ field }) => <FormField label={t("assistant:settings.dailyLimit")} required error={errors.dailyMessageLimit?.message}><NumberField key={formEpoch} value={field.value} onChange={(value) => { changed("dailyMessageLimit"); field.onChange(value); }} /></FormField>} />
        <Controller control={form.control} name="monthlyBudget" render={({ field }) => <FormField label={t(platform ? "assistant:settings.organizationBudget" : "assistant:settings.monthlyBudget")} error={errors.monthlyBudget?.message}><MoneyField fixedCurrency key={formEpoch} currencyCode={billingCurrency} value={field.value} onValidityChange={(valid) => { budgetValid.current = valid; }} onChange={(value) => { changed("monthlyBudget"); field.onChange(value); }} /></FormField>} />
      </> : <><ReadOnlyField label={t("assistant:settings.dailyLimit")}><NumberText value={settings.dailyMessageLimit} /></ReadOnlyField><ReadOnlyField label={t("assistant:settings.monthlyBudget")}><MoneyText value={settings.monthlyBudget} /></ReadOnlyField></>}
    </SectionFields></Section>
    {platform ? <Section title={t("assistant:settings.peopleAndConversations")} phone="inset"><SectionFields className="grid gap-3.5 md:grid-cols-2 md:gap-x-5">
      <Controller control={form.control} name="personalEnabled" render={({ field }) => <CheckboxField label={t("assistant:settings.personalEnabled")} checked={field.value} onCheckedChange={(value) => { changed("personalEnabled"); field.onChange(value); }} />} />
      <Controller control={form.control} name="retentionDays" render={({ field }) => <FormField label={t("assistant:settings.retentionDays")} required error={errors.retentionDays?.message}><NumberField key={formEpoch} value={field.value} onChange={(value) => { changed("retentionDays"); field.onChange(value); }} /></FormField>} />
    </SectionFields></Section> : null}
  </form>;
  const actions = tab === "general" ? <><Button type="button" variant="outline" onClick={discard}>{t("assistant:settings.discard")}</Button><Button type="submit" form="assistant-settings" disabled={!form.formState.isDirty} pending={pending} pendingLabel={t("assistant:settings.saving")}>{t("assistant:settings.save")}</Button></> : <Button onClick={(event) => setModelDialog({ trigger: event.currentTarget })}>{t("assistant:settings.addModel")}</Button>;
  return <>
    <Page icon={Sparkles} title={t("assistant:settings.title")} summary={edit.unsaved ?? (platform && !savedHasKey ? <span className="font-medium text-[var(--alerta)]">{t("assistant:settings.unconfigured")}</span> : null)} phoneSubtitle={t("assistant:title")} backTo={phone ? { to: platform ? "/plataforma/mas" : "/mas", label: t("assistant:settings.back") } : undefined}
      banner={edit.banner} actions={actions} phoneBody={tab === "catalog" ? "flush" : "padded"}
      tabs={platform ? { label: t("assistant:settings.title"), value: tab, onValueChange: (value) => { const next = new URLSearchParams(params); next.set("tab", value); setParams(next); }, items: [
        { value: "general", label: t("assistant:settings.general"), content: general },
        { value: "catalog", label: t("assistant:settings.catalog"), count: catalog.data ? <NumberText value={catalog.data.length} /> : undefined, content: <ModelCatalog scope={scope} onEdit={(model, trigger) => setModelDialog({ model, trigger })} /> },
      ] } : undefined}>{general}</Page>
    {edit.leaveDialog}
    {addEmailOpen ? <AddLoginMethodDialog open onOpenChange={setAddEmailOpen} onComplete={() => { void client.invalidateQueries({ queryKey: settingsKey }); }} /> : null}
    {info ? <SettingsInfo title={t(info === "ownKey" ? "assistant:settings.mode" : "assistant:settings.limits")} description={t(info === "ownKey" ? "assistant:settings.ownKeyUnavailable" : "assistant:settings.platformLimits", { organization: activeOrganization(me)?.name })} onClose={() => setInfo(null)} /> : null}
    {modelDialog && platform ? <ModelEditorDialog scope={scope} cancellationSignal={navigationOwner.signal} model={modelDialog.model} currency={settings.monthlyOrganizationBudget.currency} trigger={modelDialog.trigger} onClose={() => setModelDialog(null)} /> : null}
  </>;
}

function SettingsInfo({ title, description, onClose }: { title: string; description: string; onClose: () => void }) {
  const { t } = useTranslation("common");
  const restore = useRestoreFocusOnClose();
  return <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}><DialogContent size="sm" onCloseAutoFocus={restore}>
    <DialogHeader><DialogTitle>{title}</DialogTitle></DialogHeader>
    <DialogBody><DialogDescription>{description}</DialogDescription></DialogBody>
    <DialogFooter><Button onClick={onClose}>{t("notice.understood")}</Button></DialogFooter>
  </DialogContent></Dialog>;
}
