import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/utils/renderWithProviders";
import { ConversationDialog, type ConversationDialogState } from "./ConversationDialog";

const conversation: ConversationDialogState["conversation"] = { id: "chat", title: "Mi consulta", version: 1, isSaved: false, createdAtUtc: "2026-10-10T12:00:00Z", lastActivityAtUtc: "2026-10-10T12:00:00Z" };

describe("confirmación de conversaciones", () => {
  it("renombrar reconoce cambios y volver al nombre guardado; valida sin perder el borrador", async () => {
    const confirm = vi.fn();
    const user = userEvent.setup();
    renderWithProviders(<ConversationDialog value={{ kind: "rename", conversation, trigger: null }} pending={false} error={null} onClose={() => {}} onConfirm={confirm} />);
    const name = screen.getByRole("textbox", { name: "Nombre" });
    const save = screen.getByRole("button", { name: "Guardar cambios" });
    expect(save).toBeDisabled();
    fireEvent.change(name, { target: { value: "Otro nombre" } });
    expect(save).toBeEnabled();
    fireEvent.change(name, { target: { value: conversation.title } });
    expect(save).toBeDisabled();
    fireEvent.change(name, { target: { value: "   " } });
    await user.click(save);
    expect(await screen.findByText("Escribí un nombre.")).toBeInTheDocument();
    expect(confirm).not.toHaveBeenCalled();
    fireEvent.change(name, { target: { value: "  Otro nombre  " } });
    await user.click(save);
    expect(confirm).toHaveBeenCalledExactlyOnceWith("Otro nombre");
  });

  it.each(["rename", "delete"] as const)("%s anuncia espera real e impide una segunda confirmación por UI", async (kind) => {
    const confirm = vi.fn();
    const user = userEvent.setup();
    function PendingDialog() {
      const [pending, setPending] = useState(false);
      return <ConversationDialog value={{ kind, conversation, trigger: null }} pending={pending} error={null} onClose={() => {}} onConfirm={(title) => { confirm(title); setPending(true); }} />;
    }
    renderWithProviders(<PendingDialog />);
    if (kind === "rename") fireEvent.change(screen.getByRole("textbox", { name: "Nombre" }), { target: { value: "Nuevo nombre" } });
    await user.click(screen.getByRole("button", { name: kind === "rename" ? "Guardar cambios" : "Borrar" }));
    const saving = await screen.findByRole("button", { name: "Guardando…" });
    expect(saving).toBeDisabled();
    expect(within(saving).getByText("Guardando…")).toBeVisible();
    await user.click(saving);
    expect(confirm).toHaveBeenCalledExactlyOnceWith(kind === "rename" ? "Nuevo nombre" : "");
    if (kind === "rename") expect(screen.getByRole("textbox", { name: "Nombre" })).toHaveValue("Nuevo nombre");
  });

  it("Cancelar cierra y devuelve foco al disparador", async () => {
    const user = userEvent.setup();
    function WithTrigger() {
      const [trigger, setTrigger] = useState<HTMLButtonElement | null>(null);
      return <><button onClick={(event) => setTrigger(event.currentTarget)}>{"Renombrar"}</button>{trigger ? <ConversationDialog value={{ kind: "rename", conversation, trigger }} pending={false} error={null} onClose={() => setTrigger(null)} onConfirm={() => {}} /> : null}</>;
    }
    renderWithProviders(<WithTrigger />);
    const trigger = screen.getByRole("button", { name: "Renombrar" });
    await user.click(trigger);
    await user.click(screen.getByRole("button", { name: "Cancelar" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(trigger).toHaveFocus();
  });
});
