export const assistantAttachmentTypes = ["image/png", "image/jpeg", "image/webp", "application/pdf"] as const;
export interface PendingAssistantFile { id: string; file: File; invalid?: "tooLarge" }
export function validateAssistantFiles(files: readonly File[], count: number): "tooMany" | "tooLarge" | "invalidType" | null {
  if (count + files.length > 5) return "tooMany";
  if (files.some((file) => file.size > 10 * 1024 * 1024)) return "tooLarge";
  if (files.some((file) => !(assistantAttachmentTypes as readonly string[]).includes(file.type))) return "invalidType";
  return null;
}
