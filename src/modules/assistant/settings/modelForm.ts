import { validationConstraints } from "@/shared/api/generated/validation";
import type { TFunction } from "i18next";
import type { FieldPath } from "react-hook-form";
import { z } from "zod";
import type { AssistantModelPriceResponse } from "@/modules/assistant/api/types";
import { assistantModelNameMaxLength, assistantProviderModelIdMaxLength, assistantMoneySchema } from "./settingsForm";

const moneyValue = z.object({ amount: z.number(), currency: z.string() });
export function modelFormSchema(t: TFunction) {
  const requiredInteger = z.number().int(t("assistant:settings.validation.limit"))
    .min(validationConstraints.AssistantModelTechnicalHttpRequest.maxInputTokens.minimum, t("assistant:settings.validation.limit")).max(validationConstraints.AssistantModelTechnicalHttpRequest.maxInputTokens.maximum, t("assistant:settings.validation.limit"))
    .nullable().transform((value, ctx) => {
      if (value !== null) return value;
      ctx.addIssue({ code: "custom", message: t("assistant:settings.validation.limit") });
      return z.NEVER;
    });
  const tariff = moneyValue.nullable().transform((value, ctx) => {
    if (value && value.amount > validationConstraints.AssistantInputMoney.amount.minimum && value.amount < validationConstraints.AssistantInputMoney.amount.exclusiveMaximum && value.currency === "USD") return value;
    ctx.addIssue({ code: "custom", message: t("assistant:settings.validation.technicalPrice") });
    return z.NEVER;
  });
  const longTier = z.object({ inputTokensThreshold: requiredInteger,
    inputPricePerMillion: tariff, outputPricePerMillion: tariff,
    cacheReadPricePerMillion: tariff, cacheWrite5MinutesPricePerMillion: tariff,
    cacheWrite1HourPricePerMillion: tariff });
  const optionalTier = z.object({ inputTokensThreshold: z.number().nullable(),
    inputPricePerMillion: moneyValue.nullable(), outputPricePerMillion: moneyValue.nullable(),
    cacheReadPricePerMillion: moneyValue.nullable(), cacheWrite5MinutesPricePerMillion: moneyValue.nullable(),
    cacheWrite1HourPricePerMillion: moneyValue.nullable() }).transform((value, ctx) => {
      if (Object.values(value).every((field) => field === null)) return null;
      const parsed = longTier.safeParse(value);
      if (parsed.success) return parsed.data;
      for (const issue of parsed.error.issues) ctx.addIssue({ code: "custom", path: issue.path, message: issue.message });
      return z.NEVER;
    });
  return z.object({
    name: z.string().trim().min(1, t("assistant:settings.validation.name")).max(assistantModelNameMaxLength, t("assistant:settings.validation.textLength")),
    providerModelId: z.string().trim().min(1, t("assistant:settings.validation.providerId")).max(assistantProviderModelIdMaxLength, t("assistant:settings.validation.textLength")),
    inputPricePerMillion: assistantMoneySchema(t), outputPricePerMillion: assistantMoneySchema(t), isActive: z.boolean(),
    technical: z.object({ supportsText: z.boolean(), supportsTools: z.boolean(), supportsImages: z.boolean(), supportsPdf: z.boolean(), supportsAdaptiveThinking: z.boolean(),
      efforts: z.array(z.enum(["low", "medium", "high"])).min(1, t("assistant:settings.validation.efforts"))
        .refine((values) => new Set(values).size === values.length, t("assistant:settings.validation.efforts")),
      maxInputTokens: requiredInteger, maxOutputTokens: requiredInteger,
      cacheReadPricePerMillion: tariff, cacheWrite5MinutesPricePerMillion: tariff, cacheWrite1HourPricePerMillion: tariff,
      longContext: optionalTier,
    }).superRefine((value, ctx) => {
      if (value.maxOutputTokens > value.maxInputTokens) ctx.addIssue({ code: "custom", path: ["maxOutputTokens"], message: t("assistant:settings.validation.outputTokens") });
      if (value.longContext && value.longContext.inputTokensThreshold >= value.maxInputTokens) ctx.addIssue({ code: "custom", path: ["longContext", "inputTokensThreshold"], message: t("assistant:settings.validation.longContextThreshold") });
    }),
  });
}
export type ModelFormValues = z.input<ReturnType<typeof modelFormSchema>>;
export type ModelFormOutput = z.output<ReturnType<typeof modelFormSchema>>;
export function modelErrorFields(): Record<string, FieldPath<ModelFormValues>> {
  const map: Record<string, FieldPath<ModelFormValues>> = {};
  const fields: readonly FieldPath<ModelFormValues>[] = ["name", "providerModelId", "isActive",
    "technical.supportsText", "technical.supportsTools", "technical.supportsImages", "technical.supportsPdf", "technical.supportsAdaptiveThinking",
    "technical.efforts", "technical.maxInputTokens", "technical.maxOutputTokens", "technical.longContext.inputTokensThreshold"];
  const moneyFields: readonly FieldPath<ModelFormValues>[] = ["inputPricePerMillion", "outputPricePerMillion",
    "technical.cacheReadPricePerMillion", "technical.cacheWrite5MinutesPricePerMillion", "technical.cacheWrite1HourPricePerMillion",
    "technical.longContext.inputPricePerMillion", "technical.longContext.outputPricePerMillion", "technical.longContext.cacheReadPricePerMillion",
    "technical.longContext.cacheWrite5MinutesPricePerMillion", "technical.longContext.cacheWrite1HourPricePerMillion"];
  for (const field of fields) map[field] = field;
  for (const field of moneyFields) {
    map[field] = field; map[`${field}.amount`] = field; map[`${field}.currency`] = field;
  }
  return map;
}
export function modelFormValues(read: AssistantModelPriceResponse | undefined): ModelFormValues {
  const technical = read?.technical;
  const longContext = technical?.longContext;
  return { name: read?.name ?? "", providerModelId: read?.providerModelId ?? "",
    inputPricePerMillion: read?.inputPricePerMillion ?? null, outputPricePerMillion: read?.outputPricePerMillion ?? null, isActive: read?.isActive ?? true,
    technical: { supportsText: technical?.supportsText ?? false, supportsTools: technical?.supportsTools ?? false,
      supportsImages: technical?.supportsImages ?? false, supportsPdf: technical?.supportsPdf ?? false, supportsAdaptiveThinking: technical?.supportsAdaptiveThinking ?? false,
      efforts: (["low", "medium", "high"] as const).filter((effort) => technical?.efforts.includes(effort)), maxInputTokens: technical?.maxInputTokens ?? null,
      maxOutputTokens: technical?.maxOutputTokens ?? null, cacheReadPricePerMillion: technical?.cacheReadPricePerMillion ?? null,
      cacheWrite5MinutesPricePerMillion: technical?.cacheWrite5MinutesPricePerMillion ?? null,
      cacheWrite1HourPricePerMillion: technical?.cacheWrite1HourPricePerMillion ?? null,
      longContext: { inputTokensThreshold: longContext?.inputTokensThreshold ?? null,
        inputPricePerMillion: longContext?.inputPricePerMillion ?? null, outputPricePerMillion: longContext?.outputPricePerMillion ?? null,
        cacheReadPricePerMillion: longContext?.cacheReadPricePerMillion ?? null,
        cacheWrite5MinutesPricePerMillion: longContext?.cacheWrite5MinutesPricePerMillion ?? null,
        cacheWrite1HourPricePerMillion: longContext?.cacheWrite1HourPricePerMillion ?? null },
    } };
}
