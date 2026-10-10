import type { TFunction } from "i18next";
import type { AssistantErrorEventResponse } from "@/shared/api/types";
import { apiErrorMessage } from "@/shared/api/errorMessage";

const streamTexts: Readonly<Record<string, string>> = {
  "Assistant.Provider.Unavailable": "streamErrors.unavailable",
  "Assistant.Provider.ContextTooLarge": "streamErrors.contextTooLarge",
};

export function assistantStreamErrorMessage(error: AssistantErrorEventResponse, t: TFunction): string {
  const key = streamTexts[error.code];
  return key ? t(key) : apiErrorMessage(error, t);
}

export function canRetryAssistantFailure(error: AssistantErrorEventResponse | undefined): boolean {
  // La ficha durable anterior no publica el motivo del fallo.
  return !error || error.code === "Assistant.Provider.Unavailable";
}
