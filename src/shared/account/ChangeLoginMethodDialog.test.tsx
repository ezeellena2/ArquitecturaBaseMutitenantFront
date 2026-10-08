import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HttpResponse, delay, http } from "msw";
import { beforeEach, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import { configureI18n, changeCulture } from "@/shared/i18n";
import { referenceDataFixture } from "@/test/mocks/handlers";
import { server } from "@/test/mocks/server";
import { asPhone } from "@/test/utils/phone";
import { renderWithProviders } from "@/test/utils/renderWithProviders";
import { ChangeLoginMethodDialog } from "./ChangeLoginMethodDialog";

beforeEach(async () => { await configureI18n(referenceDataFixture().cultures); await changeCulture("es-AR"); });
const email = { id: "target", type: "Email" as const, value: "nuevo@example.test", isVerified: true, isPrimary: false, canRemove: true, canMakePrimary: true };

it("confirma quitar sin código y conserva el texto del diálogo y su accesibilidad", async () => {
  const user = userEvent.setup();
  const complete = vi.fn();
  let sent = 0;
  server.use(http.delete("/api/me/login-methods/target", async ({ request }) => {
    expect(await request.text()).toBe("");
    sent++;
    return new HttpResponse(null, { status: 204 });
  }));
  const { container } = renderWithProviders(<ChangeLoginMethodDialog action="remove" method={email} onClose={() => {}} onComplete={complete} />);
  expect(screen.queryByRole("button", { name: "Cerrar" })).not.toBeInTheDocument();
  expect(screen.getByText("Ya no vas a poder entrar con nuevo@example.test.")).toBeVisible();
  expect(screen.queryByRole("group", { name: "Código" })).not.toBeInTheDocument();
  expect(sent).toBe(0);
  expect(await axe(container)).toHaveNoViolations();
  await user.click(screen.getByRole("button", { name: "Quitar" }));
  await waitFor(() => expect(complete).toHaveBeenCalledOnce());
  expect(sent).toBe(1);
});

it("hacer principal confirma directamente y mantiene el aviso del método elegido", async () => {
  const user = userEvent.setup();
  const complete = vi.fn();
  server.use(http.put("/api/me/login-methods/target/primary", async ({ request }) => {
    expect(await request.text()).toBe("");
    return new HttpResponse(null, { status: 204 });
  }));
  renderWithProviders(<ChangeLoginMethodDialog action="primary" method={email} onClose={() => {}} onComplete={complete} />);
  expect(screen.getByText("Desde ahora te avisamos a nuevo@example.test.")).toBeVisible();
  await user.click(screen.getByRole("button", { name: "Hacer principal" }));
  await waitFor(() => expect(complete).toHaveBeenCalledOnce());
});

it("conserva el error de último método dentro del diálogo sin cerrarlo", async () => {
  const user = userEvent.setup();
  const complete = vi.fn();
  server.use(http.delete("/api/me/login-methods/target", () => HttpResponse.json({ code: "Identity.LoginMethod.LastMethod", detail: "No podés quitar tu último método de ingreso." }, { status: 409 })));
  renderWithProviders(<ChangeLoginMethodDialog action="remove" method={email} onClose={() => {}} onComplete={complete} />);
  await user.click(screen.getByRole("button", { name: "Quitar" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("No podés quitar tu último método de ingreso.");
  expect(complete).not.toHaveBeenCalled();
  expect(screen.getByRole("dialog")).toBeVisible();
});

it.each([
  { type: "Phone" as const, value: "+5491155554521", action: "Quitar" },
  { type: "Google" as const, value: "lucia.fer@gmail.com", action: "Desvincular" },
])("en el teléfono, «$action» confirma con el botón destructivo, como en la compu", async ({ type, value, action }) => {
  const restore = asPhone();
  try {
    renderWithProviders(<ChangeLoginMethodDialog action="remove" onClose={() => {}} method={{ ...email, type, value }} />);
    expect(screen.getByRole("button", { name: action })).toHaveAttribute("data-variant", "destructive");
    expect(screen.queryByRole("group", { name: "Código" })).not.toBeInTheDocument();
  } finally { restore(); }
});

it.each([
  { type: "Email" as const, action: "Quitar", waiting: "Quitando…" },
  { type: "Google" as const, action: "Desvincular", waiting: "Desvinculando…" },
])("mientras espera, «$action» dice «$waiting» con el aro", async ({ type, action, waiting }) => {
  const user = userEvent.setup();
  server.use(http.delete("/api/me/login-methods/target", async () => { await delay("infinite"); return new HttpResponse(null, { status: 204 }); }));
  renderWithProviders(<ChangeLoginMethodDialog action="remove" onClose={() => {}} method={{ ...email, type }} />);
  await user.click(screen.getByRole("button", { name: action }));
  const button = await screen.findByRole("button", { name: waiting });
  expect(button).toHaveAttribute("data-pending", "true");
  expect(button).toHaveAttribute("data-variant", "destructive");
  expect(button.querySelector("[data-slot='button-ring']")).not.toBeNull();
});

it.each(["primary", "remove"] as const)("Phone %s formateado opera con sesión y cero códigos", async (action) => {
  const user = userEvent.setup(); const complete = vi.fn(); const code = vi.fn();
  server.use(
    http.post("/api/me/login-methods/target/code", () => { code(); return HttpResponse.json({ methodId: "target", resendAfterSeconds: 60 }); }),
    http.delete("/api/me/login-methods/target", () => new HttpResponse(null, { status: 204 })),
    http.put("/api/me/login-methods/target/primary", () => new HttpResponse(null, { status: 204 })),
  );
  renderWithProviders(<ChangeLoginMethodDialog action={action} method={{ ...email, type: "Phone", value: "+5491155554521" }} onClose={() => {}} onComplete={complete} />);
  await screen.findByText(action === "primary" ? "Desde ahora te avisamos a 011 15-5555-4521." : "Ya no vas a poder entrar con 011 15-5555-4521.");
  await user.click(screen.getByRole("button", { name: action === "primary" ? "Hacer principal" : "Quitar" }));
  await waitFor(() => expect(complete).toHaveBeenCalledOnce());
  expect(code).not.toHaveBeenCalled();
  expect(screen.queryByRole("group", { name: "Código" })).not.toBeInTheDocument();
});

it("la concurrencia Phone conserva el error y permite cerrar sin completar", async () => {
  const user = userEvent.setup(); const close = vi.fn(); const complete = vi.fn();
  server.use(http.put("/api/me/login-methods/target/primary", () => HttpResponse.json({ code: "General.ConcurrencyConflict", detail: "Otra persona cambió esto mientras lo editabas." }, { status: 409 })));
  renderWithProviders(<ChangeLoginMethodDialog action="primary" method={{ ...email, type: "Phone", value: "+5491155554521" }} onClose={close} onComplete={complete} />);
  await user.click(screen.getByRole("button", { name: "Hacer principal" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("Otra persona cambió esto mientras lo editabas.");
  await user.click(screen.getByRole("button", { name: "Cancelar" }));
  expect(close).toHaveBeenCalledOnce(); expect(complete).not.toHaveBeenCalled();
});

it.each(["remove", "primary"] as const)("no permite %s si el servidor retira su flag", async (action) => {
  const called = vi.fn(); server.use(http.delete("/api/me/login-methods/target", () => { called(); return new HttpResponse(null, { status: 204 }); }));
  renderWithProviders(<ChangeLoginMethodDialog action={action} method={{ ...email, type: "Phone", canRemove: false, canMakePrimary: false }} onClose={() => {}} />);
  expect(screen.getByRole("button", { name: action === "remove" ? "Quitar" : "Hacer principal" })).toBeDisabled();
  expect(called).not.toHaveBeenCalled();
});
