import { fireEvent, screen, waitFor } from "@testing-library/react";
import { HttpResponse, http } from "msw";
import { StrictMode } from "react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { routes } from "@/app/routes";
import { afterEach, beforeAll, beforeEach, expect, it } from "vitest";
import { axe } from "vitest-axe";
import { changeCulture, configureI18n } from "@/shared/i18n";
import { referenceDataFixture } from "@/test/mocks/handlers";
import { server } from "@/test/mocks/server";
import { asPhone } from "@/test/utils/phone";
import { renderRouteWithProviders, renderWithProviders } from "@/test/utils/renderWithProviders";
import { AddLoginMethodDialog } from "@/shared/account/AddLoginMethodDialog";
import "./LoginPage";
import "./SignupPage";
import "./BusinessSignupPage";
import "./RecoverAccountPage";

beforeAll(async () => { await configureI18n(referenceDataFixture().cultures); });
beforeEach(() => server.use(http.get("/api/auth/external/google/antiforgery", () => HttpResponse.json({ requestToken: "test-form-token" }))));
afterEach(async () => { await changeCulture("es-AR"); sessionStorage.clear(); });
const email = "mariana@example.test";
const returnUrl = encodeURIComponent("/connect/authorize?client_id=web&response_type=code");

function fieldProblem(code: string, field: string, detail: string) {
  return HttpResponse.json({ code, detail, traceId: "test", errors: { [field]: [detail] } }, { status: 400 });
}

it.each(["consumer", "business"] as const)("sin cuenta en %s ofrece el registro con el correo escrito, sin OTP, a 390", async (access) => {
  const restore = asPhone();
  try {
    server.use(http.post("/api/auth/login-code", () => fieldProblem("Auth.LoginCode.AccountNotFound", "email", "No hay una cuenta con ese correo.")));
    const { container, router } = renderRouteWithProviders(`${access === "consumer" ? "/login" : "/login/empresa"}?returnUrl=${returnUrl}`);
    const input = await screen.findByRole("textbox", { name: "Correo electrónico" });
    fireEvent.change(input, { target: { value: email } });
    fireEvent.click(screen.getByRole("button", { name: "Enviar código" }));
    expect(await screen.findByText("No hay una cuenta con ese correo.")).toBeVisible();
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(screen.queryByRole("textbox", { name: "Código 1" })).not.toBeInTheDocument();
    expect(screen.queryByText(/Te mandamos un código/)).not.toBeInTheDocument();
    const link = screen.getByRole("link", { name: access === "consumer" ? "Crear mi cuenta" : "Registrá tu empresa" });
    expect(await axe(container)).toHaveNoViolations();
    fireEvent.click(link);
    await waitFor(() => expect(router.state.location.pathname).toBe(access === "consumer" ? "/registro" : "/registro/empresa"));
    expect(await screen.findByRole("textbox", { name: access === "consumer" ? "Correo electrónico" : "Tu correo electrónico" })).toHaveValue(email);
    expect(screen.getByRole("checkbox", { name: /Acepto los Términos/ })).not.toBeChecked();
  } finally { restore(); }
});

it("el error sin cuenta y su enlace se van al corregir el correo", async () => {
  server.use(http.post("/api/auth/login-code", () => fieldProblem("Auth.LoginCode.AccountNotFound", "email", "No hay una cuenta con ese correo.")));
  renderRouteWithProviders(`/login?returnUrl=${returnUrl}`);
  const input = await screen.findByRole("textbox", { name: "Correo electrónico" });
  fireEvent.change(input, { target: { value: email } });
  fireEvent.click(screen.getByRole("button", { name: "Enviar código" }));
  await screen.findByRole("link", { name: "Crear mi cuenta" });
  fireEvent.change(input, { target: { value: "corregido@example.test" } });
  await waitFor(() => expect(screen.queryByText("No hay una cuenta con ese correo.")).not.toBeInTheDocument());
  expect(screen.queryByRole("link", { name: "Crear mi cuenta" })).not.toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Enviar código" })).toBeEnabled();
});

