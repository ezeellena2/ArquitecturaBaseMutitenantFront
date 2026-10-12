import { api } from "@/shared/api/httpClient";
import type { AssistantAttachmentSummaryResponse, AssistantUploadRequest } from "@/modules/assistant/api/types";
import { assistantConversationPath, withAssistantQuery } from "./assistant";
import type { AssistantScope } from "./assistant";

// El schema representa binary como string; el adaptador del navegador recibe el archivo real.
export type AssistantUploadInput = Omit<AssistantUploadRequest, "file"> & { file: File };

export function uploadAssistantAttachment(scope: AssistantScope, id: string, request: AssistantUploadInput, key: string, signal?: AbortSignal): Promise<AssistantAttachmentSummaryResponse> {
  const form = new FormData();
  form.append("file", request.file);
  form.append("conversationVersion", String(request.conversationVersion));
  return api.postForm<AssistantAttachmentSummaryResponse>(`${assistantConversationPath(scope, id)}/attachments`, form, {
    signal, headers: { "Idempotency-Key": key },
  });
}

export function downloadAssistantAttachment(scope: AssistantScope, id: string, attachmentId: string, signal?: AbortSignal): Promise<Response> {
  return api.response(`${assistantConversationPath(scope, id)}/attachments/${encodeURIComponent(attachmentId)}`, {
    method: "GET", signal, cache: "no-store", headers: { Accept: "image/png, image/jpeg, image/webp, application/pdf" },
  });
}

export function deleteAssistantAttachment(scope: AssistantScope, id: string, attachmentId: string, version: AssistantAttachmentSummaryResponse["version"], signal?: AbortSignal): Promise<void> {
  return api.delete<void>(withAssistantQuery(`${assistantConversationPath(scope, id)}/attachments/${encodeURIComponent(attachmentId)}`, { version }), { signal });
}
