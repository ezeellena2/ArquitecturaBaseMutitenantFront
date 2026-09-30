import { ApiError } from "@/shared/api/ApiError";

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
