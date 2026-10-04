import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { configureI18n } from "@/shared/i18n";
import { Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "./dialog";

beforeAll(async () => {
  await configureI18n([{ code: "es-AR", languageCode: "es", fallbackCulture: null, isEnabled: true, isDefault: true }]);
});

function renderDialog(onOpenChange: (open: boolean) => void) {
  render(
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogTitle>{"Invitar usuario"}</DialogTitle>
        <input aria-label="Correo" />
      </DialogContent>
    </Dialog>,
  );
}

describe("Dialog: cómo se cierra (Criterio-Dialogos)", () => {
  it("no se cierra con un clic afuera, para no perder lo escrito", async () => {
    // El velo tiene pointer-events: none mientras el diálogo es modal; el clic igual llega al documento.
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    const onOpenChange = vi.fn();
    renderDialog(onOpenChange);

    await user.click(document.querySelector('[data-slot="dialog-overlay"]')!);
    await user.click(document.body);

    expect(onOpenChange).not.toHaveBeenCalled();
    expect(screen.getByRole("dialog", { name: "Invitar usuario" })).toBeInTheDocument();
  });

  it("se cierra con ✕ y con Escape", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    renderDialog(onOpenChange);

    await user.keyboard("{Escape}");
    expect(onOpenChange).toHaveBeenLastCalledWith(false);

    onOpenChange.mockClear();
    await user.click(screen.getByRole("button", { name: "Cerrar" }));
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
  });
});

// Tablero «Criterio · Dialogos»: encabezado arena de 48 con el título de 15 y sin bajada; cuerpo con 20 de margen y
// 14 entre campos; pie de 60 con una línea arriba; atrás, la pantalla solo oscurecida.
describe("Dialog: medidas (Criterio-Dialogos)", () => {
  it("arma encabezado, cuerpo y pie con las medidas del tablero", () => {
    render(
      <Dialog open>
        <DialogContent>
          <DialogHeader><DialogTitle>{"Verificar tu correo"}</DialogTitle></DialogHeader>
          <DialogBody><p>{"Te mandamos un código."}</p></DialogBody>
          <DialogFooter><button type="button">{"Verificar"}</button></DialogFooter>
        </DialogContent>
      </Dialog>,
    );

    const title = screen.getByRole("heading", { name: "Verificar tu correo" });
    expect(title).toHaveClass("md:text-[15px]", "font-semibold");
    expect(title.parentElement).toHaveClass("md:min-h-12", "md:bg-[var(--cab)]", "md:border-b");
    expect(screen.getByText("Te mandamos un código.").parentElement).toHaveClass("flex", "flex-col", "gap-3.5", "md:p-5");
    expect(screen.getByRole("button", { name: "Verificar" }).parentElement).toHaveClass("md:border-t", "md:py-3");
    // «Criterio · Diálogos» (v97): atrás, la pantalla oscurecida, sin difuminar.
    const overlay = document.querySelector("[data-slot='dialog-overlay']");
    expect(overlay).toHaveClass("bg-[var(--velo)]");
    expect(overlay?.className).not.toMatch(/backdrop-blur/);
  });
});
