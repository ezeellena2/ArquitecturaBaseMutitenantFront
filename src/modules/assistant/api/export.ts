import { api } from "@/shared/api/httpClient";
import type { AssistantExportQuery } from "@/shared/api/types";
import { assistantConversationPath, withAssistantQuery } from "./assistant";
import type { AssistantScope } from "./assistant";

export function exportAssistantConversation(scope: AssistantScope, id: string, query: AssistantExportQuery = {}, signal?: AbortSignal): Promise<Response> {
  return api.response(withAssistantQuery(`${assistantConversationPath(scope, id)}/export`, query), {
    method: "GET", signal, cache: "no-store", headers: { Accept: "text/markdown, application/pdf" },
  });
}
