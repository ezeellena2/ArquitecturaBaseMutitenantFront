import type { TFunction } from "i18next";
import { ApiError } from "@/shared/api/ApiError";
import { apiErrorMessage } from "@/shared/api/errorMessage";
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

export function loginCodeErrorMessage(error: ApiError, t: TFunction): string {
  return error.code && errorKeys[error.code] ? t(errorKeys[error.code]) : apiErrorMessage(error, t);
}

/// La franja del paso del código, igual en el ingreso y en los dos registros (tablero Ingreso): el texto del código y,
/// debajo, los intentos que quedan o lo que se puede hacer.
export function loginCodeMessage(error: ApiError, t: TFunction): AuthMessageContent {
  const details: string[] = [];
  if (typeof error.problem.attemptsLeft === "number") details.push(t("common:code.attemptsLeft", { count: error.problem.attemptsLeft }));
  if (error.code === "Auth.LoginCode.TooManyAttempts") details.push(t("auth:login.requestNewCode"));
  if (error.code === "Identity.Account.LockedOut") details.push(t("auth:login.tryLater"));
  if (error.code === "Identity.Account.Suspended") details.push(t("auth:login.contactSupport"));
  return { text: loginCodeErrorMessage(error, t), details };
}

/// Los datos de «Tu organización» que pueden llevar un error debajo.
export type BusinessSignupField = "slug" | "taxNumber";

const businessSignupFields: Readonly<Record<string, { field: BusinessSignupField; key: string }>> = {
  "Tenancy.TenantSlug.Reserved": { field: "slug", key: "businessSignup.slugReserved" },
  "Tenancy.TenantSlug.Taken": { field: "slug", key: "businessSignup.slugTaken" },
  "Tenancy.TenantSlug.Invalid": { field: "slug", key: "businessSignup.slugInvalid" },
  "TaxIds.TaxId.Invalid": { field: "taxNumber", key: "businessSignup.taxIdInvalid" },
};

/// Tablero Registro-Empresa: lo que el back rechaza de la dirección o del CUIT va debajo de ese campo, con el texto del
/// tablero; lo demás (el límite, el registro cerrado) lo resuelve la pantalla.
export function businessSignupErrorField(error: unknown): { field: BusinessSignupField; key: string } | null {
  return error instanceof ApiError && error.code ? businessSignupFields[error.code] ?? null : null;
}
