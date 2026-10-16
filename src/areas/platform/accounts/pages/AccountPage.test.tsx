import { act, fireEvent, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import { currentUserQueryKey } from "@/auth/useCurrentUser";
import type { ApiSchemas } from "@/shared/api/types";
import { changeCulture, configureI18n } from "@/shared/i18n";
import { platformOperator } from "@/test/mocks/currentUsers";
import { meHandlerFor, referenceDataFixture } from "@/test/mocks/handlers";
import { platformAccountDetailFixture } from "@/test/mocks/platformAccountDetail";
import { server } from "@/test/mocks/server";
import { asPhone } from "@/test/utils/phone";
import { renderRouteWithProviders } from "@/test/utils/renderWithProviders";
import { accountQueryKey } from "../api/accounts";

type Detail = ApiSchemas["PlatformAccountDetailResponse"];
let data: Detail;
let reads: number;
const open = () => renderRouteWithProviders(`/plataforma/cuentas/${data.id}`, { as: "platform-operator" });
async function menu(user: ReturnType<typeof userEvent.setup>, label: string) {
  const trigger = await screen.findByRole("button", { name: `Acciones de ${data.displayName || data.maskedPrimaryPhone || data.primaryEmail || "Sin dato"}` });
  trigger.focus(); await user.keyboard("{ArrowDown}"); await user.click(await screen.findByRole("menuitem", { name: label }));
}
async function reason(user: ReturnType<typeof userEvent.setup>, label: string) {
  await user.type(screen.getByRole("textbox", { name: "Motivo" }), "Revisión");
  await user.click(within(screen.getByRole("dialog")).getByRole("button", { name: label }));
}
beforeAll(async () => { await import("./AccountPage"); });
beforeEach(async () => {
  await configureI18n(referenceDataFixture().cultures); await changeCulture("es-AR");
  data = { ...platformAccountDetailFixture(), soleOwnerOrganizations: [] }; reads = 0;
  server.use(http.get("/api/platform/accounts/:id", () => { reads++; return HttpResponse.json(data); }),
    http.get("/api/platform/audit", () => HttpResponse.json({ items: [], hasMore: false, nextCursor: null })));
});
afterEach(() => { vi.unstubAllGlobals(); vi.useRealTimers(); });

describe("Ficha de Cuenta de Plataforma", () => {
  it.each([
    ["Persona", "Cerrar sesiones", "¿Cerrar las sesiones de Sin dato?"],
    ["Persona", "Dar de baja", "¿Dar de baja la cuenta de Sin dato?"],
    ["Persona suspendida", "Reactivar", "¿Reactivar la cuenta de Sin dato?"],
    ["Operador", "Cambiar permisos", "Cambiar permisos de Sin dato"],
    ["Operador", "Quitar operador", "¿Quitar a Sin dato como operador?"],
    ["Operador", "Restablecer el autenticador", "¿Restablecer el autenticador de Sin dato?"],
    ["Invitación de operador pendiente", "Revocar invitación", "¿Revocar la invitación a Sin dato?"],
  ])("%s sin identidad conserva el título de %s", async (kind, action, title) => {
    data = { ...platformAccountDetailFixture({ kind, state: kind === "Persona suspendida" ? "Suspendida" : "Activa" }), displayName: null, primaryEmail: null, soleOwnerOrganizations: [] };
    const user = userEvent.setup(); const { container } = open();
    await screen.findByRole("heading", { name: "Sin dato", level: 1 });
    if (["Reactivar", "Cerrar sesiones", "Cambiar permisos"].includes(action)) await user.click(screen.getByRole("button", { name: action }));
    else await menu(user, action);
    expect(await screen.findByRole("dialog")).toHaveAccessibleName(title);
    if (action === "Dar de baja") await screen.findByRole("textbox", { name: "Motivo" });
    expect(await axe(container)).toHaveNoViolations();
  });
  it.each([
    ["es-AR", false, "•••• 4521", "Acciones de •••• 4521", "Suspender", "¿Suspender la cuenta de •••• 4521?", "Suspendimos la cuenta de •••• 4521.", "Motivo", "Migas de pan"],
    ["en-US", false, "•••• 4521", "Actions for •••• 4521", "Suspend", "Suspend the account for •••• 4521?", "We suspended the account for •••• 4521.", "Reason", "Breadcrumb"],
    ["es-AR", true, "•••• 4521", "Acciones de •••• 4521", "Suspender", "¿Suspender la cuenta de •••• 4521?", "Suspendimos la cuenta de •••• 4521.", "Motivo", "Migas de pan"],
    ["en-US", true, "•••• 4521", "Actions for •••• 4521", "Suspend", "Suspend the account for •••• 4521?", "We suspended the account for •••• 4521.", "Reason", "Breadcrumb"],
  ] as const)("Phone principal sin nombre: %s móvil=%s identifica título, acciones y aviso", async (culture, phone, empty, actions, suspend, title, notice, reasonLabel, breadcrumbs) => {
    if (phone) asPhone();
    data = { ...data, displayName: null, primaryEmail: "respaldo@example.test", maskedPrimaryPhone: "•••• 4521", loginMethods: [
      { ...data.loginMethods[1], type: "Phone", maskedValue: "•••• 4521", isPrimary: true, canSignIn: true },
      { ...data.loginMethods[2], isPrimary: false },
    ] };
    server.use(http.post("/api/platform/accounts/:id/suspend", () => new HttpResponse(null, { status: 204 })));
    const user = userEvent.setup(); const { container, queryClient } = open();
    await screen.findByRole("heading", { name: "•••• 4521", level: 1 });
    if (culture === "en-US") {
      await act(async () => { queryClient.setQueryData(currentUserQueryKey, { ...platformOperator, culture }); });
      await waitFor(() => expect(reads).toBeGreaterThan(1));
      await waitFor(() => expect(queryClient.isFetching({ queryKey: accountQueryKey(data.id) })).toBe(0));
    }
    expect(await screen.findByRole("heading", { name: empty, level: 1 })).toBeVisible();
    if (!phone) expect(screen.getByRole("navigation", { name: breadcrumbs })).toHaveTextContent(empty);
    const trigger = screen.getByRole("button", { name: actions });
    if (phone) { trigger.focus(); await user.keyboard("{ArrowDown}"); await user.click(await screen.findByRole("menuitem", { name: suspend })); }
    else await user.click(screen.getByRole("button", { name: suspend }));
    expect(screen.getByRole("dialog", { name: title })).toBeVisible();
    await user.type(screen.getByRole("textbox", { name: reasonLabel }), "Revisión");
    await user.click(within(screen.getByRole("dialog")).getByRole("button", { name: suspend }));
    expect(await screen.findByText(notice)).toBeVisible();
    expect(within(screen.getByRole("tabpanel")).getByText("•••• 4521")).toBeVisible();
    expect(container).not.toHaveTextContent("+5491112344521");
    expect(await axe(container)).toHaveNoViolations();
  });
  it("banda, métodos enmascarados, grupos con cantidad y axe", async () => {
    const { container } = open();
    expect(await screen.findByRole("heading", { name: "Lucía Fernández", level: 1 })).toBeVisible();
    expect(screen.getByRole("link", { name: "Volver a Cuentas" })).toHaveAttribute("href", "/plataforma/cuentas");
    expect(await screen.findByText("lu•••@delta.ejemplo.com")).toBeVisible();
    expect(screen.getByText("•••• 4521")).toBeVisible(); expect(screen.getByText(/Principal/)).toBeVisible();
    expect(screen.queryByText("lucia.fer@gmail.com")).not.toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Métodos de ingreso 3" })).toBeVisible();
    expect(screen.getByRole("tab", { name: "Historial de seguridad" })).toBeVisible();
    expect(await axe(container)).toHaveNoViolations();
  });
  it.each([
    ["Activa", ["Cerrar sesiones", "Suspender"], null],
    ["Suspendida", ["Cerrar sesiones", "Reactivar"], "Suspendida el"],
    ["Necesita recuperación", ["Cerrar sesiones", "Suspender"], "Necesita recuperación."],
    ["Baja pedida", [], "Pidió la baja el"],
    ["Baja iniciada por la plataforma", [], "La plataforma inició la baja el"],
    ["Eliminada", [], null],
  ] as const)("estado %s conserva evidencia y acciones", async (state, actions, banner) => {
    data = platformAccountDetailFixture({ state }); open();
    await screen.findByRole("heading", { name: data.displayName!, level: 1 });
    for (const label of ["Cerrar sesiones", "Suspender", "Reactivar"]) {
      expect(Boolean(screen.queryByRole("button", { name: label }))).toBe(actions.includes(label as never));
    }
    if (banner) expect(screen.getByText(new RegExp(banner))).toBeVisible();
    if (state.startsWith("Baja") || state === "Eliminada") expect(screen.queryByRole("button", { name: `Acciones de ${data.displayName}` })).not.toBeInTheDocument();
    if (state === "Necesita recuperación") {
      expect(screen.getByText(/Kappa S.R.L. y la membresía terminó el/)).toBeVisible();
      expect(screen.getByRole("link", { name: "Ver recuperaciones" })).toHaveAttribute("href", "/plataforma/recuperaciones");
      expect(screen.getByText("Ya no sirve para ingresar")).toBeVisible();
    }
    if (state === "Eliminada") expect(screen.getByText("No tiene métodos de ingreso.")).toBeVisible();
  });
  it.each(["terminadas", "activa y terminada"] as const)("recuperación con organizaciones homónimas %s no atribuye una fecha ajena", async (memberships) => {
    data = platformAccountDetailFixture({ state: "Necesita recuperación" });
    const original = { ...data.organizations[0], endedAtUtc: "2026-09-20T13:00:00Z" };
    data.organizations = [original, { ...original, tenantId: "tenant-kappa-homonima", status: memberships === "terminadas" ? "Inactive" : "Active", endedAtUtc: memberships === "terminadas" ? "2026-09-25T13:00:00Z" : null }];
    open(); await screen.findByRole("heading", { name: "Pablo Ortiz", level: 1 });
    expect(screen.getByText(/Su único método de ingreso/)).toHaveTextContent("la membresía terminó el —.");
    expect(screen.queryByText("20/09/2026")).not.toBeInTheDocument(); expect(screen.queryByText("25/09/2026")).not.toBeInTheDocument();
  });
  it("recuperación con una sola organización coincidente terminada conserva su fecha", async () => {
    data = platformAccountDetailFixture({ state: "Necesita recuperación" });
    data.organizations.push({ ...data.organizations[0], tenantId: "tenant-otra", name: "Otra", endedAtUtc: "2026-09-25T13:00:00Z" });
    open(); await screen.findByRole("heading", { name: "Pablo Ortiz", level: 1 });
    expect(screen.getByText(/Su único método de ingreso/)).toHaveTextContent("la membresía terminó el 20/09/2026.");
  });
  it("organizaciones: nombre traducido por API, null vacío, estados de membresía y vínculo", async () => {
    data.organizations.push({ ...data.organizations[0], tenantId: "ended", name: "Terminada", status: "Removed" });
    const user = userEvent.setup(); open(); await user.click(await screen.findByRole("tab", { name: "Organizaciones 3" }));
    expect(screen.getByRole("link", { name: "Grupo Delta" })).toHaveAttribute("href", "/plataforma/organizaciones/tenant-1");
    expect(screen.getAllByText("Dueño")).toHaveLength(2); expect(screen.queryByText("TenantAdmin")).not.toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Desde" })).toBeVisible(); expect(screen.getByText("Terminada", { selector: "span" })).toBeVisible();
  });
  it("historial usa summary y cursor sin total ni códigos técnicos", async () => {
    const urls: URL[] = []; server.use(http.get("/api/platform/audit", ({ request }) => {
      const url = new URL(request.url); urls.push(url); const next = url.searchParams.has("after");
      return HttpResponse.json({ items: [{ id: next ? "2" : "1", occurredAtUtc: "2026-09-27T12:02:00Z", type: "accounts", action: "SignIn", summary: next ? "Cambió un método de ingreso" : "Ingresó con código por correo", target: "Lucía", actor: "Lu•••", actorRole: "Persona", reason: null }], nextCursor: next ? null : "opaque&cursor", hasMore: !next });
    }));
    const user = userEvent.setup(); open(); await user.click(await screen.findByRole("tab", { name: "Historial de seguridad" }));
    expect(await screen.findByText("Ingresó con código por correo")).toBeVisible(); expect(screen.queryByText("SignIn")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Cargar más" })); expect(await screen.findByText("Cambió un método de ingreso")).toBeVisible();
    expect(Object.fromEntries(urls[0].searchParams)).toEqual({ accountId: data.id, period: "all", limit: "50" });
    expect(urls[1].searchParams.get("after")).toBe("opaque&cursor");
  });
  it("sin audit.read no consulta historial y propia cuenta es de lectura", async () => {
    let history = 0; const { queryClient } = open();
    await screen.findByRole("heading", { name: "Lucía Fernández", level: 1 });
    server.use(http.get("/api/platform/audit", () => { history++; return HttpResponse.json({ items: [], hasMore: false }); }));
    act(() => queryClient.setQueryData(currentUserQueryKey, { ...platformOperator, id: data.id, effectivePermissions: { ...platformOperator.effectivePermissions, platform: ["platform.accounts.read"] } }));
    await waitFor(() => expect(screen.queryByRole("tab", { name: "Historial de seguridad" })).not.toBeInTheDocument());
    expect(screen.queryByRole("button", { name: "Suspender" })).not.toBeInTheDocument(); expect(history).toBe(0);
  });
  it("390: barra con acciones, métodos con tipo/verificación/estado, axe", async () => {
    asPhone(); const { container } = open(); await screen.findByRole("heading", { name: "Lucía Fernández", level: 1 });
    expect(screen.getByRole("button", { name: "Acciones de Lucía Fernández" })).toBeVisible();
    expect(screen.getByText(/Administrado por Grupo Delta · verificado el/)).toBeVisible();
    expect(screen.getAllByText("Sirve para ingresar")).toHaveLength(2); expect(screen.getByText("Ya no sirve para ingresar")).toBeVisible(); expect(screen.getByText("WhatsApp")).toBeVisible();
    expect(await axe(container)).toHaveNoViolations();
  });
  it.each([404, 500])("carga %s se muestra en su pantalla y permite volver", async (status) => {
    server.use(http.get("/api/platform/accounts/:id", () => HttpResponse.json({ code: status === 404 ? "Users.User.NotFound" : "Unexpected", traceId: "test" }, { status })));
    open(); expect(await screen.findByRole("heading", { name: status === 404 ? "No encontramos esta página" : "No pudimos abrir esta pantalla" })).toBeVisible();
  });
  it("cambio de operador PUT envía versión/motivo/permisos y DELETE toma la respuesta propia aun con relectura distinta", async () => {
    data = platformAccountDetailFixture({ kind: "Operador" }); const received: { body: unknown; key: string | null }[] = [];
    server.use(http.put("/api/platform/accounts/:id/operator", async ({ request }) => { received.push({ body: await request.json(), key: request.headers.get("Idempotency-Key") }); data = { ...data, operatorVersion: 99 }; return HttpResponse.json({ version: 2 }); }),
      http.delete("/api/platform/accounts/:id/operator", async ({ request }) => { received.push({ body: await request.json(), key: request.headers.get("Idempotency-Key") }); return HttpResponse.json({ code: "Platform.Operator.LastManager", detail: "Tiene que quedar al menos un operador activo que pueda administrar operadores." }, { status: 409 }); }));
    const user = userEvent.setup(); open(); await screen.findByRole("heading", { name: "Laura Díaz", level: 1 });
    expect(screen.queryByRole("tab", { name: /Métodos/ })).not.toBeInTheDocument();
    expect(screen.getAllByText(/Ver organizaciones/)).not.toHaveLength(0);
    await user.click(screen.getByRole("button", { name: "Cambiar permisos" }));
    expect(screen.getByRole("button", { name: "Guardar cambios" })).toBeDisabled();
    await user.type(screen.getByRole("textbox", { name: "Motivo" }), "Revisión");
    await user.click(screen.getByRole("button", { name: "Guardar cambios" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument()); await waitFor(() => expect(reads).toBeGreaterThan(1));
    await menu(user, "Quitar operador"); await reason(user, "Quitar");
    expect(await screen.findByText("Tiene que quedar al menos un operador activo que pueda administrar operadores.")).toBeVisible();
    expect(received.map((r) => r.body)).toEqual([{ version: 1, reason: "Revisión", permissions: data.operatorPermissions }, { version: 2, reason: "Revisión" }]);
    expect(received.every((r) => r.key)).toBe(true);
  });
  // R03 (ADR 0048): «Cambiar permisos» ofrece el catálogo compuesto, núcleo y módulos instalados, y guarda los de un módulo.
  it("cambiar permisos ofrece los catorce y guarda uno de un módulo", async () => {
    data = platformAccountDetailFixture({ kind: "Operador" }); const bodies: unknown[] = [];
    server.use(http.put("/api/platform/accounts/:id/operator", async ({ request }) => { bodies.push(await request.json()); return HttpResponse.json({ version: 2 }); }));
    const user = userEvent.setup(); open(); await user.click(await screen.findByRole("button", { name: "Cambiar permisos" }));
    const permissions = screen.getByRole("button", { name: "Permisos de plataforma" }); permissions.focus(); await user.keyboard("{ArrowDown}");
    const options = await screen.findAllByRole("menuitemcheckbox");
    expect(options).toHaveLength(14); expect(options.at(-1)).toHaveAccessibleName("Cambiar la configuración");
    await user.click(screen.getByRole("menuitemcheckbox", { name: "Usar el asistente de Plataforma" })); await user.keyboard("{Escape}");
    await reason(user, "Guardar cambios");
    await waitFor(() => expect(bodies).toHaveLength(1));
    expect(bodies[0]).toEqual({ version: 1, reason: "Revisión", permissions: [...(data.operatorPermissions ?? []), "platform.assistant.use"] });
  });
  // F3 (Etapa 9, tablero Cuenta-Plat): «Restablecer el autenticador» de otro operador, con motivo y la versión de cuando se
  // abrió el diálogo; después se vuelven a leer la cuenta, la lista y la auditoría.
  it("restablecer el autenticador manda versión y motivo, avisa y vuelve a leer la cuenta", async () => {
    data = platformAccountDetailFixture({ kind: "Operador" }); const sent: { body: unknown; key: string | null }[] = [];
    server.use(http.post("/api/platform/accounts/:id/authenticator/reset", async ({ request }) => { sent.push({ body: await request.json(), key: request.headers.get("Idempotency-Key") }); return HttpResponse.json({ version: 2 }); }));
    const user = userEvent.setup(); const { container } = open(); await screen.findByRole("heading", { name: "Laura Díaz", level: 1 });
    const trigger = screen.getByRole("button", { name: "Acciones de Laura Díaz" }); trigger.focus(); await user.keyboard("{ArrowDown}");
    expect((await screen.findAllByRole("menuitem")).map((item) => item.textContent)).toEqual(["Restablecer el autenticador", "Quitar operador"]);
    await user.click(screen.getByRole("menuitem", { name: "Restablecer el autenticador" }));
    const dialog = await screen.findByRole("dialog", { name: "¿Restablecer el autenticador de Laura Díaz?" });
    expect(dialog).toHaveTextContent("Se cierran sus sesiones y sus códigos de recuperación dejan de servir. Al volver a entrar, configura el autenticador de nuevo.");
    await user.click(within(dialog).getByRole("button", { name: "Restablecer" }));
    expect(sent).toHaveLength(0);
    expect(await axe(container)).toHaveNoViolations();
    const before = reads;
    await reason(user, "Restablecer");
    expect(await screen.findByText("Restablecimos el autenticador de Laura Díaz.")).toBeVisible();
    expect(sent).toEqual([{ body: { version: 1, reason: "Revisión" }, key: expect.stringMatching(/^[0-9a-f-]{36}$/iu) }]);
    await waitFor(() => expect(reads).toBeGreaterThan(before));
  });

  it("restablecer manda la versión de apertura aunque llegue una relectura y el 409 lo dice", async () => {
    data = platformAccountDetailFixture({ kind: "Operador" }); const bodies: unknown[] = [];
    server.use(http.post("/api/platform/accounts/:id/authenticator/reset", async ({ request }) => { bodies.push(await request.json());
      return HttpResponse.json({ code: "General.ConcurrencyConflict", detail: "Otra persona cambió este operador." }, { status: 409 }); }));
    const user = userEvent.setup(); const { queryClient } = open(); await screen.findByRole("heading", { name: "Laura Díaz", level: 1 });
    await menu(user, "Restablecer el autenticador");
    await screen.findByRole("dialog", { name: "¿Restablecer el autenticador de Laura Díaz?" });
    data = { ...data, operatorVersion: 7 };
    await act(async () => { await queryClient.invalidateQueries({ queryKey: accountQueryKey(data.id) }); });
    await waitFor(() => expect(queryClient.getQueryData<Detail>(accountQueryKey(data.id))?.operatorVersion).toBe(7));
    await reason(user, "Restablecer");
    await waitFor(() => expect(bodies).toEqual([{ version: 1, reason: "Revisión" }]));
    expect(await screen.findByText("Otra persona cambió este operador.")).toBeVisible();
  });

  it.each([
    ["la propia cuenta", "self"], ["sin administrar operadores", "permission"], ["una invitación pendiente", "invitation"],
  ] as const)("no ofrece restablecer en %s", async (_, kind) => {
    data = platformAccountDetailFixture({ kind: kind === "invitation" ? "Invitación de operador pendiente" : "Operador" });
    const { queryClient } = open(); await screen.findByRole("heading", { level: 1 });
    if (kind !== "invitation") act(() => queryClient.setQueryData(currentUserQueryKey, kind === "self" ? { ...platformOperator, id: data.id }
      : { ...platformOperator, effectivePermissions: { ...platformOperator.effectivePermissions, platform: ["platform.accounts.read", "platform.accounts.manage"] } }));
    const user = userEvent.setup();
    const trigger = screen.queryByRole("button", { name: /^Acciones de / });
    if (trigger) { trigger.focus(); await user.keyboard("{ArrowDown}"); }
    await waitFor(() => expect(screen.queryByRole("menuitem", { name: "Restablecer el autenticador" })).not.toBeInTheDocument());
  });

  it("390: restablecer está en la hoja de acciones del operador", async () => {
    asPhone(); data = platformAccountDetailFixture({ kind: "Operador" });
    const user = userEvent.setup(); open(); await screen.findByRole("heading", { name: "Laura Díaz", level: 1 });
    const trigger = screen.getByRole("button", { name: "Acciones de Laura Díaz" }); trigger.focus(); await user.keyboard("{Enter}");
    expect(await screen.findByRole("menuitem", { name: "Restablecer el autenticador" })).toBeVisible();
  });

  it("invitar: principal completo y permisos solos, reenvío sin cuerpo y revocación sin clave", async () => {
    data = platformAccountDetailFixture({ kind: "Invitación de operador pendiente" }); const user = userEvent.setup(); const revoked = vi.fn();
    server.use(http.delete("/api/platform/operators/:id/invitation", async ({ request }) => { revoked(request.headers.get("Idempotency-Key"), await request.text()); return new HttpResponse(null, { status: 204 }); }));
    const { router } = open(); await screen.findByRole("heading", { name: data.primaryEmail!, level: 1 });
    expect(screen.queryByRole("tablist")).not.toBeInTheDocument(); expect(screen.getByText("Ver cuentas")).toBeVisible();
    await menu(user, "Revocar invitación"); await user.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Revocar" }));
    await waitFor(() => expect(router.state.location.pathname).toBe("/plataforma/cuentas")); expect(revoked).toHaveBeenCalledWith(null, "");
  });
  it("baja exige GET nuevo y un GET fallido no habilita con datos cacheados", async () => {
    const user = userEvent.setup(); const { queryClient } = open(); await screen.findByRole("heading", { name: "Lucía Fernández", level: 1 });
    queryClient.setQueryData(accountQueryKey(data.id), data);
    server.use(http.get("/api/platform/accounts/:id", () => new HttpResponse(null, { status: 503 })));
    await menu(user, "Dar de baja"); expect(await screen.findByText("Algo salió mal. Probá de nuevo en un rato.")).toBeVisible();
    expect(screen.queryByRole("textbox", { name: "Motivo" })).not.toBeInTheDocument();
    expect(within(screen.getByRole("dialog")).getByRole("button", { name: "Reintentar" })).toBeVisible();
  });
  it("baja conocida del único Dueño bloquea y oculta motivo", async () => {
    const user = userEvent.setup(); open(); await screen.findByRole("heading", { name: "Lucía Fernández", level: 1 });
    data = { ...data, soleOwnerOrganizations: ["Grupo Delta"] }; await menu(user, "Dar de baja");
    expect(await screen.findByText(/Es el único Dueño de Grupo Delta/)).toBeVisible(); expect(reads).toBe(2);
    expect(screen.queryByRole("textbox", { name: "Motivo" })).not.toBeInTheDocument(); expect(screen.getByRole("button", { name: "Dar de baja" })).toBeDisabled();
  });
  it("baja conserva motivo y franja durante refetch, relee LastAdmin y fecha real tras POST", async () => {
    const user = userEvent.setup(); let writes = 0; const requests: unknown[] = [];
    server.use(http.post("/api/platform/accounts/:id/deletion", async ({ request }) => {
      requests.push(await request.json()); writes++;
      if (writes === 1) return HttpResponse.json({ code: "Legal.AccountDeletion.LastAdmin", detail: "Hace falta otro Dueño." }, { status: 409 });
      data = { ...data, state: "PendingDeletion", deletion: { requestedAtUtc: "2026-10-06T12:00:00Z", scheduledForUtc: "2026-12-24T12:00:00Z", requestedByPlatform: true } };
      return new HttpResponse(null, { status: 204 });
    }));
    const { queryClient } = open(); await menu(user, "Dar de baja"); await screen.findByRole("textbox", { name: "Motivo" }); await reason(user, "Dar de baja");
    expect(await screen.findByText("Hace falta otro Dueño.")).toBeVisible(); const motive = screen.getByRole("textbox", { name: "Motivo" }); const dialog = screen.getByRole("dialog");
    await act(async () => { await queryClient.invalidateQueries({ queryKey: accountQueryKey(data.id) }); });
    expect(screen.getByRole("dialog")).toBe(dialog); expect(screen.getByRole("textbox", { name: "Motivo" })).toBe(motive); expect(motive).toHaveValue("Revisión"); expect(screen.getByText("Hace falta otro Dueño.")).toBeVisible();
    await user.click(within(dialog).getByRole("button", { name: "Dar de baja" }));
    expect(await screen.findByText("Dimos de baja la cuenta de Lucía Fernández. Se elimina el 24/12/2026.")).toBeVisible();
    expect(requests).toEqual([{ reason: "Revisión" }, { reason: "Revisión" }]); expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
  it("LastAdmin relee organizaciones nuevas para mostrar bloqueo sin duplicar motivo", async () => {
    const user = userEvent.setup(); server.use(http.post("/api/platform/accounts/:id/deletion", () => {
      data = { ...data, soleOwnerOrganizations: ["Grupo Delta", "Beta"] }; return HttpResponse.json({ code: "Legal.AccountDeletion.LastAdmin", detail: "Viejo" }, { status: 409 });
    }));
    open(); await menu(user, "Dar de baja"); await screen.findByRole("textbox", { name: "Motivo" }); await reason(user, "Dar de baja");
    expect(await screen.findByText(/Es el único Dueño de Grupo Delta, Beta/)).toBeVisible(); expect(screen.queryByText("Viejo")).not.toBeInTheDocument();
    expect(screen.queryByRole("textbox", { name: "Motivo" })).not.toBeInTheDocument();
  });
  it("409 de estado se muestra con su texto, conserva motivo y al cancelar relee", async () => {
    const user = userEvent.setup(); server.use(http.post("/api/platform/accounts/:id/suspend", () => HttpResponse.json({ code: "Users.User.InvalidTransition", detail: "No se puede cambiar la cuenta a ese estado." }, { status: 409 })));
    open(); await user.click(await screen.findByRole("button", { name: "Suspender" })); await reason(user, "Suspender");
    expect(await screen.findByText("No se puede cambiar la cuenta a ese estado.")).toBeVisible(); expect(screen.getByRole("textbox", { name: "Motivo" })).toHaveValue("Revisión");
    expect(reads).toBe(1); await user.click(screen.getByRole("button", { name: "Cancelar" })); await waitFor(() => expect(reads).toBe(2));
  });
  it.each(["suspend", "reactivate", "revoke-sessions"] as const)("%s envía sólo motivo y conserva clave ante Retry nativo", async (action) => {
    const label = action === "suspend" ? "Suspender" : action === "reactivate" ? "Reactivar" : "Cerrar sesiones";
    if (action === "reactivate") data = platformAccountDetailFixture({ state: "Suspendida" });
    const user = userEvent.setup(); const received: { key: string | null; body: unknown }[] = [];
    server.use(http.post(`/api/platform/accounts/:id/${action}`, async ({ request }) => { received.push({ body: await request.json(), key: request.headers.get("Idempotency-Key") }); return received.length === 1 ? HttpResponse.error() : new HttpResponse(null, { status: 204 }); }));
    open(); await user.click(await screen.findByRole("button", { name: label })); await reason(user, label);
    fireEvent.click(await screen.findByRole("button", { name: "Reintentar" })); await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(received).toHaveLength(2); expect(received[0].body).toEqual({ reason: "Revisión" }); expect(received[0].key).toBeTruthy(); expect(received[1]).toEqual(received[0]);
  });
  it("cambiar id abandona borrador, Retry viejo y respuesta tardía de la cuenta anterior", async () => {
    const user = userEvent.setup(); let writes = 0;
    server.use(http.post("/api/platform/accounts/:id/suspend", () => { writes++; return HttpResponse.error(); }));
    const { router } = open(); await user.click(await screen.findByRole("button", { name: "Suspender" })); await reason(user, "Suspender"); const retry = await screen.findByRole("button", { name: "Reintentar" });
    data = { ...data, id: "otra", displayName: "Otra cuenta" }; await act(async () => { await router.navigate("/plataforma/cuentas/otra"); });
    await user.click(await screen.findByRole("button", { name: "Suspender" })); expect(screen.getByRole("textbox", { name: "Motivo" })).toHaveValue("");
    await act(async () => { fireEvent.click(retry); }); expect(writes).toBe(1); expect(screen.getByRole("dialog")).toBeVisible();
  });
  it.each(["permissions", "state", "self"] as const)("perder %s abandona el formulario y al recuperar no revive Retry", async (loss) => {
    const user = userEvent.setup(); let writes = 0; data = platformAccountDetailFixture({ kind: "Operador" });
    server.use(http.put("/api/platform/accounts/:id/operator", () => { writes++; return HttpResponse.error(); }));
    const { queryClient } = open(); await user.click(await screen.findByRole("button", { name: "Cambiar permisos" })); await reason(user, "Guardar cambios"); const retry = await screen.findByRole("button", { name: "Reintentar" });
    const original = data;
    await act(async () => {
      if (loss === "state") queryClient.setQueryData(accountQueryKey(data.id), { ...data, state: "PendingDeletion" });
      else queryClient.setQueryData(currentUserQueryKey, loss === "self" ? { ...platformOperator, id: data.id } : { ...platformOperator, effectivePermissions: { ...platformOperator.effectivePermissions, platform: ["platform.accounts.read"] } });
    }); await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    await act(async () => { queryClient.setQueryData(accountQueryKey(data.id), original); queryClient.setQueryData(currentUserQueryKey, platformOperator); });
    await screen.findByRole("button", { name: "Cambiar permisos" }); await act(async () => { fireEvent.click(retry); }); expect(writes).toBe(1); expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
  it.each([false, true])("respuesta tardía de permisos cancelados (fallida=%s) no notifica, invalida ni cierra otro diálogo", async (failed) => {
    const user = userEvent.setup(); data = platformAccountDetailFixture({ kind: "Operador" }); let release: (() => void) | undefined;
    server.use(http.put("/api/platform/accounts/:id/operator", async () => { await new Promise<void>((resolve) => { release = resolve; }); return failed ? new HttpResponse(null, { status: 503 }) : HttpResponse.json({ version: 2 }); }));
    const { queryClient } = open(); await user.click(await screen.findByRole("button", { name: "Cambiar permisos" })); await reason(user, "Guardar cambios"); await waitFor(() => expect(release).toBeDefined());
    await user.click(screen.getByRole("button", { name: "Cancelar" })); await user.click(screen.getByRole("button", { name: "Cambiar permisos" })); const dialog = screen.getByRole("dialog");
    await act(async () => { release?.(); }); await waitFor(() => expect(queryClient.isMutating()).toBe(0));
    expect(screen.getByRole("dialog")).toBe(dialog); expect(reads).toBe(1); expect(screen.queryByText("Cambiamos los permisos de Laura Díaz.")).not.toBeInTheDocument(); expect(screen.queryByText("Algo salió mal. Probá de nuevo en un rato.")).not.toBeInTheDocument();
  });
  it("PermisosRequired debajo de permisos, General.ConcurrencyConflict en franja y nueva lectura al cerrar", async () => {
    const user = userEvent.setup(); data = platformAccountDetailFixture({ kind: "Operador" }); let writes = 0;
    server.use(http.put("/api/platform/accounts/:id/operator", () => { writes++; return HttpResponse.json(writes === 1 ? { code: "Platform.Operator.PermissionsRequired", detail: "Mensaje distinto" } : { code: "General.ConcurrencyConflict", detail: "Otra persona cambió esto." }, { status: writes === 1 ? 400 : 409 }); }));
    open(); await user.click(await screen.findByRole("button", { name: "Cambiar permisos" })); await reason(user, "Guardar cambios");
    expect(await screen.findByText("Elegí al menos un permiso de plataforma.")).toBeVisible(); expect(screen.queryByText("Mensaje distinto")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Guardar cambios" })); expect(await screen.findByText("Otra persona cambió esto.")).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Cancelar" })); await waitFor(() => expect(reads).toBe(2));
  });
  it("operador sin audit.read conserva los catorce permisos (núcleo y módulos) con una sola caja y sin barra", async () => {
    data = platformAccountDetailFixture({ kind: "Operador" }); const { queryClient } = open(); await screen.findByRole("heading", { name: "Laura Díaz", level: 1 });
    await act(async () => { queryClient.setQueryData(currentUserQueryKey, { ...platformOperator, effectivePermissions: { ...platformOperator.effectivePermissions, platform: ["platform.accounts.read"] } }); });
    await waitFor(() => expect(screen.queryByRole("tablist")).not.toBeInTheDocument()); expect(screen.getByRole("list", { name: "Permisos" }).children).toHaveLength(14);
    expect(screen.getByText("Ver y responder las consultas que llegan al número de Plataforma.")).toBeVisible(); expect(screen.getByText("Ver el uso del asistente")).toBeVisible();
    expect(screen.queryByRole("button", { name: "Cambiar permisos" })).not.toBeInTheDocument();
  });
  it("en-US localiza métodos, fecha, Dueño y grupos de la ficha", async () => {
    server.use(http.get("/api/platform/accounts/:id", ({ request }) => {
      reads++;
      return HttpResponse.json({ ...data, organizations: data.organizations.map((organization) => ({ ...organization,
        roleName: request.headers.get("Accept-Language")?.startsWith("en") && organization.roleName === "Dueño" ? "Owner" : organization.roleName })) });
    }));
    const { queryClient } = open(); await screen.findByRole("heading", { name: "Lucía Fernández", level: 1 });
    await act(async () => { queryClient.setQueryData(currentUserQueryKey, { ...platformOperator, culture: "en-US" }); });
    expect(await screen.findByRole("tab", { name: "Sign-in methods 3" })).toBeVisible(); expect(screen.getAllByText(/Email/).length).toBeGreaterThan(0);
    const user = userEvent.setup(); await user.click(screen.getByRole("tab", { name: "Organizations 2" })); expect(await screen.findByText("Owner")).toBeVisible(); expect(screen.getAllByText("01/12/2026").length).toBeGreaterThan(0);
  });
  it("sin accounts.read la ruta no consulta cuenta", async () => {
    let requested = 0; server.use(http.get("/api/platform/accounts/:id", () => { requested++; return HttpResponse.json(data); }));
    const { queryClient } = open(); const denied = { ...platformOperator, effectivePermissions: { platform: [], organization: [], companies: {} } };
    server.use(meHandlerFor(denied)); await act(async () => { await queryClient.cancelQueries({ queryKey: currentUserQueryKey }); queryClient.setQueryData(currentUserQueryKey, denied); });
    expect(await screen.findByRole("heading", { name: "No tenés permiso para ver esta página" })).toBeVisible(); expect(requested).toBe(0);
  });
  it.each([false, true])("reenvío InProgress nativo agota31pedidos/30esperas y muestra final una vez (observer retirado=%s)", async (detached) => {
    data = platformAccountDetailFixture({ kind: "Invitación de operador vencida" }); const keys: (string | null)[] = []; let requests = 0; let failed = detached ? 2 : 0;
    server.use(http.post("/api/platform/operators/:id/invitation/resend", ({ request }) => {
      keys.push(request.headers.get("Idempotency-Key")); if (failed > 0) { failed--; return HttpResponse.error(); }
      requests++; return HttpResponse.json({ code: "Request.InProgress", detail: "El reenvío sigue en curso.", retryAfter: 1 }, { status: 409 });
    }));
    const user = userEvent.setup(); open(); await screen.findByRole("heading", { name: data.primaryEmail!, level: 1 });
    let start: HTMLElement;
    if (detached) { await user.click(screen.getByRole("button", { name: "Reenviar invitación" })); start = await screen.findByRole("button", { name: "Reintentar" }); await user.click(screen.getByRole("button", { name: "Reenviar invitación" })); await waitFor(() => expect(screen.getAllByRole("button", { name: "Reintentar" })).toHaveLength(2)); }
    else start = screen.getByRole("button", { name: "Reenviar invitación" });
    vi.useFakeTimers();
    await act(async () => { fireEvent.click(start); await vi.advanceTimersByTimeAsync(0); }); expect(requests).toBe(1);
    await act(async () => { await vi.advanceTimersByTimeAsync(29_000); }); expect(requests).toBe(30); expect(screen.queryByText("El reenvío sigue en curso.")).not.toBeInTheDocument();
    await act(async () => { await vi.advanceTimersByTimeAsync(1_050); }); expect(requests).toBe(31); expect(new Set(keys).size).toBe(1); expect(screen.getAllByText("El reenvío sigue en curso.")).toHaveLength(1);
  });
  it("quitar y volver a poner un permiso no cambia la selección ni habilita Guardar", async () => {
    data = platformAccountDetailFixture({ kind: "Operador" }); const user = userEvent.setup(); open(); await user.click(await screen.findByRole("button", { name: "Cambiar permisos" }));
    const select = screen.getByRole("button", { name: "Permisos de plataforma" }); select.focus(); await user.keyboard("{ArrowDown}");
    await user.click(screen.getByRole("menuitemcheckbox", { name: "Ver organizaciones" })); await user.click(screen.getByRole("menuitemcheckbox", { name: "Ver organizaciones" })); await user.keyboard("{Escape}");
    expect(screen.getByRole("button", { name: "Guardar cambios" })).toBeDisabled();
  });
  it("Organizaciones vacío conserva grupo y texto compartido de la caja", async () => {
    data = { ...data, organizations: [] }; const user = userEvent.setup(); open(); await user.click(await screen.findByRole("tab", { name: "Organizaciones 0" }));
    expect(screen.getByText("No está en ninguna organización.")).toBeVisible();
  });
  it("suspensión y eliminación sin evidencia muestran vacío sin estimar fechas", async () => {
    data = { ...platformAccountDetailFixture({ state: "Suspendida" }), lastStateChange: null }; const { queryClient } = open(); await screen.findByRole("heading", { name: "Lucía Fernández", level: 1 });
    expect(screen.getByText(/Suspendida el/).parentElement).toHaveTextContent("Suspendida el —. Motivo: —");
    await act(async () => { queryClient.setQueryData(accountQueryKey(data.id), { ...data, state: "Deleted", deletedAtUtc: null }); });
    await waitFor(() => expect(screen.getByText(/Eliminada el/)).toHaveTextContent(/Eliminada el —/));
  });
  it("permisos InProgress conserva clave y final de MutationCache aunque el observer sea retirado", async () => {
    data = platformAccountDetailFixture({ kind: "Operador" }); const user = userEvent.setup(); let failed = 2; let requests = 0; const keys: (string | null)[] = [];
    server.use(http.put("/api/platform/accounts/:id/operator", ({ request }) => {
      keys.push(request.headers.get("Idempotency-Key")); if (failed-- > 0) return HttpResponse.error();
      requests++; return HttpResponse.json({ code: "Request.InProgress", detail: "El cambio sigue en curso.", retryAfter: 1 }, { status: 409 });
    }));
    open(); await user.click(await screen.findByRole("button", { name: "Cambiar permisos" })); await reason(user, "Guardar cambios"); const retry = await screen.findByRole("button", { name: "Reintentar" });
    await user.click(screen.getByRole("button", { name: "Guardar cambios" })); await waitFor(() => expect(screen.getAllByRole("button", { name: "Reintentar" })).toHaveLength(2));
    vi.useFakeTimers(); await act(async () => { fireEvent.click(retry); await vi.advanceTimersByTimeAsync(0); }); expect(requests).toBe(1);
    await act(async () => { await vi.advanceTimersByTimeAsync(29_000); }); expect(requests).toBe(30); expect(screen.queryByText("El cambio sigue en curso.")).not.toBeInTheDocument();
    await act(async () => { await vi.advanceTimersByTimeAsync(1_050); }); expect(requests).toBe(31); expect(new Set(keys).size).toBe(1); expect(screen.getAllByText("El cambio sigue en curso.")).toHaveLength(1);
  });
  it.each(["red", "5xx"] as const)("GET de baja tardío %s luego de otro id no publica aviso ni altera el motivo nuevo", async (failed) => {
    const user = userEvent.setup(); let release: (() => void) | undefined; let details = 0;
    server.use(http.get("/api/platform/accounts/:id", async ({ params }) => {
      if (params.id === "otra") return HttpResponse.json({ ...data, id: "otra", displayName: "Otra" });
      if (++details <= 2) return HttpResponse.json(data);
      await new Promise<void>((resolve) => { release = resolve; }); return failed === "red" ? HttpResponse.error() : new HttpResponse(null, { status: 503 });
    }), http.post("/api/platform/accounts/:id/deletion", () => new HttpResponse(null, { status: 204 })));
    const { router, queryClient } = open(); await menu(user, "Dar de baja"); await screen.findByRole("textbox", { name: "Motivo" }); await reason(user, "Dar de baja"); await waitFor(() => expect(release).toBeDefined());
    await act(async () => { await router.navigate("/plataforma/cuentas/otra"); }); await user.click(await screen.findByRole("button", { name: "Suspender" })); const motive = screen.getByRole("textbox", { name: "Motivo" }); await user.type(motive, "Otro recorrido");
    await act(async () => { release?.(); }); await waitFor(() => expect(queryClient.isMutating()).toBe(0)); expect(screen.getByRole("textbox", { name: "Motivo" })).toBe(motive); expect(motive).toHaveValue("Otro recorrido");
    expect(screen.queryByText("No pudimos conectarnos. Revisá tu conexión.")).not.toBeInTheDocument(); expect(screen.queryByText("Algo salió mal. Probá de nuevo en un rato.")).not.toBeInTheDocument();
  });
});
