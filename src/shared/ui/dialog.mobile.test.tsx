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
    expect(screen.getByRole("button", { name: "Cerrar" })).toHaveClass("size-8");
    expect(document.querySelector('[data-slot="dialog-header"]')).toHaveClass("bg-[var(--cab)]", "min-h-12");
    expect(screen.getByRole("button", { name: "Guardar" }).parentElement).toHaveClass("[&_button]:w-full", "md:[&_button]:w-auto");
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
