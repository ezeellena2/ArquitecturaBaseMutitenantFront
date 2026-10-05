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
  expect(screen.queryByRole("button", { name: "Cerrar" })).not.toBeInTheDocument();
  expect(await screen.findByText(/a\*\*\*@example.test/)).toBeVisible();
  expect(screen.getByRole("button", { name: "Quitar" })).toBeEnabled();
  await user.click(screen.getByRole("button", { name: "Quitar" }));
  expect(await screen.findByText("Escribí los 6 números del código.")).toBeVisible();
  expect(complete).not.toHaveBeenCalled();
  await user.type(screen.getByRole("textbox", { name: "Código 1" }), "123456");
  await user.click(screen.getByRole("button", { name: "Quitar" }));
  await waitFor(() => expect(complete).toHaveBeenCalled());
});

it("espera el cooldown sin reintentar solo y permite pedir el código desde el mismo botón", async () => {
  const user = userEvent.setup();
  let requests = 0;
  server.use(http.post("/api/me/reauth", () => {
    requests++;
    return requests === 1
      ? HttpResponse.json({ code: "Auth.LoginCode.ResendTooSoon", detail: "Esperá para pedir otro código.", retryAfter: 1 }, { status: 429, headers: { "Retry-After": "1" } })
      : HttpResponse.json({ sourceMethodId: "source", destination: "a***@example.test", resendAfterSeconds: 60 });
  }));
  renderWithProviders(<ChangeLoginMethodDialog action="remove" method={{ id: "target", type: "Email", value: "nuevo@example.test", isVerified: true, isPrimary: false, canRemove: true, canMakePrimary: true }} onClose={() => {}} onComplete={() => {}} />);
  expect(await screen.findByRole("alert")).toHaveTextContent("Esperá para pedir otro código.");
  await waitFor(() => expect(screen.getByRole("button", { name: "Quitar" })).toBeEnabled(), { timeout: 2500 });
  expect(requests).toBe(1);
  expect(screen.queryByRole("textbox", { name: "Código 1" })).not.toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Quitar" }));
  expect(await screen.findByRole("textbox", { name: "Código 1" }, { timeout: 2500 })).toBeVisible();
  expect(requests).toBe(2);
});

// Tableros Cuenta-Verificar y M-Cuenta-Verificar (.err2 y .ap-err): al confirmar que sos vos, como al verificar un correo,
// el código a medias y el que el back rechaza van debajo de los casilleros, en rojo, y un dígito nuevo los saca; la
// franja queda para lo demás.
it("el código a medias y el incorrecto van debajo de los casilleros, y un dígito nuevo los saca", async () => {
  const user = userEvent.setup();
  const complete = vi.fn();
  let attempts = 0;
  server.use(
    http.post("/api/me/reauth", () => HttpResponse.json({ sourceMethodId: "source", destination: "a***@example.test", resendAfterSeconds: 60 })),
    http.post("/api/me/reauth/verify", () => attempts++ === 0
      ? HttpResponse.json({ status: 400, code: "Auth.LoginCode.Invalid", title: "Código", detail: "El código no es válido." }, { status: 400 })
      : HttpResponse.json({ reauthTicket: "opaque-ticket" })),
    http.delete("/api/me/login-methods/target", () => new HttpResponse(null, { status: 204 })),
  );
  renderWithProviders(<ChangeLoginMethodDialog action="remove" method={{ id: "target", type: "Email", value: "nuevo@example.test", isVerified: true, isPrimary: false, canRemove: true, canMakePrimary: true }} onClose={() => {}} onComplete={complete} />);
  const first = await screen.findByRole("textbox", { name: "Código 1" });
  const code = screen.getByRole("group", { name: "Código" });

  await user.click(screen.getByRole("button", { name: "Quitar" }));
  const incomplete = await screen.findByText("Escribí los 6 números del código.");
  expect(code.nextElementSibling).toBe(incomplete);
  expect(first).toHaveAttribute("aria-invalid", "true");
  await user.type(first, "123456");
  expect(screen.queryByText("Escribí los 6 números del código.")).not.toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Quitar" }));

  const message = await screen.findByText("El código no es válido.");
  expect(message).toHaveAttribute("role", "alert");
  expect(code.nextElementSibling).toBe(message);
  expect(message).toHaveClass("text-[13px]", "text-[var(--peligro)]", "max-md:text-[13.5px]");
  expect(code).toHaveAccessibleDescription("El código no es válido.");
  expect(first).toHaveAttribute("aria-invalid", "true");
  expect(screen.getAllByRole("alert")).toEqual([message]);

  await user.click(first);
  await user.paste("654321");
  expect(screen.queryByText("El código no es válido.")).not.toBeInTheDocument();
  expect(first).not.toHaveAttribute("aria-invalid");
  await user.click(screen.getByRole("button", { name: "Quitar" }));
  await waitFor(() => expect(complete).toHaveBeenCalled());
});
