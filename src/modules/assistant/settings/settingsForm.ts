import { validationConstraints } from "@/shared/api/generated/validation";
import type { TFunction } from "i18next";
import { z } from "zod";
import type { OrganizationAssistantSettingsResponse, PlatformAssistantSettingsResponse } from "@/shared/api/types";

// TextLimits.Description/LongText del backend; el schema HTTP no publica maxLength.
export const assistantDescriptionMaxLength = 500;
export const assistantKeyMaxLength = 4000;
const moneySchema = (t: TFunction) => z.object({ amount: z.number(), currency: z.string() }).refine((value) => value.amount >= 0 && value.amount < 1e12 && value.currency.length > 0, t("assistant:settings.validation.money"));
export const assistantMoneySchema = (t: TFunction) => moneySchema(t).nullable().refine((value) => value !== null, t("assistant:settings.validation.money"));
export function settingsSchema(t: TFunction, platform: boolean) {
  const positiveInteger = z.number().int(t("assistant:settings.validation.limit")).min(1, t("assistant:settings.validation.limit")).max(validationConstraints.UpdatePlatformAssistantSettingsHttpRequest.dailyMessageLimit.maximum, t("assistant:settings.validation.limit")).nullable();
  return z.object({ mode: z.enum(["PlatformKey", "OwnKey"]), modelId: z.string(), effort: z.enum(["low", "medium", "high"]),
    dailyMessageLimit: positiveInteger, monthlyBudget: moneySchema(t).nullable(),
    allowedModelIds: z.array(z.string()), personalEnabled: z.boolean(), retentionDays: positiveInteger,
    keyAction: z.enum(["keep", "replace", "clear"]),
  }).superRefine((value, ctx) => {
    if (!value.modelId) ctx.addIssue({ code: "custom", path: ["modelId"], message: t("assistant:settings.validation.model") });
    if ((platform || value.mode === "OwnKey") && value.dailyMessageLimit === null) ctx.addIssue({ code: "custom", path: ["dailyMessageLimit"], message: t("assistant:settings.validation.limit") });
    if (platform && value.monthlyBudget === null) ctx.addIssue({ code: "custom", path: ["monthlyBudget"], message: t("assistant:settings.validation.money") });
    if (platform && value.retentionDays === null) ctx.addIssue({ code: "custom", path: ["retentionDays"], message: t("assistant:settings.validation.limit") });
  });
}
export type SettingsValues = z.infer<ReturnType<typeof settingsSchema>>;
export type SettingsRead = OrganizationAssistantSettingsResponse | PlatformAssistantSettingsResponse;
export function settingsValues(settings: SettingsRead): SettingsValues {
  const platform = "defaultModelId" in settings;
  return { mode: platform ? "PlatformKey" : settings.mode, modelId: platform ? settings.defaultModelId : settings.modelId,
    effort: settings.effort, dailyMessageLimit: settings.dailyMessageLimit,
    monthlyBudget: platform ? settings.monthlyOrganizationBudget : settings.monthlyBudget ?? null,
    allowedModelIds: platform ? settings.allowedModelIds : [], personalEnabled: platform ? settings.personalEnabled : false,
    retentionDays: settings.retentionDays, keyAction: "keep" };
}
