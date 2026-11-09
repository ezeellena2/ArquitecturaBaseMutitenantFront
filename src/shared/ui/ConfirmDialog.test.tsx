import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { ConfirmDialog } from "./ConfirmDialog";
import { changeCulture, configureI18n } from "@/shared/i18n";
import { renderWithProviders } from "@/test/utils/renderWithProviders";

beforeAll(async () => {
  await configureI18n([
    { code: "es-AR", languageCode: "es", fallbackCulture: null, isEnabled: true, isDefault: true },
    { code: "en-US", languageCode: "en", fallbackCulture: "es-AR", isEnabled: true, isDefault: false },
  ]);
});

describe("ConfirmDialog", () => {
  it("confirms and closes", async () => {
    const onConfirm = vi.fn();
    const onOpenChange = vi.fn();
    renderWithProviders(
      <ConfirmDialog
        open
        onOpenChange={onOpenChange}
        title="Deshabilitar usuario"
        description="No va a poder ingresar."
        confirmLabel="Deshabilitar"
        onConfirm={onConfirm}
      />,
    );

    await userEvent.click(screen.getByRole("button", { name: "Deshabilitar" }));

    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("cancels without calling the action", async () => {
    const onConfirm = vi.fn();
    renderWithProviders(
      <ConfirmDialog
        open
        onOpenChange={vi.fn()}
        title="Deshabilitar usuario"
        confirmLabel="Deshabilitar"
        onConfirm={onConfirm}
      />,
    );

    await userEvent.click(screen.getByRole("button", { name: "Cancelar" }));

    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("uses the current culture for its default cancel label", async () => {
    await changeCulture("en-US");
    try {
      renderWithProviders(
        <ConfirmDialog
          open
          onOpenChange={vi.fn()}
          title="Confirm"
          confirmLabel="Continue"
          onConfirm={vi.fn()}
        />,
      );

      expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
    } finally {
      await changeCulture("es-AR");
    }
  });

  it("names the way out after what it keeps when asked to", async () => {
    const onConfirm = vi.fn();
    const onOpenChange = vi.fn();
    renderWithProviders(
      <ConfirmDialog
        open
        onOpenChange={onOpenChange}
        title="¿Salir sin guardar?"
        confirmLabel="Salir sin guardar"
        cancelLabel="Seguir editando"
        destructive
        onConfirm={onConfirm}
      />,
    );

    // "Cancelar" frente a "Salir sin guardar" no dice qué se cancela: si la salida o los cambios.
    expect(screen.queryByRole("button", { name: "Cancelar" })).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Seguir editando" }));

    expect(onConfirm).not.toHaveBeenCalled();
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("traps focus, closes on Escape, and returns focus to the trigger", async () => {
    function Harness() {
      const [open, setOpen] = useState(false);

      return (
        <>
          <button type="button" onClick={() => setOpen(true)}>
            {"Abrir"}
          </button>
          <ConfirmDialog
            open={open}
            onOpenChange={setOpen}
            title="Deshabilitar usuario"
            confirmLabel="Deshabilitar"
            onConfirm={vi.fn()}
          />
        </>
      );
    }

    renderWithProviders(<Harness />);

    const trigger = screen.getByRole("button", { name: "Abrir" });
    await userEvent.click(trigger);

    const dialog = await screen.findByRole("dialog");
    expect(dialog.contains(document.activeElement)).toBe(true);

    // El foco no se escapa del diálogo aunque se tabule más veces que elementos enfocables tiene adentro.
    for (let i = 0; i < 6; i++) {
      await userEvent.tab();
      expect(dialog.contains(document.activeElement)).toBe(true);
    }

    await userEvent.keyboard("{Escape}");

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    await waitFor(() => expect(trigger).toHaveFocus());
  });

  it("marks a destructive confirmation differently from a plain one and states what will be lost", () => {
    renderWithProviders(
      <ConfirmDialog
        open
        onOpenChange={vi.fn()}
        title="Eliminar usuario"
        description="Se van a borrar sus datos y no se puede deshacer."
        confirmLabel="Eliminar"
        destructive
        onConfirm={vi.fn()}
      />,
    );

    expect(screen.getByText("Se van a borrar sus datos y no se puede deshacer.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Eliminar" })).toHaveAttribute("data-variant", "destructive");
    expect(screen.getByRole("button", { name: "Eliminar" })).toHaveClass("bg-[var(--peligro)]");
    expect(screen.queryByRole("button", { name: "Cerrar" })).not.toBeInTheDocument();
  });

  // «Criterio · Decisiones» (161): decidir a propósito. El título nombra lo que se decide, la confirmación va sin ✕ y el
  // foco arranca en «Cancelar», así Enter no confirma sin querer.
  it("arranca con el foco en «Cancelar» y va sin ✕", async () => {
    const onConfirm = vi.fn();
    renderWithProviders(<ConfirmDialog open onOpenChange={vi.fn()} title="¿Dar de baja a Tomás Acosta?" confirmLabel="Dar de baja" onConfirm={onConfirm} />);

    await waitFor(() => expect(screen.getByRole("button", { name: "Cancelar" })).toHaveFocus());
    expect(screen.getByRole("dialog", { name: "¿Dar de baja a Tomás Acosta?" })).toBeVisible();
    expect(screen.queryByRole("button", { name: "Cerrar" })).not.toBeInTheDocument();
    await userEvent.keyboard("{Enter}");
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("keeps the default variant when the confirmation is not destructive", () => {
    renderWithProviders(
      <ConfirmDialog
        open
        onOpenChange={vi.fn()}
        title="Guardar cambios"
        confirmLabel="Guardar"
        onConfirm={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: "Guardar" })).toHaveAttribute("data-variant", "default");
  });

  // «Criterio · Diálogos» (.texto) y tablero Avisos («Salir sin guardar», .p-dlg .tx): en la compu el texto va de 13,5
  // con interlineado 1,55, gris. En el teléfono, el de las hojas de confirmar (.ap-txt-l de M-Configuracion-Quitar,
  // M-Cuenta-Metodo…): 14,5 con interlineado 1,5, gris.
  it("el texto va de 13,5 en la compu y de 14,5 en el teléfono, como los tableros", () => {
    renderWithProviders(<ConfirmDialog open onOpenChange={vi.fn()} title="¿Salir sin guardar?" description="Se pierde lo que cambiaste acá."
      confirmLabel="Salir sin guardar" destructive onConfirm={vi.fn()} />);

    const text = screen.getByText("Se pierde lo que cambiaste acá.");
    expect(text).toHaveClass("text-[0.84375rem]", "leading-[1.55]", "text-[var(--t2)]", "max-md:text-[0.90625rem]", "max-md:leading-normal");
    expect(text).not.toHaveClass("max-md:text-[var(--t1)]");
  });

  // «Criterio · Diálogos», Mientras trabaja (base de la 12): queda abierta hasta la respuesta, con su botón en gerundio, y
  // se cierra con la respuesta, sea cual sea.
  function Waiting({ action }: { action: () => Promise<void> }) {
    const [open, setOpen] = useState(true);
    const [pending, setPending] = useState(false);
    return <ConfirmDialog open={open} onOpenChange={setOpen} title="¿Dar de baja a Ana Gómez?" confirmLabel="Dar de baja" destructive
      pending={pending} pendingLabel="Dando de baja…"
      onConfirm={() => { setPending(true); void action().catch(() => undefined).finally(() => { setPending(false); setOpen(false); }); }} />;
  }

  it.each([["sale bien", true], ["falla", false]] as const)("queda abierta hasta la respuesta cuando %s", async (_case, succeeds) => {
    let settle: () => void = () => undefined;
    const action = () => new Promise<void>((resolve, reject) => { settle = succeeds ? resolve : () => reject(new Error("falló")); });
    const user = userEvent.setup();
    renderWithProviders(<Waiting action={action} />);

    await user.click(screen.getByRole("button", { name: "Dar de baja" }));
    const working = screen.getByRole("button", { name: "Dando de baja…" });
    expect(working).toBeDisabled();
    expect(working).not.toHaveClass("disabled:opacity-50");
    expect(screen.getByRole("button", { name: "Cancelar" })).toBeDisabled();
    await user.keyboard("{Escape}");
    expect(screen.getByRole("dialog", { name: "¿Dar de baja a Ana Gómez?" })).toBeInTheDocument();

    settle();
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });
});
