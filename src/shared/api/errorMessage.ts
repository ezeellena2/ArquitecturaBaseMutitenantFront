import type { TFunction } from "i18next";
import { toastError } from "@/shared/ui/sonner";
import { ApiError } from "./ApiError";

/// Red, 5xx y 429: se avisan igual en cualquier pantalla. En una mutación los avisa el MutationCache (salvo
/// `meta.handlesError`); en una consulta, el QueryCache o la pantalla de error de la consulta.
export function isGenericApiError(error: unknown): error is ApiError {
  return error instanceof ApiError && (error.isNetworkError || error.status >= 500 || error.status === 429);
}

/// El texto de un error donde pasó, en el idioma de la persona («Criterio · Avisos y errores»): sin conexión y 5xx con
/// el texto común; lo demás, también un 429, con el `detail` que ya tradujo el back («Esperá un minuto antes de volver a
/// invitar…»). Nunca el `message` crudo ni un código técnico.
export function apiErrorMessage(error: unknown, t: TFunction): string {
  if (error instanceof ApiError) {
    if (error.isNetworkError) return t("errors:network");
    if (error.status >= 500) return t("errors:server");
    if (error.detail) return error.detail;
    if (error.status === 429) return t("errors:rateLimited");
  }
  return t("errors:server");
}

/// Lo que la pantalla muestra de una acción que falló (un formulario, un ⋮): `null` si no hay error o si ya lo avisó
/// el MutationCache, con «Reintentar» o «Copiar código». El mismo error nunca va en dos lugares.
export function actionErrorMessage(error: unknown, t: TFunction): string | null {
  return error == null || isGenericApiError(error) ? null : apiErrorMessage(error, t);
}

/// Una acción directa que falló (un ⋮, un botón, una confirmación) se avisa abajo, en rojo y sin irse sola; los
/// errores genéricos ya los avisó el MutationCache.
export function toastActionError(error: unknown, t: TFunction): void {
  const message = actionErrorMessage(error, t);
  if (message) toastError(message);
}
