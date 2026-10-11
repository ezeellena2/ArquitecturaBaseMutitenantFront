import { Controller, type FieldPath, type UseFormReturn } from "react-hook-form";
import { useId } from "react";
import { useTranslation } from "react-i18next";
import { CheckboxField } from "@/shared/ui/CheckboxField";
import { FormField } from "@/shared/ui/FormField";
import { MoneyField } from "@/shared/ui/fields/MoneyField";
import { NumberField } from "@/shared/ui/fields/NumberField";
import type { ModelFormOutput, ModelFormValues } from "./modelForm";

export function ModelTechnicalFields({ form, currency, changed, validity }: {
  form: UseFormReturn<ModelFormValues, unknown, ModelFormOutput>; currency: string; changed: () => void;
  validity: (name: FieldPath<ModelFormValues>, valid: boolean) => void;
}) {
  const { t } = useTranslation(["assistant", "enums"]);
  const effortsErrorId = useId();
  const errors = form.formState.errors.technical;
  return <div className="flex flex-col gap-4">
    <fieldset className="min-w-0"><legend className="mb-1 font-semibold">{t("assistant:settings.technical.capabilities")}</legend>
      <div className="flex flex-wrap gap-x-2">
        {(["supportsText", "supportsTools", "supportsImages", "supportsPdf", "supportsAdaptiveThinking"] as const).map((name) =>
          <Controller key={name} control={form.control} name={`technical.${name}`} render={({ field }) =>
            <CheckboxField label={t(`assistant:settings.technical.${name}`)} checked={field.value}
              onCheckedChange={(value) => { changed(); field.onChange(value); }} error={errors?.[name]?.message} />} />)}
      </div>
    </fieldset>
    <Controller control={form.control} name="technical.efforts" render={({ field }) =>
      <fieldset className="min-w-0" aria-describedby={errors?.efforts?.message ? effortsErrorId : undefined}><legend className="mb-1 font-semibold">{t("assistant:settings.technical.efforts")}</legend>
        <div className="flex flex-wrap gap-x-2">
          {(["low", "medium", "high"] as const).map((effort) =>
            <CheckboxField key={effort} label={t(`enums:AssistantEffort.${effort}`)} checked={field.value.includes(effort)}
              onCheckedChange={(checked) => {
                changed();
                // Mantiene un orden estable para que marcar y desmarcar sea volver a la lectura original.
                field.onChange((["low", "medium", "high"] as const).filter((item) => item === effort ? checked : field.value.includes(item)));
              }} />)}
        </div>
        {errors?.efforts?.message ? <p id={effortsErrorId} role="alert" className="text-[13px] text-[var(--peligro)]">{errors.efforts.message}</p> : null}
      </fieldset>} />
    <fieldset className="min-w-0"><legend className="mb-3 font-semibold">{t("assistant:settings.technical.limits")}</legend>
      <div className="grid gap-3.5 md:grid-cols-2 md:gap-x-5">
        {(["maxInputTokens", "maxOutputTokens"] as const).map((name) =>
          <Controller key={name} control={form.control} name={`technical.${name}`} render={({ field }) =>
            <FormField label={t(`assistant:settings.technical.${name}`)} required error={errors?.[name]?.message}>
              <NumberField value={field.value} onValidityChange={(valid) => validity(`technical.${name}`, valid)} onChange={(value) => { changed(); field.onChange(value); }} />
            </FormField>} />)}
      </div>
    </fieldset>
    <fieldset className="min-w-0"><legend className="mb-3 font-semibold">{t("assistant:settings.technical.cache")}</legend>
      <div className="grid gap-3.5 md:grid-cols-3 md:gap-x-5">
        {(["cacheReadPricePerMillion", "cacheWrite5MinutesPricePerMillion", "cacheWrite1HourPricePerMillion"] as const).map((name) =>
          <Controller key={name} control={form.control} name={`technical.${name}`} render={({ field }) =>
            <FormField label={t(`assistant:settings.technical.${name}`)} required error={errors?.[name]?.message}>
              <MoneyField precision="technical-tariff" currencyCode={currency} value={field.value} onValidityChange={(valid) => validity(`technical.${name}`, valid)} onChange={(value) => { changed(); field.onChange(value); }} />
            </FormField>} />)}
      </div>
    </fieldset>
    <fieldset className="min-w-0"><legend className="mb-3 flex items-center gap-2 font-semibold">{t("assistant:settings.technical.longContext")} <span className="text-xs font-normal text-[var(--t2)]">{t("assistant:settings.technical.optional")}</span></legend>
      <div className="grid gap-3.5 md:grid-cols-3 md:gap-x-5">
        <Controller control={form.control} name="technical.longContext.inputTokensThreshold" render={({ field }) =>
          <FormField label={t("assistant:settings.technical.inputTokensThreshold")} error={errors?.longContext?.inputTokensThreshold?.message}>
            <NumberField value={field.value} onValidityChange={(valid) => validity("technical.longContext.inputTokensThreshold", valid)} onChange={(value) => { changed(); field.onChange(value); }} />
          </FormField>} />
        {(["inputPricePerMillion", "outputPricePerMillion", "cacheReadPricePerMillion", "cacheWrite5MinutesPricePerMillion", "cacheWrite1HourPricePerMillion"] as const).map((name) =>
          <Controller key={name} control={form.control} name={`technical.longContext.${name}`} render={({ field }) =>
            <FormField label={t(`assistant:settings.technical.${name}`)} error={errors?.longContext?.[name]?.message}>
              <MoneyField precision="technical-tariff" currencyCode={currency} value={field.value} onValidityChange={(valid) => validity(`technical.longContext.${name}`, valid)} onChange={(value) => { changed(); field.onChange(value); }} />
            </FormField>} />)}
      </div>
    </fieldset>
  </div>;
}
