import { act, fireEvent, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import { configureI18n, changeCulture } from "@/shared/i18n";
import type { ApiSchemas } from "@/shared/api/types";
import { meHandlerFor, referenceDataFixture } from "@/test/mocks/handlers";
import { platformOperator } from "@/test/mocks/currentUsers";
import { server } from "@/test/mocks/server";
import { asPhone } from "@/test/utils/phone";
import { renderRouteWithProviders } from "@/test/utils/renderWithProviders";
import { accountQueryKey, accountsQueryRoot } from "../api/accounts";
import { currentUserQueryKey } from "@/auth/useCurrentUser";

type Account = ApiSchemas["PlatformAccountResponse"];
type Detail = ApiSchemas["PlatformAccountDetailResponse"];
const person: Account = { id: "lucia", displayName: "Lucía Fernández", primaryEmail: "lucia@example.com", kind: "Person", state: "Active", hasPersonalSpace: true, organizationCount: 2, lastSignInAtUtc: "2026-09-18T12:00:00Z", lastSignInMethod: "Code" };
const invitation: Account = { ...person, id: "invite", displayName: null, primaryEmail: "julieta@example.com", kind: "Operator", state: "Invited", organizationCount: 0, hasPersonalSpace: false, lastSignInAtUtc: null, lastSignInMethod: null, invitationExpiresAtUtc: "2026-10-04T12:00:00Z" };
const detail: Detail = { id: "lucia", displayName: person.displayName, kind: person.kind, state: person.state, hasPersonalSpace: true, loginMethods: [], organizations: [], soleOwnerOrganizations: [], operatorPermissions: null, operatorVersion: null };
const counts = { total: 11, states: [{ state: "Active", count: 5 }, { state: "Suspended", count: 1 }, { state: "NeedsRecovery", count: 1 }, { state: "Invited", count: 1 }, { state: "InvitationExpired", count: 1 }, { state: "PendingDeletion", count: 1 }, { state: "Deleted", count: 1 }], kinds: [{ kind: "Person", count: 7 }, { kind: "Operator", count: 4 }] };
function list(items: Account[] = [person, invitation]) { return { items, page: 1, pageSize: 10, totalCount: items.length, totalPages: items.length ? 1 : 0, hasPrevious: false, hasNext: false }; }
async function action(user: ReturnType<typeof userEvent.setup>, label: string, name = "Lucía Fernández") {
  const trigger = await screen.findByRole("button", { name: `Acciones de ${name}` });
  trigger.focus(); await user.keyboard("{ArrowDown}");
  await user.click(await screen.findByRole("menuitem", { name: label }));
}
async function reason(user: ReturnType<typeof userEvent.setup>, label: string) {
  await user.type(screen.getByRole("textbox", { name: "Motivo" }), "Revisión");
  await user.click(within(screen.getByRole("dialog")).getByRole("button", { name: label }));
}
beforeAll(async () => { await import("./AccountsPage"); });
afterEach(() => vi.unstubAllGlobals());
beforeEach(async () => {
  await configureI18n(referenceDataFixture().cultures); await changeCulture("es-AR");
  server.use(http.get("/api/platform/accounts/paged", () => HttpResponse.json(list())), http.get("/api/platform/accounts/filter-counts", () => HttpResponse.json(counts)), http.get("/api/platform/accounts/lucia", () => HttpResponse.json(detail)));
});
describe("Cuentas de Plataforma", () => {
  it("banda global, perfiles reales, invitación Nunca/Vence y sin errores axe", async () => {
    const { container } = renderRouteWithProviders("/plataforma/cuentas", { as: "platform-operator" });
    expect(await screen.findByRole("heading", { name: "Cuentas", level: 1 })).toBeVisible();
    expect(await screen.findByText("11 cuentas · 1 suspendida")).toBeVisible();
    expect(screen.getByRole("link", { name: "Lucía Fernández" })).toHaveAttribute("href", "/plataforma/cuentas/lucia");
    expect(screen.getByText("Personal + 2 organizaciones")).toBeVisible();
    expect(screen.getByText("Nunca")).toBeVisible(); expect(screen.getByText(/Vence el/)).toHaveTextContent("Vence el 04/10/2026");
    expect(await axe(container)).toHaveNoViolations();
  });
  it.each([
    ["Active", ["Cerrar sus sesiones", "Suspender", "Dar de baja"]],
    ["Suspended", ["Cerrar sus sesiones", "Reactivar", "Dar de baja"]],
    ["NeedsRecovery", ["Cerrar sus sesiones", "Suspender", "Dar de baja"]],
    ["Invited", ["Reenviar invitación", "Revocar invitación"]],
    ["InvitationExpired", ["Reenviar invitación", "Revocar invitación"]],
  ] as [Account["state"], string[]][])("%s ofrece sus acciones reales", async (state, labels) => {
    const user = userEvent.setup(); server.use(http.get("/api/platform/accounts/paged", () => HttpResponse.json(list([{ ...person, state }]))));
    renderRouteWithProviders("/plataforma/cuentas", { as: "platform-operator" });
    const trigger = await screen.findByRole("button", { name: "Acciones de Lucía Fernández" }); trigger.focus(); await user.keyboard("{ArrowDown}");
    expect((await screen.findAllByRole("menuitem")).map((item) => item.textContent)).toEqual(labels);
    expect(screen.getByRole("separator")).toBeVisible();
  });
  it("baja, eliminada y propia no tienen menú; sin nombre usa correo sin repetirlo, sin Personal inventado", async () => {
    server.use(http.get("/api/platform/accounts/paged", () => HttpResponse.json(list([
      { ...person, id: "pending", state: "PendingDeletion" }, { ...person, id: "deleted", displayName: "Cuenta eliminada", primaryEmail: null, state: "Deleted" },
      { ...person, id: platformOperator.id, displayName: "Martín Sosa", kind: "Operator" }, { ...person, id: "nameless", displayName: null, primaryEmail: "sin.nombre@example.com", hasPersonalSpace: false, organizationCount: 1 },
    ]))));
    renderRouteWithProviders("/plataforma/cuentas", { as: "platform-operator" }); await screen.findByRole("link", { name: "Cuenta eliminada" });
    expect(screen.queryByRole("button", { name: /Acciones de (Lucía|Martín|Cuenta eliminada)/ })).not.toBeInTheDocument();
    expect(screen.getAllByText("sin.nombre@example.com")).toHaveLength(1); expect(screen.getByText("1 organización")).toBeVisible();
    expect(within(screen.getByRole("link", { name: "Cuenta eliminada" }).closest("tr")!).getAllByText("—").length).toBeGreaterThan(0);
  });
  it.each(["suspend", "reactivate", "revoke-sessions"] as const)("%s manda sólo motivo, conserva franja409 y relee al cerrar", async (path) => {
    const user = userEvent.setup(); let reads = 0; let body: unknown;
    const label = path === "reactivate" ? "Reactivar" : path === "suspend" ? "Suspender" : "Cerrar sus sesiones";
    server.use(http.get("/api/platform/accounts/paged", () => { reads++; return HttpResponse.json(list([{ ...person, state: path === "reactivate" ? "Suspended" : "Active" }])); }), http.post(`/api/platform/accounts/lucia/${path}`, async ({ request }) => { body = await request.json(); return HttpResponse.json({ code: "Users.User.InvalidTransition", detail: "No se puede cambiar la cuenta a ese estado." }, { status: 409 }); }));
    renderRouteWithProviders("/plataforma/cuentas", { as: "platform-operator" }); await action(user, label);
    const dialog = screen.getByRole("dialog"); expect(within(dialog).queryByRole("button", { name: "Cerrar" })).not.toBeInTheDocument();
    await reason(user, path === "revoke-sessions" ? "Cerrar sesiones" : label);
    expect(await within(dialog).findByText("No se puede cambiar la cuenta a ese estado.")).toBeVisible(); expect(body).toEqual({ reason: "Revisión" }); expect(reads).toBe(1);
    await user.click(screen.getByRole("button", { name: "Cancelar" })); await waitFor(() => expect(reads).toBe(2));
  });
  it("baja lee la evidencia antes de confirmar y bloquea único Dueño sin motivo", async () => {
    const user = userEvent.setup(); server.use(http.get("/api/platform/accounts/lucia", () => HttpResponse.json({ ...detail, soleOwnerOrganizations: ["Grupo Delta"] })));
    renderRouteWithProviders("/plataforma/cuentas", { as: "platform-operator" }); await action(user, "Dar de baja");
    expect(await screen.findByText("Es el único Dueño de Grupo Delta. Primero la organización tiene que sumar otro Dueño, o la plataforma tiene que cerrarla.")).toBeVisible();
    expect(screen.queryByRole("textbox", { name: "Motivo" })).not.toBeInTheDocument(); expect(screen.getByRole("button", { name: "Dar de baja" })).toBeDisabled();
  });
  it("baja relee la fecha real para el aviso, sin calcular treinta días", async () => {
    const user = userEvent.setup(); let written = false; const steps: string[] = [];
    server.use(http.get("/api/platform/accounts/lucia", () => { steps.push("GET"); return HttpResponse.json(written ? { ...detail, deletion: { requestedAtUtc: "2026-09-27T12:00:00Z", scheduledForUtc: "2026-11-18T12:00:00Z", requestedByPlatform: true } } : detail); }), http.post("/api/platform/accounts/lucia/deletion", () => { steps.push("POST"); written = true; return new HttpResponse(null, { status: 204 }); }));
    renderRouteWithProviders("/plataforma/cuentas", { as: "platform-operator" }); await action(user, "Dar de baja"); await screen.findByRole("textbox", { name: "Motivo" }); await reason(user, "Dar de baja");
    expect(await screen.findByText("Dimos de baja la cuenta de Lucía Fernández. Se elimina el 18/11/2026.")).toBeVisible(); expect(steps.slice(0, 3)).toEqual(["GET", "POST", "GET"]);
  });
  it("LastManager se queda en la franja", async () => {
    const user = userEvent.setup(); server.use(http.post("/api/platform/accounts/lucia/suspend", () => HttpResponse.json({ code: "Platform.Operator.LastManager", detail: "Tiene que quedar al menos un operador activo que pueda administrar operadores." }, { status: 409 })));
    renderRouteWithProviders("/plataforma/cuentas", { as: "platform-operator" }); await action(user, "Suspender"); await reason(user, "Suspender");
    expect(await within(screen.getByRole("dialog")).findByText("Tiene que quedar al menos un operador activo que pueda administrar operadores.")).toBeVisible();
  });
  it("reenviar es directo y revocar confirma sin motivo", async () => {
    const user = userEvent.setup(); let resends = 0; let revokes = 0;
    server.use(http.post("/api/platform/operators/invite/invitation/resend", () => { resends++; return HttpResponse.json({ id: "invite", expiresAtUtc: "2026-10-08T12:00:00Z" }); }), http.delete("/api/platform/operators/invite/invitation", () => { revokes++; return new HttpResponse(null, { status: 204 }); }));
    renderRouteWithProviders("/plataforma/cuentas", { as: "platform-operator" }); await action(user, "Reenviar invitación", "julieta@example.com");
    expect(await screen.findByText("Reenviamos la invitación a julieta@example.com.")).toBeVisible(); expect(resends).toBe(1); expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    await action(user, "Revocar invitación", "julieta@example.com"); expect(screen.queryByRole("textbox", { name: "Motivo" })).not.toBeInTheDocument(); await user.click(screen.getByRole("button", { name: "Revocar" }));
    expect(await screen.findByText("Revocamos la invitación a julieta@example.com.")).toBeVisible(); expect(revokes).toBe(1);
  });
  it("sólo lectura no ofrece invitación ni acciones", async () => {
    renderRouteWithProviders("/plataforma/cuentas", { as: "platform-operator-reader" }); await screen.findByRole("link", { name: "Lucía Fernández" });
    expect(screen.queryByRole("button", { name: "Invitar operador" })).not.toBeInTheDocument(); expect(screen.queryByRole("button", { name: /Acciones de/ })).not.toBeInTheDocument();
  });
  it("invitar exige correo, permite permisos vacíos al backend y ubica ambos409 y400 en sus campos", async () => {
    const user = userEvent.setup(); const requests: unknown[] = []; let code = "Platform.Operator.InvitationExists";
    server.use(http.post("/api/platform/operators/invitations", async ({ request }) => { requests.push(await request.json()); return HttpResponse.json({ code }, { status: code.endsWith("PermissionsRequired") ? 400 : 409 }); }));
    renderRouteWithProviders("/plataforma/cuentas", { as: "platform-operator" }); await user.click(await screen.findByRole("button", { name: "Invitar operador" }));
    expect(screen.getByRole("button", { name: "Invitar" })).toBeEnabled(); await user.click(screen.getByRole("button", { name: "Invitar" })); expect(await screen.findByText("Escribí el correo.")).toBeVisible(); expect(requests).toHaveLength(0);
    const email = screen.getByRole("textbox", { name: "Correo" }); await user.type(email, "NUEVO@EXAMPLE.COM"); await user.click(screen.getByRole("button", { name: "Invitar" }));
    expect(await screen.findByText("Ese correo ya tiene una invitación. Reenviala desde la lista.")).toBeVisible(); expect(email).toHaveAttribute("aria-invalid", "true");
    code = "Platform.Operator.AccountExists"; await user.click(screen.getByRole("button", { name: "Invitar" })); expect(await screen.findByText("Ese correo ya tiene una cuenta. Un operador no puede tener perfiles de persona.")).toBeVisible();
    code = "Platform.Operator.PermissionsRequired"; await user.click(screen.getByRole("button", { name: "Invitar" })); expect(await screen.findByText("Elegí al menos un permiso de plataforma.")).toBeVisible(); expect(screen.getByRole("button", { name: "Permisos de plataforma" })).toHaveAttribute("aria-invalid", "true");
    expect(requests).toEqual(Array.from({ length: 3 }, () => ({ email: "nuevo@example.com", permissions: [] })));
  });
  it("invitar tiene nueve opciones con descripción y reintenta red con igual clave y aviso", async () => {
    const user = userEvent.setup(); const keys: (string | null)[] = []; const bodies: unknown[] = [];
    server.use(http.post("/api/platform/operators/invitations", async ({ request }) => { keys.push(request.headers.get("Idempotency-Key")); bodies.push(await request.json()); return keys.length === 1 ? HttpResponse.error() : HttpResponse.json({ id: "new", expiresAtUtc: "2026-10-04T12:00:00Z" }, { status: 201 }); }));
    renderRouteWithProviders("/plataforma/cuentas", { as: "platform-operator" }); await user.click(await screen.findByRole("button", { name: "Invitar operador" }));
    await user.type(screen.getByRole("textbox", { name: "Correo" }), "new@example.com"); const permissions = screen.getByRole("button", { name: "Permisos de plataforma" }); permissions.focus(); await user.keyboard("{ArrowDown}");
    expect(await screen.findAllByRole("menuitemcheckbox")).toHaveLength(9); expect(screen.getByText("Buscar cuentas y ver su ficha.")).toBeVisible(); await user.click(screen.getByRole("menuitemcheckbox", { name: "Ver cuentas" })); await user.keyboard("{Escape}");
    await user.click(screen.getByRole("button", { name: "Invitar" })); fireEvent.click(await screen.findByRole("button", { name: "Reintentar" }));
    expect(await screen.findByText("Invitamos a new@example.com como operador.")).toBeVisible(); expect(keys).toHaveLength(2); expect(keys[0]).toBe(keys[1]); expect(bodies).toEqual(Array.from({ length: 2 }, () => ({ email: "new@example.com", permissions: ["platform.accounts.read"] })));
  });
  it("390 usa fila con avatar, estados, acciones y hoja; axe", async () => {
    asPhone(); const user = userEvent.setup(); const { container } = renderRouteWithProviders("/plataforma/cuentas", { as: "platform-operator" });
    await screen.findByRole("link", { name: /Lucía Fernández/ }); expect(screen.getByText("Plataforma", { selector: "span" })).toBeVisible(); expect(screen.queryByRole("table")).not.toBeInTheDocument(); expect(screen.getByRole("button", { name: "Buscar por nombre, correo o teléfono" })).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Acciones de Lucía Fernández" })); expect(await screen.findByRole("dialog")).toBeVisible(); expect(await axe(container)).toHaveNoViolations();
  });
  it("cambiar la URL abandona confirmación y una respuesta tardía no notifica ni cierra otra", async () => {
    const user = userEvent.setup(); let complete: (() => void) | undefined;
    server.use(http.post("/api/platform/accounts/lucia/suspend", async () => { await new Promise<void>((resolve) => { complete = resolve; }); return new HttpResponse(null, { status: 204 }); }));
    const { router } = renderRouteWithProviders("/plataforma/cuentas", { as: "platform-operator" }); await action(user, "Suspender"); await reason(user, "Suspender");
    await act(async () => { await router.navigate("/plataforma/cuentas?kind=Person"); }); expect(screen.queryByRole("dialog")).not.toBeInTheDocument(); await action(user, "Suspender");
    await act(async () => { complete?.(); }); expect(screen.getByRole("dialog")).toBeVisible(); expect(screen.queryByText("Suspendimos la cuenta de Lucía Fernández.")).not.toBeInTheDocument();
  });
  it("volver a una URL abandonada no revive la confirmación ni Invitar", async () => {
    const user = userEvent.setup(); const { router } = renderRouteWithProviders("/plataforma/cuentas", { as: "platform-operator" });
    await action(user, "Suspender"); await act(async () => { await router.navigate("/plataforma/cuentas?kind=Person"); });
    await act(async () => { await router.navigate("/plataforma/cuentas"); }); expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Invitar operador" }));
    await act(async () => { await router.navigate("/plataforma/cuentas?state=Active"); });
    await act(async () => { await router.navigate("/plataforma/cuentas"); }); expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
  it("si falla la lectura nueva de la baja no confirma con datos cacheados", async () => {
    const user = userEvent.setup(); server.use(http.get("/api/platform/accounts/lucia", () => HttpResponse.error()));
    const { queryClient } = renderRouteWithProviders("/plataforma/cuentas", { as: "platform-operator" });
    queryClient.setQueryData(accountQueryKey(person.id), detail); await action(user, "Dar de baja");
    expect(await within(screen.getByRole("dialog")).findByRole("button", { name: "Reintentar" })).toBeVisible();
    expect(screen.queryByRole("textbox", { name: "Motivo" })).not.toBeInTheDocument();
  });
  it("LastAdmin relee el nuevo único Dueño y bloquea con el texto de Plataforma", async () => {
    const user = userEvent.setup(); let rejected = false; let reads = 0;
    server.use(http.get("/api/platform/accounts/lucia", () => { reads++; return HttpResponse.json({ ...detail, soleOwnerOrganizations: rejected ? ["Nueva organización"] : [] }); }), http.post("/api/platform/accounts/lucia/deletion", () => { rejected = true; return HttpResponse.json({ code: "Legal.AccountDeletion.LastAdmin", detail: "Antes de pedir la baja, cada Organización activa debe tener otra persona con el rol Dueño." }, { status: 409 }); }));
    renderRouteWithProviders("/plataforma/cuentas", { as: "platform-operator" }); await action(user, "Dar de baja"); await screen.findByRole("textbox", { name: "Motivo" }); await reason(user, "Dar de baja");
    expect(await screen.findByText("Es el único Dueño de Nueva organización. Primero la organización tiene que sumar otro Dueño, o la plataforma tiene que cerrarla.")).toBeVisible();
    expect(reads).toBe(2); expect(screen.queryByRole("textbox", { name: "Motivo" })).not.toBeInTheDocument(); expect(screen.getByRole("button", { name: "Dar de baja" })).toBeDisabled();
  });
  it("LastAdmin con relectura retenida y sin únicos Dueños conserva motivo y rechazo original", async () => {
    const user = userEvent.setup(); let reads = 0; let release: (() => void) | undefined;
    const message = "Antes de pedir la baja, cada Organización activa debe tener otra persona con el rol Dueño.";
    server.use(http.get("/api/platform/accounts/lucia", async () => {
      reads++; if (reads === 2) await new Promise<void>((resolve) => { release = resolve; });
      return HttpResponse.json(detail);
    }), http.post("/api/platform/accounts/lucia/deletion", () => HttpResponse.json({ code: "Legal.AccountDeletion.LastAdmin", detail: message }, { status: 409 })));
    renderRouteWithProviders("/plataforma/cuentas", { as: "platform-operator" }); await action(user, "Dar de baja");
    const motive = await screen.findByRole("textbox", { name: "Motivo" });
    try {
      await reason(user, "Dar de baja"); await waitFor(() => expect(release).toBeDefined());
      expect(screen.getByRole("textbox", { name: "Motivo" })).toBe(motive); expect(motive).toHaveValue("Revisión");
    } finally { await act(async () => { release?.(); }); }
    expect(await within(screen.getByRole("dialog")).findByText(message)).toBeVisible();
    expect(screen.getByRole("textbox", { name: "Motivo" })).toBe(motive); expect(motive).toHaveValue("Revisión"); expect(reads).toBe(2);
  });
  it("la relectura de fondo retenida conserva motivo y franja de la baja", async () => {
    const user = userEvent.setup(); let reads = 0; let release: (() => void) | undefined;
    server.use(http.get("/api/platform/accounts/lucia", async () => {
      reads++; if (reads === 2) await new Promise<void>((resolve) => { release = resolve; });
      return HttpResponse.json(detail);
    }), http.post("/api/platform/accounts/lucia/deletion", () => HttpResponse.json({ code: "Legal.AccountDeletion.AlreadyPending", detail: "Ya pediste la baja de tu cuenta." }, { status: 409 })));
    const { queryClient } = renderRouteWithProviders("/plataforma/cuentas", { as: "platform-operator" }); await action(user, "Dar de baja");
    const motive = await screen.findByRole("textbox", { name: "Motivo" }); await reason(user, "Dar de baja");
    const message = "Esa cuenta ya tiene la baja pedida."; expect(await screen.findByText(message)).toBeVisible();
    try {
      await act(async () => { void queryClient.invalidateQueries({ queryKey: accountQueryKey(person.id), exact: true }); });
      await waitFor(() => expect(release).toBeDefined());
      expect(screen.getByRole("textbox", { name: "Motivo" })).toBe(motive); expect(motive).toHaveValue("Revisión"); expect(screen.getByText(message)).toBeVisible();
    } finally { await act(async () => { release?.(); }); }
    await waitFor(() => expect(queryClient.getQueryState(accountQueryKey(person.id))?.fetchStatus).toBe("idle"));
    expect(screen.getByRole("textbox", { name: "Motivo" })).toBe(motive); expect(motive).toHaveValue("Revisión"); expect(screen.getByText(message)).toBeVisible(); expect(reads).toBe(2);
  });
  it("AlreadyPending traduce el error y relee al cerrar", async () => {
    const user = userEvent.setup(); let reads = 0;
    server.use(http.get("/api/platform/accounts/paged", () => { reads++; return HttpResponse.json(list()); }), http.post("/api/platform/accounts/lucia/deletion", () => HttpResponse.json({ code: "Legal.AccountDeletion.AlreadyPending", detail: "Ya pediste la baja de tu cuenta." }, { status: 409 })));
    renderRouteWithProviders("/plataforma/cuentas", { as: "platform-operator" }); await action(user, "Dar de baja"); await screen.findByRole("textbox", { name: "Motivo" }); await reason(user, "Dar de baja");
    expect(await screen.findByText("Esa cuenta ya tiene la baja pedida.")).toBeVisible(); await user.click(screen.getByRole("button", { name: "Cancelar" })); await waitFor(() => expect(reads).toBe(2));
  });
  it("si la fila deja de estar invitada desaparece un diálogo de revocación", async () => {
    const user = userEvent.setup(); let invited = true;
    server.use(http.get("/api/platform/accounts/paged", () => HttpResponse.json(list([{ ...invitation, state: invited ? "Invited" : "Active" }]))));
    const { queryClient } = renderRouteWithProviders("/plataforma/cuentas", { as: "platform-operator" }); await action(user, "Revocar invitación", "julieta@example.com");
    invited = false; await act(async () => { await queryClient.invalidateQueries({ queryKey: accountsQueryRoot }); }); await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });
  it("reenviar A, B y Retry A conserva cada clave y su aviso original", async () => {
    const user = userEvent.setup(); const other = { ...invitation, id: "other", primaryEmail: "otra@example.com" }; const requests: { id: string; key: string | null; body: string }[] = []; let reads = 0;
    server.use(http.get("/api/platform/accounts/paged", () => { reads++; return HttpResponse.json(list([invitation, other])); }), http.post("/api/platform/operators/:id/invitation/resend", async ({ request, params }) => { const id = String(params.id); requests.push({ id, key: request.headers.get("Idempotency-Key"), body: await request.text() }); return id === invitation.id && requests.filter((item) => item.id === id).length === 1 ? HttpResponse.error() : HttpResponse.json({ id, expiresAtUtc: "2026-10-08T12:00:00Z" }); }));
    renderRouteWithProviders("/plataforma/cuentas", { as: "platform-operator" }); await action(user, "Reenviar invitación", "julieta@example.com"); const retry = await screen.findByRole("button", { name: "Reintentar" });
    await action(user, "Reenviar invitación", "otra@example.com"); expect(await screen.findByText("Reenviamos la invitación a otra@example.com.")).toBeVisible(); await user.click(retry);
    expect(await screen.findByText("Reenviamos la invitación a julieta@example.com.")).toBeVisible(); expect(requests).toHaveLength(3); expect(requests[0].key).toBeTruthy(); expect(requests[1].key).not.toBe(requests[0].key); expect(requests[2]).toEqual(requests[0]); await waitFor(() => expect(reads).toBe(3));
  });
  it("Retry A sigue ejecutando éxito después de otro envío fallido de A", async () => {
    const user = userEvent.setup(); const keys: (string | null)[] = [];
    server.use(http.post("/api/platform/operators/invite/invitation/resend", ({ request }) => { keys.push(request.headers.get("Idempotency-Key")); return keys.length < 3 ? HttpResponse.error() : HttpResponse.json({ id: "invite", expiresAtUtc: "2026-10-08T12:00:00Z" }); }));
    renderRouteWithProviders("/plataforma/cuentas", { as: "platform-operator" }); await action(user, "Reenviar invitación", "julieta@example.com"); const retry = await screen.findByRole("button", { name: "Reintentar" });
    await action(user, "Reenviar invitación", "julieta@example.com"); await waitFor(() => expect(screen.getAllByRole("button", { name: "Reintentar" })).toHaveLength(2)); await user.click(retry);
    expect(await screen.findByText("Reenviamos la invitación a julieta@example.com.")).toBeVisible(); expect(keys).toEqual([keys[0], keys[0], keys[0]]);
  });
  it.each([false, true])("Request.InProgress calla intermedios y avisa una vez al agotar (observer retirado=%s)", async (detached) => {
    const user = userEvent.setup(); const keys: (string | null)[] = []; const failed = detached ? 2 : 0; let requests = 0;
    server.use(http.post("/api/platform/operators/invite/invitation/resend", ({ request }) => { keys.push(request.headers.get("Idempotency-Key")); if (keys.length <= failed) return HttpResponse.error(); requests++; return HttpResponse.json({ code: "Request.InProgress", detail: "El reenvío sigue en curso." }, { status: 409 }); }));
    renderRouteWithProviders("/plataforma/cuentas", { as: "platform-operator" }); let start: HTMLElement;
    if (detached) { await action(user, "Reenviar invitación", "julieta@example.com"); start = await screen.findByRole("button", { name: "Reintentar" }); await action(user, "Reenviar invitación", "julieta@example.com"); await waitFor(() => expect(screen.getAllByRole("button", { name: "Reintentar" })).toHaveLength(2)); }
    else { const trigger = await screen.findByRole("button", { name: "Acciones de julieta@example.com" }); trigger.focus(); await user.keyboard("{ArrowDown}"); start = screen.getByRole("menuitem", { name: "Reenviar invitación" }); }
    vi.useFakeTimers();
    try {
      await act(async () => { fireEvent.click(start); await vi.advanceTimersByTimeAsync(0); }); expect(requests).toBe(1);
      await act(async () => { await vi.advanceTimersByTimeAsync(29_000); }); expect(requests).toBe(30); expect(screen.queryByText("El reenvío sigue en curso.")).not.toBeInTheDocument();
      expect(screen.queryByRole("button", { name: "Acciones de julieta@example.com" })).not.toBeInTheDocument();
      await act(async () => { await vi.advanceTimersByTimeAsync(1_000); await vi.advanceTimersByTimeAsync(50); });
      expect(requests).toBe(31); expect(keys).toHaveLength(failed + 31); expect(new Set(keys).size).toBe(1); expect(screen.getAllByText("El reenvío sigue en curso.")).toHaveLength(1); expect(screen.getByRole("button", { name: "Acciones de julieta@example.com" })).toBeVisible();
    } finally { vi.useRealTimers(); }
  });
  it("rechazo de reenvío por estado avisa rojo y relee la lista", async () => {
    const user = userEvent.setup(); let reads = 0;
    server.use(http.get("/api/platform/accounts/paged", () => { reads++; return HttpResponse.json(list()); }), http.post("/api/platform/operators/invite/invitation/resend", () => HttpResponse.json({ code: "Platform.Operator.NoPendingInvitation", detail: "La invitación ya no está pendiente." }, { status: 409 })));
    renderRouteWithProviders("/plataforma/cuentas", { as: "platform-operator" }); await action(user, "Reenviar invitación", "julieta@example.com"); expect(await screen.findByText("La invitación ya no está pendiente.")).toBeVisible(); await waitFor(() => expect(reads).toBe(2));
  });
  it("navegar abandona Retry de reenvío sin otro POST ni aviso", async () => {
    const user = userEvent.setup(); let calls = 0;
    server.use(http.post("/api/platform/operators/invite/invitation/resend", () => { calls++; return calls === 1 ? HttpResponse.error() : HttpResponse.json({ id: "invite", expiresAtUtc: "2026-10-08T12:00:00Z" }); }));
    const { router } = renderRouteWithProviders("/plataforma/cuentas", { as: "platform-operator" }); await action(user, "Reenviar invitación", "julieta@example.com"); const retry = await screen.findByRole("button", { name: "Reintentar" });
    await act(async () => { await router.navigate("/plataforma/cuentas?kind=Person"); }); await act(async () => { fireEvent.click(retry); }); expect(calls).toBe(1); expect(screen.queryByText("Reenviamos la invitación a julieta@example.com.")).not.toBeInTheDocument();
  });
  it("revocar cancelada no cierra la siguiente confirmación ni notifica tarde", async () => {
    const user = userEvent.setup(); let release: (() => void) | undefined;
    server.use(http.delete("/api/platform/operators/invite/invitation", async () => { await new Promise<void>((resolve) => { release = resolve; }); return new HttpResponse(null, { status: 204 }); }));
    renderRouteWithProviders("/plataforma/cuentas", { as: "platform-operator" }); await action(user, "Revocar invitación", "julieta@example.com"); await user.click(screen.getByRole("button", { name: "Revocar" })); await waitFor(() => expect(release).toBeDefined()); await user.click(screen.getByRole("button", { name: "Cancelar" })); await action(user, "Revocar invitación", "julieta@example.com");
    await act(async () => { release?.(); }); expect(screen.getByRole("dialog")).toBeVisible(); expect(screen.queryByText("Revocamos la invitación a julieta@example.com.")).not.toBeInTheDocument();
  });
  it.each(["red", "5xx"] as const)("rechazo tardío %s de revocar cancelada no avisa ni afecta otra confirmación", async (failure) => {
    const user = userEvent.setup(); let release: (() => void) | undefined; let calls = 0; let reads = 0;
    server.use(http.get("/api/platform/accounts/paged", () => { reads++; return HttpResponse.json(list()); }), http.delete("/api/platform/operators/invite/invitation", async () => {
      calls++; await new Promise<void>((resolve) => { release = resolve; });
      return failure === "red" ? HttpResponse.error() : new HttpResponse(null, { status: 503 });
    }));
    const { queryClient } = renderRouteWithProviders("/plataforma/cuentas", { as: "platform-operator" }); await action(user, "Revocar invitación", "julieta@example.com"); await user.click(screen.getByRole("button", { name: "Revocar" })); await waitFor(() => expect(release).toBeDefined());
    try {
      await user.click(screen.getByRole("button", { name: "Cancelar" })); await action(user, "Revocar invitación", "julieta@example.com");
      const next = screen.getByRole("dialog"); await act(async () => { release?.(); }); await waitFor(() => expect(queryClient.isMutating()).toBe(0));
      expect(screen.getByRole("dialog")).toBe(next); expect(next).toBeVisible(); expect(calls).toBe(1); expect(reads).toBe(1);
      expect(screen.queryByText("No pudimos conectarnos. Revisá tu conexión.")).not.toBeInTheDocument(); expect(screen.queryByText("Algo salió mal. Probá de nuevo en un rato.")).not.toBeInTheDocument(); expect(screen.queryByRole("button", { name: "Reintentar" })).not.toBeInTheDocument();
    } finally { await act(async () => { release?.(); }); }
  });
  it.each([
    ["red", "URL"], ["5xx", "URL"], ["red", "elegibilidad"], ["5xx", "elegibilidad"],
  ] as const)("rechazo tardío %s de reenvío abandonado por %s no avisa ni invalida otro recorrido", async (failure, abandonment) => {
    const user = userEvent.setup(); let release: (() => void) | undefined; let calls = 0; let reads = 0; let invited = true;
    server.use(http.get("/api/platform/accounts/paged", () => { reads++; return HttpResponse.json(list([person, { ...invitation, state: invited ? "Invited" : "Active" }])); }), http.post("/api/platform/operators/invite/invitation/resend", async () => {
      calls++; await new Promise<void>((resolve) => { release = resolve; });
      return failure === "red" ? HttpResponse.error() : new HttpResponse(null, { status: 503 });
    }));
    const { router, queryClient } = renderRouteWithProviders("/plataforma/cuentas", { as: "platform-operator" }); await action(user, "Reenviar invitación", "julieta@example.com"); await waitFor(() => expect(release).toBeDefined());
    try {
      if (abandonment === "URL") await act(async () => { await router.navigate("/plataforma/cuentas?kind=Person"); });
      else { invited = false; await act(async () => { await queryClient.invalidateQueries({ queryKey: accountsQueryRoot }); }); }
      await waitFor(() => expect(reads).toBe(2)); await action(user, "Suspender"); const motive = screen.getByRole("textbox", { name: "Motivo" }); await user.type(motive, "Otro recorrido");
      await act(async () => { release?.(); }); await waitFor(() => expect(queryClient.isMutating()).toBe(0));
      expect(screen.getByRole("textbox", { name: "Motivo" })).toBe(motive); expect(motive).toHaveValue("Otro recorrido"); expect(calls).toBe(1); expect(reads).toBe(2);
      expect(screen.queryByText("No pudimos conectarnos. Revisá tu conexión.")).not.toBeInTheDocument(); expect(screen.queryByText("Algo salió mal. Probá de nuevo en un rato.")).not.toBeInTheDocument(); expect(screen.queryByRole("button", { name: "Reintentar" })).not.toBeInTheDocument();
    } finally { await act(async () => { release?.(); }); }
  });
  it.each([
    ["red", "éxito"], ["5xx", "éxito"], ["red", "LastAdmin"], ["5xx", "LastAdmin"],
  ] as const)("rechazo tardío %s de GET de baja tras %s abandonada no avisa ni altera el nuevo motivo", async (failure, result) => {
    const user = userEvent.setup(); let release: (() => void) | undefined; let details = 0; let writes = 0; let reads = 0;
    server.use(http.get("/api/platform/accounts/paged", () => { reads++; return HttpResponse.json(list()); }), http.get("/api/platform/accounts/lucia", async () => {
      details++; if (details === 1) return HttpResponse.json(detail);
      await new Promise<void>((resolve) => { release = resolve; }); return failure === "red" ? HttpResponse.error() : new HttpResponse(null, { status: 503 });
    }), http.post("/api/platform/accounts/lucia/deletion", () => {
      writes++; return result === "LastAdmin" ? HttpResponse.json({ code: "Legal.AccountDeletion.LastAdmin", detail: "Hace falta otro Dueño." }, { status: 409 }) : new HttpResponse(null, { status: 204 });
    }));
    const { router, queryClient } = renderRouteWithProviders("/plataforma/cuentas", { as: "platform-operator" }); await action(user, "Dar de baja"); await screen.findByRole("textbox", { name: "Motivo" }); await reason(user, "Dar de baja"); await waitFor(() => expect(release).toBeDefined());
    try {
      if (result === "LastAdmin") await act(async () => { await router.navigate("/plataforma/cuentas?kind=Person"); });
      else await user.click(screen.getByRole("button", { name: "Cancelar" }));
      await action(user, "Suspender"); const motive = screen.getByRole("textbox", { name: "Motivo" }); await user.type(motive, "Otro motivo");
      await act(async () => { release?.(); }); await waitFor(() => expect(queryClient.isMutating()).toBe(0));
      expect(screen.getByRole("textbox", { name: "Motivo" })).toBe(motive); expect(motive).toHaveValue("Otro motivo"); expect(writes).toBe(1); expect(details).toBe(2); expect(reads).toBe(result === "LastAdmin" ? 2 : 1);
      expect(screen.queryByText("No pudimos conectarnos. Revisá tu conexión.")).not.toBeInTheDocument(); expect(screen.queryByText("Algo salió mal. Probá de nuevo en un rato.")).not.toBeInTheDocument(); expect(screen.queryByRole("button", { name: "Reintentar" })).not.toBeInTheDocument();
    } finally { await act(async () => { release?.(); }); }
  });
  it.each(["revocar", "fecha de baja", "LastAdmin"] as const)("rechazo activo 5xx de %s conserva el aviso genérico", async (operation) => {
    const user = userEvent.setup(); let details = 0;
    server.use(http.delete("/api/platform/operators/invite/invitation", () => new HttpResponse(null, { status: 503 })), http.get("/api/platform/accounts/lucia", () => {
      details++; return details === 1 ? HttpResponse.json(detail) : new HttpResponse(null, { status: 503 });
    }), http.post("/api/platform/accounts/lucia/deletion", () => operation === "LastAdmin" ? HttpResponse.json({ code: "Legal.AccountDeletion.LastAdmin", detail: "Hace falta otro Dueño." }, { status: 409 }) : new HttpResponse(null, { status: 204 })));
    const { queryClient } = renderRouteWithProviders("/plataforma/cuentas", { as: "platform-operator" });
    if (operation === "revocar") { await action(user, "Revocar invitación", "julieta@example.com"); await user.click(screen.getByRole("button", { name: "Revocar" })); }
    else { await action(user, "Dar de baja"); await screen.findByRole("textbox", { name: "Motivo" }); await reason(user, "Dar de baja"); }
    expect(await screen.findByText("Algo salió mal. Probá de nuevo en un rato.")).toBeVisible(); await waitFor(() => expect(queryClient.isMutating()).toBe(0));
    expect(screen.getAllByText("Algo salió mal. Probá de nuevo en un rato.")).toHaveLength(1); expect(screen.getByRole("dialog")).toBeVisible();
    if (operation !== "revocar") expect(screen.getByRole("textbox", { name: "Motivo" })).toHaveValue("Revisión");
  });
  it("filtros cruzados, búsqueda y orden viven en la URL; la banda conserva totales globales", async () => {
    const user = userEvent.setup(); const requested: Record<string, string>[] = []; const crossed = { total: 99, states: [{ state: "Active", count: 3 }, { state: "Suspended", count: 2 }], kinds: [{ kind: "Person", count: 8 }, { kind: "Operator", count: 4 }] };
    server.use(http.get("/api/platform/accounts/filter-counts", ({ request }) => HttpResponse.json(new URL(request.url).search ? crossed : counts)), http.get("/api/platform/accounts/paged", ({ request }) => { requested.push(Object.fromEntries(new URL(request.url).searchParams)); return HttpResponse.json(list([person])); }));
    const { router } = renderRouteWithProviders("/plataforma/cuentas?kind=Person&state=Active&search=lucia", { as: "platform-operator" }); await screen.findByRole("link", { name: "Lucía Fernández" });
    expect(await screen.findByText("11 cuentas · 1 suspendida")).toBeVisible(); const state = screen.getByRole("button", { name: "Activas" }); state.focus(); await user.keyboard("{ArrowDown}");
    expect(screen.getByRole("menuitemradio", { name: /^Todos/ })).toHaveTextContent("5"); expect(screen.getByRole("menuitemradio", { name: /^Suspendidas/ })).toHaveTextContent("2"); await user.click(screen.getByRole("menuitemradio", { name: /^Suspendidas/ }));
    await waitFor(() => expect(requested.at(-1)).toMatchObject({ kind: "Person", state: "Suspended", search: "lucia" })); expect(router.state.location.search).toContain("state=Suspended");
    await user.click(screen.getByRole("button", { name: /Último ingreso/ })); await waitFor(() => expect(requested.at(-1)?.sort).toBe("lastSignInAtUtc"));
    await user.click(screen.getByRole("button", { name: "Limpiar" })); await waitFor(() => expect(router.state.location.search).not.toMatch(/kind=|state=|search=/));
  });
  it.each([1, 50])("%s filas del servidor, sin recortar ni paginar en cliente", async (size) => {
    const rows = Array.from({ length: size }, (_, index) => ({ ...person, id: String(index), displayName: `Persona ${index}` }));
    server.use(http.get("/api/platform/accounts/paged", () => HttpResponse.json({ ...list(rows), pageSize: size === 50 ? 50 : 10 })));
    renderRouteWithProviders(`/plataforma/cuentas${size === 50 ? "?pageSize=50" : ""}`, { as: "platform-operator" }); await screen.findByRole("link", { name: "Persona 0" }); expect(within(screen.getByRole("table")).getAllByRole("row")).toHaveLength(size + 1);
  });
  it("accounts.manage y operators.manage ofrecen sólo sus acciones", async () => {
    const user = userEvent.setup(); const { queryClient } = renderRouteWithProviders("/plataforma/cuentas", { as: "platform-operator" }); await screen.findByRole("link", { name: "Lucía Fernández" });
    await act(async () => { queryClient.setQueryData(currentUserQueryKey, { ...platformOperator, effectivePermissions: { platform: ["platform.accounts.read", "platform.accounts.manage"], organization: [], companies: {} } }); });
    await waitFor(() => expect(screen.queryByRole("button", { name: "Invitar operador" })).not.toBeInTheDocument()); expect(screen.queryByRole("button", { name: "Acciones de julieta@example.com" })).not.toBeInTheDocument(); await action(user, "Suspender"); await user.click(screen.getByRole("button", { name: "Cancelar" }));
    await act(async () => { queryClient.setQueryData(currentUserQueryKey, { ...platformOperator, effectivePermissions: { platform: ["platform.accounts.read", "platform.operators.manage"], organization: [], companies: {} } }); });
    expect(await screen.findByRole("button", { name: "Invitar operador" })).toBeVisible(); expect(screen.queryByRole("button", { name: "Acciones de Lucía Fernández" })).not.toBeInTheDocument(); await action(user, "Revocar invitación", "julieta@example.com");
  });
  it("sin accounts.read no consulta el listado", async () => {
    let reads = 0; server.use(http.get("/api/platform/accounts/paged", () => { reads++; return HttpResponse.json(list()); }));
    const { queryClient } = renderRouteWithProviders("/plataforma/cuentas", { as: "platform-operator" });
    const account = { ...platformOperator, effectivePermissions: { platform: [], organization: [], companies: {} } };
    server.use(meHandlerFor(account)); await act(async () => { await queryClient.cancelQueries({ queryKey: currentUserQueryKey }); queryClient.setQueryData(currentUserQueryKey, account); });
    expect(await screen.findByRole("heading", { name: "No tenés permiso para ver esta página" })).toBeVisible(); expect(reads).toBe(0);
  });
  it("en-US traduce estados, perfiles, métodos y confirmaciones", async () => {
    const user = userEvent.setup(); const { queryClient } = renderRouteWithProviders("/plataforma/cuentas", { as: "platform-operator" }); await screen.findByRole("link", { name: "Lucía Fernández" });
    await act(async () => { queryClient.setQueryData(currentUserQueryKey, { ...platformOperator, culture: "en-US" }); });
    expect(await screen.findByRole("heading", { name: "Accounts" })).toBeVisible(); expect(screen.getByText("Personal + 2 organizations")).toBeVisible(); expect(screen.getByText("Email code")).toBeVisible(); expect(screen.getByText("Invitation pending")).toBeVisible();
    const trigger = screen.getByRole("button", { name: "Actions for Lucía Fernández" }); trigger.focus(); await user.keyboard("{ArrowDown}"); await user.click(screen.getByRole("menuitem", { name: "Suspend" })); expect(screen.getByRole("dialog")).toHaveTextContent("Suspend the account for Lucía Fernández?");
  });
  it("invitar corregido o cancelado genera otra clave y un Retry viejo no cierra el formulario nuevo", async () => {
    const user = userEvent.setup(); const requests: { key: string | null; body: unknown }[] = [];
    server.use(http.post("/api/platform/operators/invitations", async ({ request }) => { requests.push({ key: request.headers.get("Idempotency-Key"), body: await request.json() }); return HttpResponse.error(); }));
    renderRouteWithProviders("/plataforma/cuentas", { as: "platform-operator" }); await user.click(await screen.findByRole("button", { name: "Invitar operador" }));
    const email = screen.getByRole("textbox", { name: "Correo" }); await user.type(email, "a@example.com"); await user.click(screen.getByRole("button", { name: "Invitar" })); const oldRetry = await screen.findByRole("button", { name: "Reintentar" });
    await user.clear(email); await user.type(email, "b@example.com"); await user.click(screen.getByRole("button", { name: "Invitar" })); await waitFor(() => expect(requests).toHaveLength(2)); expect(requests[1].key).not.toBe(requests[0].key);
    await user.click(screen.getByRole("button", { name: "Cancelar" })); await user.click(screen.getByRole("button", { name: "Invitar operador" }));
    await act(async () => { fireEvent.click(oldRetry); }); expect(requests).toHaveLength(2); expect(screen.getByRole("dialog")).toBeVisible(); expect(screen.getByRole("textbox", { name: "Correo" })).toHaveValue("");
    await user.type(screen.getByRole("textbox", { name: "Correo" }), "b@example.com"); await user.click(screen.getByRole("button", { name: "Invitar" })); await waitFor(() => expect(requests).toHaveLength(3)); expect(requests[2].key).not.toBe(requests[1].key);
  });
  it("un POST de invitar cancelado no avisa ni cierra una nueva invitación", async () => {
    const user = userEvent.setup(); let release: (() => void) | undefined;
    server.use(http.post("/api/platform/operators/invitations", async () => { await new Promise<void>((resolve) => { release = resolve; }); return HttpResponse.json({ id: "new", expiresAtUtc: "2026-10-08T12:00:00Z" }, { status: 201 }); }));
    renderRouteWithProviders("/plataforma/cuentas", { as: "platform-operator" }); await user.click(await screen.findByRole("button", { name: "Invitar operador" })); await user.type(screen.getByRole("textbox", { name: "Correo" }), "a@example.com"); await user.click(screen.getByRole("button", { name: "Invitar" }));
    await waitFor(() => expect(release).toBeDefined()); await user.click(screen.getByRole("button", { name: "Cancelar" })); await user.click(screen.getByRole("button", { name: "Invitar operador" }));
    await act(async () => { release?.(); }); expect(screen.getByRole("dialog")).toBeVisible(); expect(screen.queryByText("Invitamos a a@example.com como operador.")).not.toBeInTheDocument();
  });
  it("un reenvío tardío no avisa ni invalida otro recorrido", async () => {
    const user = userEvent.setup(); let release: (() => void) | undefined; let reads = 0;
    server.use(http.get("/api/platform/accounts/paged", () => { reads++; return HttpResponse.json(list()); }), http.post("/api/platform/operators/invite/invitation/resend", async () => { await new Promise<void>((resolve) => { release = resolve; }); return HttpResponse.json({ id: "invite", expiresAtUtc: "2026-10-08T12:00:00Z" }); }));
    const { router } = renderRouteWithProviders("/plataforma/cuentas", { as: "platform-operator" }); await action(user, "Reenviar invitación", "julieta@example.com"); await waitFor(() => expect(release).toBeDefined());
    await act(async () => { await router.navigate("/plataforma/cuentas?kind=Person"); }); await waitFor(() => expect(reads).toBe(2)); await act(async () => { release?.(); }); expect(reads).toBe(2); expect(screen.queryByText("Reenviamos la invitación a julieta@example.com.")).not.toBeInTheDocument();
  });
  it("red en motivo usa Retry nativo con el mismo cuerpo y clave y cierra tras éxito", async () => {
    const user = userEvent.setup(); const requests: { key: string | null; body: unknown }[] = [];
    server.use(http.post("/api/platform/accounts/lucia/suspend", async ({ request }) => { requests.push({ key: request.headers.get("Idempotency-Key"), body: await request.json() }); return requests.length === 1 ? HttpResponse.error() : new HttpResponse(null, { status: 204 }); }));
    renderRouteWithProviders("/plataforma/cuentas", { as: "platform-operator" }); await action(user, "Suspender"); await reason(user, "Suspender"); fireEvent.click(await screen.findByRole("button", { name: "Reintentar" }));
    expect(await screen.findByText("Suspendimos la cuenta de Lucía Fernández.")).toBeVisible(); await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument()); expect(requests).toHaveLength(2); expect(requests[0].key).toBeTruthy(); expect(requests[1]).toEqual(requests[0]);
  });
  it("una acción que ya no admite el estado nuevo abandona la confirmación", async () => {
    const user = userEvent.setup(); let state: Account["state"] = "Active";
    server.use(http.get("/api/platform/accounts/paged", () => HttpResponse.json(list([{ ...person, state }]))));
    const { queryClient } = renderRouteWithProviders("/plataforma/cuentas", { as: "platform-operator" }); await action(user, "Suspender"); state = "Suspended";
    await act(async () => { await queryClient.invalidateQueries({ queryKey: accountsQueryRoot }); }); await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });
  it("perder operators.manage abandona Invitar y devolverlo no lo reabre", async () => {
    const user = userEvent.setup(); const { queryClient } = renderRouteWithProviders("/plataforma/cuentas", { as: "platform-operator" }); await user.click(await screen.findByRole("button", { name: "Invitar operador" }));
    await act(async () => { queryClient.setQueryData(currentUserQueryKey, { ...platformOperator, effectivePermissions: { platform: ["platform.accounts.read"], organization: [], companies: {} } }); }); await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    await act(async () => { queryClient.setQueryData(currentUserQueryKey, platformOperator); }); await screen.findByRole("button", { name: "Invitar operador" }); expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
  it("invitar a390 mantiene formulario y nueve descripciones accesibles", async () => {
    asPhone(); const user = userEvent.setup(); renderRouteWithProviders("/plataforma/cuentas", { as: "platform-operator" }); await user.click(await screen.findByRole("button", { name: "Invitar operador" }));
    expect(await axe(document.body)).toHaveNoViolations(); const permissions = screen.getByRole("button", { name: "Permisos de plataforma" }); permissions.focus(); await user.keyboard("{ArrowDown}"); expect(await screen.findAllByRole("menuitemcheckbox")).toHaveLength(9); expect(await axe(screen.getByRole("menu"))).toHaveNoViolations();
  });
  it("dejar de estar invitada retira para siempre Retry viejo aunque la fila vuelva a Invited", async () => {
    const user = userEvent.setup(); let state: Account["state"] = "Invited"; let calls = 0;
    server.use(http.get("/api/platform/accounts/paged", () => HttpResponse.json(list([{ ...invitation, state }]))), http.post("/api/platform/operators/invite/invitation/resend", () => { calls++; return calls === 1 ? HttpResponse.error() : HttpResponse.json({ id: "invite", expiresAtUtc: "2026-10-08T12:00:00Z" }); }));
    const { queryClient } = renderRouteWithProviders("/plataforma/cuentas", { as: "platform-operator" }); await action(user, "Reenviar invitación", "julieta@example.com"); const retry = await screen.findByRole("button", { name: "Reintentar" });
    state = "Active"; await act(async () => { await queryClient.invalidateQueries({ queryKey: accountsQueryRoot }); }); await screen.findByText("Activa");
    state = "Invited"; await act(async () => { await queryClient.invalidateQueries({ queryKey: accountsQueryRoot }); }); await screen.findByText("Invitación pendiente");
    await act(async () => { fireEvent.click(retry); }); expect(calls).toBe(1); expect(screen.queryByText("Reenviamos la invitación a julieta@example.com.")).not.toBeInTheDocument();
  });
  it("editar el correo abandona Retry A aun sin cerrar el mismo diálogo", async () => {
    const user = userEvent.setup(); const requests: unknown[] = [];
    server.use(http.post("/api/platform/operators/invitations", async ({ request }) => { requests.push(await request.json()); return requests.length === 1 ? HttpResponse.error() : HttpResponse.json({ id: "new", expiresAtUtc: "2026-10-08T12:00:00Z" }, { status: 201 }); }));
    renderRouteWithProviders("/plataforma/cuentas", { as: "platform-operator" }); await user.click(await screen.findByRole("button", { name: "Invitar operador" })); const email = screen.getByRole("textbox", { name: "Correo" });
    await user.type(email, "a@example.com"); await user.click(screen.getByRole("button", { name: "Invitar" })); const retryA = await screen.findByRole("button", { name: "Reintentar" });
    await user.clear(email); await user.type(email, "b@example.com"); await act(async () => { fireEvent.click(retryA); });
    expect(requests).toHaveLength(1); expect(screen.getByRole("dialog")).toBeVisible(); expect(email).toHaveValue("b@example.com"); expect(screen.queryByText("Invitamos a a@example.com como operador.")).not.toBeInTheDocument();
  });
  it.each([false, true])("editar permisos abandona la respuesta de A pendiente (error=%s)", async (failed) => {
    const user = userEvent.setup(); let release: (() => void) | undefined;
    server.use(http.post("/api/platform/operators/invitations", async () => { await new Promise<void>((resolve) => { release = resolve; }); return failed ? HttpResponse.json({ code: "Platform.Operator.PermissionsRequired" }, { status: 400 }) : HttpResponse.json({ id: "new", expiresAtUtc: "2026-10-08T12:00:00Z" }, { status: 201 }); }));
    renderRouteWithProviders("/plataforma/cuentas", { as: "platform-operator" }); await user.click(await screen.findByRole("button", { name: "Invitar operador" })); await user.type(screen.getByRole("textbox", { name: "Correo" }), "a@example.com"); await user.click(screen.getByRole("button", { name: "Invitar" })); await waitFor(() => expect(release).toBeDefined());
    screen.getByRole("button", { name: "Permisos de plataforma" }).focus(); await user.keyboard("{ArrowDown}"); await user.click(screen.getByRole("menuitemcheckbox", { name: "Ver cuentas" })); await user.keyboard("{Escape}");
    await act(async () => { release?.(); }); expect(screen.getByRole("dialog")).toBeVisible(); expect(screen.queryByText("Invitamos a a@example.com como operador.")).not.toBeInTheDocument(); expect(screen.queryByText("Elegí al menos un permiso de plataforma.")).not.toBeInTheDocument();
  });
});