it("registro con cuenta ofrece Ingresar y conserva el correo después del redirect OIDC", async () => {
  server.use(http.post("/api/auth/signup", () => fieldProblem("Auth.Signup.EmailTaken", "email", "Ya tenés una cuenta con ese correo.")));
  const { container, router, unmount } = renderRouteWithProviders("/registro");
  fireEvent.change(await screen.findByRole("textbox", { name: "Correo electrónico" }), { target: { value: email } });
  fireEvent.click(screen.getByRole("checkbox", { name: /Acepto los Términos/ }));
  fireEvent.click(screen.getByRole("button", { name: "Crear cuenta" }));
  expect(await screen.findByText("Ya tenés una cuenta con ese correo.")).toBeVisible();
  expect(screen.queryByRole("textbox", { name: "Código 1" })).not.toBeInTheDocument();
  const link = screen.getByRole("link", { name: "Ingresar" });
  expect(await axe(container)).toHaveNoViolations();
  fireEvent.click(link);
  await waitFor(() => expect(router.state.location.pathname).toBe("/login"));
  await waitFor(() => expect(sessionStorage.getItem("arquitecturabasemt.login-email")).toBe(email));
  unmount();
  renderRouteWithProviders(`/login?returnUrl=${returnUrl}`);
  expect(await screen.findByRole("textbox", { name: "Correo electrónico" })).toHaveValue(email);
  expect(sessionStorage.getItem("arquitecturabasemt.login-email")).toBeNull();
});

it("el ciclo de registro ocupado y retorno OIDC conserva y envía el correo en StrictMode", async () => {
  let sent = 0;
  server.use(
    http.post("/api/auth/signup", () => fieldProblem("Auth.Signup.EmailTaken", "email", "Ya tenés una cuenta con ese correo.")),
    http.post("/api/auth/login-code", async ({ request }) => {
      expect(await request.json()).toEqual({ email });
      sent++;
      return HttpResponse.json({ resendAfterSeconds: 60 }, { status: 202 });
    }),
  );
  const signupRouter = createMemoryRouter(routes, { initialEntries: ["/registro"] });
  const initial = renderWithProviders(<StrictMode><RouterProvider router={signupRouter} /></StrictMode>);
  fireEvent.change(await screen.findByRole("textbox", { name: "Correo electrónico" }), { target: { value: email } });
  fireEvent.click(screen.getByRole("checkbox", { name: /Acepto los Términos/ }));
  fireEvent.click(screen.getByRole("button", { name: "Crear cuenta" }));
  fireEvent.click(await screen.findByRole("link", { name: "Ingresar" }));
  await waitFor(() => expect(sessionStorage.getItem("arquitecturabasemt.login-email")).toBe(email));
  initial.unmount();
  const authorizedRouter = createMemoryRouter(routes, { initialEntries: [`/login?returnUrl=${returnUrl}`] });
  renderWithProviders(<StrictMode><RouterProvider router={authorizedRouter} /></StrictMode>);
  expect(await screen.findByRole("textbox", { name: "Correo electrónico" })).toHaveValue(email);
  fireEvent.click(screen.getByRole("button", { name: "Enviar código" }));
  expect(await screen.findByRole("textbox", { name: "Código 1" })).toBeVisible();
  expect(sent).toBe(1);
  expect(sessionStorage.getItem("arquitecturabasemt.login-email")).toBeNull();
});

