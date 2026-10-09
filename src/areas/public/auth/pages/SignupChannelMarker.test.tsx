import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { HttpResponse, http } from "msw";
import type { AuthContextProps } from "react-oidc-context";
import { RouterProvider, createMemoryRouter } from "react-router";
import { beforeAll, beforeEach, expect, it, vi } from "vitest";
import { AppProviders } from "@/app/providers";
import { createQueryClient } from "@/shared/api/queryClient";
import type { SignupRequest } from "@/shared/api/types";
import { loginMethodsQueryKey } from "@/shared/account/api/loginChannels";
import { configureI18n } from "@/shared/i18n";
import { referenceDataFixture } from "@/test/mocks/handlers";
import { server } from "@/test/mocks/server";
import { SignupPage } from "./SignupPage";

const methods = { channels: [{ key: "email", countries: [] }, { key: "whatsapp", countries: ["AR"] }] };
const signinRedirect = vi.fn(async () => {});
const completeAuthorization = vi.fn();

beforeAll(async () => configureI18n(referenceDataFixture().cultures));
beforeEach(() => {
  signinRedirect.mockClear();
  completeAuthorization.mockClear();
  server.use(http.get("/api/auth/methods", () => HttpResponse.json(methods)));
});

function show(url = "/registro?channel=whatsapp", state?: unknown) {
  const client = createQueryClient({ queries: { retry: false }, mutations: { retry: false } });
  const auth = { isAuthenticated: false, isLoading: false, signinRedirect } as unknown as AuthContextProps;
  const router = createMemoryRouter([{ path: "/registro", element: <SignupPage completeAuthorization={completeAuthorization} /> }], {
    initialEntries: [{ pathname: "/registro", search: url.includes("?") ? url.slice(url.indexOf("?")) : "", state }],
  });
  return { client, router, ...render(<AppProviders client={client} authContext={auth}><RouterProvider router={router} /></AppProviders>) };
}

it("el marcador público elige WhatsApp disponible sin cargar identidad ni aceptar términos", async () => {
  show("/registro?channel=whatsapp&phone=se-ignora&email=se-ignora&token=se-ignora");
  expect(await screen.findByRole("textbox", { name: /^(Tu )?número de WhatsApp$/i })).toHaveValue("");
  expect(screen.getByRole("button", { name: "WhatsApp" })).toHaveAttribute("aria-pressed", "true");
  expect(screen.getByRole("checkbox")).not.toBeChecked();
  expect(signinRedirect).not.toHaveBeenCalled();
});

it.each(["sin módulo", "error"])("el marcador conserva Email con capacidades %s", async (scenario) => {
  let answered = false;
  server.use(http.get("/api/auth/methods", () => {
    answered = true;
    return scenario === "error" ? HttpResponse.json({}, { status: 503 }) : HttpResponse.json({ channels: [{ key: "email", countries: [] }] });
  }));
  const { client } = show();
  await waitFor(() => expect(answered).toBe(true));
  await waitFor(() => expect(client.getQueryState(loginMethodsQueryKey)?.fetchStatus).toBe("idle"));
  expect(screen.getByRole("textbox", { name: "Correo electrónico" })).toHaveValue("");
  expect(screen.queryByRole("button", { name: "WhatsApp" })).not.toBeInTheDocument();
});

it.each(["/registro", "/registro?channel=email", "/registro?channel=phone", "/registro?channel=WHATSAPP"])("%s conserva el canal Email", async (url) => {
  show(url);
  await screen.findByRole("button", { name: "WhatsApp" });
  expect(screen.getByRole("textbox", { name: "Correo electrónico" })).toHaveValue("");
  expect(screen.getByRole("button", { name: "Correo" })).toHaveAttribute("aria-pressed", "true");
});

it("selecciona WhatsApp cuando methods llega después del catálogo sin reiniciar el formulario", async () => {
  let resolveMethods!: () => void;
  const pending = new Promise<void>((resolve) => { resolveMethods = resolve; });
  let requested = false;
  server.use(http.get("/api/auth/methods", async () => { requested = true; await pending; return HttpResponse.json(methods); }));
  const { client } = show();
  await waitFor(() => expect(requested).toBe(true));
  await waitFor(() => expect(client.getQueryCache().findAll().some((query) => query.queryKey[0] === "reference-data" && query.state.status === "success")).toBe(true));
  expect(screen.getByRole("textbox", { name: "Correo electrónico" })).toBeVisible();
  fireEvent.click(screen.getByRole("checkbox"));
  await act(async () => { resolveMethods(); await pending; });
  expect(await screen.findByRole("textbox", { name: /^(Tu )?número de WhatsApp$/i })).toHaveValue("");
  expect(screen.getByRole("checkbox")).toBeChecked();
});

