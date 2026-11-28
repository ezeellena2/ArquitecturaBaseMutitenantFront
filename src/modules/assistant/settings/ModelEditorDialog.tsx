import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { ChevronRight } from "lucide-react";
import { useMemo, useRef, useState, type ReactNode } from "react";
import { Controller, useWatch, type FieldErrors, type FieldPath } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { toastSuccess } from "@/shared/ui/sonner";
import { ApiError } from "@/shared/api/ApiError";
import { actionErrorMessage } from "@/shared/api/errorMessage";
import { applyApiErrorToForm } from "@/shared/api/formErrors";
import type { AssistantModelPriceResponse, CreateAssistantModelRequest, UpdateAssistantModelRequest } from "@/modules/assistant/api/types";
import { useFormat } from "@/shared/format/useFormat";
import { useEditForm } from "@/shared/hooks/useEditForm";
import { useRestoreFocusOnClose } from "@/shared/hooks/useRestoreFocusOnClose";
import { useAppChrome } from "@/shared/ui/app/AppChrome";
import { Button } from "@/shared/ui/button";
import { CheckboxField } from "@/shared/ui/CheckboxField";
import { DetailGrid, type DetailGridItem } from "@/shared/ui/DetailGrid";
import { Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/shared/ui/dialog";
import { MoneyField } from "@/shared/ui/fields/MoneyField";
import { FormError } from "@/shared/ui/FormError";
import { FormField } from "@/shared/ui/FormField";
import { Input } from "@/shared/ui/input";
import { ReadOnlyField } from "@/shared/ui/ReadOnlyField";
import { assistantStateQueryKey, type AssistantScope } from "../api/assistant";
import { assistantModelsRoot, createAssistantModel, updateAssistantModel } from "../api/models";
import { modelErrorFields, modelFormSchema, modelFormValues, type ModelFormOutput, type ModelFormValues } from "./modelForm";
import { ModelTechnicalFields, type ModelTechnicalPart } from "./ModelTechnicalFields";
import { assistantModelNameMaxLength, assistantProviderModelIdMaxLength } from "./settingsForm";
import { usePrivateSettingsOperation } from "./usePrivateSettingsOperation";

/// El diálogo de un modelo, en pasos (254, Plat-Asistente-Config y su M-): nada se pliega ni se desplaza adentro. Agregar
/// va de los datos a los técnicos; en el teléfono, los técnicos van en tres zonas que entran en la hoja. Al editar, lo
/// técnico se lee en una grilla y «Cambiar datos técnicos» abre su paso. Los pasos que no se ven quedan montados y
/// ocultos: un texto a medio escribir no se pierde al ir y volver.
type Step = "data" | "technical" | "reading" | "capabilities" | "limits" | "longContext";
const technicalParts: Readonly<Partial<Record<Step, ModelTechnicalPart>>> = { technical: "all", capabilities: "capabilities", limits: "limits", longContext: "longContext" };
const stepFields: Readonly<Record<Step, readonly FieldPath<ModelFormValues>[]>> = {
  data: ["name", "providerModelId", "inputPricePerMillion", "outputPricePerMillion"],
  technical: ["technical"],
  reading: [],
  capabilities: ["technical.supportsText", "technical.supportsTools", "technical.supportsImages", "technical.supportsPdf", "technical.supportsAdaptiveThinking", "technical.efforts"],
  limits: ["technical.maxInputTokens", "technical.maxOutputTokens", "technical.cacheReadPricePerMillion", "technical.cacheWrite5MinutesPricePerMillion", "technical.cacheWrite1HourPricePerMillion"],
  longContext: ["technical.longContext"],
};
function stepsFor(phone: boolean, editing: boolean): readonly Step[] {
  if (!phone) return ["data", "technical"];
  return editing ? ["data", "reading", "capabilities", "limits", "longContext"] : ["data", "capabilities", "limits", "longContext"];
}
/// El paso donde se carga un campo: un error lleva a la persona hasta ahí.
function stepOf(field: string, phone: boolean): Step {
  if (!field.startsWith("technical")) return "data";
  if (!phone) return "technical";
  if (field.startsWith("technical.longContext")) return "longContext";
  return /^technical\.(max|cache)/u.test(field) ? "limits" : "capabilities";
}
function errorPaths(errors: FieldErrors | undefined, prefix = ""): string[] {
  if (!errors) return [];
  return Object.entries(errors).flatMap(([key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    if (!value || typeof value !== "object" || key === "ref") return [];
    return "message" in value ? [path] : errorPaths(value as FieldErrors, path);
  });
}

export function ModelEditorDialog({ scope, cancellationSignal, model, currency, trigger, onClose }: {
  scope: AssistantScope; cancellationSignal: AbortSignal; model?: AssistantModelPriceResponse; currency: string; trigger: HTMLElement | null; onClose: () => void;
}) {
  const { t } = useTranslation(["assistant", "common", "enums"]); const client = useQueryClient(); const format = useFormat(); const { phone } = useAppChrome();
  const restoreFocus = useRestoreFocusOnClose(true, trigger); const [failure, setFailure] = useState<unknown>(); const conflict = useRef(false);
  const steps = stepsFor(phone, Boolean(model));
  const [requested, setStep] = useState<Step>("data");
  const step = steps.includes(requested) ? requested : "data";
  const index = steps.indexOf(step);
  const [invalidFields, setInvalidFields] = useState<ReadonlySet<FieldPath<ModelFormValues>>>(new Set());
  const schema = useMemo(() => modelFormSchema(t), [t]);
  const { form, version, wrote } = useEditForm<AssistantModelPriceResponse | undefined, ModelFormValues, ModelFormOutput>({
    read: model, resolver: zodResolver(schema), toValues: modelFormValues });
  const technical = useWatch({ control: form.control, name: "technical" });
  function goToFirst(fields: readonly string[]) {
    const first = steps.find((item) => fields.some((field) => stepOf(field, phone) === item));
    if (first) setStep(first);
  }
  const operation = usePrivateSettingsOperation<CreateAssistantModelRequest | UpdateAssistantModelRequest>({ scope, cancellationSignal, queryRoot: assistantModelsRoot(scope), allowed: () => true,
    execute: (body, key, signal) => model ? updateAssistantModel(model.id, body, signal) : createAssistantModel(body, key, signal),
    success: (body, response) => {
      if (model) wrote((body as UpdateAssistantModelRequest).version!, response.version, undefined);
      toastSuccess(t("assistant:settings.modelSaved")); onClose(); void client.invalidateQueries({ queryKey: assistantModelsRoot(scope) });
      // El Inicio nombra los modelos que se pueden elegir: un nombre nuevo se ve al volver.
      void client.invalidateQueries({ queryKey: assistantStateQueryKey(scope) });
    },
    failure: (error) => {
      if (error instanceof ApiError && error.code === "General.ConcurrencyConflict") { conflict.current = true; setStep("data"); }
      if (error instanceof ApiError) goToFirst(Object.keys(error.errors ?? {}));
      if (error instanceof ApiError && applyApiErrorToForm<FieldPath<ModelFormValues>>(error, form.setError, modelErrorFields())) return;
      setFailure(error);
    },
  });
  function close() { operation.abandon(); if (conflict.current) void client.invalidateQueries({ queryKey: assistantModelsRoot(scope) }); onClose(); }
  function changed() { operation.abandon(); setFailure(undefined); form.clearErrors(); }
  function validity(name: FieldPath<ModelFormValues>, valid: boolean) {
    setInvalidFields((previous) => {
      const next = new Set(previous);
      if (valid) next.delete(name); else next.add(name);
      return next;
    });
  }
  /// Un texto que no se pudo leer como número o tarifa queda marcado en su campo.
  function markInvalid(fields: readonly FieldPath<ModelFormValues>[]) {
    for (const field of fields) form.setError(field, { type: "validate", message: t(field.endsWith("Tokens") || field.endsWith("inputTokensThreshold")
      ? "assistant:settings.validation.limit" : "assistant:settings.validation.technicalPrice") });
  }
  async function next() {
    const unreadable = [...invalidFields].filter((field) => stepOf(field, phone) === step);
    if (unreadable.length) { markInvalid(unreadable); return; }
    if (stepFields[step].length && !await form.trigger(stepFields[step])) return;
    setStep(steps[index + 1]!);
  }
  const submit = form.handleSubmit((values) => {
    if (invalidFields.size) { markInvalid([...invalidFields]); goToFirst([...invalidFields]); return; }
    for (const field of ["inputPricePerMillion", "outputPricePerMillion"] as const) {
      const price = values[field];
      if (!price || price.currency !== currency || format.isLoading || !format.referenceData.currencies.some((row) => row.isEnabled && row.code === price.currency)) {
        form.setError(field, { type: "validate", message: t("assistant:settings.validation.money") }); setStep("data"); return;
      }
    }
    operation.submit({ ...values, provider: "Anthropic", ...(model ? { version } : {}) });
  }, (errors) => goToFirst(errorPaths(errors)));
  const errors = form.formState.errors;
  // Un texto inválido en un campo opcional sigue siendo una edición, aunque su valor parseado sea null.
  const isDirty = form.formState.isDirty || invalidFields.size > 0;
  // Al editar, los datos guardan sin pasar por lo técnico; la lectura del teléfono abre su primer paso.
  const primary: "next" | "change" | "save" = step === "reading" ? "change" : index === steps.length - 1 || (model && step === "data") ? "save" : "next";
  const stepText = model ? null : t("assistant:settings.steps.step", { current: format.formatInteger(index + 1), total: format.formatInteger(steps.length) });
  const reading = <ModelTechnicalReading technical={technical} phone={phone} />;
  return <Dialog open onOpenChange={(open) => { if (!open) close(); }}><DialogContent className="md:max-w-160" onCloseAutoFocus={restoreFocus}>
    <DialogHeader><DialogTitle>{step === "data" ? t(model ? "assistant:settings.editModel" : "assistant:settings.addModel") : t("assistant:settings.technical.title")}</DialogTitle>
      {phone && stepText ? <p className="text-[0.8125rem] text-[var(--t2)]">{stepText}</p> : null}</DialogHeader>
    <form noValidate onSubmit={(event) => {
      if (primary === "save") { void submit(event); return; }
      event.preventDefault();
      if (primary === "next") void next(); else setStep(steps[index + 1]!);
    }} onChangeCapture={changed} className="flex min-h-0 flex-col">
      <DialogBody>
        <div hidden={step !== "data"} className="grid gap-3.5 md:grid-cols-2 md:gap-x-5">
          <FormField label={t("assistant:settings.name")} required error={errors.name?.message}><Input {...form.register("name")} maxLength={assistantModelNameMaxLength} /></FormField>
          <ReadOnlyField label={t("assistant:settings.provider")}>{t("enums:AssistantProvider.Anthropic")}</ReadOnlyField>
          <div className="md:col-span-2"><FormField label={t("assistant:settings.providerModelId")} required error={errors.providerModelId?.message}><Input {...form.register("providerModelId")} maxLength={assistantProviderModelIdMaxLength} /></FormField></div>
          {(["inputPricePerMillion", "outputPricePerMillion"] as const).map((name) => <Controller key={name} control={form.control} name={name} render={({ field }) => <FormField label={t(name === "inputPricePerMillion" ? "assistant:settings.inputPrice" : "assistant:settings.outputPrice")} required error={errors[name]?.message}>
            <MoneyField fixedCurrency precision="technical-tariff" currencyCode={currency} value={field.value} onChange={(value) => { changed(); field.onChange(value); }} />
          </FormField>} />)}
          <Controller control={form.control} name="isActive" render={({ field }) => <CheckboxField label={t("assistant:settings.active")} checked={field.value} onCheckedChange={(value) => { changed(); field.onChange(value); }} />} />
          {model ? phone
            ? <button type="button" className="flex min-h-12 items-center justify-between gap-2 border-t border-[var(--borde)] pt-1 text-left text-[1rem] font-medium text-[var(--t1)]" onClick={() => setStep("reading")}>
              {t("assistant:settings.technical.title")}<ChevronRight className="size-4.5 text-[var(--t3)]" aria-hidden="true" /></button>
            : <div role="group" aria-label={t("assistant:settings.technical.title")} className="flex flex-col gap-2 border-t border-[var(--borde)] pt-3.5 md:col-span-2">
              <div className="flex items-center justify-between gap-3"><span className="font-semibold">{t("assistant:settings.technical.title")}</span>
                <Button type="button" variant="outline" size="sm" onClick={() => setStep("technical")}>{t("assistant:settings.technical.change")}</Button></div>
              {reading}
            </div> : null}
        </div>
        {step === "reading" ? reading : null}
        {steps.filter((item) => technicalParts[item]).map((item) => <div key={item} hidden={step !== item}>
          <ModelTechnicalFields form={form} currency={currency} changed={changed} validity={validity} part={technicalParts[item]} />
        </div>)}
        <FormError message={actionErrorMessage(failure, t)} />
      </DialogBody>
      <DialogFooter className="max-md:flex-col-reverse max-md:[&_button]:flex-none">
        {!phone && stepText ? <span className="mr-auto self-center text-[0.8125rem] text-[var(--t2)]">{stepText}</span> : null}
        <Button type="button" variant="outline" onClick={() => { if (step === "data") close(); else setStep(steps[index - 1]!); }}>{t(step === "data" ? "common:actions.cancel" : "assistant:settings.steps.back")}</Button>
        {primary === "save" ? <Button type="submit" disabled={Boolean(model) && !isDirty} pending={operation.pending}>{t(model ? "assistant:settings.save" : "assistant:settings.addModel")}</Button>
          : <Button type="submit">{t(primary === "change" ? "assistant:settings.technical.change" : "assistant:settings.steps.next")}</Button>}
      </DialogFooter>
    </form>
  </DialogContent></Dialog>;
}

/// Lo técnico de un modelo, para leer (254): en la compu, en grillas dentro de los datos; en el teléfono, su propio paso.
function ModelTechnicalReading({ technical, phone }: { technical: ModelFormValues["technical"]; phone: boolean }) {
  const { t } = useTranslation(["assistant", "enums"]); const format = useFormat();
  const empty = format.formatEmpty();
  const tokens = (value: number | null) => value === null ? empty : format.formatInteger(value);
  // La tarifa con el símbolo y los decimales que hagan falta, hasta seis (Plat-Asistente-Config: «US$ 0,01», «US$ 0,125»).
  const money = (value: { amount: number; currency: string } | null) => value === null ? empty : format.formatTariff(value);
  const list = (items: readonly string[]) => items.length === 0 ? empty : items.length === 1 ? items[0]!
    : t("assistant:settings.technical.list", { items: items.slice(0, -1).join(", "), last: items.at(-1) });
  const capabilities = (["supportsText", "supportsTools", "supportsImages", "supportsPdf", "supportsAdaptiveThinking"] as const).filter((name) => technical[name]).map((name) => t(`assistant:settings.technical.${name}`));
  const efforts = (["low", "medium", "high"] as const).filter((effort) => technical.efforts.includes(effort)).map((effort) => t(`enums:AssistantEffort.${effort}`));
  const long = technical.longContext;
  const group = (title: string | null, items: DetailGridItem[]): ReactNode => <div className="flex flex-col gap-1">
    {title ? <span className="text-[0.8125rem] font-semibold text-[var(--t2)]">{title}</span> : null}
    <div className="[&>*]:p-0!"><DetailGrid phone={phone} items={items} /></div>
  </div>;
  return <div className="flex flex-col gap-3">
    {group(null, [
      { key: "capabilities", label: t("assistant:settings.technical.capabilities"), value: list(capabilities) },
      { key: "efforts", label: t("assistant:settings.technical.efforts"), value: list(efforts) },
      { key: "maxInputTokens", label: t("assistant:settings.technical.maxInputTokens"), value: tokens(technical.maxInputTokens) },
      { key: "maxOutputTokens", label: t("assistant:settings.technical.maxOutputTokens"), value: tokens(technical.maxOutputTokens) },
    ])}
    {group(t("assistant:settings.technical.cache"), (["cacheReadPricePerMillion", "cacheWrite5MinutesPricePerMillion", "cacheWrite1HourPricePerMillion"] as const)
      .map((name) => ({ key: name, label: t(`assistant:settings.technical.${name}`), value: money(technical[name]) })))}
    {group(t("assistant:settings.technical.longContext"), [
      { key: "inputTokensThreshold", label: t("assistant:settings.technical.inputTokensThreshold"), value: tokens(long.inputTokensThreshold) },
      ...(["inputPricePerMillion", "outputPricePerMillion", "cacheReadPricePerMillion", "cacheWrite5MinutesPricePerMillion", "cacheWrite1HourPricePerMillion"] as const)
        .map((name) => ({ key: `long-${name}`, label: t(`assistant:settings.technical.${name}`), value: money(long[name]) })),
    ])}
  </div>;
}
