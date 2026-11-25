import { act, fireEvent, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import { currentUserQueryKey } from "@/auth/useCurrentUser";
import type { ApiSchemas } from "@/shared/api/types";
import { changeCulture, configureI18n } from "@/shared/i18n";
import { platformOperator } from "@/test/mocks/currentUsers";
import { referenceDataFixture } from "@/test/mocks/handlers";
import { server } from "@/test/mocks/server";
import { asPhone, cardData } from "@/test/utils/phone";
import { renderRouteWithProviders } from "@/test/utils/renderWithProviders";
import { tenantQueryKey, tenantsQueryRoot } from "../api/tenants";

const owner: ApiSchemas["PlatformTenantOwnerResponse"] = { id: "lucia", displayName: "Lucía Fernández", email: "lucia@example.com", identityStatus: "Active", membershipStatus: "Active", lastSignInAtUtc: null };
const organization: ApiSchemas["PlatformTenantDetailResponse"] = { id: "delta", name: "Grupo Delta", status: "Active", source: "SelfService", createdAtUtc: "2026-01-12T11:40:00Z", companyCount: 3, memberCount: 11, version: 2, ownerName: "Lucía Fernández", ownerEmail: "lucia@example.com", owners: [owner], lastStateChange: null };
const otherOrganization: ApiSchemas["PlatformTenantDetailResponse"] = { ...organization, id: "omega", name: "Grupo Omega", version: 42 };
const history: ApiSchemas["PlatformTenantHistoryResponse"] = { id: "event-1", occurredAtUtc: "2026-09-20T14:02:00Z", action: "Reactivó la organización", summary: '[{"field":"status","before":"Suspended","after":"Active"}]', actor: "Martín Sosa", actorRole: "Operador", reason: "Se resolvió el reclamo" };
function detail(data = organization) { server.use(http.get("/api/platform/tenants/delta", () => HttpResponse.json(data))); }
const render = () => renderRouteWithProviders("/plataforma/organizaciones/delta", { as: "platform-operator" });
function cacheOtherOrganization(page: ReturnType<typeof render>) {
  page.queryClient.setQueryDefaults(tenantQueryKey("omega"), { staleTime: Infinity });
  page.queryClient.setQueryData(tenantQueryKey("omega"), otherOrganization);
  server.use(http.get("/api/platform/tenants/omega", () => HttpResponse.json(otherOrganization)), http.get("/api/platform/tenants/omega/history", () => HttpResponse.json({ items: [], hasMore: false })));
  server.use(http.get("/api/platform/tenants/omega/features", () => HttpResponse.json([])));
}
/// 209: suspender, reactivar y cerrar van en el ⋮ de la banda; aprobar y rechazar lo que espera, a la vista.
async function openAction(user: ReturnType<typeof userEvent.setup>, label: string) {
  (await screen.findByRole("button", { name: /^Acciones de Grupo / })).focus(); await user.keyboard("{Enter}");
  await user.click(await screen.findByRole("menuitem", { name: label }));
}
async function confirm(user: ReturnType<typeof userEvent.setup>, label: string, reason = "Revisión") {
  if (["Suspender", "Reactivar", "Cerrar"].includes(label)) await openAction(user, label);
  else await user.click(await screen.findByRole("button", { name: label }));
  const dialog = await screen.findByRole("dialog");
  await user.type(within(dialog).getByRole("textbox", { name: "Motivo" }), reason);
  await user.click(within(dialog).getByRole("button", { name: label }));
}
beforeEach(async () => {
  vi.unstubAllGlobals();
  await configureI18n(referenceDataFixture().cultures); await changeCulture("es-AR"); detail();
  server.use(http.get("/api/platform/tenants/delta/history", () => HttpResponse.json({ items: [history], hasMore: false, nextCursor: null })));
  server.use(http.get("/api/platform/tenants/delta/features", () => HttpResponse.json([])));
});

describe("Ficha de Organización", () => {
  it("monta banda, resumen, Historial sin cantidad y Dueños con cantidad; axe", async () => {
    const { container } = render();
    expect(await screen.findByRole("heading", { name: "Grupo Delta" })).toBeVisible();
    expect(screen.getByText(/Alta el/)).toHaveTextContent("Alta el 12/01/2026 por autoservicio");
    expect(screen.getByText(/3 empresas · 11 miembros/)).toBeVisible();
    expect(screen.getByRole("tab", { name: "Historial" })).toBeVisible();
    expect(screen.getByRole("tab", { name: "Dueños 1" })).toBeVisible();
    for (const header of ["Fecha y hora", "Qué pasó", "Quién", "Motivo"]) expect(await screen.findByRole("columnheader", { name: header })).toBeVisible();
    expect(await screen.findByText(history.action)).toBeVisible();
    expect(screen.queryByText(history.summary)).not.toBeInTheDocument();
    await waitFor(() => expect(screen.queryByRole("tab", { name: /^Módulos/ })).not.toBeInTheDocument());
    expect(await axe(container)).toHaveNoViolations();
  });
  // La campana cuenta la organización mientras espera: aprobarla, rechazarla o enterarse de que otro ya lo hizo la vuelve a leer.
  it.each([["approve", "Aprobar", null], ["reject", "Rechazar", null], ["approve", "Aprobar", "Tenancy.Tenant.InvalidTransition"]] as const)("%s (%s, %s) vuelve a leer la campana montada", async (action, label, conflict) => {
    const user = userEvent.setup(); let resolved = false; let reads = 0;
    const waiting = { id: "organizationPending:delta", kind: "organizationPending", params: { name: "Grupo Delta" }, occurredAtUtc: "2026-09-27T12:05:00Z", link: "/plataforma/organizaciones/delta", read: false };
    detail({ ...organization, status: "PendingApproval" });
    server.use(http.get("/api/notifications", () => { reads++; return HttpResponse.json(resolved ? { items: [], unread: 0 } : { items: [waiting], unread: 1 }); }),
      http.post(`/api/platform/tenants/delta/${action}`, () => { resolved = true; return conflict ? HttpResponse.json({ code: conflict, detail: "Ya cambió." }, { status: 409 }) : HttpResponse.json({ version: 3 }); }));
    render(); expect(await screen.findByRole("button", { name: "Avisos: 1" })).toBeVisible(); const before = reads;
    await confirm(user, label);
    if (conflict) { expect(await screen.findByText("Ya cambió.")).toBeVisible(); await user.click(screen.getByRole("button", { name: "Cancelar" })); }
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    await waitFor(() => expect(reads).toBeGreaterThan(before)); expect(await screen.findByRole("button", { name: "Avisos" })).toBeVisible();
  });
  it("PendingApproval Rechazar en banda usa peligro con borde y en confirmación peligro lleno", async () => {
    detail({ ...organization, status: "PendingApproval" }); const user = userEvent.setup(); render();
    const button = await screen.findByRole("button", { name: "Rechazar" }); expect(button).toHaveAttribute("data-variant", "danger");
    await user.click(button); expect(within(await screen.findByRole("dialog")).getByRole("button", { name: "Rechazar" })).toHaveAttribute("data-variant", "destructive");
  });
  // Tablero Organizacion (175): sin cartel; la banda dice el estado una vez, y cuándo y por qué van en la frase de su (i).
  // Sin el cambio de estado, no hay frase ni se inventa una fecha.
  it.each(["Suspended", "Closed"] as const)("%s dice fecha y motivo reales en la (i) del estado y sin dato no inventa", async (status) => {
    detail({ ...organization, status, lastStateChange: { atUtc: "2026-09-03T14:00:00Z", action: status === "Suspended" ? "OrganizationSuspended" : "OrganizationClosed", reason: "Reclamo" } });
    const { queryClient } = render();
    const why = await screen.findByRole("img", { name: status === "Suspended" ? /^El 03\/09\/2026, \d{2}:\d{2}\. Motivo: Reclamo\.$/ : /^El 03\/09\/2026, \d{2}:\d{2}\. Motivo: Reclamo\. Queda de solo lectura\.$/ });
    expect(why).toHaveAttribute("tabindex", "0");
    expect(screen.queryByText(/Motivo: Reclamo/)).not.toBeInTheDocument();
    detail({ ...organization, status, lastStateChange: null }); await act(async () => { await queryClient.invalidateQueries({ queryKey: tenantsQueryRoot }); });
    await waitFor(() => expect(screen.queryByRole("img", { name: /^El 03\/09\/2026/ })).not.toBeInTheDocument());
  });
  // 209 («Criterio · Botones» y «Criterio · Menús»): a la vista solo lo que espera una decisión y reintentar el alta; suspender,
  // reactivar y cerrar van en el ⋮ de la banda, con lo destructivo al final.
  it.each([
    ["Active", [], ["Suspender"]],
    ["Suspended", [], ["Reactivar", "Cerrar"]],
    ["PendingApproval", ["Rechazar", "Aprobar"], null],
    ["Provisioning", ["Reintentar el alta"], null],
    ["Closed", [], null],
  ] as const)("la banda de una organización %s deja a la vista la tarea y lo demás en el ⋮", async (status, visible, menu) => {
    detail({ ...organization, status }); const user = userEvent.setup(); render(); await screen.findByRole("heading", { name: "Grupo Delta" });
    for (const label of ["Suspender", "Reactivar", "Cerrar", "Rechazar", "Aprobar", "Reintentar el alta"]) {
      expect(Boolean(screen.queryByRole("button", { name: label }))).toBe((visible as readonly string[]).includes(label));
    }
    const trigger = screen.queryByRole("button", { name: "Acciones de Grupo Delta" });
    if (!menu) { expect(trigger).not.toBeInTheDocument(); return; }
    trigger!.focus(); await user.keyboard("{Enter}");
    const items = await screen.findAllByRole("menuitem");
    expect(items.map((item) => item.textContent)).toEqual(menu);
    // «Criterio · Menús»: cada opción con su ícono; suspender y cerrar, de peligro y al final.
    for (const item of items) expect(item.querySelector("svg")).not.toBeNull();
    expect(items.filter((item) => item.getAttribute("data-variant") === "destructive").map((item) => item.textContent)).toEqual(menu.filter((label) => label !== "Reactivar"));
  });
  it("Plataforma y fecha nullable se muestran sin atribuir autoservicio", async () => {
    detail({ ...organization, source: "Platform", createdAtUtc: null }); render(); await screen.findByRole("heading", { name: "Grupo Delta" });
    expect(screen.getByText(/por la plataforma/)).toBeVisible(); expect(screen.getByRole("img", { name: "Sin dato" })).toBeVisible();
  });
  it("Historial usa el cursor opaco y suma action de la segunda tanda con summary técnico vacío, sin total", async () => {
    const after: (string | null)[] = []; const user = userEvent.setup();
    server.use(http.get("/api/platform/tenants/delta/history", ({ request }) => { const cursor = new URL(request.url).searchParams.get("after"); after.push(cursor); return HttpResponse.json(cursor ? { items: [{ ...history, id: "event-2", action: "Pidió crear la organización", summary: "{}", reason: null }], hasMore: false } : { items: [history], hasMore: true, nextCursor: "opaque/&=" }); }));
    render(); await user.click(await screen.findByRole("button", { name: "Cargar más" })); expect(await screen.findByText("Pidió crear la organización")).toBeVisible();
    expect(screen.getByText(history.action)).toBeVisible(); expect(screen.queryByText(history.summary)).not.toBeInTheDocument(); expect(screen.queryByText("{}")).not.toBeInTheDocument(); expect(after).toEqual([null, "opaque/&="]); expect(screen.queryByRole("button", { name: "Cargar más" })).not.toBeInTheDocument();
  });
  it("Historial vacío y fallo tienen su recuperación local", async () => {
    const user = userEvent.setup(); server.use(http.get("/api/platform/tenants/delta/history", () => HttpResponse.error())); render();
    expect(await screen.findByText("No pudimos conectarnos. Revisá tu conexión.")).toBeVisible();
    server.use(http.get("/api/platform/tenants/delta/history", () => HttpResponse.json({ items: [], hasMore: false }))); await user.click(screen.getByRole("button", { name: "Reintentar" })); expect(await screen.findByText("Todavía no hay historial")).toBeVisible();
  });
  it.each([
    ["Active", "Active", "Activo"], ["Suspended", "Active", "Suspendido"], ["PendingDeletion", "Active", "Por borrar"], ["Deleted", "Active", "Borrado"], ["Active", "Inactive", "De baja"], ["Active", "Removed", "Terminada"], ["Active", "Invited", "Invitación pendiente"],
  ] as const)("Dueño %s/%s refleja identidad y membresía", async (identityStatus, membershipStatus, label) => {
    detail({ ...organization, owners: [{ ...owner, identityStatus, membershipStatus }] }); const user = userEvent.setup(); render(); await user.click(await screen.findByRole("tab", { name: "Dueños 1" }));
    expect(await screen.findByText("Lucía Fernández")).toBeVisible(); expect(screen.getByText("lucia@example.com")).toBeVisible(); expect(screen.getByText("Nunca")).toBeVisible(); expect(screen.getByText(label)).toBeVisible();
  });
  it("sin Dueño todavía deriva sólo el contacto pendiente; sin contacto queda vacío", async () => {
    const user = userEvent.setup(); detail({ ...organization, owners: [], ownerName: "Registrante antiguo" }); const { queryClient } = render(); await user.click(await screen.findByRole("tab", { name: "Dueños 1" }));
    expect(await screen.findByText("Invitación pendiente")).toBeVisible(); expect(screen.getByText("lucia@example.com")).toBeVisible(); expect(screen.queryByText("Registrante antiguo")).not.toBeInTheDocument(); expect(screen.getByRole("img", { name: "Sin dato" })).toBeVisible();
    detail({ ...organization, owners: [], ownerEmail: null }); await act(async () => { await queryClient.invalidateQueries({ queryKey: tenantsQueryRoot }); }); expect(await screen.findByText("Todavía no hay Dueños")).toBeVisible(); expect(screen.getByRole("tab", { name: "Dueños 0" })).toBeVisible();
  });
  it("Dueños llega entera y ordena en el navegador por sus columnas, con lo vacío al final (264)", async () => {
    const ana = { ...owner, id: "ana", displayName: "Ana Paz", email: "ana@example.com", lastSignInAtUtc: "2026-01-10T11:40:00Z" };
    const bruno = { ...owner, id: "bruno", displayName: "Bruno Gil", email: "bruno@example.com", lastSignInAtUtc: "2026-01-12T11:40:00Z" };
    detail({ ...organization, owners: [owner, ana, bruno] }); const user = userEvent.setup(); render(); await user.click(await screen.findByRole("tab", { name: "Dueños 3" }));
    const names = () => within(screen.getByRole("tabpanel")).getAllByRole("row").slice(1).map((row) => within(row).getAllByRole("cell")[0]?.textContent);
    expect(await within(screen.getByRole("tabpanel")).findByText("Ana Paz")).toBeVisible(); expect(names()).toEqual(["Lucía Fernández", "Ana Paz", "Bruno Gil"]);
    await user.click(screen.getByRole("button", { name: "Dueño" }));
    expect(names()).toEqual(["Ana Paz", "Bruno Gil", "Lucía Fernández"]); expect(screen.getByRole("columnheader", { name: /Dueño/ })).toHaveAttribute("aria-sort", "ascending");
    await user.click(screen.getByRole("button", { name: "Dueño" })); expect(names()).toEqual(["Lucía Fernández", "Bruno Gil", "Ana Paz"]);
    // El último ingreso, de la más reciente a la más vieja al primer toque, y «Nunca» al final en los dos sentidos.
    await user.click(screen.getByRole("button", { name: "Último ingreso" })); expect(names()).toEqual(["Bruno Gil", "Ana Paz", "Lucía Fernández"]);
    await user.click(screen.getByRole("button", { name: "Último ingreso" })); expect(names()).toEqual(["Ana Paz", "Bruno Gil", "Lucía Fernández"]);
  });
  it("Dueño sin nombre/correo conserva null; último ingreso con fecha y hora", async () => {
    const user = userEvent.setup(); detail({ ...organization, owners: [{ ...owner, displayName: null, email: null, lastSignInAtUtc: "2026-01-12T11:40:00Z" }] }); render(); await user.click(await screen.findByRole("tab", { name: "Dueños 1" }));
    // El Dueño y su correo van cada uno en su columna (base de la 12): sin dato, los dos dicen la raya.
    expect(await screen.findAllByRole("img", { name: "Sin dato" })).toHaveLength(2); expect(within(screen.getByRole("tabpanel")).getByText("12/01/2026, 08:40")).toBeVisible();
  });
  it("404 y error inicial usan las pantallas comunes y Reintentar vuelve a pedir", async () => {
    const user = userEvent.setup(); server.use(http.get("/api/platform/tenants/delta", () => HttpResponse.json({ code: "Tenancy.Tenant.NotFound" }, { status: 404 }))); const first = render();
    expect(await screen.findByRole("heading", { name: "No encontramos esta página" })).toBeVisible(); expect(screen.queryByRole("button", { name: "Reintentar" })).not.toBeInTheDocument(); first.unmount();
    server.use(http.get("/api/platform/tenants/delta", () => HttpResponse.error())); render(); expect(await screen.findByRole("heading", { name: "No pudimos abrir esta pantalla" })).toBeVisible(); detail(); await user.click(screen.getByRole("button", { name: "Reintentar" })); expect(await screen.findByRole("heading", { name: "Grupo Delta" })).toBeVisible();
  });
  it("sin manage permite leer ficha y Dueños, omite acciones y lecturas privadas", async () => {
    const user = userEvent.setup(); renderRouteWithProviders("/plataforma/organizaciones/delta", { as: "platform-operator-reader" }); await screen.findByRole("heading", { name: "Grupo Delta" });
    await user.click(screen.getByRole("tab", { name: "Dueños 1" })); expect(await screen.findByText("Lucía Fernández")).toBeVisible(); expect(screen.queryByRole("button", { name: "Suspender" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Acciones de Grupo Delta" })).not.toBeInTheDocument();
  });
  it("403 principal y falta de read bloquean la ficha", async () => {
    server.use(http.get("/api/platform/tenants/delta", () => HttpResponse.json({ code: "Auth.Forbidden" }, { status: 403 }))); render(); expect(await screen.findByRole("heading", { name: "No tenés permiso para ver esta página" })).toBeVisible();
  });
  // 263: cada evento del historial es una tarjeta con la fecha y hora, quién y el motivo, cada dato con su nombre.
  it("a 390 el ⋮ abre la hoja con menuitem y el historial va en tarjetas con sus datos nombrados; axe", async () => {
    asPhone(); const user = userEvent.setup(); const { container } = render(); expect(await screen.findByRole("heading", { name: "Grupo Delta" })).toBeVisible();
    expect(screen.getByText(/3 empresas · 11 miembros/)).toBeVisible(); const card = (await screen.findByText(history.action)).closest("li")!;
    expect(cardData(card)).toEqual([["Fecha y hora", "20/09/2026, 11:02"], ["Quién", "Martín Sosa"], ["Motivo", "Se resolvió el reclamo"]]); expect(card.textContent).not.toContain("·");
    expect(screen.getByText(history.action)).toBeVisible(); expect(screen.queryByText(history.summary)).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Suspender" })).not.toBeInTheDocument(); const trigger = screen.getByRole("button", { name: "Acciones de Grupo Delta" }); await user.click(trigger); expect(within(await screen.findByRole("dialog", { name: "Grupo Delta" })).getByRole("menuitem", { name: "Suspender" })).toBeVisible(); await user.keyboard("{Escape}"); expect(await axe(container)).toHaveNoViolations();
  });
  it("en-US conserva formatos y textos traducidos", async () => {
    const { queryClient } = render(); await screen.findByRole("heading", { name: "Grupo Delta" });
    await act(async () => { queryClient.setQueryData(currentUserQueryKey, { ...platformOperator, culture: "en-US" }); });
    expect(await screen.findByRole("tab", { name: "History" })).toBeVisible(); expect(screen.getByRole("button", { name: "Actions for Grupo Delta" })).toBeVisible(); expect(screen.getByText(/01\/12\/2026/)).toBeVisible();
  });
  // 263: cada Dueño es una tarjeta con el estado, el último ingreso y el correo, cada dato con su nombre.
  it("Dueños a 390 es una tarjeta sin avatar con estado, último ingreso y correo; axe", async () => {
    asPhone(); const user = userEvent.setup(); const { container } = render(); await user.click(await screen.findByRole("tab", { name: "Dueños 1" }));
    const panel = screen.getByRole("tabpanel"); expect(within(panel).queryByRole("table")).not.toBeInTheDocument();
    expect(cardData(within(panel).getByRole("listitem"))).toEqual([["Estado", "Activo"], ["Último ingreso", "Nunca"], ["Correo", "lucia@example.com"]]);
    expect(panel.querySelector("[data-slot=avatar]")).toBeNull(); expect(await axe(container)).toHaveNoViolations();
  });
  it("la versión propia habilita Reactivar antes del GET y otra lectura no la pisa ni inventa fecha", async () => {
    const user = userEvent.setup(); let reads = 0; let release: (() => void) | undefined; let body: unknown;
    server.use(http.get("/api/platform/tenants/delta", async () => { reads++; if (reads === 1) return HttpResponse.json({ ...organization, lastStateChange: { atUtc: "2026-09-01T14:00:00Z", action: "OrganizationReactivated", reason: "Anterior" } }); await new Promise<void>((resolve) => { release = resolve; }); return HttpResponse.json({ ...organization, status: "Suspended", version: 99, lastStateChange: { atUtc: "2026-09-03T14:00:00Z", action: "OrganizationSuspended", reason: "Real" } }); }), http.post("/api/platform/tenants/delta/suspend", () => HttpResponse.json({ version: 10 })), http.post("/api/platform/tenants/delta/reactivate", async ({ request }) => { body = await request.json(); return HttpResponse.json({ version: 11 }); }));
    render(); await confirm(user, "Suspender"); await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument()); expect(screen.queryByText(/01\/09\/2026/)).not.toBeInTheDocument();
    await openAction(user, "Reactivar"); await user.click(screen.getByRole("button", { name: "Cancelar" })); await waitFor(() => expect(release).toBeDefined()); await act(async () => { release?.(); }); await waitFor(() => expect(screen.getByRole("img", { name: /Motivo: Real\.$/ })).toBeInTheDocument());
    await confirm(user, "Reactivar"); expect(await screen.findByText("Reactivamos Grupo Delta.")).toBeVisible(); expect(body).toEqual({ version: 10, reason: "Revisión" });
  });
  it.each(["General.ConcurrencyConflict", "Tenancy.Tenant.InvalidTransition"])("%s conserva motivo y franja, cerrar descarta coordinación y relee", async (code) => {
    const user = userEvent.setup(); let reads = 0; server.use(http.get("/api/platform/tenants/delta", () => { reads++; return HttpResponse.json(organization); }), http.post("/api/platform/tenants/delta/suspend", () => HttpResponse.json({ code, detail: "Revisá el estado actual." }, { status: 409 })));
    render(); await confirm(user, "Suspender"); const dialog = screen.getByRole("dialog"); expect(await within(dialog).findByRole("alert")).toHaveTextContent("Revisá el estado actual."); expect(screen.getByRole("textbox", { name: "Motivo" })).toHaveValue("Revisión"); expect(reads).toBe(1); await user.click(screen.getByRole("button", { name: "Cancelar" })); await waitFor(() => expect(reads).toBeGreaterThan(1));
  });
  it("retry del alta usa botón principal, manda sólo versión y sin diálogo", async () => {
    detail({ ...organization, status: "Provisioning", companyCount: 0 }); const user = userEvent.setup(); let body: unknown; server.use(http.post("/api/platform/tenants/delta/retry-provisioning", async ({ request }) => { body = await request.json(); return HttpResponse.json({ version: 12 }); })); render(); const button = await screen.findByRole("button", { name: "Reintentar el alta" }); expect(button).toHaveAttribute("data-variant", "default"); await user.click(button); expect(await screen.findByText("Terminamos el alta de Grupo Delta.")).toBeVisible(); expect(body).toEqual({ version: 2 }); expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
  it("aprobación con múltiples Dueños usa el aviso plural", async () => {
    detail({ ...organization, status: "PendingApproval", owners: [owner, { ...owner, id: "other" }] }); const user = userEvent.setup(); server.use(http.post("/api/platform/tenants/delta/approve", () => HttpResponse.json({ version: 3 }))); render(); await confirm(user, "Aprobar"); expect(await screen.findByText("Aprobamos Grupo Delta. Les avisamos a sus Dueños.")).toBeVisible();
  });
  it("retry de red conserva clave y cuerpo mientras el formulario vive", async () => {
    const user = userEvent.setup(); const keys: (string | null)[] = []; const bodies: unknown[] = []; server.use(http.post("/api/platform/tenants/delta/suspend", async ({ request }) => { keys.push(request.headers.get("Idempotency-Key")); bodies.push(await request.json()); return keys.length === 1 ? HttpResponse.error() : HttpResponse.json({ version: 3 }); })); render(); await confirm(user, "Suspender"); fireEvent.click(await screen.findByRole("button", { name: "Reintentar" })); expect(await screen.findByText("Suspendimos Grupo Delta.")).toBeVisible(); expect(keys[0]).toBe(keys[1]); expect(bodies).toEqual([{ version: 2, reason: "Revisión" }, { version: 2, reason: "Revisión" }]);
  });
  it("Reactivar manda la versión propia mientras el GET sigue retenido", async () => {
    const user = userEvent.setup(); let reads = 0; const releases: (() => void)[] = []; let body: unknown;
    server.use(http.get("/api/platform/tenants/delta", async () => { reads++; if (reads > 1) await new Promise<void>((resolve) => { releases.push(resolve); }); return HttpResponse.json(organization); }), http.post("/api/platform/tenants/delta/suspend", () => HttpResponse.json({ version: 10 })), http.post("/api/platform/tenants/delta/reactivate", async ({ request }) => { body = await request.json(); return HttpResponse.json({ version: 11 }); }));
    const page = render(); await confirm(user, "Suspender"); await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument()); await confirm(user, "Reactivar");
    expect(await screen.findByText("Reactivamos Grupo Delta.")).toBeVisible(); expect(body).toEqual({ version: 10, reason: "Revisión" }); expect(releases.length).toBeGreaterThan(0); page.unmount(); releases.forEach((release) => release());
  });
  it.each([
    ["PendingApproval", "Aprobar", "approve", "Aprobamos Grupo Delta. Le avisamos a lu•••@example.com."],
    ["PendingApproval", "Rechazar", "reject", "Rechazamos Grupo Delta."],
    ["Active", "Suspender", "suspend", "Suspendimos Grupo Delta."],
    ["Suspended", "Reactivar", "reactivate", "Reactivamos Grupo Delta."],
    ["Suspended", "Cerrar", "close", "Cerramos Grupo Delta."],
  ] as const)("%s %s manda versión, motivo y clave y conserva foco", async (status, label, action, message) => {
    detail({ ...organization, status }); const user = userEvent.setup(); let body: unknown; let key: string | null = null;
    server.use(http.post(`/api/platform/tenants/delta/${action}`, async ({ request }) => { body = await request.json(); key = request.headers.get("Idempotency-Key"); return HttpResponse.json({ version: 9 }); }));
    render(); if (["Suspender", "Reactivar", "Cerrar"].includes(label)) await openAction(user, label); else await user.click(await screen.findByRole("button", { name: label })); const dialog = await screen.findByRole("dialog");
    await user.click(within(dialog).getByRole("button", { name: label })); expect(await screen.findByText("Escribí el motivo.")).toBeVisible(); expect(body).toBeUndefined();
    await user.type(screen.getByRole("textbox", { name: "Motivo" }), "Revisión"); await user.click(within(dialog).getByRole("button", { name: label }));
    expect(await screen.findByText(message)).toBeVisible(); await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument()); expect(body).toEqual({ version: 2, reason: "Revisión" }); expect(key).toBeTruthy();
  });
  it("cancelar y reabrir renueva clave; un aviso viejo no vuelve a enviar ni cierra el nuevo", async () => {
    const user = userEvent.setup(); const keys: (string | null)[] = []; server.use(http.post("/api/platform/tenants/delta/suspend", ({ request }) => { keys.push(request.headers.get("Idempotency-Key")); return HttpResponse.error(); })); render();
    await confirm(user, "Suspender"); const oldRetry = await screen.findByRole("button", { name: "Reintentar" }); await user.click(screen.getByRole("button", { name: "Cancelar" })); await confirm(user, "Suspender", "Otra revisión");
    await waitFor(() => expect(keys).toHaveLength(2)); await act(async () => { fireEvent.click(oldRetry); }); expect(keys).toHaveLength(2); expect(keys[0]).not.toBe(keys[1]); expect(screen.getByRole("textbox", { name: "Motivo" })).toHaveValue("Otra revisión"); expect(screen.getByRole("dialog")).toBeVisible();
  });
  it("corregir motivo después de red renueva la clave del cuerpo completo", async () => {
    const user = userEvent.setup(); const keys: (string | null)[] = []; server.use(http.post("/api/platform/tenants/delta/suspend", ({ request }) => { keys.push(request.headers.get("Idempotency-Key")); return keys.length === 1 ? HttpResponse.error() : HttpResponse.json({ version: 3 }); })); render();
    await confirm(user, "Suspender"); await screen.findByRole("button", { name: "Reintentar" }); await user.clear(screen.getByRole("textbox", { name: "Motivo" })); await user.type(screen.getByRole("textbox", { name: "Motivo" }), "Otro motivo"); await user.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Suspender" }));
    expect(await screen.findByText("Suspendimos Grupo Delta.")).toBeVisible(); expect(keys).toHaveLength(2); expect(keys[0]).not.toBe(keys[1]);
  });
  it("cancelar un retry en vuelo aborta la respuesta tardía y mantiene abierto el siguiente formulario", async () => {
    const user = userEvent.setup(); let complete: (() => void) | undefined; let calls = 0;
    server.use(http.post("/api/platform/tenants/delta/suspend", async () => { calls++; if (calls === 1) return HttpResponse.error(); await new Promise<void>((resolve) => { complete = resolve; }); return HttpResponse.json({ version: 9 }); })); render();
    await confirm(user, "Suspender"); fireEvent.click(await screen.findByRole("button", { name: "Reintentar" })); await waitFor(() => expect(complete).toBeDefined()); await user.click(screen.getByRole("button", { name: "Cancelar" })); await openAction(user, "Suspender"); await screen.findByRole("dialog");
    await act(async () => { complete?.(); }); expect(screen.getByRole("dialog")).toBeVisible(); expect(screen.getByRole("textbox", { name: "Motivo" })).toHaveValue(""); expect(screen.queryByText("Suspendimos Grupo Delta.")).not.toBeInTheDocument(); expect(calls).toBe(2);
  });
  it("navegar a otra ficha cacheada abandona el diálogo sin enviar el POST anterior", async () => {
    const user = userEvent.setup(); const posts: { id: string; body: unknown }[] = [];
    server.use(http.post("/api/platform/tenants/:id/suspend", async ({ params, request }) => { posts.push({ id: String(params.id), body: await request.json() }); return HttpResponse.json({ version: 43 }); }));
    const page = render(); cacheOtherOrganization(page); await openAction(user, "Suspender"); await user.type(screen.getByRole("textbox", { name: "Motivo" }), "Motivo de Delta");
    await act(async () => { await page.router.navigate("/plataforma/organizaciones/omega"); }); expect(screen.queryByRole("dialog")).not.toBeInTheDocument(); expect(await screen.findByRole("heading", { name: "Grupo Omega" })).toBeVisible(); expect(posts).toEqual([]); expect(page.queryClient.getQueryData(tenantQueryKey("omega"))).toEqual(otherOrganization);
    await openAction(user, "Suspender"); expect(screen.getByRole("textbox", { name: "Motivo" })).toHaveValue(""); await user.type(screen.getByRole("textbox", { name: "Motivo" }), "Motivo de Omega"); await user.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Suspender" }));
    expect(await screen.findByText("Suspendimos Grupo Omega.")).toBeVisible(); expect(posts).toEqual([{ id: "omega", body: { version: 42, reason: "Motivo de Omega" } }]);
  });
  it("navegar a otra ficha cacheada durante POST descarta éxito tardío y conserva la nueva ficha y su diálogo", async () => {
    const user = userEvent.setup(); let complete: (() => void) | undefined; let calls = 0;
    server.use(http.post("/api/platform/tenants/delta/suspend", async () => { calls++; await new Promise<void>((resolve) => { complete = resolve; }); return HttpResponse.json({ version: 99 }); }));
    const page = render(); cacheOtherOrganization(page); await confirm(user, "Suspender"); await waitFor(() => expect(complete).toBeDefined());
    await act(async () => { await page.router.navigate("/plataforma/organizaciones/omega"); }); expect(screen.queryByRole("dialog")).not.toBeInTheDocument(); expect(await screen.findByRole("heading", { name: "Grupo Omega" })).toBeVisible();
    await openAction(user, "Suspender"); await user.type(screen.getByRole("textbox", { name: "Motivo" }), "Motivo de Omega"); await act(async () => { complete?.(); }); await waitFor(() => expect(page.queryClient.getMutationCache().getAll().some((mutation) => mutation.state.status === "pending")).toBe(false));
    expect(page.queryClient.getQueryData(tenantQueryKey("omega"))).toEqual(otherOrganization); expect(page.queryClient.getQueryData(tenantQueryKey("delta"))).toEqual(organization); expect(screen.getByRole("dialog")).toBeVisible(); expect(screen.getByRole("textbox", { name: "Motivo" })).toHaveValue("Motivo de Omega"); expect(screen.queryByText("Suspendimos Grupo Delta.")).not.toBeInTheDocument(); expect(calls).toBe(1);
  });
  it("navegar a otra ficha cacheada vuelve inerte el retry del aviso anterior", async () => {
    const user = userEvent.setup(); let calls = 0; server.use(http.post("/api/platform/tenants/delta/suspend", () => { calls++; return HttpResponse.error(); }));
    const page = render(); cacheOtherOrganization(page); await confirm(user, "Suspender"); const oldRetry = await screen.findByRole("button", { name: "Reintentar" });
    await act(async () => { await page.router.navigate("/plataforma/organizaciones/omega"); }); expect(screen.queryByRole("dialog")).not.toBeInTheDocument(); expect(await screen.findByRole("heading", { name: "Grupo Omega" })).toBeVisible();
    await openAction(user, "Suspender"); await act(async () => { fireEvent.click(oldRetry); }); await waitFor(() => expect(page.queryClient.getMutationCache().getAll().some((mutation) => mutation.state.status === "pending")).toBe(false));
    expect(calls).toBe(1); expect(page.queryClient.getQueryData(tenantQueryKey("omega"))).toEqual(otherOrganization); expect(screen.getByRole("dialog")).toBeVisible(); expect(screen.getByRole("textbox", { name: "Motivo" })).toHaveValue(""); expect(screen.queryByText("Suspendimos Grupo Delta.")).not.toBeInTheDocument();
  });
  it("carga inicial muestra el estado común hasta recibir la ficha", async () => {
    let complete: (() => void) | undefined; server.use(http.get("/api/platform/tenants/delta", async () => { await new Promise<void>((resolve) => { complete = resolve; }); return HttpResponse.json(organization); })); render();
    await waitFor(() => expect(complete).toBeDefined()); expect(screen.getByText("Cargando…")).toHaveAttribute("role", "status"); await act(async () => { complete?.(); }); expect(await screen.findByRole("heading", { name: "Grupo Delta" })).toBeVisible();
  });
  it("sin read la guarda bloquea la ficha y no repite la lectura", async () => {
    let reads = 0; server.use(http.get("/api/platform/tenants/delta", () => { reads++; return HttpResponse.json(organization); })); const { queryClient } = render();
    await screen.findByRole("heading", { name: "Grupo Delta" }); act(() => queryClient.setQueryData(currentUserQueryKey, { ...platformOperator, effectivePermissions: { ...platformOperator.effectivePermissions, platform: ["platform.tenants.manage"] } }));
    expect(await screen.findByRole("heading", { name: "No tenés permiso para ver esta página" })).toBeVisible(); expect(reads).toBe(1);
  });
});

