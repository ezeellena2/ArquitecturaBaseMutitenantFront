import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HttpResponse, http } from "msw";
import { beforeEach, expect, it, vi } from "vitest";
import { configureI18n, changeCulture } from "@/shared/i18n";
import { referenceDataFixture } from "@/test/mocks/handlers";
import { server } from "@/test/mocks/server";
import { renderWithProviders } from "@/test/utils/renderWithProviders";
import { AddLoginMethodDialog } from "./AddLoginMethodDialog";

beforeEach(async () => { await configureI18n(referenceDataFixture().cultures); await changeCulture("es-AR"); });
// Tableros Cuenta-Agregar y Cuenta-Verificar (y sus M-*): el título dice el paso, «Agregar correo o teléfono» y después
// «Verificar tu correo»; el código incorrecto va debajo de los casilleros, en rojo, y no en una franja.
it("suma correo: el título dice el paso, el código incorrecto va debajo de los casilleros y verifica con claves idempotentes", async () => {
  const user = userEvent.setup();
  const complete = vi.fn();
  let attempts = 0;
  server.use(
    http.post("/api/me/reauth", async ({ request }) => {
      expect(await request.json()).toEqual({ action: "AddEmail" });
      return HttpResponse.json({ sourceMethodId: "original", destination: "a***@example.test", resendAfterSeconds: 60 });
    }),
    http.post("/api/me/reauth/verify", async ({ request }) => {
      expect(await request.json()).toEqual({ action: "AddEmail", sourceMethodId: "original", code: "123456" });
      return HttpResponse.json({ reauthTicket: "opaque-ticket" });
    }),
    http.post("/api/me/login-methods", async ({ request }) => {
      expect(await request.json()).toEqual({ email: "nuevo@example.test", reauthTicket: "opaque-ticket" });
      expect(request.headers.get("Idempotency-Key")).toBeTruthy();
      return HttpResponse.json({ methodId: "new", resendAfterSeconds: 60 });
    }),
    http.post("/api/me/login-methods/new/verify", async ({ request }) => {
      expect(request.headers.get("Idempotency-Key")).toBeTruthy();
      const body = await request.json();
      if (attempts++ === 0) return HttpResponse.json({ status: 400, code: "Auth.LoginCode.Invalid", title: "Código", detail: "El código no es válido." }, { status: 400 });
      expect(body).toEqual({ code: "654321" });
      return new HttpResponse(null, { status: 204 });
    }),
  );
  renderWithProviders(<AddLoginMethodDialog open onOpenChange={() => {}} onComplete={complete} />);
  expect(screen.queryByRole("button", { name: "WhatsApp" })).not.toBeInTheDocument();
  await user.type(await screen.findByRole("textbox", { name: "Código 1" }), "123456");
  await user.click(screen.getByRole("button", { name: "Verificar" }));

  const add = await screen.findByRole("dialog", { name: "Agregar correo o teléfono" });
  await user.type(within(add).getByRole("textbox", { name: "Correo" }), "nuevo@example.test");
  await user.click(within(add).getByRole("button", { name: "Enviar código" }));

  const verify = await screen.findByRole("dialog", { name: "Verificar tu correo" });
  expect(verify).toHaveTextContent("Te mandamos un código a nuevo@example.test.");
  const code = within(verify).getByRole("group", { name: "Código" });
  const first = within(verify).getByRole("textbox", { name: "Código 1" });
  expect(within(verify).getByRole("button", { name: "Verificar" })).toBeEnabled();
  // «Criterio · Botones»: «Verificar» no se apaga; con el código a medias, debajo de los casilleros dice qué falta y un
  // dígito nuevo lo saca.
  await user.click(within(verify).getByRole("button", { name: "Verificar" }));
  expect(await within(verify).findByText("Escribí los 6 números del código.")).toBeVisible();
  expect(attempts).toBe(0);
  await user.type(first, "123456");
  expect(within(verify).queryByText("Escribí los 6 números del código.")).not.toBeInTheDocument();
  await user.click(within(verify).getByRole("button", { name: "Verificar" }));

  const message = await within(verify).findByText("El código no es válido.");
  expect(message).toHaveAttribute("role", "alert");
  expect(code.nextElementSibling).toBe(message);
  expect(message).toHaveClass("text-[13px]", "text-[var(--peligro)]", "max-md:text-[13.5px]");
  expect(code).toHaveAccessibleDescription("Te mandamos un código a nuevo@example.test. El código no es válido.");
  expect(first).toHaveAttribute("aria-invalid", "true");
  expect(screen.getAllByRole("alert")).toEqual([message]);

  await user.click(first);
  await user.paste("654321");
  expect(within(verify).queryByText("El código no es válido.")).not.toBeInTheDocument();
  expect(first).not.toHaveAttribute("aria-invalid");
  await user.click(within(verify).getByRole("button", { name: "Verificar" }));
  await waitFor(() => expect(complete).toHaveBeenCalled());
});
