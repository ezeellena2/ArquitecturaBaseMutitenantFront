import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { StrictMode } from "react";
import type { AuthContextProps } from "react-oidc-context";
import { createMemoryRouter, RouterProvider } from "react-router";
import { afterEach, beforeAll, beforeEach, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import { AppProviders } from "@/app/providers";
import { createQueryClient } from "@/shared/api/queryClient";
import type { CancelAccountDeletionRequest, LoginLinkPreviewResponse, PreviewLoginLinkRequest, RedeemLoginLinkRequest } from "@/shared/api/types";
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
    http.post<never, PreviewLoginLinkRequest, LoginLinkPreviewResponse>("/api/auth/login-link/preview", async ({ request }) => { expect(location.hash).toBe(""); previewCalls.push(await request.json()); return HttpResponse.json({ displayName: "Lucía Fernández", maskedPhone: "•••• 4521" }); }),
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
function previewIdentity(response: LoginLinkPreviewResponse) {
  server.use(http.post<never, PreviewLoginLinkRequest, LoginLinkPreviewResponse>("/api/auth/login-link/preview", async ({ request }) => {
    expect(location.hash).toBe(""); previewCalls.push(await request.json()); return HttpResponse.json(response);
  }));
}
it("un nombre compuesto conserva nombre y máscara con las dos iniciales comunes", async () => {
  previewIdentity({ displayName: "maría luisa del Río", maskedPhone: "•••• 4521" });
  const { container } = show();
  const name = await screen.findByText("maría luisa del Río");
  expect(screen.getByText("ML")).toBeVisible();
  expect(screen.getAllByText("•••• 4521")).toHaveLength(1);
  expect(name.parentElement?.textContent).toBe("maría luisa del Río•••• 4521");
  expect(previewCalls).toEqual([{ token }]); expect(redeemCalls).toEqual([]);
  expect(await axe(container)).toHaveNoViolations();
});
it.each([
  { displayName: null, maskedPhone: "•••• 4521" },
  { maskedPhone: "•••• 4521" },
  { displayName: " \t\n ", maskedPhone: "•••• 4521" },
] satisfies LoginLinkPreviewResponse[])("sin nombre ($displayName) identifica con la máscara una vez y sólo Continuar canjea", async (response) => {
  previewIdentity(response);
  const { container } = show();
  const phone = await screen.findByText("•••• 4521");
  expect(screen.getAllByText("•••• 4521")).toHaveLength(1);
  expect(phone.parentElement?.children).toHaveLength(1);
  expect(screen.getByText("—")).toBeVisible();
  expect(previewCalls).toEqual([{ token }]); expect(redeemCalls).toEqual([]);
  expect(removeUser).not.toHaveBeenCalled(); expect(signinRedirect).not.toHaveBeenCalled();
  expect(await axe(container)).toHaveNoViolations();
  fireEvent.click(screen.getByRole("button", { name: "Continuar" }));
  await waitFor(() => expect(signinRedirect).toHaveBeenCalledOnce());
  expect(redeemCalls).toEqual([{ token, access: "consumer" }]);
});
it.each([
  { displayName: null, maskedPhone: null },
  {},
  { displayName: " \t\n ", maskedPhone: " " },
] satisfies LoginLinkPreviewResponse[])("sin identidad publicada ($displayName) muestra el vacío central accesible sin fila vacía", async (response) => {
  previewIdentity(response);
  const { container } = show();
  const empty = await screen.findByRole("img", { name: "Sin dato" });
  expect(empty).toHaveTextContent("—");
  expect(empty.parentElement?.parentElement?.children).toHaveLength(1);
  expect(screen.getAllByText("—")).toHaveLength(2);
  expect(previewCalls).toEqual([{ token }]); expect(redeemCalls).toEqual([]);
  expect(await axe(container)).toHaveNoViolations();
});
it("con nombre y sin máscara conserva una sola línea de identificación", async () => {
  previewIdentity({ displayName: "Lucía Fernández", maskedPhone: null });
  const { container } = show();
  const name = await screen.findByText("Lucía Fernández");
  expect(name.parentElement?.children).toHaveLength(1);
  expect(screen.getByText("LF")).toBeVisible();
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
it("LockedOut después del preview es terminal sin otro canje ni cambiar la sesión previa", async () => {
  const detail = "Tu cuenta está bloqueada temporalmente. Intentá más tarde.";
  server.use(http.post<never, RedeemLoginLinkRequest>("/api/auth/login-link/redeem", async ({ request }) => {
    redeemCalls.push(await request.json()); events.push("redeem");
    return HttpResponse.json({ code: "Identity.Account.LockedOut", detail, retryAfter: 2 }, { status: 429, headers: { "Retry-After": "2" } });
  }));
  const storage = vi.spyOn(Storage.prototype, "setItem");
  const { client, clear, container } = show(); await screen.findByText("Lucía Fernández");
  fireEvent.click(screen.getByRole("button", { name: "Continuar" }));
  expect(await screen.findByRole("heading", { name: "No podés entrar" })).toBeVisible();
  expect(screen.getByText(detail)).toBeVisible();
  expect(screen.getByRole("link", { name: "Ir al ingreso" })).toHaveAttribute("href", "/login");
  const status = within(screen.getByRole("main"));
  expect(status.queryByRole("button")).not.toBeInTheDocument();
  expect(status.getAllByRole("link")).toEqual([status.getByRole("link", { name: "Ir al ingreso" })]);
  expect(screen.queryByRole("link", { name: "Volver a WhatsApp" })).not.toBeInTheDocument();
  vi.useFakeTimers(); await act(async () => { await vi.advanceTimersByTimeAsync(2100); window.dispatchEvent(new Event("focus")); }); vi.useRealTimers();
  expect(status.queryByRole("button")).not.toBeInTheDocument();
  expect(previewCalls).toEqual([{ token }]); expect(redeemCalls).toEqual([{ token, access: "consumer" }]); expect(events).toEqual(["redeem"]);
  expect(removeUser).not.toHaveBeenCalled(); expect(clear).not.toHaveBeenCalled(); expect(signinRedirect).not.toHaveBeenCalled(); expect(signoutRedirect).not.toHaveBeenCalled();
  expect(client.getQueryData(["previous-account"])).toEqual({ name: "Anterior" }); expect(location.hash).toBe("");
  expect(JSON.stringify(client.getMutationCache().getAll().map((item) => item.state.variables))).not.toContain(token);
  expect(JSON.stringify(storage.mock.calls)).not.toContain(token); storage.mockRestore();
  expect(await axe(container)).toHaveNoViolations();
});
it("429 transitorio al canjear conserva espera y reintento manual", async () => {
  server.use(http.post<never, RedeemLoginLinkRequest>("/api/auth/login-link/redeem", async ({ request }) => {
    redeemCalls.push(await request.json()); events.push("redeem");
    return redeemCalls.length === 1
      ? HttpResponse.json({ code: "Request.TooManyRequests", retryAfter: 2 }, { status: 429, headers: { "Retry-After": "2" } })
      : HttpResponse.json({ access: "consumer" });
  }));
  const { clear } = show(); await screen.findByText("Lucía Fernández"); fireEvent.click(screen.getByRole("button", { name: "Continuar" }));
  expect(await screen.findByRole("button", { name: "Reintentá en 0:02" })).toBeDisabled();
  vi.useFakeTimers(); await act(async () => { await vi.advanceTimersByTimeAsync(2100); window.dispatchEvent(new Event("focus")); }); vi.useRealTimers();
  expect(redeemCalls).toHaveLength(1); expect(removeUser).not.toHaveBeenCalled(); expect(clear).not.toHaveBeenCalled(); expect(signinRedirect).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Continuar" }));
  await waitFor(() => expect(signinRedirect).toHaveBeenCalledOnce());
  expect(redeemCalls).toEqual([{ token, access: "consumer" }, { token, access: "consumer" }]);
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

const cancelTicket = "test-opaque-cancel-ticket";
const pendingDeletion = { code: "Identity.Account.PendingDeletion", scheduledForUtc: "2026-10-30T12:00:00Z", timeZoneId: "America/Argentina/Buenos_Aires", cancelTicket, returnUrl: "/login/enlace", cancelTicketExpiresAtUtc: "2026-10-09T13:00:00Z" };
const cancelRequests: { body: CancelAccountDeletionRequest; key: string | null }[] = [];
function pendingAccount() {
  cancelRequests.length = 0;
  server.use(http.post<never, RedeemLoginLinkRequest>("/api/auth/login-link/redeem", async ({ request }) => {
    redeemCalls.push(await request.json()); events.push("redeem"); return HttpResponse.json(pendingDeletion, { status: 403 });
  }), http.post<never, CancelAccountDeletionRequest>("/api/auth/deletion/cancel", async ({ request }) => {
    cancelRequests.push({ body: await request.json(), key: request.headers.get("Idempotency-Key") }); events.push("cancel");
    return HttpResponse.json({ returnUrl: "/login/enlace" });
  }));
}
async function openPendingAccount() {
  await screen.findByText("Lucía Fernández");
  fireEvent.click(screen.getByRole("button", { name: "Continuar" }));
  await screen.findByRole("heading", { name: "Tu cuenta tiene la baja pedida" });
}
it("baja pendiente usa el panel existente y doble clic cancela una vez antes de iniciar OIDC Consumer nuevo", async () => {
  pendingAccount(); const storage = vi.spyOn(Storage.prototype, "setItem");
  const { client, clear, container } = show(); await openPendingAccount();
  expect(screen.getByText("30/10/2026", { exact: false })).toBeVisible();
  expect(removeUser).not.toHaveBeenCalled(); expect(signinRedirect).not.toHaveBeenCalled();
  expect(JSON.stringify(client.getMutationCache().getAll().map((item) => item.state.variables))).not.toContain(cancelTicket);
  expect(await axe(container)).toHaveNoViolations();
  const cancelButton = screen.getByRole("button", { name: "Cancelar la baja y entrar" });
  fireEvent.click(cancelButton); fireEvent.click(cancelButton);
  await waitFor(() => expect(signinRedirect).toHaveBeenCalledExactlyOnceWith({ extraQueryParams: { access: "consumer" }, state: { returnTo: "/" } }));
  expect(events).toEqual(["redeem", "cancel", "removeUser", "clear", "signinRedirect"]); expect(clear).toHaveBeenCalledOnce();
  expect(cancelRequests).toEqual([{ body: { cancelTicket }, key: expect.any(String) }]); expect(redeemCalls).toHaveLength(1);
  expect(signoutRedirect).not.toHaveBeenCalled(); expect(location.pathname).toBe("/login/enlace"); expect(location.hash).toBe("");
  expect(JSON.stringify(client.getMutationCache().getAll().map((item) => item.state.variables))).not.toContain(cancelTicket);
  expect(JSON.stringify(storage.mock.calls)).not.toContain(cancelTicket); storage.mockRestore();
});
it.each(["network", "server"])("cancelación con error %s conserva prueba y clave para el reintento manual", async (failure) => {
  pendingAccount(); let attempts = 0;
  server.use(http.post<never, CancelAccountDeletionRequest>("/api/auth/deletion/cancel", async ({ request }) => {
    cancelRequests.push({ body: await request.json(), key: request.headers.get("Idempotency-Key") });
    if (++attempts === 1) return failure === "network" ? HttpResponse.error() : HttpResponse.json({ code: "General.Unexpected" }, { status: 503 });
    return HttpResponse.json({ returnUrl: "/login/enlace" });
  }));
  show(); await openPendingAccount(); fireEvent.click(screen.getByRole("button", { name: "Cancelar la baja y entrar" }));
  await screen.findByRole("alert"); expect(removeUser).not.toHaveBeenCalled(); expect(signinRedirect).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Cancelar la baja y entrar" }));
  await waitFor(() => expect(signinRedirect).toHaveBeenCalledOnce());
  expect(cancelRequests).toHaveLength(2); expect(cancelRequests[0]!.key).toBeTruthy(); expect(cancelRequests[1]).toEqual(cancelRequests[0]); expect(redeemCalls).toHaveLength(1);
});
it.each([["Legal.AccountDeletion.GraceExpired", 409], ["Legal.AccountDeletion.CancelProofInvalid", 403]] as const)("%s abandona la prueba sin volver a canjear ni cambiar la sesión", async (code, status) => {
  pendingAccount(); server.use(http.post("/api/auth/deletion/cancel", () => HttpResponse.json({ code, detail: "Esta prueba ya no sirve." }, { status })));
  show(); await openPendingAccount(); fireEvent.click(screen.getByRole("button", { name: "Cancelar la baja y entrar" }));
  await screen.findByRole("heading", { name: "Este enlace ya no sirve" }); expect(screen.getByRole("link", { name: "Ir al ingreso" })).toBeVisible();
  expect(screen.queryByRole("button", { name: "Cancelar la baja y entrar" })).not.toBeInTheDocument(); expect(removeUser).not.toHaveBeenCalled(); expect(signinRedirect).not.toHaveBeenCalled(); expect(redeemCalls).toHaveLength(1);
});
it("429 de cancelación conserva el panel, cuenta la espera y exige otro clic", async () => {
  pendingAccount(); let attempts = 0;
  server.use(http.post("/api/auth/deletion/cancel", () => ++attempts === 1
    ? HttpResponse.json({ code: "Request.TooManyRequests", retryAfter: 2 }, { status: 429, headers: { "Retry-After": "2" } })
    : HttpResponse.json({ returnUrl: "/login/enlace" })));
  show(); await openPendingAccount(); fireEvent.click(screen.getByRole("button", { name: "Cancelar la baja y entrar" }));
  expect(await screen.findByRole("button", { name: "Reintentá en 0:02" })).toBeDisabled();
  vi.useFakeTimers(); await act(async () => { await vi.advanceTimersByTimeAsync(2100); window.dispatchEvent(new Event("focus")); }); vi.useRealTimers();
  expect(attempts).toBe(1); expect(signinRedirect).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Cancelar la baja y entrar" })); await waitFor(() => expect(signinRedirect).toHaveBeenCalledOnce()); expect(redeemCalls).toHaveLength(1);
});
it.each(["signinRedirect", "removeUser"])("si %s falla después de cancelar, Continuar no cancela ni canjea de nuevo", async (operation) => {
  pendingAccount(); (operation === "signinRedirect" ? signinRedirect : removeUser).mockRejectedValueOnce(new Error("network"));
  show(); await openPendingAccount(); fireEvent.click(screen.getByRole("button", { name: "Cancelar la baja y entrar" }));
  await screen.findByRole("alert"); expect(screen.queryByRole("button", { name: "Cancelar la baja y entrar" })).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Continuar" }));
  await waitFor(() => expect(signinRedirect).toHaveBeenCalledTimes(operation === "signinRedirect" ? 2 : 1));
  expect(cancelRequests).toHaveLength(1); expect(redeemCalls).toHaveLength(1); expect(signoutRedirect).not.toHaveBeenCalled();
});
it("metadata incompleta de baja pendiente no ofrece una cancelación", async () => {
  server.use(http.post("/api/auth/login-link/redeem", () => HttpResponse.json({ code: "Identity.Account.PendingDeletion", cancelTicket }, { status: 403 })));
  show(); await screen.findByText("Lucía Fernández"); fireEvent.click(screen.getByRole("button", { name: "Continuar" }));
  await screen.findByRole("alert"); expect(screen.queryByRole("button", { name: "Cancelar la baja y entrar" })).not.toBeInTheDocument(); expect(removeUser).not.toHaveBeenCalled();
});
it.each([200, 403])("una cancelación que responde %s después de desmontar no cambia sesión ni inicia OIDC", async (status) => {
  pendingAccount(); let finish: () => void = () => {}; let requested = false;
  const response = new Promise<void>((resolve) => { finish = resolve; });
  server.use(http.post("/api/auth/deletion/cancel", async () => {
    requested = true; await response;
    return status === 200 ? HttpResponse.json({ returnUrl: "/login/enlace" }) : HttpResponse.json({ code: "Legal.AccountDeletion.CancelProofInvalid" }, { status });
  }));
  const { unmount, clear, client } = show(); await openPendingAccount(); fireEvent.click(screen.getByRole("button", { name: "Cancelar la baja y entrar" }));
  await waitFor(() => expect(requested).toBe(true)); expect(screen.getByRole("button", { name: "Cancelar la baja y entrar" })).toBeDisabled(); expect(screen.getByRole("button", { name: "Salir" })).toBeDisabled(); unmount();
  await act(async () => { finish(); await response; });
  await waitFor(() => expect(client.getMutationCache().getAll().at(-1)?.state.status).toBe("error"));
  expect(removeUser).not.toHaveBeenCalled(); expect(clear).not.toHaveBeenCalled(); expect(signinRedirect).not.toHaveBeenCalled();
});
it("desmontar mientras borra el usuario local después de cancelar impide la continuación tardía", async () => {
  pendingAccount(); let finish: () => void = () => {};
  const response = new Promise<void>((resolve) => { finish = resolve; }); removeUser.mockImplementationOnce(() => response);
  const { unmount, clear } = show(); await openPendingAccount(); fireEvent.click(screen.getByRole("button", { name: "Cancelar la baja y entrar" }));
  await waitFor(() => expect(removeUser).toHaveBeenCalledOnce()); unmount(); await act(async () => { finish(); await response; });
  expect(clear).not.toHaveBeenCalled(); expect(signinRedirect).not.toHaveBeenCalled();
});
