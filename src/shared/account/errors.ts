import { ApiError } from "@/shared/api/ApiError";
import { accountErrorCodes } from "@/shared/api/accountContract";

/// Los datos del alta de un correo que pueden llevar un error debajo.
export type LoginMethodField = "code" | "phone";

const fields: Readonly<Record<string, LoginMethodField>> = {
  "Auth.LoginCode.Invalid": "code",
  [accountErrorCodes.phoneAlreadyUsed]: "phone",
  [accountErrorCodes.phoneInvalid]: "phone",
  [accountErrorCodes.phoneNotMobile]: "phone",
  [accountErrorCodes.phoneCountryNotAllowed]: "phone",
};

/// Tableros Cuenta-Verificar y M-Cuenta-Verificar: el código que el back rechaza («El código no es válido.») va debajo
/// de los casilleros, con el texto del back; lo demás (vencido, ya usado, demasiados intentos) va en la franja del diálogo.
export function loginMethodErrorField(error: unknown): LoginMethodField | null {
  if (error instanceof ApiError && error.errors?.phone?.length) return "phone";
  return error instanceof ApiError && error.code ? fields[error.code] ?? null : null;
}
