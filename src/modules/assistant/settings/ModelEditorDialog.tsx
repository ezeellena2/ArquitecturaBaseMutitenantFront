import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { useMemo, useRef, useState } from "react";
import { Controller } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { z } from "zod";
import { ApiError } from "@/shared/api/ApiError";
import { actionErrorMessage } from "@/shared/api/errorMessage";
import { applyApiErrorToForm } from "@/shared/api/formErrors";
import type { AssistantModelPriceResponse, CreateAssistantModelRequest, UpdateAssistantModelRequest } from "@/shared/api/types";
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
import { assistantDescriptionMaxLength, assistantMoneySchema } from "./settingsForm";
import { usePrivateSettingsOperation } from "./usePrivateSettingsOperation";

export function ModelEditorDialog({ scope, model, currency, trigger, onClose }: {
  scope: AssistantScope; model?: AssistantModelPriceResponse; currency: string; trigger: HTMLElement | null; onClose: () => void;
}) {
  const { t } = useTranslation(["assistant", "common", "enums"]); const client = useQueryClient(); const format = useFormat();
  const restoreFocus = useRestoreFocusOnClose(true, trigger); const [failure, setFailure] = useState<unknown>(); const conflict = useRef(false);
  const schema = useMemo(() => z.object({ name: z.string().trim().min(1, t("assistant:settings.validation.name")).max(assistantDescriptionMaxLength, t("assistant:settings.validation.textLength")),
    providerModelId: z.string().trim().min(1, t("assistant:settings.validation.providerId")).max(assistantDescriptionMaxLength, t("assistant:settings.validation.textLength")),
    inputPricePerMillion: assistantMoneySchema(t), outputPricePerMillion: assistantMoneySchema(t), isActive: z.boolean(),
  }), [t]);
  type Values = z.input<typeof schema>;
  const { form, version, wrote } = useEditForm<AssistantModelPriceResponse | undefined, Values, z.output<typeof schema>>({ read: model, resolver: zodResolver(schema), toValues: (read): Values => ({ name: read?.name ?? "", providerModelId: read?.providerModelId ?? "",
    inputPricePerMillion: read?.inputPricePerMillion ?? null, outputPricePerMillion: read?.outputPricePerMillion ?? null, isActive: read?.isActive ?? true }) });
  const operation = usePrivateSettingsOperation<CreateAssistantModelRequest | UpdateAssistantModelRequest>({ scope, path: "/plataforma/asistente/configuracion", queryRoot: assistantModelsRoot(scope), allowed: () => true,
    execute: (body, key, signal) => model ? updateAssistantModel(model.id, body, signal) : createAssistantModel(body, key, signal),
    success: (body, response) => {
      if (model) wrote((body as UpdateAssistantModelRequest).version!, response.version, undefined);
      toast.success(t("assistant:settings.modelSaved")); onClose(); void client.invalidateQueries({ queryKey: assistantModelsRoot(scope) });
    },
    failure: (error) => {
      if (error instanceof ApiError && error.code === "General.ConcurrencyConflict") conflict.current = true;
      if (error instanceof ApiError && applyApiErrorToForm<keyof Values>(error, form.setError, { name: "name", providerModelId: "providerModelId", inputPricePerMillion: "inputPricePerMillion", outputPricePerMillion: "outputPricePerMillion", isActive: "isActive" })) return;
      setFailure(error);
    },
  });
  function close() { operation.abandon(); if (conflict.current) void client.invalidateQueries({ queryKey: assistantModelsRoot(scope) }); onClose(); }
  function changed() { operation.abandon(); setFailure(undefined); form.clearErrors(); }
  const submit = form.handleSubmit((values) => {
    for (const field of ["inputPricePerMillion", "outputPricePerMillion"] as const) {
      const price = values[field];
      if (!price || price.currency !== currency || format.isLoading || !format.referenceData.currencies.some((row) => row.isEnabled && row.code === price.currency)) {
        form.setError(field, { type: "validate", message: t("assistant:settings.validation.money") }); return;
      }
    }
    operation.submit({ ...values, provider: "Anthropic", ...(model ? { version } : {}) });
  });
  const errors = form.formState.errors;
  return <Dialog open onOpenChange={(open) => { if (!open) close(); }}><DialogContent onCloseAutoFocus={restoreFocus}>
    <DialogHeader><DialogTitle>{t(model ? "assistant:settings.editModel" : "assistant:settings.addModel")}</DialogTitle></DialogHeader>
    <form noValidate onSubmit={(event) => { void submit(event); }} onChangeCapture={changed} className="flex min-h-0 flex-col">
      <DialogBody><div className="grid gap-3.5 md:grid-cols-2 md:gap-x-5">
        <FormField label={t("assistant:settings.name")} required error={errors.name?.message}><Input {...form.register("name")} maxLength={assistantDescriptionMaxLength} /></FormField>
        <ReadOnlyField label={t("assistant:settings.provider")}>{t("enums:AssistantProvider.Anthropic")}</ReadOnlyField>
        <div className="md:col-span-2"><FormField label={t("assistant:settings.providerModelId")} required error={errors.providerModelId?.message}><Input {...form.register("providerModelId")} maxLength={assistantDescriptionMaxLength} /></FormField></div>
        {(["inputPricePerMillion", "outputPricePerMillion"] as const).map((name) => <Controller key={name} control={form.control} name={name} render={({ field }) => <FormField label={t(name === "inputPricePerMillion" ? "assistant:settings.inputPrice" : "assistant:settings.outputPrice")} required error={errors[name]?.message}>
          <MoneyField precision="technical-tariff" currencyCode={currency} value={field.value} onChange={(value) => { changed(); field.onChange(value); }} />
        </FormField>} />)}
        <Controller control={form.control} name="isActive" render={({ field }) => <CheckboxField label={t("assistant:settings.active")} checked={field.value} onCheckedChange={(value) => { changed(); field.onChange(value); }} />} />
      </div><FormError message={actionErrorMessage(failure, t)} /></DialogBody>
      <DialogFooter><Button type="button" variant="outline" onClick={close}>{t("common:actions.cancel")}</Button><Button type="submit" disabled={!!model && !form.formState.isDirty} pending={operation.pending}>{t(model ? "assistant:settings.save" : "assistant:settings.addModel")}</Button></DialogFooter>
    </form>
  </DialogContent></Dialog>;
}
