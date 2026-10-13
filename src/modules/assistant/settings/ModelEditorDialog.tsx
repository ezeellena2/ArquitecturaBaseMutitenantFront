import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { ChevronRight } from "lucide-react";
import { useId, useMemo, useRef, useState } from "react";
import { Controller, type FieldPath } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { ApiError } from "@/shared/api/ApiError";
import { actionErrorMessage } from "@/shared/api/errorMessage";
import { applyApiErrorToForm } from "@/shared/api/formErrors";
import type { AssistantModelPriceResponse, CreateAssistantModelRequest, UpdateAssistantModelRequest } from "@/modules/assistant/api/types";
import { useFormat } from "@/shared/format/useFormat";
import { useEditForm } from "@/shared/hooks/useEditForm";
import { useRestoreFocusOnClose } from "@/shared/hooks/useRestoreFocusOnClose";
import { Button } from "@/shared/ui/button";
import { CheckboxField } from "@/shared/ui/CheckboxField";
import { Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/shared/ui/dialog";
import { MoneyField } from "@/shared/ui/fields/MoneyField";
import { FormError } from "@/shared/ui/FormError";
import { FormField } from "@/shared/ui/FormField";
import { Input } from "@/shared/ui/input";
import { ReadOnlyField } from "@/shared/ui/ReadOnlyField";
import type { AssistantScope } from "../api/assistant";
import { assistantModelsRoot, createAssistantModel, updateAssistantModel } from "../api/models";
import { modelErrorFields, modelFormSchema, modelFormValues, type ModelFormOutput, type ModelFormValues } from "./modelForm";
import { ModelTechnicalFields } from "./ModelTechnicalFields";
import { assistantModelNameMaxLength, assistantProviderModelIdMaxLength } from "./settingsForm";
import { usePrivateSettingsOperation } from "./usePrivateSettingsOperation";

export function ModelEditorDialog({ scope, cancellationSignal, model, currency, trigger, onClose }: {
  scope: AssistantScope; cancellationSignal: AbortSignal; model?: AssistantModelPriceResponse; currency: string; trigger: HTMLElement | null; onClose: () => void;
}) {
  const { t } = useTranslation(["assistant", "common", "enums"]); const client = useQueryClient(); const format = useFormat();
  const restoreFocus = useRestoreFocusOnClose(true, trigger); const [failure, setFailure] = useState<unknown>(); const conflict = useRef(false);
  const [advanced, setAdvanced] = useState(false); const advancedId = useId();
  const [invalidFields, setInvalidFields] = useState<ReadonlySet<FieldPath<ModelFormValues>>>(new Set());
  const schema = useMemo(() => modelFormSchema(t), [t]);
  const { form, version, wrote } = useEditForm<AssistantModelPriceResponse | undefined, ModelFormValues, ModelFormOutput>({
    read: model, resolver: zodResolver(schema), toValues: modelFormValues });
  const operation = usePrivateSettingsOperation<CreateAssistantModelRequest | UpdateAssistantModelRequest>({ scope, cancellationSignal, queryRoot: assistantModelsRoot(scope), allowed: () => true,
    execute: (body, key, signal) => model ? updateAssistantModel(model.id, body, signal) : createAssistantModel(body, key, signal),
    success: (body, response) => {
      if (model) wrote((body as UpdateAssistantModelRequest).version!, response.version, undefined);
      toast.success(t("assistant:settings.modelSaved")); onClose(); void client.invalidateQueries({ queryKey: assistantModelsRoot(scope) });
    },
    failure: (error) => {
      if (error instanceof ApiError && error.code === "General.ConcurrencyConflict") conflict.current = true;
      if (error instanceof ApiError && Object.keys(error.errors ?? {}).some((field) => field.startsWith("technical"))) setAdvanced(true);
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
  const submit = form.handleSubmit((values) => {
    if (invalidFields.size) {
      setAdvanced(true);
      for (const field of invalidFields) form.setError(field, { type: "validate", message: t(field.endsWith("Tokens") || field.endsWith("inputTokensThreshold")
        ? "assistant:settings.validation.limit" : "assistant:settings.validation.technicalPrice") });
      return;
    }
    for (const field of ["inputPricePerMillion", "outputPricePerMillion"] as const) {
      const price = values[field];
      if (!price || price.currency !== currency || format.isLoading || !format.referenceData.currencies.some((row) => row.isEnabled && row.code === price.currency)) {
        form.setError(field, { type: "validate", message: t("assistant:settings.validation.money") }); return;
      }
    }
    operation.submit({ ...values, provider: "Anthropic", ...(model ? { version } : {}) });
  }, (errors) => { if (errors.technical) setAdvanced(true); });
  const errors = form.formState.errors;
  // Un texto inválido en un campo opcional sigue siendo una edición, aunque su valor parseado sea null.
  const isDirty = form.formState.isDirty || invalidFields.size > 0;
  return <Dialog open onOpenChange={(open) => { if (!open) close(); }}><DialogContent className="md:max-w-[640px]" onCloseAutoFocus={restoreFocus}>
    <DialogHeader><DialogTitle>{t(model ? "assistant:settings.editModel" : "assistant:settings.addModel")}</DialogTitle></DialogHeader>
    <form noValidate onSubmit={(event) => { void submit(event); }} onChangeCapture={changed} className="flex min-h-0 flex-col">
      <DialogBody><div className="grid gap-3.5 md:grid-cols-2 md:gap-x-5">
        <FormField label={t("assistant:settings.name")} required error={errors.name?.message}><Input {...form.register("name")} maxLength={assistantModelNameMaxLength} /></FormField>
        <ReadOnlyField label={t("assistant:settings.provider")}>{t("enums:AssistantProvider.Anthropic")}</ReadOnlyField>
        <div className="md:col-span-2"><FormField label={t("assistant:settings.providerModelId")} required error={errors.providerModelId?.message}><Input {...form.register("providerModelId")} maxLength={assistantProviderModelIdMaxLength} /></FormField></div>
        {(["inputPricePerMillion", "outputPricePerMillion"] as const).map((name) => <Controller key={name} control={form.control} name={name} render={({ field }) => <FormField label={t(name === "inputPricePerMillion" ? "assistant:settings.inputPrice" : "assistant:settings.outputPrice")} required error={errors[name]?.message}>
          <MoneyField fixedCurrency precision="technical-tariff" currencyCode={currency} value={field.value} onChange={(value) => { changed(); field.onChange(value); }} />
        </FormField>} />)}
        <Controller control={form.control} name="isActive" render={({ field }) => <CheckboxField label={t("assistant:settings.active")} checked={field.value} onCheckedChange={(value) => { changed(); field.onChange(value); }} />} />
        <Button type="button" variant="link" aria-expanded={advanced} aria-controls={advancedId} className="mt-1 min-h-11 justify-start rounded-none border-x-0 border-b-0 border-t border-[var(--borde)] px-0 text-[var(--t1)] hover:no-underline md:col-span-2" onClick={() => setAdvanced(!advanced)}>
          <ChevronRight className={`size-4 text-[var(--t2)] ${advanced ? "rotate-90" : ""}`} aria-hidden="true" />{t("assistant:settings.technical.advanced")}
        </Button>
        <div id={advancedId} hidden={!advanced} className="md:col-span-2">
          <ModelTechnicalFields form={form} currency={currency} changed={changed} validity={validity} />
        </div>
      </div><FormError message={actionErrorMessage(failure, t)} /></DialogBody>
      <DialogFooter className="max-md:flex-col-reverse max-md:[&_button]:flex-none"><Button type="button" variant="outline" onClick={close}>{t("common:actions.cancel")}</Button><Button type="submit" disabled={Boolean(model) && !isDirty} pending={operation.pending}>{t(model ? "assistant:settings.save" : "assistant:settings.addModel")}</Button></DialogFooter>
    </form>
  </DialogContent></Dialog>;
}
