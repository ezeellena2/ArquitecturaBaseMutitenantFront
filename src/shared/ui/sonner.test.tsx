import { afterEach, describe, expect, it, vi } from "vitest";
import { toast, type ToasterProps } from "sonner";
import { renderWithProviders } from "@/test/utils/renderWithProviders";
import { asPhone } from "@/test/utils/phone";
import { Toaster, toastError } from "./sonner";

vi.mock("sonner", async (importOriginal) => {
  const actual = await importOriginal<typeof import("sonner")>();
  return {
    ...actual,
    Toaster: ({ position, richColors, style, toastOptions }: ToasterProps) => (
      <div
        data-testid="sonner-root"
        data-x-position={position?.split("-")[1]}
        data-y-position={position?.split("-")[0]}
        data-rich-colors={String(richColors)}
        data-toast-padding={toastOptions?.style?.padding}
        data-toast-gap={toastOptions?.style?.gap}
        data-toast-radius={toastOptions?.style?.borderRadius}
        data-toast-font-size={toastOptions?.style?.fontSize}
        data-toast-shadow={toastOptions?.style?.boxShadow}
        style={style}
      />
    ),
  };
});

afterEach(() => vi.restoreAllMocks());

describe("Toaster · Criterio v65", () => {
  // Tablero Avisos («Guardado», .p-aviso) y «Criterio · Avisos» (.toast3): en la compu, abajo a la derecha, blanco con
  // borde y sombra, el texto oscuro y solo el ícono de color (index.css).
  it("puts white toasts with a shadow at the bottom right using system tokens", () => {
    renderWithProviders(<Toaster />);
    const toaster = document.querySelector<HTMLElement>("[data-testid='sonner-root']");

    expect(toaster).toHaveAttribute("data-x-position", "right");
    expect(toaster).toHaveAttribute("data-y-position", "bottom");
    expect(toaster).toHaveAttribute("data-rich-colors", "false");
    expect(toaster).toHaveAttribute("data-toast-shadow", "var(--sombra-aviso)");
    expect(toaster).toHaveAttribute("data-toast-padding", "12px 14px");
    expect(toaster).toHaveAttribute("data-toast-gap", "10px");
    expect(toaster).toHaveAttribute("data-toast-radius", "10px");
    expect(toaster).toHaveAttribute("data-toast-font-size", "13px");
    expect((toaster as HTMLElement).style.getPropertyValue("--width")).toBe("340px");
    expect((toaster as HTMLElement).style.getPropertyValue("--border-radius")).toBe("10px");
    expect((toaster as HTMLElement).style.getPropertyValue("--normal-bg")).toBe("var(--lado-activo)");
    expect((toaster as HTMLElement).style.getPropertyValue("--normal-border")).toBe("var(--borde)");
    expect((toaster as HTMLElement).style.getPropertyValue("--normal-text")).toBe("var(--t1)");
    expect((toaster as HTMLElement).style.getPropertyValue("--success-bg")).toBe("");
  });

  // Tablero M-Avisos: en el teléfono el aviso pasajero es una franja oscura abajo, a lo ancho, con el ícono de color.
  it("en el teléfono es una franja oscura abajo, a lo ancho", () => {
    const restore = asPhone();
    try {
      renderWithProviders(<Toaster />);
      const toaster = document.querySelector<HTMLElement>("[data-testid='sonner-root']")!;

      expect(toaster).toHaveAttribute("data-x-position", "center");
      expect(toaster).toHaveAttribute("data-rich-colors", "false");
      expect(toaster).toHaveAttribute("data-toast-padding", "13px 14px 13px 16px");
      expect(toaster).toHaveAttribute("data-toast-radius", "14px");
      expect(toaster).toHaveAttribute("data-toast-font-size", "14.5px");
      expect(toaster.style.getPropertyValue("--normal-bg")).toBe("var(--franja)");
      expect(toaster.style.getPropertyValue("--normal-text")).toBe("var(--lado-activo)");
    } finally {
      restore();
    }
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
