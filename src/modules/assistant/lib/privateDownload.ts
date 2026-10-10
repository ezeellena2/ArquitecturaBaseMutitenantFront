import type { AssistantOperationContext } from "../hooks/useAssistantOperations";
import { ApiError } from "@/shared/api/ApiError";

export async function saveAssistantDownload(response: Response, name: string, allowed: readonly string[], context: AssistantOperationContext): Promise<void> {
  context.assertActive();
  const mediaType = response.headers.get("Content-Type")?.split(";")[0].trim().toLowerCase();
  if (!mediaType || !allowed.includes(mediaType)) throw new ApiError(422, { code: "Assistant.Attachment.UnsupportedType" });
  const blob = await response.blob();
  context.assertActive();
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  let handedOff = false;
  let released = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const release = () => {
    if (released) return;
    released = true;
    clearTimeout(timer);
    context.signal.removeEventListener("abort", release);
    URL.revokeObjectURL(url);
  };
  try {
    context.assertActive();
    anchor.href = url;
    anchor.download = Array.from(name, (char) => char.charCodeAt(0) < 32 || char === "/" || char === "\\" ? "_" : char).join("");
    document.body.append(anchor);
    context.signal.addEventListener("abort", release, { once: true });
    anchor.click();
    context.assertActive();
    // Firefox/Safari necesitan consumir el Blob después del click. El enlace
    // desaparece ahora; la URL se libera al abortar o tras un plazo acotado.
    timer = setTimeout(release, 60_000);
    handedOff = true;
  } finally { anchor.remove(); if (!handedOff) release(); }
}