it.each(["previous", "new"] as const)("recuperar muestra el error del correo %s sin avanzar al código", async (step) => {
  server.use(
    http.post("/api/account-recovery/preview", () => step === "previous"
      ? fieldProblem("Platform.AccountRecovery.AccountNotFound", "previousEmail", "No hay una cuenta con ese correo.")
      : new HttpResponse(null, { status: 204 })),
    http.post("/api/account-recovery/code", () => fieldProblem("Platform.AccountRecovery.MethodInUse", "email", "Ese correo ya es de otra cuenta.")),
  );
  const { container } = renderRouteWithProviders("/recuperar");
  fireEvent.change(await screen.findByRole("textbox", { name: "Correo electrónico" }), { target: { value: email } });
  fireEvent.click(screen.getByRole("button", { name: "Seguir" }));
  if (step === "new") {
    fireEvent.change(await screen.findByRole("textbox", { name: "Correo electrónico nuevo" }), { target: { value: "owned@example.test" } });
    fireEvent.click(screen.getByRole("button", { name: "Enviar código" }));
  }
  const message = step === "previous" ? "No hay una cuenta con ese correo." : "Ese correo ya es de otra cuenta.";
  expect(await screen.findByText(message)).toBeVisible();
  const input = screen.getByRole("textbox", { name: step === "previous" ? "Correo electrónico" : "Correo electrónico nuevo" });
  expect(input).toHaveAttribute("aria-invalid", "true");
  expect(screen.queryByRole("textbox", { name: "Código 1" })).not.toBeInTheDocument();
  expect(await axe(container)).toHaveNoViolations();
  fireEvent.change(input, { target: { value: "corregido@example.test" } });
  await waitFor(() => expect(screen.queryByText(message)).not.toBeInTheDocument());
});

it("agregar correo de otra cuenta lo rechaza en el campo sin OTP y permite corregir", async () => {
  server.use(http.post("/api/me/login-methods", () => fieldProblem("Identity.LoginMethod.AlreadyUsed", "email", "Ese correo ya está asociado a otra cuenta.")));
  const { container } = renderWithProviders(<AddLoginMethodDialog open onOpenChange={() => {}} onComplete={() => {}} />);
  const input = await screen.findByRole("textbox", { name: "Correo" });
  fireEvent.change(input, { target: { value: email } });
  fireEvent.click(screen.getByRole("button", { name: "Enviar código" }));
  expect(await screen.findByText("Ese correo ya está asociado a otra cuenta.")).toBeVisible();
  expect(input).toHaveAttribute("aria-invalid", "true");
  expect(screen.queryByRole("textbox", { name: "Código 1" })).not.toBeInTheDocument();
  expect(await axe(container)).toHaveNoViolations();
  fireEvent.change(input, { target: { value: "corregido@example.test" } });
  await waitFor(() => expect(screen.queryByText("Ese correo ya está asociado a otra cuenta.")).not.toBeInTheDocument());
});

it.each(["previousEmail", "email"] as const)("recuperar vuelve al campo %s si cambia la cuenta después del código", async (field) => {
  const detail = field === "previousEmail" ? "No hay una cuenta con ese correo." : "Ese correo ya es de otra cuenta.";
  server.use(
    http.post("/api/account-recovery/preview", () => new HttpResponse(null, { status: 204 })),
    http.post("/api/account-recovery/code", () => HttpResponse.json({ resendAfterSeconds: 60 }, { status: 202 })),
    http.post("/api/account-recovery/verify", () => new HttpResponse(null, { status: 204 })),
    http.post("/api/account-recovery", () => fieldProblem(field === "previousEmail" ? "Platform.AccountRecovery.AccountNotFound" : "Platform.AccountRecovery.MethodInUse", field, detail)),
  );
  renderRouteWithProviders("/recuperar");
  fireEvent.change(await screen.findByRole("textbox", { name: "Correo electrónico" }), { target: { value: email } });
  fireEvent.click(screen.getByRole("button", { name: "Seguir" }));
  fireEvent.change(await screen.findByRole("textbox", { name: "Correo electrónico nuevo" }), { target: { value: "nuevo@example.test" } });
  fireEvent.click(screen.getByRole("button", { name: "Enviar código" }));
  fireEvent.change(await screen.findByRole("textbox", { name: "Código 1" }), { target: { value: "123456" } });
  fireEvent.click(screen.getByRole("button", { name: "Verificar" }));
  const input = await screen.findByRole("textbox", { name: field === "previousEmail" ? "Correo electrónico" : "Correo electrónico nuevo" });
  expect(input).toHaveAttribute("aria-invalid", "true");
  expect(screen.getByText(detail)).toBeVisible();
  expect(screen.queryByRole("textbox", { name: "Código 1" })).not.toBeInTheDocument();
});
