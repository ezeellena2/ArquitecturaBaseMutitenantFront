import type { AssistantOperationContext } from "../hooks/useAssistantOperations";
import { ApiError } from "@/shared/api/ApiError";

export async function saveAssistantDownload(response: Response, name: string, allowed: readonly string[], context: AssistantOperationContext): Promise<void> {
  context.assertActive();
  const mediaType = response.headers.get("Content-Type")?.split(";")[0].trim().toLowerCase();
  if (!mediaType || !allowed.includes(mediaType)) throw new ApiError(422, { code: "Assistant.Attachment.InvalidType" });
  const blob = await response.blob();
  context.assertActive();
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  try {
    context.assertActive();
    anchor.href = url;
    anchor.download = Array.from(name, (char) => char.charCodeAt(0) < 32 || char === "/" || char === "\\" ? "_" : char).join("");
    anchor.click();
  } finally { anchor.remove(); URL.revokeObjectURL(url); }
}
