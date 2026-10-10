import { fireEvent, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/utils/renderWithProviders";
import { AttachmentComposer } from "./AttachmentComposer";

const props = { files: [], placeholder: "Preguntá algo", unavailable: false, pending: false, canStop: false, onFiles: () => {}, onRemove: () => {}, onSend: async () => true, onStop: () => {} };

describe("disponibilidad y espera del compositor", () => {
  it("disponible vacío deja enviar y valida sin llamar al envío", async () => {
    const send = vi.fn(async () => true);
    const user = userEvent.setup();
    renderWithProviders(<AttachmentComposer {...props} onSend={send} />);
    const button = screen.getByRole("button", { name: "Enviar" });
    expect(button).toBeEnabled();
    await user.click(button);
    expect(await screen.findByText("Escribí una consulta.")).toBeInTheDocument();
    expect(send).not.toHaveBeenCalled();
    fireEvent.change(screen.getByRole("textbox", { name: "Tu consulta" }), { target: { value: "Una consulta" } });
    await user.click(button);
    expect(send).toHaveBeenCalledExactlyOnceWith("Una consulta");
  });

  it("un bloqueo externo apaga la acción sin anunciar una escritura", () => {
    renderWithProviders(<AttachmentComposer {...props} unavailable />);
    const send = screen.getByRole("button", { name: "Enviar" });
    expect(send).toBeDisabled();
    expect(within(send).queryByText("Guardando…")).not.toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Tu consulta" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Adjuntar" })).toBeDisabled();
  });

  it("espera real anuncia el pendiente y Detener conserva su propia acción", async () => {
    const send = vi.fn(async () => true);
    const stop = vi.fn();
    const user = userEvent.setup();
    const app = renderWithProviders(<AttachmentComposer {...props} pending onSend={send} onStop={stop} />);
    const sending = screen.getByRole("button", { name: "Guardando…" });
    expect(sending).toBeDisabled();
    expect(within(sending).getByText("Guardando…")).toBeVisible();
    await user.click(sending);
    expect(send).not.toHaveBeenCalled();
    app.rerender(<AttachmentComposer {...props} pending canStop onSend={send} onStop={stop} />);
    const stopping = screen.getByRole("button", { name: "Detener" });
    expect(stopping).toBeEnabled();
    await user.click(stopping);
    expect(stop).toHaveBeenCalledOnce();
    expect(screen.queryByRole("button", { name: "Enviar" })).not.toBeInTheDocument();
  });
});
