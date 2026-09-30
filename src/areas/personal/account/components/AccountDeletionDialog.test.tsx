import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HttpResponse, http } from "msw";
import { beforeEach, expect, it, vi } from "vitest";
import { configureI18n, changeCulture } from "@/shared/i18n";
import { referenceDataFixture } from "@/test/mocks/handlers";
import { server } from "@/test/mocks/server";
import { renderWithProviders } from "@/test/utils/renderWithProviders";
import { AccountDeletionDialog } from "./AccountDeletionDialog";

beforeEach(async () => { await configureI18n(referenceDataFixture().cultures); await changeCulture("es-AR"); });
it("exige motivo, confirma con código del principal y devuelve fecha", async () => {
  const user = userEvent.setup();
  const complete = vi.fn();
  server.use(
    http.post("/api/me/reauth", async ({ request }) => {
      expect(await request.json()).toEqual({ action: "DeleteAccount" });
      return HttpResponse.json({ sourceMethodId: "primary", destination: "a***@example.test", resendAfterSeconds: 60 });
    }),
    http.post("/api/me/reauth/verify", () => HttpResponse.json({ reauthTicket: "proof" })),
    http.post("/api/me/deletion", async ({ request }) => {
      expect(await request.json()).toEqual({ reason: "Dejé de usarla", reauthTicket: "proof" });
      expect(request.headers.get("Idempotency-Key")).toBeTruthy();
      return HttpResponse.json({ scheduledForUtc: "2026-10-30T12:00:00Z" });
    }),
  );
  renderWithProviders(<AccountDeletionDialog graceDays={30} onClose={() => {}} onComplete={complete} />);
  expect(screen.queryByText(/exportar/i)).not.toBeInTheDocument();
  const code = await screen.findByRole("textbox", { name: "Código 1" });
  expect(screen.getByRole("button", { name: "Dar de baja mi cuenta" })).toBeEnabled();
  await user.click(screen.getByRole("button", { name: "Dar de baja mi cuenta" }));
  expect(await screen.findByText("Escribí los 6 números del código.")).toBeVisible();
  expect(await screen.findByText("Escribí el motivo.")).toBeVisible();
  expect(complete).not.toHaveBeenCalled();
  await user.type(code, "123456");
  await user.click(screen.getByRole("button", { name: "Dar de baja mi cuenta" }));
  expect(await screen.findByText("Escribí el motivo.")).toBeVisible();
  expect(complete).not.toHaveBeenCalled();
  await user.type(screen.getByRole("textbox", { name: "Motivo" }), "Dejé de usarla");
  await user.click(screen.getByRole("button", { name: "Dar de baja mi cuenta" }));
  await waitFor(() => expect(complete).toHaveBeenCalledWith("2026-10-30T12:00:00Z"));
});
