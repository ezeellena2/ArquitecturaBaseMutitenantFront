import type { AssistantStateResponse } from "@/modules/assistant/api/types";

export const assistantAttachmentTypes = ["image/png", "image/jpeg", "image/webp", "application/pdf"] as const;
export type AssistantAttachmentLimits = Pick<AssistantStateResponse, "maxAttachments" | "maxAttachmentBytes">;
export interface PendingAssistantFile { id: string; file: File; invalid?: "tooLarge" }
export function validateAssistantFiles(files: readonly File[], count: number, limits: AssistantAttachmentLimits): "tooMany" | "tooLarge" | "invalidType" | null {
  if (count + files.length > limits.maxAttachments) return "tooMany";
  if (files.some((file) => file.size > limits.maxAttachmentBytes)) return "tooLarge";
  if (files.some((file) => !(assistantAttachmentTypes as readonly string[]).includes(file.type))) return "invalidType";
  return null;
}
