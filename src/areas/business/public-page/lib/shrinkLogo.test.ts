import { afterEach, describe, expect, it, vi } from "vitest";
import { shrinkLogo } from "./shrinkLogo";

// jsdom no decodifica imágenes ni dibuja: se simulan el bitmap y el canvas, y se mira lo que se pidió.
function mockCanvas(width: number, height: number) {
  const close = vi.fn();
  vi.stubGlobal("createImageBitmap", vi.fn(async () => ({ width, height, close })));
  const drawImage = vi.fn();
  const canvases: HTMLCanvasElement[] = [];
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockImplementation(function (this: HTMLCanvasElement) {
    canvases.push(this);
    return { drawImage, imageSmoothingQuality: "low" } as unknown as CanvasRenderingContext2D;
  } as unknown as HTMLCanvasElement["getContext"]);
  const toDataURL = vi.spyOn(HTMLCanvasElement.prototype, "toDataURL").mockImplementation((type?: string) => `data:${type};base64,QUJD`);
  return { close, drawImage, canvases, toDataURL };
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("shrinkLogo", () => {
  it("un PNG grande sale como PNG con el lado mayor en 256", async () => {
    const { canvases, drawImage, toDataURL, close } = mockCanvas(1024, 512);
    const logo = await shrinkLogo(new Blob(["x"], { type: "image/png" }));
    expect(logo).toEqual({ dataUri: "data:image/png;base64,QUJD", base64: "QUJD", contentType: "image/png" });
    expect([canvases[0].width, canvases[0].height]).toEqual([256, 128]);
    expect(drawImage).toHaveBeenCalledWith(expect.anything(), 0, 0, 256, 128);
    expect(toDataURL).toHaveBeenCalledWith("image/png", 0.9);
    expect(close).toHaveBeenCalledOnce();
  });

  it("un WebP sale como PNG, para conservar la transparencia", async () => {
    mockCanvas(300, 600);
    const logo = await shrinkLogo(new Blob(["x"], { type: "image/webp" }));
    expect(logo.contentType).toBe("image/png");
  });

  it("un JPEG sale como JPEG", async () => {
    const { canvases } = mockCanvas(800, 800);
    const logo = await shrinkLogo(new Blob(["x"], { type: "image/jpeg" }));
    expect(logo.contentType).toBe("image/jpeg");
    expect(logo.dataUri.startsWith("data:image/jpeg;base64,")).toBe(true);
    expect([canvases[0].width, canvases[0].height]).toEqual([256, 256]);
  });

  it("uno chico no se agranda", async () => {
    const { canvases } = mockCanvas(64, 40);
    await shrinkLogo(new Blob(["x"], { type: "image/png" }));
    expect([canvases[0].width, canvases[0].height]).toEqual([64, 40]);
  });

  it("si no se puede decodificar, rechaza", async () => {
    vi.stubGlobal("createImageBitmap", vi.fn(async () => { throw new DOMException("bad", "InvalidStateError"); }));
    await expect(shrinkLogo(new Blob(["x"], { type: "image/png" }))).rejects.toThrow();
  });

  it("si el canvas no codifica el formato pedido, rechaza", async () => {
    mockCanvas(100, 100).toDataURL.mockReturnValue("data:,");
    await expect(shrinkLogo(new Blob(["x"], { type: "image/png" }))).rejects.toThrow();
  });
});
