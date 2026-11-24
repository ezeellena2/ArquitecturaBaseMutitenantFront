import { readFileSync } from "node:fs";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { toast, type ToasterProps } from "sonner";
import { renderWithProviders } from "@/test/utils/renderWithProviders";
import { asPhone } from "@/test/utils/phone";
import { Toaster, toastDurations, toastError, toastErrorWithCode } from "./sonner";

const css = readFileSync(path.resolve(import.meta.dirname, "../../index.css"), "utf8");
const phoneCss = css.slice(css.indexOf("/* En el teléfono, los avisos suben"), css.indexOf("@media (min-width: 768px)"));
const desktopCss = css.slice(css.indexOf("@media (min-width: 768px)"));

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
        data-duration={toastOptions?.duration}
        data-toast-padding={toastOptions?.style?.padding}
        data-toast-gap={toastOptions?.style?.gap}
        data-toast-radius={toastOptions?.style?.borderRadius}
        data-toast-font-size={toastOptions?.style?.fontSize}
        data-toast-shadow={toastOptions?.style?.boxShadow}
        style={style}
      >
        <span data-testid="icon-success">{icons?.success}</span>
        <span data-testid="icon-info">{icons?.info}</span>
        <span data-testid="icon-warning">{icons?.warning}</span>
        <span data-testid="icon-error">{icons?.error}</span>
      </div>
    ),
  };
});

afterEach(() => vi.restoreAllMocks());

function paths(svg: Element | null): (string | null)[] {
  return [...(svg?.querySelectorAll("path") ?? [])].map((item) => item.getAttribute("d"));
}

