import { fireEvent, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import { ApiError } from "@/shared/api/ApiError";
import { changeCulture } from "@/shared/i18n";
import { renderWithProviders } from "@/test/utils/renderWithProviders";
import { asPhone } from "@/test/utils/phone";
import { ReasonDialog, type ReasonDialogProps, type ReasonDialogValues } from "./ReasonDialog";

const queryRoot = ["platform-tenants"] as const;
const stateConflictCodes = ["Tenancy.Tenant.InvalidTransition", "Users.User.InvalidTransition", "Legal.AccountDeletion.AlreadyPending", "Platform.AccountRecovery.AlreadyResolved"];
function dialog(overrides: Partial<ReasonDialogProps<{ version: number }>> = {}) {
  const mutationFn = vi.fn<(values: ReasonDialogValues) => Promise<{ version: number }>>().mockResolvedValue({ version: 7 });
  const onSuccess = vi.fn();
  const onClose = vi.fn();
  const view = renderWithProviders(<ReasonDialog title="¿Suspender Grupo Delta?" description="Nadie entra mientras esté suspendida."
    confirmLabel="Suspender" pendingLabel="Suspendiendo…" destructive queryRoot={queryRoot} stateConflictCodes={stateConflictCodes}
    mutationFn={mutationFn} onSuccess={onSuccess} onClose={onClose} {...overrides} />);
  return { ...view, mutationFn, onSuccess, onClose };
}

async function writeReason() {
  await userEvent.type(screen.getByRole("textbox", { name: "Motivo" }), "  Verificamos el pedido  ");
}

describe("ReasonDialog (E5)", () => {
  it("sin motivo, dice qué escribir bajo el campo y no manda", async () => {
    const { mutationFn } = dialog();
    const action = await screen.findByRole("button", { name: "Suspender" });
    expect(action).toBeEnabled();
    await userEvent.click(action);
    const reason = screen.getByRole("textbox", { name: "Motivo" });
    expect(reason).toHaveAccessibleDescription("Escribí el motivo.");
    expect(mutationFn).not.toHaveBeenCalled();
    await writeReason();
    expect(screen.queryByText("Escribí el motivo.")).not.toBeInTheDocument();
  });

  it("con fecha mal escrita dice el formato debajo de Hasta y no manda", async () => {
    const { mutationFn } = dialog({ date: {}, confirmLabel: "Extender prueba", pendingLabel: "Extendiendo…", destructive: false });
    await screen.findByRole("textbox", { name: "Motivo" });
    const date = screen.getByRole("textbox", { name: "Hasta" });
    await waitFor(() => expect(date).toBeEnabled());
    expect(date).toBeRequired();
    expect(screen.getByRole("textbox", { name: "Motivo" })).toBeRequired();
    fireEvent.change(date, { target: { value: "31/02/2026" } });
    fireEvent.blur(date);
    await writeReason();
    expect(screen.getAllByRole("alert")).toHaveLength(1);
    expect(screen.getByRole("alert")).toHaveTextContent("Escribí la fecha como dd/mm/aaaa.");
    await userEvent.click(screen.getByRole("button", { name: "Extender prueba" }));
    expect(date).toHaveAccessibleDescription(expect.stringContaining("Escribí la fecha como dd/mm/aaaa."));
    expect(screen.getAllByRole("alert")).toHaveLength(1);
    expect(mutationFn).not.toHaveBeenCalled();
    fireEvent.change(date, { target: { value: "18/10/2026" } });
    await userEvent.click(screen.getByRole("button", { name: "Extender prueba" }));
    await waitFor(() => expect(mutationFn).toHaveBeenCalledWith({ reason: "Verificamos el pedido", expiresOn: "2026-10-18" }));
  });

  it("la fecha inválida también tiene una sola alerta al enviar con Enter", async () => {
    const { mutationFn } = dialog({ date: {}, confirmLabel: "Extender prueba", destructive: false });
    await screen.findByRole("textbox", { name: "Motivo" });
    await writeReason();
    const date = screen.getByRole("textbox", { name: "Hasta" });
    await waitFor(() => expect(date).toBeEnabled());
    fireEvent.change(date, { target: { value: "31/02/2026" } });
    await userEvent.click(date);
    await userEvent.keyboard("{Enter}");
    expect(screen.getAllByRole("alert")).toHaveLength(1);
    expect(screen.getByRole("alert")).toHaveTextContent("Escribí la fecha como dd/mm/aaaa.");
    expect(date).toHaveAccessibleDescription("Escribí la fecha como dd/mm/aaaa.");
    expect(mutationFn).not.toHaveBeenCalled();
  });

  it.each([true, false])("la acción usa el tono pedido (%s), sin X, y Cancelar cierra", async (destructive) => {
    const { onClose, mutationFn } = dialog({ destructive });
    const action = await screen.findByRole("button", { name: "Suspender" });
    expect(action).toHaveAttribute("data-variant", destructive ? "destructive" : "default");
    expect(screen.queryByRole("button", { name: "Cerrar" })).not.toBeInTheDocument();
    expect(screen.getByRole("dialog")).toHaveClass("md:max-w-[420px]");
    await userEvent.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(onClose).toHaveBeenCalledOnce();
    expect(mutationFn).not.toHaveBeenCalled();
  });

  it("Escape cierra y devuelve el foco al botón que lo abrió", async () => {
    function Harness() {
      const [open, setOpen] = useState(false);
      return <><button onClick={() => setOpen(true)}>{"Abrir"}</button>{open ? <ReasonDialog title="¿Suspender?" description="Se cierran las sesiones."
        confirmLabel="Suspender" pendingLabel="Suspendiendo…" queryRoot={queryRoot} mutationFn={async () => {}} onSuccess={vi.fn()} onClose={() => setOpen(false)} /> : null}</>;
    }
    renderWithProviders(<Harness />);
    const trigger = await screen.findByRole("button", { name: "Abrir" });
    await userEvent.click(trigger);
    const content = screen.getByRole("dialog");
    for (let i = 0; i < 5; i++) { await userEvent.tab(); expect(content.contains(document.activeElement)).toBe(true); }
    await userEvent.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    await waitFor(() => expect(trigger).toHaveFocus());
  });

  it("mientras espera, dice el verbo y deshabilita la acción", async () => {
    let finish: ((value: { version: number }) => void) | undefined;
    const pending = new Promise<{ version: number }>((resolve) => { finish = resolve; });
    dialog({ mutationFn: () => pending });
    await screen.findByRole("textbox", { name: "Motivo" });
    await writeReason();
    await userEvent.click(screen.getByRole("button", { name: "Suspender" }));
    expect(await screen.findByRole("button", { name: "Suspendiendo…" })).toBeDisabled();
    finish?.({ version: 7 });
    await waitFor(() => expect(screen.queryByRole("button", { name: "Suspendiendo…" })).not.toBeInTheDocument());
  });

  it("un bloqueo conocido muestra la franja roja sin Motivo y la acción apagada", async () => {
    const reason = "Es el único Dueño de Grupo Delta. Primero la organización tiene que sumar otro Dueño, o la plataforma tiene que cerrarla.";
    const { mutationFn } = dialog({ blockedReason: reason, confirmLabel: "Dar de baja", pendingLabel: "Dando de baja…" });
    const action = await screen.findByRole("button", { name: "Dar de baja" });
    expect(action).toBeDisabled();
    expect(screen.queryByRole("textbox", { name: "Motivo" })).not.toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent(reason);
    expect(screen.getByRole("alert")).toHaveClass("bg-[var(--peligro-t)]");
    expect(screen.getByRole("alert").compareDocumentPosition(screen.getByText("Nadie entra mientras esté suspendida.")) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    await userEvent.click(action);
    expect(mutationFn).not.toHaveBeenCalled();
  });

  it.each(["General.ConcurrencyConflict", ...stateConflictCodes])("el rechazo %s va arriba de botones y relee sólo al cerrar", async (code) => {
    const error = new ApiError(409, { code, detail: "Otro operador cambió esto." });
    const { queryClient, onClose } = dialog({ mutationFn: async () => { throw error; } });
    const invalidate = vi.spyOn(queryClient, "invalidateQueries");
    await screen.findByRole("textbox", { name: "Motivo" });
    await writeReason();
    await userEvent.click(screen.getByRole("button", { name: "Suspender" }));
    const band = await screen.findByRole("alert");
    expect(band).toHaveTextContent(error.detail!);
    expect(band.compareDocumentPosition(screen.getByRole("button", { name: "Cancelar" })) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(invalidate).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(invalidate).toHaveBeenCalledWith({ queryKey: queryRoot });
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("entrega la versión respondida antes de cerrar aunque la lectura tenga otra", async () => {
    const order: string[] = [];
    const { queryClient, mutationFn } = dialog({ onSuccess: (data, values) => {
      expect(data).toEqual({ version: 7 }); expect(values).toEqual({ reason: "Verificamos el pedido" }); order.push("success");
    }, onClose: () => { order.push("close"); } });
    queryClient.setQueryData([...queryRoot, "detail"], { version: 99 });
    await screen.findByRole("textbox", { name: "Motivo" });
    await writeReason();
    await userEvent.click(screen.getByRole("button", { name: "Suspender" }));
    await waitFor(() => expect(order).toEqual(["success", "close"]));
    expect(mutationFn).toHaveBeenCalledWith({ reason: "Verificamos el pedido" });
  });

  it("admite una acción de cuenta sin respuesta y Reintentar ejecuta el mismo éxito", async () => {
    const mutationFn = vi.fn<(values: ReasonDialogValues) => Promise<void>>().mockRejectedValueOnce(ApiError.network()).mockResolvedValueOnce(undefined);
    const onSuccess = vi.fn(); const onClose = vi.fn();
    renderWithProviders(<ReasonDialog title="¿Suspender la cuenta?" description="No puede entrar."
      confirmLabel="Suspender" pendingLabel="Suspendiendo…" queryRoot={["platform-accounts"]} mutationFn={mutationFn}
      onSuccess={onSuccess} onClose={onClose} />);
    const content = await screen.findByRole("dialog");
    await writeReason();
    await userEvent.click(screen.getByRole("button", { name: "Suspender" }));
    expect(await screen.findByText("No pudimos conectarnos. Revisá tu conexión.")).toBeInTheDocument();
    expect(within(content).queryByRole("alert")).not.toBeInTheDocument();
    // jsdom no carga el CSS de sonner que permite tocar el aviso por encima del modal de Radix.
    fireEvent.click(screen.getByRole("button", { name: "Reintentar" }));
    await waitFor(() => expect(onSuccess).toHaveBeenCalledOnce());
    expect(onSuccess).toHaveBeenCalledWith(undefined, { reason: "Verificamos el pedido" });
    expect(onClose).toHaveBeenCalledOnce();
    expect(mutationFn.mock.calls).toEqual([[{ reason: "Verificamos el pedido" }], [{ reason: "Verificamos el pedido" }]]);
  });

  it("un 5xx se avisa una sola vez fuera del diálogo", async () => {
    dialog({ mutationFn: async () => { throw new ApiError(500, { traceId: "trace-for-test" }); } });
    const content = await screen.findByRole("dialog");
    await writeReason();
    await userEvent.click(screen.getByRole("button", { name: "Suspender" }));
    expect(await screen.findByText("Algo salió mal. Probá de nuevo en un rato.")).toBeInTheDocument();
    expect(screen.getAllByText("Algo salió mal. Probá de nuevo en un rato.")).toHaveLength(1);
    expect(within(content).queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Copiar código" })).toBeInTheDocument();
  });

  it("el rechazo de un campo del back va bajo ese campo y se va al corregirlo", async () => {
    const error = new ApiError(400, { code: "Validation.Failed", detail: "Revisá los datos.", errors: { reason: ["Escribí un motivo más corto."] } });
    dialog({ mutationFn: async () => { throw error; } });
    await screen.findByRole("textbox", { name: "Motivo" });
    await writeReason();
    await userEvent.click(screen.getByRole("button", { name: "Suspender" }));
    const input = screen.getByRole("textbox", { name: "Motivo" });
    await waitFor(() => expect(input).toHaveAccessibleDescription("Escribí un motivo más corto."));
    expect(screen.queryByText("Revisá los datos.")).not.toBeInTheDocument();
    await userEvent.type(input, " Corregido");
    expect(screen.queryByText("Escribí un motivo más corto.")).not.toBeInTheDocument();
  });

  it("los rótulos y la fecha se muestran en en-US", async () => {
    dialog({ date: { initialValue: "2026-10-18" } });
    await screen.findByRole("textbox", { name: "Motivo" });
    try {
      await changeCulture("en-US");
      const date = await screen.findByRole("textbox", { name: "Until" });
      await waitFor(() => expect(date).toHaveValue("10/18/2026"));
      expect(screen.getByRole("textbox", { name: "Reason" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
      await userEvent.click(screen.getByRole("button", { name: "Suspender" }));
      expect(await screen.findByText("Enter a reason.")).toBeInTheDocument();
    } finally { await changeCulture("es-AR"); }
  });

  it("en el teléfono es una hoja con manija y sin violaciones axe", async () => {
    const restore = asPhone();
    try {
      dialog();
      const content = await screen.findByRole("dialog");
      expect(content).toHaveClass("bottom-0", "rounded-t-[20px]");
      expect(content.querySelector('[data-slot="dialog-handle"]')).toHaveAttribute("aria-hidden", "true");
      expect(await axe(content)).toHaveNoViolations();
    } finally { restore(); }
  });
});
