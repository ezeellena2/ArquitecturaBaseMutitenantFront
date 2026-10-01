import { afterEach, describe, expect, it, vi } from "vitest";
import { toast, type ToasterProps } from "sonner";
import { renderWithProviders } from "@/test/utils/renderWithProviders";
import { Toaster, toastError } from "./sonner";

vi.mock("sonner", async (importOriginal) => {
  const actual = await importOriginal<typeof import("sonner")>();
  return {
    ...actual,
    Toaster: ({ position, richColors, style }: ToasterProps) => (
      <div
        data-testid="sonner-root"
        data-x-position={position?.split("-")[1]}
        data-y-position={position?.split("-")[0]}
        data-rich-colors={String(richColors)}
        style={style}
      />
    ),
  };
});

afterEach(() => vi.restoreAllMocks());

describe("Toaster · Criterio v60", () => {
  it("puts colored toasts at the bottom right using system tokens", () => {
    renderWithProviders(<Toaster />);
    const toaster = document.querySelector<HTMLElement>("[data-testid='sonner-root']");

    expect(toaster).toHaveAttribute("data-x-position", "right");
    expect(toaster).toHaveAttribute("data-y-position", "bottom");
    expect(toaster).toHaveAttribute("data-rich-colors", "true");
    expect((toaster as HTMLElement).style.getPropertyValue("--success-bg")).toBe("var(--ok-t)");
    expect((toaster as HTMLElement).style.getPropertyValue("--error-bg")).toBe("var(--peligro-t)");
  });

  it("keeps direct failures visible until the user closes them", () => {
    const error = vi.spyOn(toast, "error");
    toastError("No se pudo guardar.");

    expect(error).toHaveBeenCalledWith("No se pudo guardar.", {
      duration: Number.POSITIVE_INFINITY,
      closeButton: true,
    });
  });
});
