import { ApiError } from "@/shared/api/ApiError";

/// Los datos del alta de un correo que pueden llevar un error debajo.
export type LoginMethodField = "code";

const fields: Readonly<Record<string, LoginMethodField>> = {
  "Auth.LoginCode.Invalid": "code",
};

/// Tableros Cuenta-Verificar y M-Cuenta-Verificar: el código que el back rechaza («El código no es válido.») va debajo
/// de los casilleros, con el texto del back; lo demás (vencido, ya usado, demasiados intentos) va en la franja del diálogo.
export function loginMethodErrorField(error: unknown): LoginMethodField | null {
  return error instanceof ApiError && error.code ? fields[error.code] ?? null : null;
}
