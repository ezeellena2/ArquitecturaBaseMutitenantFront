import { afterEach, describe, expect, it, vi } from "vitest";
import { copyToClipboard } from "./clipboard";

describe("copyToClipboard", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("copia el texto y devuelve true cuando navigator.clipboard responde bien", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText } });

    await expect(copyToClipboard("abc-123")).resolves.toBe(true);
    expect(writeText).toHaveBeenCalledWith("abc-123");
  });

  it("devuelve false si navigator.clipboard falla o no está disponible", async () => {
    const writeText = vi.fn().mockRejectedValue(new Error("denied"));
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText } });

    await expect(copyToClipboard("abc-123")).resolves.toBe(false);
  });
});
