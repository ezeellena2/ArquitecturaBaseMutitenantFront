import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HttpResponse, delay, http } from "msw";
import { beforeEach, expect, it, vi } from "vitest";
import { configureI18n, changeCulture } from "@/shared/i18n";
import { referenceDataFixture } from "@/test/mocks/handlers";
import { server } from "@/test/mocks/server";
import { asPhone } from "@/test/utils/phone";
import { renderWithProviders } from "@/test/utils/renderWithProviders";
import { AccountDeletionDialog } from "./AccountDeletionDialog";

beforeEach(async () => { await configureI18n(referenceDataFixture().cultures); await changeCulture("es-AR"); });
it("exige motivo, confirma sin código y devuelve fecha", async () => {
  const user = userEvent.setup();
  const complete = vi.fn();
  server.use(
    http.post("/api/me/deletion", async ({ request }) => {
      expect(await request.json()).toEqual({ reason: "Dejé de usarla" });
      expect(request.headers.get("Idempotency-Key")).toBeTruthy();
      return HttpResponse.json({ scheduledForUtc: "2026-10-30T12:00:00Z" });
    }),
  );
  renderWithProviders(<AccountDeletionDialog graceDays={30} onClose={() => {}} onComplete={complete} />);
  // Tablero Cuenta-Baja: el diálogo lleva su ✕. En el teléfono (M-Cuenta-Baja) es la hoja de una confirmación, sin ✕.
  expect(screen.getByRole("button", { name: "Cerrar" })).toHaveClass("max-md:hidden");
  // M-Cuenta-Baja: en el teléfono, el motivo arranca con el alto de un campo de una línea y crece con lo escrito.
  expect(screen.getByRole("textbox", { name: "Motivo" })).toHaveClass("max-md:min-h-12");
  expect(screen.queryByText(/exportar/i)).not.toBeInTheDocument();
  expect(screen.queryByRole("group", { name: "Código" })).not.toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Dar de baja" })).toBeEnabled();
  await user.click(screen.getByRole("button", { name: "Dar de baja" }));
  expect(await screen.findByText("Escribí el motivo.")).toBeVisible();
  expect(complete).not.toHaveBeenCalled();
  await user.click(screen.getByRole("button", { name: "Dar de baja" }));
  expect(await screen.findByText("Escribí el motivo.")).toBeVisible();
  expect(complete).not.toHaveBeenCalled();
  await user.type(screen.getByRole("textbox", { name: "Motivo" }), "Dejé de usarla");
  await user.click(screen.getByRole("button", { name: "Dar de baja" }));
  await waitFor(() => expect(complete).toHaveBeenCalledWith("2026-10-30T12:00:00Z"));
});

// M-Cuenta-Baja (6d-3b, E7): en el teléfono, «Dar de baja» es el botón destructivo, en rojo como en la compu. El lienzo
// v107 lo había dibujado en petróleo por error y Diseño lo corrigió.
it("en el teléfono, «Dar de baja» confirma con el botón destructivo, como en la compu", async () => {
  const restore = asPhone();
  try {
    renderWithProviders(<AccountDeletionDialog graceDays={30} onClose={() => {}} onComplete={() => {}} />);

    expect(await screen.findByRole("button", { name: "Dar de baja" })).toHaveAttribute("data-variant", "destructive");
  } finally { restore(); }
});

// «Criterio · Botones», Guardando (decisión del 2026-10-05, 6d-4a): mientras da de baja, el botón dice «Dando de baja…»
// con el aro de «Guardando…», y no su propio texto.
it("mientras da de baja dice «Dando de baja…» con el aro", async () => {
  const user = userEvent.setup();
  server.use(
    http.post("/api/me/deletion", async () => { await delay("infinite"); return HttpResponse.json({ scheduledForUtc: "2026-10-30T12:00:00Z" }); }),
  );
  renderWithProviders(<AccountDeletionDialog graceDays={30} onClose={() => {}} onComplete={() => {}} />);
  await user.type(screen.getByRole("textbox", { name: "Motivo" }), "Dejé de usarla");
  await user.click(screen.getByRole("button", { name: "Dar de baja" }));

  const button = await screen.findByRole("button", { name: "Dando de baja…" });
  expect(button).toHaveAttribute("data-pending", "true");
  expect(button).toHaveAttribute("data-variant", "destructive");
  expect(button.querySelector("[data-slot='button-ring']")).not.toBeNull();
});
