import { describe, expect, it, vi } from "vitest";
import { saveAssistantDownload } from "./privateDownload";
import { validateAssistantFiles } from "./assistantFiles";

describe("archivos privados del chat", () => {
  const limits = { maxAttachments: 5, maxAttachmentBytes: 10 * 1024 * 1024 };
  it("limita a cinco archivos, 10 MiB y los tipos admitidos antes de HTTP", () => {
    const png = new File(["image"], "a.png", { type: "image/png" });
    const large = new File([new Uint8Array(10 * 1024 * 1024 + 1)], "large.pdf", { type: "application/pdf" });
    expect(validateAssistantFiles([png], 5, limits)).toBe("tooMany");
    expect(validateAssistantFiles([large], 0, limits)).toBe("tooLarge");
    expect(validateAssistantFiles([new File(["html"], "evil.pdf", { type: "text/html" })], 0, limits)).toBe("invalidType");
    expect(validateAssistantFiles([png], 4, limits)).toBeNull();
  });
  it("usa límites de State y acepta exactamente sus fronteras", () => {
    const limits = { maxAttachments: 1, maxAttachmentBytes: 3 };
    const exact = new File(["abc"], "small.pdf", { type: "application/pdf" });
    const larger = new File(["abcd"], "large.pdf", { type: "application/pdf" });
    expect(validateAssistantFiles([exact], 0, limits)).toBeNull();
    expect(validateAssistantFiles([exact], 1, limits)).toBe("tooMany");
    expect(validateAssistantFiles([larger], 0, limits)).toBe("tooLarge");
    expect(validateAssistantFiles([exact, exact], 0, { ...limits, maxAttachments: 2 })).toBeNull();
  });
  it("rechaza HTML aunque el archivo se llame PDF", async () => {
    const controller = new AbortController();
    await expect(saveAssistantDownload(new Response("<script/>", { headers: { "content-type": "text/html" } }), "file.pdf", ["application/pdf"], { key: "k", signal: controller.signal, assertActive: () => controller.signal.throwIfAborted() })).rejects.toMatchObject({ code: "Assistant.Attachment.InvalidType" });
  });
  it("no crea una URL si el contexto termina mientras se lee el Blob", async () => {
    const controller = new AbortController();
    let release!: (blob: Blob) => void;
    const response = new Response("pdf", { headers: { "content-type": "application/pdf" } });
    vi.spyOn(response, "blob").mockReturnValue(new Promise((resolve) => { release = resolve; }));
    URL.createObjectURL = vi.fn();
    const download = saveAssistantDownload(response, "file.pdf", ["application/pdf"], { key: "k", signal: controller.signal, assertActive: () => controller.signal.throwIfAborted() });
    controller.abort(); release(new Blob(["pdf"]));
    await expect(download).rejects.toMatchObject({ name: "AbortError" });
    expect(URL.createObjectURL).not.toHaveBeenCalled();
  });
  it("la descarga explícita revoca su URL y no inserta un visor de PDF", async () => {
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    URL.createObjectURL = vi.fn(() => "blob:private-download"); URL.revokeObjectURL = vi.fn();
    await saveAssistantDownload(new Response("pdf", { headers: { "content-type": "application/pdf" } }), "file.pdf", ["application/pdf"], { key: "k", signal: new AbortController().signal, assertActive: () => {} });
    expect(click).toHaveBeenCalledOnce();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:private-download");
    expect(document.querySelector("iframe, object, embed")).toBeNull();
    click.mockRestore();
  });
});
