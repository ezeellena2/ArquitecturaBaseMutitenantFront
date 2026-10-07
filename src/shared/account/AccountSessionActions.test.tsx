import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HttpResponse, delay, http } from "msw";
import { beforeEach, expect, it, vi } from "vitest";
import { configureI18n, changeCulture } from "@/shared/i18n";
import { referenceDataFixture } from "@/test/mocks/handlers";
import { server } from "@/test/mocks/server";
import { renderWithProviders } from "@/test/utils/renderWithProviders";
import { AccountDeletionDialog } from "@/areas/personal/account/components/AccountDeletionDialog";
import { AccountGoogleButton } from "@/areas/personal/account/components/AccountGoogleButton";
import { AddLoginMethodDialog } from "./AddLoginMethodDialog";
import { ChangeLoginMethodDialog } from "./ChangeLoginMethodDialog";

beforeEach(async () => { await configureI18n(referenceDataFixture().cultures); await changeCulture("es-AR"); });

it("abre agregar correo directamente y verifica sólo el código del nuevo correo", async () => {
  const user = userEvent.setup();
  const complete = vi.fn();
  server.use(
    http.post("/api/me/login-methods", async ({ request }) => {
      expect(await request.json()).toEqual({ email: "nuevo@example.test" });
      return HttpResponse.json({ methodId: "new", resendAfterSeconds: 60 });
    }),
    http.post("/api/me/login-methods/new/verify", async ({ request }) => {
      expect(await request.json()).toEqual({ code: "123456" });
      return new HttpResponse(null, { status: 204 });
    }),
  );
  renderWithProviders(<AddLoginMethodDialog open onOpenChange={() => {}} onComplete={complete} />);
  expect(screen.queryByRole("group", { name: "Código" })).not.toBeInTheDocument();
  await user.type(await screen.findByRole("textbox", { name: "Correo" }), "nuevo@example.test");
  await user.click(screen.getByRole("button", { name: "Enviar código" }));
  await user.type(await screen.findByRole("textbox", { name: "Código 1" }), "123456");
  await user.click(screen.getByRole("button", { name: "Verificar" }));
  await waitFor(() => expect(complete).toHaveBeenCalledOnce());
});

it.each(["remove", "primary"] as const)("confirma %s sin código ni envío previo", async (action) => {
  const user = userEvent.setup();
  const complete = vi.fn();
  server.use(
    http.delete("/api/me/login-methods/target", () => new HttpResponse(null, { status: 204 })),
    http.put("/api/me/login-methods/target/primary", () => new HttpResponse(null, { status: 204 })),
  );
  renderWithProviders(<ChangeLoginMethodDialog action={action} method={{ id: "target", type: "Email", value: "nuevo@example.test", isVerified: true, isPrimary: false, canRemove: true, canMakePrimary: true }} onClose={() => {}} onComplete={complete} />);
  await user.click(screen.getByRole("button", { name: action === "remove" ? "Quitar" : "Hacer principal" }));
  await waitFor(() => expect(complete).toHaveBeenCalledOnce());
  expect(screen.queryByRole("group", { name: "Código" })).not.toBeInTheDocument();
});

it("da de baja con motivo sin un código adicional", async () => {
  const user = userEvent.setup();
  const complete = vi.fn();
  server.use(
    http.post("/api/me/deletion", async ({ request }) => {
      expect(await request.json()).toEqual({ reason: "Ya no la uso" });
      return HttpResponse.json({ scheduledForUtc: "2026-10-30T12:00:00Z" });
    }),
  );
  renderWithProviders(<AccountDeletionDialog graceDays={30} onClose={() => {}} onComplete={complete} />);
  await user.type(screen.getByRole("textbox", { name: "Motivo" }), "Ya no la uso");
  await user.click(screen.getByRole("button", { name: "Dar de baja" }));
  await waitFor(() => expect(complete).toHaveBeenCalledWith("2026-10-30T12:00:00Z"));
  expect(screen.queryByRole("group", { name: "Código" })).not.toBeInTheDocument();
});

it("vincular Google inicia su desafío con antiforgery directamente", async () => {
  const user = userEvent.setup();
  const challenge = vi.fn();
  server.use(
    http.get("/api/auth/external/google/antiforgery", () => HttpResponse.json({ requestToken: "csrf" })),
    http.post("/api/me/external/google", async ({ request }) => {
      expect(request.headers.get("RequestVerificationToken")).toBe("csrf");
      challenge();
      await delay("infinite");
      return HttpResponse.json({ redirectUrl: "https://accounts.google.com/authorize" });
    }),
  );
  renderWithProviders(<AccountGoogleButton />);
  await user.click(screen.getByRole("button", { name: "Vincular Google" }));
  await waitFor(() => expect(challenge).toHaveBeenCalledOnce());
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
});
