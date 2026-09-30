import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HttpResponse, http } from "msw";
import { beforeEach, expect, it, vi } from "vitest";
import { configureI18n, changeCulture } from "@/shared/i18n";
import { referenceDataFixture } from "@/test/mocks/handlers";
import { server } from "@/test/mocks/server";
import { renderWithProviders } from "@/test/utils/renderWithProviders";
import { AddLoginMethodDialog } from "./AddLoginMethodDialog";

beforeEach(async () => { await configureI18n(referenceDataFixture().cultures); await changeCulture("es-AR"); });
it("suma correo, conserva OTP incorrecto y verifica con claves idempotentes", async () => {
  const user = userEvent.setup();
  const complete = vi.fn();
  let attempts = 0;
  server.use(
    http.post("/api/me/login-methods", async ({ request }) => {
      expect(await request.json()).toEqual({ email: "nuevo@example.test" });
      expect(request.headers.get("Idempotency-Key")).toBeTruthy();
      return HttpResponse.json({ methodId: "new", resendAfterSeconds: 60 });
    }),
    http.post("/api/me/login-methods/new/verify", async ({ request }) => {
      expect(request.headers.get("Idempotency-Key")).toBeTruthy();
      const body = await request.json();
      if (attempts++ === 0) return HttpResponse.json({ code: "Identity.LoginCode.Invalid", detail: "Ese código no es correcto." }, { status: 400 });
      expect(body).toEqual({ code: "654321" });
      return new HttpResponse(null, { status: 204 });
    }),
  );
  renderWithProviders(<AddLoginMethodDialog open onOpenChange={() => {}} onComplete={complete} />);
  expect(screen.queryByRole("button", { name: "WhatsApp" })).not.toBeInTheDocument();
  await user.type(screen.getByRole("textbox", { name: "Correo" }), "nuevo@example.test");
  await user.click(screen.getByRole("button", { name: "Enviar código" }));
  const first = await screen.findByRole("textbox", { name: "Código 1" });
  await user.type(first, "123456");
  await user.click(screen.getByRole("button", { name: "Verificar" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("Ese código no es correcto.");
  await user.click(first);
  await user.paste("654321");
  await user.click(screen.getByRole("button", { name: "Verificar" }));
  await waitFor(() => expect(complete).toHaveBeenCalled());
});
