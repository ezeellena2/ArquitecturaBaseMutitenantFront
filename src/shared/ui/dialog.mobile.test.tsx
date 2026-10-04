import { render, screen } from "@testing-library/react";
import { beforeAll, describe, expect, it } from "vitest";
import { configureI18n } from "@/shared/i18n";
import { ConfirmDialog } from "./ConfirmDialog";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "./dialog";

beforeAll(async () => {
  await configureI18n([{ code: "es-AR", languageCode: "es", fallbackCulture: null, isEnabled: true, isDefault: true }]);
});

describe("Dialog mobile layout", () => {
  it("opens from the bottom on phones and stays centered from tablet size", () => {
    render(
      <Dialog open>
        <DialogContent>
          <DialogHeader><DialogTitle>{"Editar"}</DialogTitle></DialogHeader>
          <DialogFooter><button type="button">{"Guardar"}</button></DialogFooter>
        </DialogContent>
      </Dialog>,
    );

    const content = screen.getByRole("dialog", { name: "Editar" });
    expect(document.querySelector('[data-slot="dialog-overlay"]')).toHaveClass("bg-[var(--velo)]");
    expect(content).toHaveClass("bottom-0", "md:top-1/2", "md:max-w-[560px]");
    expect(content).toHaveClass("max-h-[calc(100dvh-1rem)]");
    // Tablero M-Usuarios-Invitar (.ap-hoja): en el teléfono es una hoja con esquinas de 20 y manija; el título de 18
    // va sin fondo arena, el ✕ mide 44 y los botones de 48 van uno al lado del otro, a lo ancho.
    expect(content).toHaveClass("rounded-t-[20px]", "shadow-[var(--sombra-hoja)]");
    expect(content.querySelector("[data-slot='dialog-handle']")).toHaveClass("md:hidden", "h-[5px]", "w-9");
    expect(screen.getByRole("button", { name: "Cerrar" })).toHaveClass("size-11", "md:size-8");
    expect(document.querySelector('[data-slot="dialog-header"]')).toHaveClass("md:bg-[var(--cab)]", "md:min-h-12", "max-md:bg-transparent");
    expect(screen.getByRole("heading", { name: "Editar" })).toHaveClass("max-md:text-[18px]", "max-md:font-bold");
    expect(screen.getByRole("button", { name: "Guardar" }).parentElement).toHaveClass("max-md:[&_button]:h-12", "max-md:[&_button]:flex-1", "max-md:border-0");
  });

  it("gives form dialogs nearly the full phone height and confirmations a narrower desktop width", () => {
    const { unmount } = render(
      <Dialog open>
        <DialogContent mobileFullHeight>
          <DialogTitle>{"Editar"}</DialogTitle>
        </DialogContent>
      </Dialog>,
    );
    expect(screen.getByRole("dialog", { name: "Editar" })).toHaveClass("min-h-[calc(100dvh-1rem)]");
    unmount();

    render(<ConfirmDialog open onOpenChange={() => {}} title="Eliminar" confirmLabel="Eliminar" onConfirm={() => {}} />);
    expect(screen.getByRole("dialog", { name: "Eliminar" })).toHaveClass("md:max-w-[420px]");
  });
});
