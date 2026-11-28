import type { TFunction } from "i18next";
import { toastError } from "@/shared/ui/sonner";
import { formatWait } from "@/shared/format/countdown";
import { ApiError } from "./ApiError";
import { isReauthenticationCancelled } from "./recentAuthentication";

/// Red, 5xx y 429: se avisan igual en cualquier pantalla. En una mutación los avisa el MutationCache (salvo
/// `meta.handlesError`); en una consulta, el QueryCache o la pantalla de error de la consulta.
export function isGenericApiError(error: unknown): error is ApiError {
  return error instanceof ApiError && (error.isNetworkError || error.status >= 500 || error.status === 429);
}

/// Un límite de uso (E9, P2): el 429 `Security.RateLimit.Exceeded`, u otro 429, con `retryAfter`. La pantalla lo dice en el
/// lugar de la acción con la cuenta regresiva; nunca se repite solo.
export function isRateLimitError(error: unknown): error is ApiError {
  return error instanceof ApiError && error.status === 429;
}

/// Los topes de negocio que no son «muchos pedidos seguidos» y dicen su texto, el que ya tradujo el back, también en el
/// aviso de abajo: el diario del correo (0063) y el de las invitaciones por WhatsApp (B9), que frenan el reenvío de una
/// invitación desde Usuarios o una empresa hasta un día.
const quotasWithText: ReadonlySet<string> = new Set(["Messaging.Email.DailyLimit", "WhatsApp.PhoneImport.DailyLimit"]);

/// El texto de un 429 en el aviso de abajo (`queryClient`): el de su tope, si lo tiene, con la espera («Reintentá en
/// 22 h 53 min», 0063 §7) cuando la trae, porque el aviso no tiene un botón que la cuente; si no, el común.
export function rateLimitMessage(error: ApiError, t: TFunction): string {
  if (!error.code || !quotasWithText.has(error.code) || !error.detail) return t("errors:rateLimited");
  const wait = error.retryAfterSeconds;
  return wait === undefined ? error.detail : `${error.detail} ${t("errors:retryIn", { time: formatWait(wait, t) })}`;
}

/// Lo que pidió la pantalla no existe para quien mira (404, también un id de otra organización o de otro acceso): la
/// ficha muestra `NotFoundPage` en lugar de la pantalla de error con «Reintentar».
export function isNotFoundError(error: unknown): error is ApiError {
  return error instanceof ApiError && error.status === 404;
}

/// El texto de un error donde pasó, en el idioma de la persona («Criterio · Avisos y errores»): sin conexión y 5xx con
/// el texto común; lo demás, también un 429, con el `detail` que ya tradujo el back («Esperá un minuto antes de volver a
/// invitar…»). Nunca el `message` crudo ni un código técnico.
export function apiErrorMessage(error: unknown, t: TFunction): string {
  // Cancelar «Confirmá que sos vos» no es un error: el formulario vuelve como estaba, sin franja.
  if (isReauthenticationCancelled(error)) return "";
  if (error instanceof ApiError) {
    if (error.isNetworkError) return t("errors:network");
    if (error.code === "Security.RateLimit.Exceeded") return t("errors:rateLimitExceeded");
    if (error.status >= 500) return t("errors:server");
    if (error.detail) return error.detail;
    if (error.status === 429) return t("errors:rateLimited");
  }
  return t("errors:server");
}

/// Lo que la pantalla muestra de una acción que falló (un formulario, un ⋮): `null` si no hay error o si ya lo avisó
/// el MutationCache, con «Reintentar» o «Copiar código». El mismo error nunca va en dos lugares.
export function actionErrorMessage(error: unknown, t: TFunction): string | null {
  return error == null || isGenericApiError(error) || isReauthenticationCancelled(error) ? null : apiErrorMessage(error, t);
}

/// La franja de un formulario que dice su límite de uso en el lugar de la acción (`meta.handlesRateLimit`, como Mi cuenta):
/// el 429 con el texto que tradujo el back, mientras el botón cuenta la espera (`useRetryAfterCountdown`); lo demás, como
/// `actionErrorMessage`.
export function rateLimitedActionMessage(error: unknown, t: TFunction): string | null {
  return isRateLimitError(error) ? apiErrorMessage(error, t) : actionErrorMessage(error, t);
}

/// Una acción directa que falló (un ⋮, un botón, una confirmación) se avisa abajo, en rojo y sin irse sola; los
/// errores genéricos ya los avisó el MutationCache.
export function toastActionError(error: unknown, t: TFunction): void {
  const message = actionErrorMessage(error, t);
  if (message) toastError(message);
}
