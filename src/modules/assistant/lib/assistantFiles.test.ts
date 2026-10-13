import { expect, it } from "vitest";
import { assistantAttachmentTypes, validateAssistantFiles } from "./assistantFiles";

it("acepta los formatos publicados y valida tamaño/cantidad recibidos antes del envío", () => {
  const limits = { maxAttachments: 2, maxAttachmentBytes: 4 };
  for (const mediaType of assistantAttachmentTypes) {
    const file = new File(["1234"], "fixture", { type: mediaType });
    expect(validateAssistantFiles([file], 1, limits)).toBeNull();
    expect(validateAssistantFiles([file], 2, limits)).toBe("tooMany");
    expect(validateAssistantFiles([new File(["12345"], "fixture", { type: mediaType })], 0, limits)).toBe("tooLarge");
  }
  expect(validateAssistantFiles([new File(["x"], "fixture", { type: "text/html" })], 0, limits)).toBe("invalidType");
});
