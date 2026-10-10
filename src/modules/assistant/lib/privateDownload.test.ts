import { afterEach, describe, expect, it, vi } from "vitest";
import { saveAssistantDownload } from "./privateDownload";
import { validateAssistantFiles } from "./assistantFiles";

afterEach(() => { vi.restoreAllMocks(); vi.useRealTimers(); });

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
    await expect(saveAssistantDownload(new Response("<script/>", { headers: { "content-type": "text/html" } }), "file.pdf", ["application/pdf"], { key: "k", signal: controller.signal, assertActive: () => controller.signal.throwIfAborted() })).rejects.toMatchObject({ code: "Assistant.Attachment.UnsupportedType" });
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
  it.each(["application/pdf", "text/markdown"])("descarga %s con enlace conectado y tiempo acotado para consumir el Blob", async (mediaType) => {
    vi.useFakeTimers();
    const click = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function (this: HTMLAnchorElement) {
      expect(this.isConnected).toBe(true);
      expect(this.download).toBe("private__file");
    });
    URL.createObjectURL = vi.fn(() => "blob:private-download"); URL.revokeObjectURL = vi.fn();
    await saveAssistantDownload(new Response("bytes", { headers: { "content-type": mediaType } }), "private/\\file", [mediaType], { key: "k", signal: new AbortController().signal, assertActive: () => {} });
    expect(click).toHaveBeenCalledOnce();
    expect(URL.revokeObjectURL).not.toHaveBeenCalled();
    expect(document.querySelector('a[href="blob:private-download"]')).toBeNull();
    await vi.advanceTimersByTimeAsync(59_999);
    expect(URL.revokeObjectURL).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1);
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:private-download");
    expect(document.querySelector("iframe, object, embed")).toBeNull();
  });
  it("abortar libera el Blob antes del plazo y no revoca dos veces", async () => {
    vi.useFakeTimers();
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    URL.createObjectURL = vi.fn(() => "blob:private-download"); URL.revokeObjectURL = vi.fn();
    const controller = new AbortController();
    await saveAssistantDownload(new Response("pdf", { headers: { "content-type": "application/pdf" } }), "file.pdf", ["application/pdf"], { key: "k", signal: controller.signal, assertActive: () => controller.signal.throwIfAborted() });
    controller.abort();
    expect(URL.revokeObjectURL).toHaveBeenCalledExactlyOnceWith("blob:private-download");
    expect(vi.getTimerCount()).toBe(0);
  });
  it("un fallo al iniciar la descarga libera inmediatamente el enlace y su URL", async () => {
    vi.useFakeTimers();
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => { throw new Error("click failed"); });
    URL.createObjectURL = vi.fn(() => "blob:private-download"); URL.revokeObjectURL = vi.fn();
    await expect(saveAssistantDownload(new Response("pdf", { headers: { "content-type": "application/pdf" } }), "file.pdf", ["application/pdf"], { key: "k", signal: new AbortController().signal, assertActive: () => {} })).rejects.toThrow("click failed");
    expect(URL.revokeObjectURL).toHaveBeenCalledExactlyOnceWith("blob:private-download");
    expect(document.querySelector('a[href="blob:private-download"]')).toBeNull();
    expect(vi.getTimerCount()).toBe(0);
  });
});
