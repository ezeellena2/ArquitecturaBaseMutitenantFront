import type { TFunction } from "i18next";
import type { AssistantErrorEventResponse } from "@/modules/assistant/api/types";
import { ApiError } from "@/shared/api/ApiError";
import { apiErrorMessage } from "@/shared/api/errorMessage";

const streamTexts: Readonly<Record<string, string>> = {
  "Assistant.Provider.Unavailable": "streamErrors.unavailable",
  "Assistant.Provider.Uncertain": "streamErrors.uncertain",
  "Assistant.Provider.ContextTooLarge": "streamErrors.contextTooLarge",
};

export function assistantStreamErrorMessage(error: AssistantErrorEventResponse, t: TFunction): string {
  const key = streamTexts[error.code];
  return key ? t(key) : apiErrorMessage(error, t);
}

/// Se puede volver a probar, con un turno nuevo, lo que no llegó al proveedor (`Unavailable`) y lo que pudo llegar sin una
/// respuesta confirmada (`Uncertain`, 0064 §7: un 5xx o una respuesta cortada), después de avisar el posible consumo.
const retryableFailures: ReadonlySet<string> = new Set(["Assistant.Provider.Unavailable", "Assistant.Provider.Uncertain"]);

export function canRetryAssistantFailure(error: AssistantErrorEventResponse | undefined): boolean {
  // La ficha durable anterior no publica el motivo del fallo.
  return !error || retryableFailures.has(error.code);
}

/// Lo que frena una subida antes de leer el archivo (0064 §2 y §4): sin cupo, otra subida de la misma persona, la cola
/// llena, los 120 s del cuerpo o la misma clave con otro archivo. Se dice debajo de la caja, con el texto del back, y el
/// archivo queda para volver a mandarlo: no es el tope que reemplaza la caja ni «muchas consultas seguidas».
const uploadRefusals: ReadonlySet<string> = new Set([
  "Assistant.Limit.DailyReached", "Assistant.Limit.MonthlyReached", "Assistant.Attachment.UploadBusy",
  "Assistant.Attachment.UploadQueueFull", "Assistant.Attachment.UploadTimedOut", "Request.IdempotencyKeyReused",
]);

export function assistantUploadRefusal(error: unknown, t: TFunction): string | null {
  return error instanceof ApiError && !error.isNetworkError && error.code !== undefined && uploadRefusals.has(error.code) ? apiErrorMessage(error, t) : null;
}

/// Una conversación que esta versión no puede leer (0064 §6): su GET responde 409 y se puede borrar.
export function isUnavailableConversation(error: unknown): boolean {
  return error instanceof ApiError && error.code === "Assistant.Conversation.Unavailable";
}