it("no pisa correo escrito mientras espera capabilities", async () => {
  let resolveMethods!: () => void;
  const pending = new Promise<void>((resolve) => { resolveMethods = resolve; });
  server.use(http.get("/api/auth/methods", async () => { await pending; return HttpResponse.json(methods); }));
  show();
  fireEvent.change(screen.getByRole("textbox", { name: "Correo electrónico" }), { target: { value: "ana@example.test" } });
  await act(async () => { resolveMethods(); await pending; });
  await screen.findByRole("button", { name: "WhatsApp" });
  expect(screen.getByRole("textbox", { name: "Correo electrónico" })).toHaveValue("ana@example.test");
});

it.each([{ email: "ana@example.test" }, { phone: { country: "AR", number: "011 15-2345-6789" } }])("conserva el destino interno %j sobre el marcador público", async (state) => {
  show(undefined, state);
  await screen.findByRole("button", { name: "WhatsApp" });
  expect(await screen.findByRole("textbox", { name: "email" in state ? "Correo electrónico" : /^(Tu )?número de WhatsApp$/i })).toHaveValue("email" in state ? state.email : state.phone.number);
});

it("permite cambiar a correo y no reaplica el marcador al releer capacidades", async () => {
  const { client } = show();
  await screen.findByRole("textbox", { name: /^(Tu )?número de WhatsApp$/i });
  fireEvent.click(screen.getByRole("button", { name: "Correo" }));
  await act(async () => { await client.invalidateQueries({ queryKey: loginMethodsQueryKey }); });
  expect(screen.getByRole("textbox", { name: "Correo electrónico" })).toBeVisible();
});

it("si el módulo se apaga vuelve a Email y no reaplica el marcador al habilitarlo nuevamente", async () => {
  const { client } = show();
  await screen.findByRole("textbox", { name: /^(Tu )?número de WhatsApp$/i });
  server.use(http.get("/api/auth/methods", () => HttpResponse.json({ channels: [{ key: "email", countries: [] }] })));
  await act(async () => { await client.invalidateQueries({ queryKey: loginMethodsQueryKey }); });
  expect(await screen.findByRole("textbox", { name: "Correo electrónico" })).toBeVisible();
  server.use(http.get("/api/auth/methods", () => HttpResponse.json(methods)));
  await act(async () => { await client.invalidateQueries({ queryKey: loginMethodsQueryKey }); });
  await screen.findByRole("button", { name: "WhatsApp" });
  expect(screen.getByRole("textbox", { name: "Correo electrónico" })).toBeVisible();
});

it("el registro desde el marcador exige términos y OTP y conserva la autorización original", async () => {
  const authorize = "/connect/authorize?client_id=web&state=original-state&code_challenge=pkce";
  const calls: SignupRequest[] = [];
  server.use(
    http.post<never, SignupRequest>("/api/auth/signup", async ({ request }) => { calls.push(await request.json()); return HttpResponse.json({ resendAfterSeconds: 0 }, { status: 202 }); }),
    http.post("/api/auth/signup/verify", () => new HttpResponse(null, { status: 204 })),
  );
  show(`/registro?${new URLSearchParams({ channel: "whatsapp", returnUrl: authorize })}`);
  const input = await screen.findByRole("textbox", { name: /^(Tu )?número de WhatsApp$/i });
  await waitFor(() => expect(input).toBeEnabled());
  fireEvent.change(input, { target: { value: "011 15-2345-6789" } });
  fireEvent.click(screen.getByRole("button", { name: "Crear cuenta" }));
  expect(await screen.findByText("Aceptá los Términos y la Política de privacidad.")).toBeVisible();
  expect(calls).toHaveLength(0);
  fireEvent.click(screen.getByRole("checkbox"));
  fireEvent.click(screen.getByRole("button", { name: "Crear cuenta" }));
  const code = await screen.findByRole("textbox", { name: "Código 1" });
  expect(completeAuthorization).not.toHaveBeenCalled();
  expect(calls).toEqual([{ phone: { country: "AR", number: "011 15-2345-6789" }, channel: "whatsapp", acceptedTerms: true, culture: "es-AR", timeZoneId: expect.any(String) }]);
  fireEvent.change(code, { target: { value: "123456" } });
  fireEvent.click(screen.getByRole("button", { name: "Verificar y crear la cuenta" }));
  await waitFor(() => expect(completeAuthorization).toHaveBeenCalledExactlyOnceWith(authorize));
  expect(signinRedirect).not.toHaveBeenCalled();
});

it("el marcador no evita el registro cerrado", async () => {
  show("/registro?channel=whatsapp&error=Auth.Signup.Closed");
  expect(await screen.findByRole("heading", { name: "Por ahora no se pueden crear cuentas" })).toBeVisible();
  expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
});
