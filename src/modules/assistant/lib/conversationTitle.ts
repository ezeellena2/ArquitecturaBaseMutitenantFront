import type { TFunction } from "i18next";
import type { AssistantConversationSummaryResponse } from "@/modules/assistant/api/types";

/// El nombre de una conversación en la lista, en su ⋮ y al borrarla. Una que esta versión no puede leer (0064 §6) llega
/// sin título y se ve «Conversación no disponible»; una nueva todavía sin título, «Nueva conversación».
export function assistantConversationTitle(conversation: Pick<AssistantConversationSummaryResponse, "title" | "available">, t: TFunction): string {
  if (!conversation.available) return t("assistant:history.unavailable");
  return conversation.title ?? t("assistant:history.untitled");
}