describe("Toaster · Criterio v65", () => {
  // Tablero Avisos («Guardado», .p-aviso) y «Criterio · Avisos» (.toast3): en la compu, abajo a la derecha, blanco con
  // borde y sin sombra (173) y el texto oscuro.
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
    expect((toaster as HTMLElement).style.getPropertyValue("--normal-border")).toBe("var(--borde2)");
    expect((toaster as HTMLElement).style.getPropertyValue("--normal-text")).toBe("var(--t1)");
    expect((toaster as HTMLElement).style.getPropertyValue("--success-bg")).toBe("");
    // Tablero Avisos (.p-aviso): la tilde dibujada como el lienzo (círculo de 8,5 en 18, con trazo 2).
    const ok = toaster!.querySelector<SVGElement>("[data-testid='icon-success'] svg")!;
    expect(ok).toHaveClass("size-4.5");
    expect(ok).toHaveAttribute("stroke-width", "2");
    expect(ok.querySelector("circle")).toHaveAttribute("r", "8.5");
    expect(ok.querySelector("path")).toHaveAttribute("d", "m8.5 12 2.4 2.4 4.6-4.8");
  });

  // 210 («Criterio · Avisos», Avisos según el tipo): el fondo nunca dice el tipo. En la compu la tarjeta es blanca y el
  // tipo va en un filo de 3 a la izquierda y en el ícono, del mismo color: tilde verde, (i) gris, triángulo ámbar y
  // octógono rojo. El error ya no suma un borde rojo alrededor.
  it("en la compu, el tipo va en el filo de 3 y en el ícono, del mismo color", () => {
    renderWithProviders(<Toaster />);
    const toaster = document.querySelector<HTMLElement>("[data-testid='sonner-root']")!;

    expect(paths(toaster.querySelector("[data-testid='icon-info'] svg"))).toContain("M12 11v5");
    expect(paths(toaster.querySelector("[data-testid='icon-warning'] svg"))).toContain("M12 10v4");
    const error = toaster.querySelector("[data-testid='icon-error'] svg");
    expect(error?.querySelector("circle")).toBeNull();
    expect(paths(error)).toEqual(["M8.7 3h6.6L21 8.7v6.6L15.3 21H8.7L3 15.3V8.7z", "m14.5 9.5-5 5", "m9.5 9.5 5 5"]);
    expect(error).toHaveAttribute("stroke-width", "2");

    expect(desktopCss).toContain('[data-sonner-toaster] [data-sonner-toast][data-styled="true"] { border-left-width: 3px; border-left-color: var(--t2); }');
    for (const [type, color] of [["success", "--aviso-ok"], ["warning", "--alerta"], ["error", "--peligro"]]) {
      expect(desktopCss).toMatch(new RegExp(`\\[data-sonner-toaster\\] \\[data-sonner-toast\\]\\[data-type="${type}"\\] \\{ border-left-color: var\\(${color}\\);`));
    }
    for (const [type, color] of [["success", "--aviso-ok"], ["info", "--t2"], ["warning", "--alerta"], ["error", "--peligro"]]) {
      expect(desktopCss).toContain(`[data-sonner-toast][data-type="${type}"] [data-icon] { color: var(${color}); }`);
    }
    expect(desktopCss).not.toContain("--peligro-borde");
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
      // M-Avisos (.f-snack .ok y .mal): la tilde de 20 y el octógono de 28.
      const ok = toaster!.querySelector<SVGElement>("[data-testid='icon-success'] svg")!;
      expect(ok).toHaveClass("size-5");
      expect(ok.querySelector("circle")).toHaveAttribute("r", "8.5");
      const error = toaster.querySelector("[data-testid='icon-error'] svg");
      expect(error).toHaveClass("size-7");
      expect(paths(error)).toContain("m14.5 9.5-5 5");
      // index.css: la franja va a 13 de la barra de botones (75 + 13), con el renglón de 1,4 y el ícono en su caja, sin
      // márgenes.
      expect(css).toContain('body:has([data-slot="fixed-actions"]) [data-sonner-toaster][data-y-position="bottom"] { bottom: 5.5rem; }');
      expect(css).toContain('[data-sonner-toast][data-styled="true"] [data-title] { font-weight: 400; line-height: inherit; }');
      expect(css).toContain('[data-sonner-toaster] [data-sonner-toast][data-type="error"] [data-icon] { width: 1.75rem; height: 1.75rem; }');
    } finally {
      restore();
    }
  });

  // 210 y M-Avisos (.f-snack, con el filo del 18/11): la franja oscura de siempre, sin borde alrededor y con el filo de 3
  // de su tipo a la izquierda, del color de su ícono: verde, rojo, ámbar o el gris de .neu.
  it("en el teléfono, la franja lleva el filo y el ícono de su tipo", () => {
    expect(phoneCss).toContain('[data-sonner-toaster] [data-sonner-toast][data-styled="true"] { border-width: 0; border-left-width: 3px; border-left-color: var(--punto-apagado); }');
    for (const [type, color] of [["success", "--franja-ok"], ["warning", "--punto-alerta"], ["error", "--franja-mal"]]) {
      expect(phoneCss).toContain(`[data-sonner-toaster] [data-sonner-toast][data-type="${type}"] { border-left-color: var(${color}); }`);
    }
    for (const [type, color] of [["success", "--franja-ok"], ["info", "--punto-apagado"], ["warning", "--punto-alerta"], ["error", "--franja-mal"]]) {
      expect(phoneCss).toContain(`[data-sonner-toast][data-type="${type}"] [data-icon] { color: var(${color}); }`);
    }
  });

  // 210: todo aviso pasajero se va solo; el que salió bien, a los 4 s.
  it("lo que salió bien se va solo a los 4 segundos, en la compu y en el teléfono", () => {
    expect(toastDurations).toEqual({ passing: 4000, error: 10_000 });
    renderWithProviders(<Toaster />);
    expect(document.querySelector("[data-testid='sonner-root']")).toHaveAttribute("data-duration", "4000");

    const restore = asPhone();
    try {
      document.body.innerHTML = "";
      renderWithProviders(<Toaster />);
      expect(document.querySelector("[data-testid='sonner-root']")).toHaveAttribute("data-duration", "4000");
    } finally {
      restore();
    }
  });

  // 210: el de error se va a los 10 s, con la ✕ para cerrarlo antes.
  it("el de error se va a los 10 segundos y lleva la ✕", () => {
    const error = vi.spyOn(toast, "error");
    toastError("No se pudo guardar.");

    expect(error).toHaveBeenCalledWith("No se pudo guardar.", { duration: 10_000, closeButton: true });
  });

  // 210: el que trae una acción, sea del tipo que sea, como «Reintentar», queda hasta cerrarlo.
  it("el de error con una acción queda hasta cerrarlo", () => {
    const error = vi.spyOn(toast, "error");
    const retry = { label: "Reintentar", onClick: vi.fn() };
    toastError("No pudimos conectarnos. Revisá tu conexión.", { action: retry });

    expect(error).toHaveBeenCalledWith("No pudimos conectarnos. Revisá tu conexión.", {
      action: retry,
      duration: Number.POSITIVE_INFINITY,
      closeButton: true,
    });
  });

  // Tablero Avisos, «Error del servidor» (.p-aviso .o-tt): en la compu, «Copiar código» va debajo del texto, a 6, y la ✕
  // a la derecha; en el teléfono (M-Avisos, .f-snack), al lado del texto, como «Reintentar». Con su acción, queda.
  it("el aviso de un 5xx lleva «Copiar código» debajo del texto en la compu y queda hasta cerrarlo", () => {
    const error = vi.spyOn(toast, "error");
    const onClick = vi.fn();
    toastErrorWithCode("Algo salió mal. Probá de nuevo en un rato.", { label: "Copiar código", onClick });

    expect(error).toHaveBeenCalledWith("Algo salió mal. Probá de nuevo en un rato.", {
      action: { label: "Copiar código", onClick },
      className: "aviso-codigo",
      duration: Number.POSITIVE_INFINITY,
      closeButton: true,
    });
    expect(desktopCss).toMatch(/\.aviso-codigo \{[^}]*display: grid;[^}]*grid-template-columns: auto minmax\(0, 1fr\) auto;/);
    // Sin `:first-of-type`: la ✕ también es un botón y va antes, así que la acción nunca es la primera.
    expect(desktopCss).toMatch(/\.aviso-codigo \[data-button\] \{[^}]*grid-area: 2 \/ 2;[^}]*margin: -0.25rem 0 0;/);
    expect(desktopCss).toMatch(/\.aviso-codigo \[data-close-button\] \{[^}]*grid-area: 1 \/ 3;/);
    expect(css.slice(0, css.indexOf("@media (min-width: 768px)"))).not.toContain("aviso-codigo");
  });
});
