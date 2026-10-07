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
