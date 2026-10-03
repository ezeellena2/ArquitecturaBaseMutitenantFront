import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { configureI18n } from "@/shared/i18n";
import { Dialog, DialogContent, DialogTitle } from "./dialog";

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
