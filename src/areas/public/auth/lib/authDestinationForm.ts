import type { TFunction } from "i18next";
import { z } from "zod";
import type { LoginDestination, PhoneDraft } from "@/shared/api/types";
import { effectiveCulture } from "@/shared/i18n";
import { browserTimeZone } from "@/shared/time/browserTimeZone";
import { sameLoginDestination, toLoginDestinationRequest } from "./loginDestination";

export function authDestinationSchema(t: TFunction) {
  return z.object({
    channel: z.enum(["email", "phone"]),
    email: z.string(),
    phone: z.object({ country: z.string(), number: z.string() }).nullable(),
  }).superRefine((value, context) => {
    if (value.channel === "email" && !z.email().safeParse(value.email.trim()).success) {
      context.addIssue({ code: "custom", path: ["email"], message: t("auth:login.emailInvalid") });
    }
    if (value.channel === "phone" && (!value.phone?.country || !value.phone.number.trim())) {
      context.addIssue({ code: "custom", path: ["phone"], message: t("auth:login.phoneRequired") });
    }
  });
}

export type AuthDestinationFields = z.infer<ReturnType<typeof authDestinationSchema>>;

export function destinationFromFields(values: AuthDestinationFields): LoginDestination {
  return values.channel === "phone" ? { type: "phone", phone: { ...values.phone! } }
    : { type: "email", email: values.email.trim() };
}

export function phoneFromNavigation(state: unknown): PhoneDraft | null {
  const parsed = z.object({ phone: z.object({ country: z.string().min(1), number: z.string().min(1) }) }).safeParse(state);
  return parsed.success ? parsed.data.phone : null;
}

export function destinationNavigationState(destination: LoginDestination) {
  return destination.type === "phone" ? { phone: { ...destination.phone } } : { email: destination.email };
}

export interface SignupCodeOperation {
  destination: LoginDestination;
  acceptedTerms: true;
  culture: string;
  timeZoneId?: string;
  journey: number;
  code?: string;
}

export function signupCodeOperation(destination: LoginDestination, journey: number, code?: string): SignupCodeOperation {
  return { destination, acceptedTerms: true, culture: effectiveCulture() ?? navigator.language,
    timeZoneId: browserTimeZone(), journey, ...(code !== undefined ? { code } : {}) };
}

export function signupCodeRequest(operation: SignupCodeOperation) {
  return { ...toLoginDestinationRequest(operation.destination), acceptedTerms: operation.acceptedTerms,
    culture: operation.culture, timeZoneId: operation.timeZoneId };
}

export function sameSignupCodeOperation(previous: SignupCodeOperation, next: SignupCodeOperation): boolean {
  return sameLoginDestination(previous.destination, next.destination) && previous.code === next.code
    && previous.acceptedTerms === next.acceptedTerms && previous.culture === next.culture
    && previous.timeZoneId === next.timeZoneId && previous.journey === next.journey;
}
