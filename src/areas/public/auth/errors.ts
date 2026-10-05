import type { TFunction } from "i18next";
import { ApiError } from "@/shared/api/ApiError";
import type { AuthMessageContent } from "./components/AuthMessage";

const errorKeys: Record<string, string> = {
  "Auth.LoginCode.Invalid": "login.codeInvalid",
  "Auth.LoginCode.Expired": "login.codeExpired",
  "Auth.LoginCode.AlreadyUsed": "login.codeAlreadyUsed",
  "Auth.LoginCode.TooManyAttempts": "login.tooManyAttempts",
  "Auth.LoginCode.ResendTooSoon": "login.resendTooSoon",
  "Auth.LoginCode.TooManyRequests": "login.tooManyRequests",
  "Http.TooManyRequests": "login.networkRateLimited",
  "Validation.Failed": "login.codeInvalid",
  "Identity.Account.LockedOut": "login.accountLocked",
  "Identity.Account.Suspended": "login.accountSuspended",
};

export function loginCodeErrorKey(error: ApiError): string {
  if (error.isNetworkError) return "errors:network";
  return (error.code && errorKeys[error.code]) || "errors:server";
}

/// La franja del paso del código, igual en el ingreso y en los dos registros (tablero Ingreso): el texto del código y,
/// debajo, los intentos que quedan o lo que se puede hacer.
export function loginCodeMessage(error: ApiError, t: TFunction): AuthMessageContent {
  const details: string[] = [];
  if (typeof error.problem.attemptsLeft === "number") details.push(t("common:code.attemptsLeft", { count: error.problem.attemptsLeft }));
  if (error.code === "Auth.LoginCode.TooManyAttempts") details.push(t("auth:login.requestNewCode"));
  if (error.code === "Identity.Account.LockedOut") details.push(t("auth:login.tryLater"));
  if (error.code === "Identity.Account.Suspended") details.push(t("auth:login.contactSupport"));
  return { text: t(loginCodeErrorKey(error)), details };
}
