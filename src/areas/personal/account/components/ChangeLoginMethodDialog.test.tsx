import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HttpResponse, http } from "msw";
import { beforeEach, expect, it, vi } from "vitest";
import { configureI18n, changeCulture } from "@/shared/i18n";
import { referenceDataFixture } from "@/test/mocks/handlers";
import { server } from "@/test/mocks/server";
import { renderWithProviders } from "@/test/utils/renderWithProviders";
import { ChangeLoginMethodDialog } from "./ChangeLoginMethodDialog";

beforeEach(async () => { await configureI18n(referenceDataFixture().cultures); await changeCulture("es-AR"); });
it("pide prueba a otro método y entrega el ticket al quitar", async () => {
  const user = userEvent.setup();
  const complete = vi.fn();
  server.use(
    http.post("/api/me/reauth", async ({ request }) => {
      expect(await request.json()).toMatchObject({ action: "RemoveMethod", targetMethodId: "target" });
      return HttpResponse.json({ sourceMethodId: "source", destination: "a***@example.test", resendAfterSeconds: 60 });
    }),
    http.post("/api/me/reauth/verify", async ({ request }) => {
      expect(await request.json()).toEqual({ action: "RemoveMethod", targetMethodId: "target", sourceMethodId: "source", code: "123456" });
      return HttpResponse.json({ reauthTicket: "opaque-ticket" });
    }),
    http.delete("/api/me/login-methods/target", async ({ request }) => {
      expect(await request.json()).toEqual({ reauthTicket: "opaque-ticket" });
      return new HttpResponse(null, { status: 204 });
    }),
  );
  renderWithProviders(<ChangeLoginMethodDialog action="remove" method={{ id: "target", type: "Email", value: "nuevo@example.test", isVerified: true, isPrimary: false, canRemove: true, canMakePrimary: true }} onClose={() => {}} onComplete={complete} />);
  expect(await screen.findByText(/a\*\*\*@example.test/)).toBeVisible();
  await user.type(screen.getByRole("textbox", { name: "Código 1" }), "123456");
  await user.click(screen.getByRole("button", { name: "Quitar" }));
  await waitFor(() => expect(complete).toHaveBeenCalled());
});

it("espera el cooldown del destino y pide el código al terminar, sin dejar el diálogo bloqueado", async () => {
  let requests = 0;
  server.use(http.post("/api/me/reauth", () => {
    requests++;
    return requests === 1
      ? HttpResponse.json({ code: "Auth.LoginCode.ResendTooSoon", detail: "Esperá para pedir otro código.", retryAfter: 1 }, { status: 429, headers: { "Retry-After": "1" } })
      : HttpResponse.json({ sourceMethodId: "source", destination: "a***@example.test", resendAfterSeconds: 60 });
  }));
  renderWithProviders(<ChangeLoginMethodDialog action="remove" method={{ id: "target", type: "Email", value: "nuevo@example.test", isVerified: true, isPrimary: false, canRemove: true, canMakePrimary: true }} onClose={() => {}} onComplete={() => {}} />);
  expect(await screen.findByRole("textbox", { name: "Código 1" }, { timeout: 2500 })).toBeVisible();
  expect(requests).toBe(2);
});
