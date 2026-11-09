import { readFileSync } from "node:fs";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { toast, type ToasterProps } from "sonner";
import { renderWithProviders } from "@/test/utils/renderWithProviders";
import { asPhone } from "@/test/utils/phone";
import { Toaster, toastError, toastErrorWithCode } from "./sonner";

const css = readFileSync(path.resolve(import.meta.dirname, "../../index.css"), "utf8");

vi.mock("sonner", async (importOriginal) => {
  const actual = await importOriginal<typeof import("sonner")>();
  return {
    ...actual,
    Toaster: ({ position, richColors, style, toastOptions, icons }: ToasterProps) => (
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
      >
        <span data-testid="icon-success">{icons?.success}</span>
        <span data-testid="icon-error">{icons?.error}</span>
      </div>
    ),
  };
});

afterEach(() => vi.restoreAllMocks());

describe("Toaster · Criterio v65", () => {
  // Tablero Avisos («Guardado», .p-aviso) y «Criterio · Avisos» (.toast3): en la compu, abajo a la derecha, blanco con
  // borde y sin sombra (173), el texto oscuro y solo el ícono de color (index.css).
  it("puts white toasts with their border at the bottom right using system tokens", () => {
    renderWithProviders(<Toaster />);
    const toaster = document.querySelector<HTMLElement>("[data-testid='sonner-root']");

    expect(toaster).toHaveAttribute("data-x-position", "right");
    expect(toaster).toHaveAttribute("data-y-position", "bottom");
    expect(toaster).toHaveAttribute("data-rich-colors", "false");
    expect(toaster).not.toHaveAttribute("data-toast-shadow");
    expect(toaster).toHaveAttribute("data-toast-padding", "0.75rem 0.875rem");
    expect(toaster).toHaveAttribute("data-toast-gap", "0.625rem");
    // La escala de la compu (180): las esquinas, de 3 como mucho.
    expect(toaster).toHaveAttribute("data-toast-radius", "0.25rem");
    expect(toaster).toHaveAttribute("data-toast-font-size", "0.8125rem");
    expect((toaster as HTMLElement).style.getPropertyValue("--width")).toBe("21.25rem");
    expect((toaster as HTMLElement).style.getPropertyValue("--border-radius")).toBe("0.625rem");
    expect((toaster as HTMLElement).style.getPropertyValue("--normal-bg")).toBe("var(--superficie)");
    expect((toaster as HTMLElement).style.getPropertyValue("--normal-border")).toBe("var(--borde)");
    expect((toaster as HTMLElement).style.getPropertyValue("--normal-text")).toBe("var(--t1)");
    expect((toaster as HTMLElement).style.getPropertyValue("--success-bg")).toBe("");
    // Tablero Avisos (.p-aviso): la tilde y el signo dibujados como el lienzo (círculo de 8,5 en 18, con trazo 2).
    const ok = toaster!.querySelector<SVGElement>("[data-testid='icon-success'] svg")!;
    expect(ok).toHaveClass("size-4.5");
    expect(ok).toHaveAttribute("stroke-width", "2");
    expect(ok.querySelector("circle")).toHaveAttribute("r", "8.5");
    expect(ok.querySelector("path")).toHaveAttribute("d", "m8.5 12 2.4 2.4 4.6-4.8");
    expect(toaster!.querySelector("[data-testid='icon-error'] svg circle")).toHaveAttribute("r", "8.5");
  });

  // Tablero M-Avisos: en el teléfono el aviso pasajero es una franja oscura abajo, a lo ancho, con el ícono de color.
  it("en el teléfono es una franja oscura abajo, a lo ancho", () => {
    const restore = asPhone();
    try {
      renderWithProviders(<Toaster />);
      const toaster = document.querySelector<HTMLElement>("[data-testid='sonner-root']")!;

      expect(toaster).toHaveAttribute("data-x-position", "center");
      expect(toaster).toHaveAttribute("data-rich-colors", "false");
      expect(toaster).toHaveAttribute("data-toast-padding", "0.8125rem 0.875rem 0.8125rem 1rem");
      expect(toaster).toHaveAttribute("data-toast-radius", "0.875rem");
      expect(toaster).toHaveAttribute("data-toast-font-size", "0.90625rem");
      expect(toaster.style.getPropertyValue("--normal-bg")).toBe("var(--franja)");
      expect(toaster.style.getPropertyValue("--normal-text")).toBe("var(--superficie)");
      // M-Avisos (.f-snack .ok y .mal): la tilde de 20 y el signo de 28, con el círculo de 8,5 del tablero.
      const ok = toaster!.querySelector<SVGElement>("[data-testid='icon-success'] svg")!;
      expect(ok).toHaveClass("size-5");
      expect(ok.querySelector("circle")).toHaveAttribute("r", "8.5");
      expect(toaster.querySelector("[data-testid='icon-error'] svg")).toHaveClass("size-7");
      // index.css: la franja va a 13 de la barra de botones (75 + 13), sin borde, con el renglón de 1,4 y el ícono en su
      // caja, sin márgenes.
      expect(css).toContain('body:has([data-slot="fixed-actions"]) [data-sonner-toaster][data-y-position="bottom"] { bottom: 5.5rem; }');
      expect(css).toContain('[data-sonner-toaster] [data-sonner-toast][data-styled="true"] { border-width: 0; }');
      expect(css).toContain('[data-sonner-toast][data-styled="true"] [data-title] { font-weight: 400; line-height: inherit; }');
      expect(css).toContain('[data-sonner-toaster] [data-sonner-toast][data-type="error"] [data-icon] { width: 1.75rem; height: 1.75rem; }');
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

  // Tablero Avisos, «Error del servidor» (.p-aviso .o-tt): en la compu, «Copiar código» va debajo del texto, a 6, y la ✕
  // a la derecha; en el teléfono (M-Avisos, .f-snack), al lado del texto, como «Reintentar».
  it("el aviso de un 5xx lleva «Copiar código» debajo del texto en la compu", () => {
    const error = vi.spyOn(toast, "error");
    const onClick = vi.fn();
    toastErrorWithCode("Algo salió mal. Probá de nuevo en un rato.", { label: "Copiar código", onClick });

    expect(error).toHaveBeenCalledWith("Algo salió mal. Probá de nuevo en un rato.", {
      action: { label: "Copiar código", onClick },
      className: "aviso-codigo",
      duration: Number.POSITIVE_INFINITY,
      closeButton: true,
    });
    const desktop = css.slice(css.indexOf("@media (min-width: 768px)"));
    expect(desktop).toMatch(/\.aviso-codigo \{[^}]*display: grid;[^}]*grid-template-columns: auto minmax\(0, 1fr\) auto;/);
    // Sin `:first-of-type`: la ✕ también es un botón y va antes, así que la acción nunca es la primera.
    expect(desktop).toMatch(/\.aviso-codigo \[data-button\] \{[^}]*grid-area: 2 \/ 2;[^}]*margin: -0.25rem 0 0;/);
    expect(desktop).toMatch(/\.aviso-codigo \[data-close-button\] \{[^}]*grid-area: 1 \/ 3;/);
    expect(css.slice(0, css.indexOf("@media (min-width: 768px)"))).not.toContain("aviso-codigo");
  });
});
