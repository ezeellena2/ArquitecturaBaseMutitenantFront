import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { StrictMode } from "react";
import type { AuthContextProps } from "react-oidc-context";
import { createMemoryRouter, RouterProvider } from "react-router";
import { afterEach, beforeAll, beforeEach, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import { AppProviders } from "@/app/providers";
import { createQueryClient } from "@/shared/api/queryClient";
import type { PreviewLoginLinkRequest, RedeemLoginLinkRequest } from "@/shared/api/types";
import { configureI18n } from "@/shared/i18n";
import { referenceDataFixture } from "@/test/mocks/handlers";
import { consumerWithOrganizations } from "@/test/mocks/currentUsers";
import { server } from "@/test/mocks/server";
import { LoginLinkPage } from "./LoginLinkPage";
const token = "test-opaque-login-link-secret";
const previewCalls: PreviewLoginLinkRequest[] = [];
const redeemCalls: RedeemLoginLinkRequest[] = [];
const events: string[] = [];
const removeUser = vi.fn(async () => { events.push("removeUser"); });
const signinRedirect = vi.fn(async () => { events.push("signinRedirect"); });
const signoutRedirect = vi.fn(async () => {});
beforeAll(async () => { await configureI18n(referenceDataFixture().cultures); });
beforeEach(() => {
  previewCalls.length = 0; redeemCalls.length = 0; events.length = 0; vi.clearAllMocks();
  history.replaceState(null, "", `/login/enlace#t=${token}`);
  server.use(http.get("/api/me", () => HttpResponse.json(consumerWithOrganizations)), http.get("/api/auth/methods", () => HttpResponse.json({ channels: [{ key: "whatsapp", countries: ["AR"], contactPhone: "+5491123456789" }] })),
    http.post<never, PreviewLoginLinkRequest>("/api/auth/login-link/preview", async ({ request }) => { expect(location.hash).toBe(""); previewCalls.push(await request.json()); return HttpResponse.json({ displayName: "Lucía Fernández", maskedPhone: "•••• 4521" }); }),
    http.post<never, RedeemLoginLinkRequest>("/api/auth/login-link/redeem", async ({ request }) => { redeemCalls.push(await request.json()); events.push("redeem"); expect(request.headers.get("Idempotency-Key")).toBeTruthy(); return HttpResponse.json({ access: "consumer" }); }));
});
afterEach(() => { history.replaceState(null, "", "/"); vi.useRealTimers(); });
function show() {
  const client = createQueryClient({ queries: { retry: false }, mutations: { retry: false } });
  client.setQueryData(["previous-account"], { name: "Anterior" });
  const originalClear = client.clear.bind(client);
  const clear = vi.spyOn(client, "clear").mockImplementation(() => { events.push("clear"); originalClear(); });
  const auth = { isAuthenticated: true, isLoading: false, removeUser, signinRedirect, signoutRedirect, user: { profile: { access: "business" } } } as unknown as AuthContextProps;
  const router = createMemoryRouter([{ path: "/login/enlace", element: <LoginLinkPage /> }], { initialEntries: ["/login/enlace"] });
  return { client, clear, ...render(<StrictMode><AppProviders client={client} authContext={auth}><RouterProvider router={router} /></AppProviders></StrictMode>) };
}
it("StrictMode hace preview una vez, nunca canjea al abrir, y no lleva token a storage/query", async () => {
  const storage = vi.spyOn(Storage.prototype, "setItem");
  const { container, client } = show();
  await screen.findByText("Lucía Fernández");
  expect(previewCalls).toEqual([{ token }]); expect(redeemCalls).toEqual([]); expect(signinRedirect).not.toHaveBeenCalled();
  expect(location.hash).toBe("");
  expect(JSON.stringify(client.getMutationCache().getAll().map((item) => item.state.variables))).not.toContain(token);
  expect(JSON.stringify(storage.mock.calls)).not.toContain(token); storage.mockRestore();
  expect(await axe(container)).toHaveNoViolations();
});
it("doble clic canjea una vez y reemplaza sesión previa en orden sin logout ni token en OIDC", async () => {
  const { clear } = show(); await screen.findByText("Lucía Fernández");
  const button = screen.getByRole("button", { name: "Continuar" });
  fireEvent.click(button); fireEvent.click(button);
  await waitFor(() => expect(signinRedirect).toHaveBeenCalledExactlyOnceWith({ extraQueryParams: { access: "consumer" }, state: { returnTo: "/" } }));
  expect(events).toEqual(["redeem", "removeUser", "clear", "signinRedirect"]); expect(clear).toHaveBeenCalledOnce();
  expect(redeemCalls).toEqual([{ token, access: "consumer" }]); expect(signoutRedirect).not.toHaveBeenCalled();
});
it.each(["Auth.LoginLink.Invalid", "Auth.LoginLink.Expired", "Auth.LoginLink.AlreadyUsed"])("%s muestra el mismo estado y WhatsApp público", async (code) => {
  server.use(http.post("/api/auth/login-link/preview", () => HttpResponse.json({ code }, { status: 400 })));
  show(); expect(await screen.findByRole("heading", { name: "Este enlace ya no sirve" })).toBeVisible();
  expect(await screen.findByRole("link", { name: "Volver a WhatsApp" })).toHaveAttribute("href", "https://wa.me/5491123456789");
  expect(screen.getByRole("link", { name: "Ir al ingreso" })).toHaveAttribute("href", "/login"); expect(redeemCalls).toEqual([]);
});
it("sin contacto público conserva ingreso y oculta WhatsApp", async () => {
  server.use(http.get("/api/auth/methods", () => HttpResponse.json({ channels: [] })), http.post("/api/auth/login-link/preview", () => HttpResponse.json({ code: "Auth.LoginLink.Invalid" }, { status: 400 })));
  show(); await screen.findByRole("heading", { name: "Este enlace ya no sirve" });
  expect(screen.queryByRole("link", { name: "Volver a WhatsApp" })).not.toBeInTheDocument(); expect(screen.getByRole("link", { name: "Ir al ingreso" })).toBeVisible();
});
it("suspensión no permite continuar", async () => {
  server.use(http.post("/api/auth/login-link/redeem", () => HttpResponse.json({ code: "Identity.Account.Suspended", detail: "Tu cuenta está suspendida." }, { status: 403 })));
  show(); await screen.findByText("Lucía Fernández"); fireEvent.click(screen.getByRole("button", { name: "Continuar" }));
  expect(await screen.findByRole("heading", { name: "No podés entrar" })).toBeVisible(); expect(removeUser).not.toHaveBeenCalled(); expect(signinRedirect).not.toHaveBeenCalled();
});
it("429 cuenta Retry-After y no canjea por timer; reintentar preview no consume", async () => {
  let requests = 0;
  server.use(http.post("/api/auth/login-link/preview", () => { requests++; return requests === 1 ? HttpResponse.json({ code: "Auth.LoginLink.TooManyRequests", retryAfter: 2 }, { status: 429, headers: { "Retry-After": "2" } }) : HttpResponse.json({ displayName: "Lucía Fernández", maskedPhone: "•••• 4521" }); }));
  show(); expect(await screen.findByRole("button", { name: "Reintentá en 0:02" })).toBeDisabled();
  vi.useFakeTimers(); await act(async () => { await vi.advanceTimersByTimeAsync(2100); window.dispatchEvent(new Event("focus")); }); vi.useRealTimers();
  expect(requests).toBe(1); expect(redeemCalls).toEqual([]);
  fireEvent.click(screen.getByRole("button", { name: "Reintentar" })); await screen.findByText("Lucía Fernández"); expect(redeemCalls).toEqual([]);
});

it("si OIDC falla luego del canje, reintentar conserva la cookie y no consume nuevamente", async () => {
  signinRedirect.mockRejectedValueOnce(new Error("network"));
  show(); await screen.findByText("Lucía Fernández"); fireEvent.click(screen.getByRole("button", { name: "Continuar" }));
  await screen.findByRole("alert"); fireEvent.click(screen.getByRole("button", { name: "Continuar" }));
  await waitFor(() => expect(signinRedirect).toHaveBeenCalledTimes(2)); expect(redeemCalls).toEqual([{ token, access: "consumer" }]); expect(signoutRedirect).not.toHaveBeenCalled();
});
it("un replay al continuar muestra el estado vencido sin cambiar la sesión anterior", async () => {
  server.use(http.post("/api/auth/login-link/redeem", () => HttpResponse.json({ code: "Auth.LoginLink.AlreadyUsed" }, { status: 400 })));
  show(); await screen.findByText("Lucía Fernández"); fireEvent.click(screen.getByRole("button", { name: "Continuar" }));
  await screen.findByRole("heading", { name: "Este enlace ya no sirve" }); expect(removeUser).not.toHaveBeenCalled(); expect(signinRedirect).not.toHaveBeenCalled();
});
