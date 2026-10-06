import { act, fireEvent, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
import { configureI18n, changeCulture } from "@/shared/i18n";
import { referenceDataFixture } from "@/test/mocks/handlers";
import { server } from "@/test/mocks/server";
import { renderRouteWithProviders } from "@/test/utils/renderWithProviders";
import { asPhone } from "@/test/utils/phone";
import type { PlatformTenantResponse, TenantStatus } from "@/shared/api/types";
import { tenantsQueryRoot } from "../api/tenants";
import { currentUserQueryKey } from "@/auth/useCurrentUser";
import { platformOperator } from "@/test/mocks/currentUsers";

beforeAll(async () => { await import("./OrganizationsPage"); });

const organization: PlatformTenantResponse = { id: "delta", name: "Grupo Delta", status: "Active", source: "SelfService", createdAtUtc: "2026-01-12T12:00:00Z", companyCount: 3, memberCount: 11, version: 2, ownerName: "Lucía Fernández", ownerEmail: "lucia@example.com" };
const counts = { total: 7, statuses: [{ status: "PendingApproval", count: 2 }, { status: "Active", count: 2 }, { status: "Suspended", count: 1 }, { status: "Provisioning", count: 1 }, { status: "Closed", count: 1 }], sources: [{ source: "SelfService", count: 5 }, { source: "Platform", count: 2 }] };
function list(items = [organization], totalCount = items.length, pageSize = 10) { return { items, page: 1, pageSize, totalCount, totalPages: Math.ceil(totalCount / pageSize), hasPrevious: false, hasNext: totalCount > pageSize }; }
async function openMenu(user: ReturnType<typeof userEvent.setup>) {
  const trigger = await screen.findByRole("button", { name: "Acciones de Grupo Delta" });
  trigger.focus(); await user.keyboard("{ArrowDown}");
  await screen.findByRole("menuitem", { name: "Ver ficha" });
}
async function openAction(user: ReturnType<typeof userEvent.setup>, label: string) {
  await openMenu(user);
  await user.click(await screen.findByRole("menuitem", { name: label }));
}
beforeEach(async () => {
  await configureI18n(referenceDataFixture().cultures);
  await changeCulture("es-AR");
  server.use(http.get("/api/platform/tenants/paged", () => HttpResponse.json(list())), http.get("/api/platform/tenants/filter-counts", () => HttpResponse.json(counts)));
});
describe("OrganizationsPage", () => {
  it("muestra la banda global, las columnas del tablero y Crear, sin montar la ficha futura", async () => {
    const { container } = renderRouteWithProviders("/plataforma", { as: "platform-operator" });
    expect(await screen.findByRole("heading", { name: "Organizaciones", level: 1 })).toBeVisible();
    expect(await screen.findByText("7 organizaciones · 2 esperan aprobación")).toBeVisible();
    expect(screen.getByRole("link", { name: "Grupo Delta" })).toHaveAttribute("href", "/plataforma/organizaciones/delta");
    expect(screen.getByText(/Alta/)).toHaveTextContent("Alta 12/01/2026 · Autoservicio");
    expect(screen.getByText("lucia@example.com")).toBeVisible();
    expect(screen.getByRole("button", { name: "Crear organización" })).toBeEnabled();
    expect(await axe(container)).toHaveNoViolations();
  });
  it("manda la versión respondida en la acción siguiente aunque la relectura conserve la versión anterior", async () => {
    const user = userEvent.setup();
    const bodies: unknown[] = [];
    server.use(http.post("/api/platform/tenants/delta/suspend", async ({ request }) => { bodies.push(await request.json()); return HttpResponse.json({ version: 10 }); }), http.post("/api/platform/tenants/delta/reactivate", async ({ request }) => { bodies.push(await request.json()); return HttpResponse.json({ version: 11 }); }));
    renderRouteWithProviders("/plataforma", { as: "platform-operator" });
    await openMenu(user);
    await user.click(screen.getByRole("menuitem", { name: "Suspender" }));
    await user.type(screen.getByRole("textbox", { name: "Motivo" }), "Revisión");
    await user.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Suspender" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    await openMenu(user);
    await user.click(screen.getByRole("menuitem", { name: "Reactivar" }));
    await user.type(screen.getByRole("textbox", { name: "Motivo" }), "Resuelto");
    await user.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Reactivar" }));
    await waitFor(() => expect(bodies).toEqual([{ version: 2, reason: "Revisión" }, { version: 10, reason: "Resuelto" }]));
  });
  it("permite la acción siguiente con la versión respondida mientras la relectura sigue pendiente", async () => {
    const user = userEvent.setup(); const bodies: unknown[] = []; let reads = 0; let release: (() => void) | undefined;
    const gate = new Promise<void>((resolve) => { release = resolve; });
    server.use(http.get("/api/platform/tenants/paged", async () => { if (++reads > 1) await gate; return HttpResponse.json(list()); }), http.post("/api/platform/tenants/delta/suspend", async ({ request }) => { bodies.push(await request.json()); return HttpResponse.json({ version: 10 }); }), http.post("/api/platform/tenants/delta/reactivate", async ({ request }) => { bodies.push(await request.json()); return HttpResponse.json({ version: 11 }); }));
    renderRouteWithProviders("/plataforma", { as: "platform-operator" });
    try {
      await openAction(user, "Suspender"); await user.type(screen.getByRole("textbox", { name: "Motivo" }), "Revisión"); await user.click(screen.getByRole("button", { name: "Suspender" }));
      await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
      await openAction(user, "Reactivar"); await user.type(screen.getByRole("textbox", { name: "Motivo" }), "Resuelto"); await user.click(screen.getByRole("button", { name: "Reactivar" }));
      await waitFor(() => expect(bodies).toEqual([{ version: 2, reason: "Revisión" }, { version: 10, reason: "Resuelto" }]));
    } finally { await act(async () => { release?.(); }); }
  });
  it("mantiene banda global y conteos cruzados al buscar con debounce y elegir filtros en la URL", async () => {
    const user = userEvent.setup(); const requests: URL[] = []; const countRequests: URL[] = [];
    server.use(http.get("/api/platform/tenants/paged", ({ request }) => { requests.push(new URL(request.url)); return HttpResponse.json(list()); }), http.get("/api/platform/tenants/filter-counts", ({ request }) => { const url = new URL(request.url); countRequests.push(url); return HttpResponse.json(url.search ? { total: 1, statuses: [{ status: "Active", count: 1 }], sources: [{ source: "SelfService", count: 1 }] } : counts); }));
    const { router } = renderRouteWithProviders("/plataforma?page=2&pageSize=50", { as: "platform-operator" });
    await screen.findByRole("link", { name: "Grupo Delta" });
    expect(requests[0].searchParams.get("sort")).toBe("name");
    await user.type(screen.getByRole("searchbox", { name: "Buscar por nombre o correo" }), "Delta");
    expect(requests.at(-1)?.searchParams.get("search")).toBeNull();
    await waitFor(() => expect(requests.at(-1)?.searchParams.get("search")).toBe("Delta"));
    expect(router.state.location.search).toContain("search=Delta"); expect(router.state.location.search).not.toContain("page=2");
    await user.click(screen.getByRole("button", { name: "Estado: todas" }));
    expect(await screen.findByRole("menuitemradio", { name: /^Activa/u })).toHaveTextContent("Activa1");
    await user.click(screen.getByRole("menuitemradio", { name: /^Activa/u }));
    await waitFor(() => expect(requests.at(-1)?.searchParams.get("status")).toBe("Active"));
    await user.click(screen.getByRole("button", { name: "Origen: todos" }));
    await user.click(await screen.findByRole("menuitemradio", { name: /^Autoservicio/u }));
    await waitFor(() => expect(countRequests.at(-1)?.searchParams.get("source")).toBe("SelfService"));
    expect(countRequests.at(-1)?.searchParams.get("status")).toBe("Active");
    expect(screen.getByText("7 organizaciones · 2 esperan aprobación")).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Limpiar" }));
    await waitFor(() => expect(router.state.location.search).not.toMatch(/search|status|source/u));
  });
  it.each([
    ["PendingApproval", ["Ver ficha", "Aprobar", "Rechazar"]],
    ["Active", ["Ver ficha", "Suspender"]],
    ["Suspended", ["Ver ficha", "Reactivar", "Cerrar"]],
    ["Provisioning", ["Ver ficha", "Reintentar el alta"]],
    ["Closed", ["Ver ficha"]],
  ] as [TenantStatus, string[]][])("%s ofrece sólo sus acciones y separa el peligro al final", async (status, labels) => {
    const user = userEvent.setup(); server.use(http.get("/api/platform/tenants/paged", () => HttpResponse.json(list([{ ...organization, status }]))));
    renderRouteWithProviders("/plataforma", { as: "platform-operator" });
    await openMenu(user);
    expect(screen.getAllByRole("menuitem").map((item) => item.textContent)).toEqual(labels);
    if (["PendingApproval", "Active", "Suspended"].includes(status)) { expect(screen.getByRole("separator")).toBeVisible(); expect(screen.getAllByRole("menuitem").at(-1)).toHaveAttribute("data-variant", "destructive"); }
    await user.keyboard("{Escape}");
  });
  it.each([
    ["PendingApproval", "approve", "Aprobar", "Aprobamos Grupo Delta. Le avisamos a lu•••@example.com."],
    ["PendingApproval", "reject", "Rechazar", "Rechazamos Grupo Delta."],
    ["Active", "suspend", "Suspender", "Suspendimos Grupo Delta."],
    ["Suspended", "reactivate", "Reactivar", "Reactivamos Grupo Delta."],
    ["Suspended", "close", "Cerrar", "Cerramos Grupo Delta."],
  ] as const)("%s %s requiere motivo y manda versión + clave, con confirmación sin X y su aviso", async (status, action, label, success) => {
    const user = userEvent.setup(); let body: unknown; let key: string | null = null; let complete: (() => void) | undefined;
    server.use(http.get("/api/platform/tenants/paged", () => HttpResponse.json(list([{ ...organization, status }]))), http.post(`/api/platform/tenants/delta/${action}`, async ({ request }) => { body = await request.json(); key = request.headers.get("Idempotency-Key"); await new Promise<void>((resolve) => { complete = resolve; }); return HttpResponse.json({ version: 4 }); }));
    renderRouteWithProviders("/plataforma", { as: "platform-operator" }); await openAction(user, label);
    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByRole("heading", { name: `¿${label} Grupo Delta?` })).toBeVisible();
    expect(dialog.querySelector('button[aria-label="Cerrar"]')).toBeNull();
    await user.click(within(dialog).getByRole("button", { name: label }));
    expect(await screen.findByText("Escribí el motivo.")).toBeVisible(); expect(body).toBeUndefined();
    await user.type(screen.getByRole("textbox", { name: "Motivo" }), "  Revisión  ");
    await user.click(within(dialog).getByRole("button", { name: label }));
    const pendingLabels = { approve: "Aprobando…", reject: "Rechazando…", suspend: "Suspendiendo…", reactivate: "Reactivando…", close: "Cerrando…" };
    expect(await within(dialog).findByRole("button", { name: pendingLabels[action] })).toBeDisabled();
    await act(async () => { complete?.(); });
    await waitFor(() => expect(body).toEqual({ version: 2, reason: "Revisión" }));
    expect(key).toMatch(/^[a-f\d-]{36}$/u); expect(await screen.findByText(success)).toBeVisible();
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(screen.getByRole("button", { name: "Acciones de Grupo Delta" })).toHaveFocus();
  });
  it("reintenta el alta directamente, sin motivo, y muestra el error de negocio rojo", async () => {
    const user = userEvent.setup(); const bodies: unknown[] = []; let failing = true;
    server.use(http.get("/api/platform/tenants/paged", () => HttpResponse.json(list([{ ...organization, status: "Provisioning" }]))), http.post("/api/platform/tenants/delta/retry-provisioning", async ({ request }) => { bodies.push(await request.json()); return failing ? HttpResponse.json({ code: "Tenancy.Tenant.InvalidTransition", detail: "El alta ya cambió." }, { status: 409 }) : HttpResponse.json({ version: 9 }); }));
    renderRouteWithProviders("/plataforma", { as: "platform-operator" }); await openAction(user, "Reintentar el alta");
    expect(await screen.findByText("El alta ya cambió.")).toBeVisible(); expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    failing = false; await openAction(user, "Reintentar el alta");
    expect(await screen.findByText("Terminamos el alta de Grupo Delta.")).toBeVisible(); expect(bodies).toEqual([{ version: 2 }, { version: 2 }]);
  });
  it("conserva la versión respondida al suspender ante una lectura ajena", async () => {
    const user = userEvent.setup(); let read = organization; const bodies: unknown[] = [];
    server.use(http.get("/api/platform/tenants/paged", () => HttpResponse.json(list([read]))), http.post("/api/platform/tenants/delta/suspend", async ({ request }) => { bodies.push(await request.json()); return HttpResponse.json({ version: 10 }); }), http.post("/api/platform/tenants/delta/reactivate", async ({ request }) => { bodies.push(await request.json()); return HttpResponse.json({ code: "General.ConcurrencyConflict", detail: "Otra persona cambió la organización." }, { status: 409 }); }));
    const { queryClient } = renderRouteWithProviders("/plataforma", { as: "platform-operator" });
    await openAction(user, "Suspender"); await user.type(screen.getByRole("textbox", { name: "Motivo" }), "Revisión"); await user.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Suspender" })); await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    read = { ...organization, version: 50 }; await act(async () => { await queryClient.invalidateQueries({ queryKey: tenantsQueryRoot }); });
    await openAction(user, "Reactivar"); await user.type(screen.getByRole("textbox", { name: "Motivo" }), "Resuelto"); await user.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Reactivar" }));
    expect(await screen.findByText("Otra persona cambió la organización.")).toBeVisible(); expect(bodies[1]).toEqual({ version: 10, reason: "Resuelto" });
  });
  it("tras el 409 al cerrar acepta la versión de la lectura autoritativa", async () => {
    const user = userEvent.setup(); let read = organization; const bodies: unknown[] = [];
    server.use(http.get("/api/platform/tenants/paged", () => HttpResponse.json(list([read]))), http.post("/api/platform/tenants/delta/suspend", async ({ request }) => {
      bodies.push(await request.json());
      if (bodies.length === 1) { read = { ...organization, version: 50 }; return HttpResponse.json({ code: "General.ConcurrencyConflict", detail: "Otra persona cambió la organización." }, { status: 409 }); }
      return HttpResponse.json({ version: 51 });
    }));
    renderRouteWithProviders("/plataforma", { as: "platform-operator" });
    await openAction(user, "Suspender"); await user.click(screen.getByRole("textbox", { name: "Motivo" })); await user.paste("Revisión"); await user.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Suspender" }));
    expect(await screen.findByText("Otra persona cambió la organización.")).toBeVisible(); expect(bodies[0]).toEqual({ version: 2, reason: "Revisión" });
    await user.click(screen.getByRole("button", { name: "Cancelar" }));
    await openAction(user, "Suspender"); await user.type(screen.getByRole("textbox", { name: "Motivo" }), "Nuevo" ); await user.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Suspender" }));
    await waitFor(() => expect(bodies[1]).toEqual({ version: 50, reason: "Nuevo" }));
  });
  it("el reintento global de red conserva clave, motivo y callbacks de la confirmación", async () => {
    const user = userEvent.setup(); const keys: (string | null)[] = []; const bodies: unknown[] = [];
    server.use(http.post("/api/platform/tenants/delta/suspend", async ({ request }) => { keys.push(request.headers.get("Idempotency-Key")); bodies.push(await request.json()); return keys.length === 1 ? HttpResponse.error() : HttpResponse.json({ version: 5 }); }));
    renderRouteWithProviders("/plataforma", { as: "platform-operator" }); await openAction(user, "Suspender"); await user.type(screen.getByRole("textbox", { name: "Motivo" }), "Revisión"); await user.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Suspender" }));
    // Como ReasonDialog.test: jsdom no carga el pointer-events:auto del toast que está sobre el diálogo modal.
    fireEvent.click(await screen.findByRole("button", { name: "Reintentar" }));
    expect(await screen.findByText("Suspendimos Grupo Delta.")).toBeVisible(); await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(keys).toHaveLength(2); expect(keys[0]).toBe(keys[1]); expect(bodies).toEqual([{ version: 2, reason: "Revisión" }, { version: 2, reason: "Revisión" }]);
  });
  it("corregir el motivo después de una respuesta perdida inicia otra operación", async () => {
    const user = userEvent.setup(); const keys: (string | null)[] = []; const bodies: unknown[] = [];
    server.use(http.post("/api/platform/tenants/delta/suspend", async ({ request }) => { keys.push(request.headers.get("Idempotency-Key")); bodies.push(await request.json()); return keys.length === 1 ? HttpResponse.error() : HttpResponse.json({ version: 5 }); }));
    renderRouteWithProviders("/plataforma", { as: "platform-operator" }); await openAction(user, "Suspender"); await user.type(screen.getByRole("textbox", { name: "Motivo" }), "Revisión"); await user.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Suspender" })); await screen.findByRole("button", { name: "Reintentar" });
    await user.clear(screen.getByRole("textbox", { name: "Motivo" })); await user.type(screen.getByRole("textbox", { name: "Motivo" }), "Otro motivo"); await user.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Suspender" }));
    expect(await screen.findByText("Suspendimos Grupo Delta.")).toBeVisible(); expect(keys).toHaveLength(2); expect(keys[0]).not.toBe(keys[1]); expect(bodies).toEqual([{ version: 2, reason: "Revisión" }, { version: 2, reason: "Otro motivo" }]);
  });
  it("abandonar el diálogo tras una respuesta perdida y reabrirlo inicia otra operación", async () => {
    const user = userEvent.setup(); const keys: (string | null)[] = [];
    server.use(http.post("/api/platform/tenants/delta/suspend", ({ request }) => { keys.push(request.headers.get("Idempotency-Key")); return keys.length === 1 ? HttpResponse.error() : HttpResponse.json({ version: 5 }); }));
    renderRouteWithProviders("/plataforma", { as: "platform-operator" });
    await openAction(user, "Suspender"); await user.type(screen.getByRole("textbox", { name: "Motivo" }), "Revisión"); await user.click(screen.getByRole("button", { name: "Suspender" })); await screen.findByRole("button", { name: "Reintentar" });
    await user.click(screen.getByRole("button", { name: "Cancelar" })); await openAction(user, "Suspender"); await user.type(screen.getByRole("textbox", { name: "Motivo" }), "Revisión"); await user.click(screen.getByRole("button", { name: "Suspender" }));
    expect(await screen.findByText("Suspendimos Grupo Delta.")).toBeVisible(); expect(keys).toHaveLength(2); expect(keys[0]).not.toBe(keys[1]);
  });
  it("cancelar un reintento en vuelo conserva su clave enviada y su respuesta tardía no cierra el diálogo nuevo", async () => {
    const user = userEvent.setup(); const keys: (string | null)[] = []; let complete: (() => void) | undefined;
    server.use(http.post("/api/platform/tenants/delta/suspend", async ({ request }) => {
      keys.push(request.headers.get("Idempotency-Key")); if (keys.length === 1) return HttpResponse.error();
      await new Promise<void>((resolve) => { complete = resolve; }); return HttpResponse.json({ version: 5 });
    }));
    const { queryClient } = renderRouteWithProviders("/plataforma", { as: "platform-operator" }); await openAction(user, "Suspender"); await user.type(screen.getByRole("textbox", { name: "Motivo" }), "Revisión"); await user.click(screen.getByRole("button", { name: "Suspender" }));
    fireEvent.click(await screen.findByRole("button", { name: "Reintentar" })); await waitFor(() => expect(keys).toHaveLength(2));
    await user.click(screen.getByRole("button", { name: "Cancelar" })); await openAction(user, "Suspender"); await user.type(screen.getByRole("textbox", { name: "Motivo" }), "Otro recorrido");
    await act(async () => { complete?.(); });
    await waitFor(() => expect(queryClient.isMutating()).toBe(0));
    expect(keys[0]).toBe(keys[1]); expect(screen.getByRole("dialog")).toBeVisible(); expect(screen.getByRole("textbox", { name: "Motivo" })).toHaveValue("Otro recorrido");
    expect(screen.queryByText("Suspendimos Grupo Delta.")).not.toBeInTheDocument();
  });
  it("el aviso de un diálogo cancelado no vuelve a enviar ni cierra otro recorrido", async () => {
    const user = userEvent.setup(); const keys: (string | null)[] = []; const bodies: unknown[] = [];
    server.use(http.post("/api/platform/tenants/delta/suspend", async ({ request }) => { keys.push(request.headers.get("Idempotency-Key")); bodies.push(await request.json()); return keys.length < 3 ? HttpResponse.error() : HttpResponse.json({ version: 5 }); }));
    renderRouteWithProviders("/plataforma", { as: "platform-operator" }); await openAction(user, "Suspender"); await user.type(screen.getByRole("textbox", { name: "Motivo" }), "Revisión"); await user.click(screen.getByRole("button", { name: "Suspender" }));
    const retryOriginal = await screen.findByRole("button", { name: "Reintentar" }); await user.click(screen.getByRole("button", { name: "Cancelar" }));
    await openAction(user, "Suspender"); await user.type(screen.getByRole("textbox", { name: "Motivo" }), "Otro recorrido"); await user.click(screen.getByRole("button", { name: "Suspender" })); await waitFor(() => expect(keys).toHaveLength(2));
    await act(async () => { fireEvent.click(retryOriginal); });
    expect(keys).toHaveLength(2); expect(keys[0]).not.toBe(keys[1]); expect(bodies).toEqual([{ version: 2, reason: "Revisión" }, { version: 2, reason: "Otro recorrido" }]); expect(screen.getByRole("textbox", { name: "Motivo" })).toHaveValue("Otro recorrido"); expect(screen.queryByText("Suspendimos Grupo Delta.")).not.toBeInTheDocument();
  });
  it("Reintentar global del alta conserva la clave y deja su versión como base para Suspender", async () => {
    const user = userEvent.setup(); const keys: (string | null)[] = []; let body: unknown;
    server.use(http.get("/api/platform/tenants/paged", () => HttpResponse.json(list([{ ...organization, status: "Provisioning" }]))), http.post("/api/platform/tenants/delta/retry-provisioning", ({ request }) => { keys.push(request.headers.get("Idempotency-Key")); return keys.length === 1 ? HttpResponse.error() : HttpResponse.json({ version: 15 }); }), http.post("/api/platform/tenants/delta/suspend", async ({ request }) => { body = await request.json(); return HttpResponse.json({ version: 16 }); }));
    renderRouteWithProviders("/plataforma", { as: "platform-operator" }); await openAction(user, "Reintentar el alta"); await user.click(await screen.findByRole("button", { name: "Reintentar" })); expect(await screen.findByText("Terminamos el alta de Grupo Delta.")).toBeVisible(); expect(keys).toHaveLength(2); expect(keys[0]).toBe(keys[1]);
    await openAction(user, "Suspender"); await user.type(screen.getByRole("textbox", { name: "Motivo" }), "Revisión"); await user.click(screen.getByRole("button", { name: "Suspender" })); await waitFor(() => expect(body).toEqual({ version: 15, reason: "Revisión" }));
  });
  it("el 409 de estado inválido conserva la franja y cerrar con Escape relee", async () => {
    const user = userEvent.setup(); let reads = 0;
    server.use(http.get("/api/platform/tenants/paged", () => { reads++; return HttpResponse.json(list()); }), http.post("/api/platform/tenants/delta/suspend", () => HttpResponse.json({ code: "Tenancy.Tenant.InvalidTransition", detail: "El estado cambió." }, { status: 409 })));
    renderRouteWithProviders("/plataforma", { as: "platform-operator" }); await openAction(user, "Suspender"); await user.type(screen.getByRole("textbox", { name: "Motivo" }), "Revisión"); await user.click(screen.getByRole("button", { name: "Suspender" })); expect(await screen.findByText("El estado cambió.")).toBeVisible(); expect(reads).toBe(1);
    await user.keyboard("{Escape}"); await waitFor(() => expect(reads).toBe(2));
  });
  it("la tabla muestra 50 filas cuando se elige 50 por página", async () => {
    const user = userEvent.setup(); const rows = Array.from({ length: 50 }, (_, index) => ({ ...organization, id: `org-${index}`, name: `Grupo ${index}` }));
    server.use(http.get("/api/platform/tenants/paged", ({ request }) => { const size = Number(new URL(request.url).searchParams.get("pageSize") ?? "10"); return HttpResponse.json(list(rows.slice(0, size), 50, size)); }));
    const { router } = renderRouteWithProviders("/plataforma", { as: "platform-operator" }); await screen.findByRole("link", { name: "Grupo 0" }); expect(screen.getAllByRole("row")).toHaveLength(11);
    screen.getByRole("combobox", { name: "Filas por página" }).focus(); await user.keyboard("{ArrowDown}"); await user.click(await screen.findByRole("option", { name: "50 por página" }));
    await waitFor(() => expect(screen.getAllByRole("row")).toHaveLength(51)); expect(router.state.location.search).toContain("pageSize=50"); expect(screen.getByText("1–50 de 50")).toBeVisible();
  });
  it("sin manage conserva Ver ficha y oculta todas las escrituras y Crear", async () => {
    const user = userEvent.setup(); renderRouteWithProviders("/plataforma", { as: "platform-operator-reader" });
    await openMenu(user);
    expect(screen.getAllByRole("menuitem")).toHaveLength(1); expect(screen.getByRole("menuitem", { name: "Ver ficha" })).toBeVisible(); expect(screen.queryByRole("button", { name: "Crear organización" })).not.toBeInTheDocument();
  });
  it("en el teléfono a 390 usa filas sin avatar, fecha completa, Sigma sin empresas y Cargar más", async () => {
    const restore = asPhone(); const user = userEvent.setup(); const pageSizes: string[] = [];
    const rows = [{ ...organization, id: "omega", name: "Omega", ownerName: null, companyCount: 1, memberCount: 1 }, { ...organization, id: "sigma", name: "Sigma", ownerName: "Rosa Luna", companyCount: 0, memberCount: 0, status: "Provisioning" as const }];
    try {
      server.use(http.get("/api/platform/tenants/paged", ({ request }) => { const size = new URL(request.url).searchParams.get("pageSize") ?? "10"; pageSizes.push(size); return HttpResponse.json(list(rows, 50, Number(size))); }));
      const { container } = renderRouteWithProviders("/plataforma", { as: "platform-operator" });
      const omega = await screen.findByRole("link", { name: /^Omega/u }); expect(omega).toHaveTextContent("12/01/2026"); expect(omega).toHaveTextContent("lucia@example.com · 1 empresa · 1 miembro");
      expect(screen.getByRole("link", { name: /Sigma/ })).toHaveTextContent("Rosa Luna · sin empresas"); expect(screen.getByRole("link", { name: /Sigma/ })).not.toHaveTextContent("0 miembros");
      expect(screen.queryByRole("table")).not.toBeInTheDocument(); expect(omega.closest("li")!.querySelector("[data-slot='avatar']")).toBeNull(); expect(screen.getByRole("button", { name: "Crear organización" })).toHaveClass("fixed", "size-14");
      await user.click(screen.getByRole("button", { name: "Cargar más" })); await waitFor(() => expect(pageSizes.at(-1)).toBe("20"));
      expect(await axe(container)).toHaveNoViolations();
    } finally { restore(); }
  });
  it("la tabla con dueño sin nombre muestra — y la singular de espera queda en la banda", async () => {
    server.use(http.get("/api/platform/tenants/paged", () => HttpResponse.json(list([{ ...organization, ownerName: null }]))), http.get("/api/platform/tenants/filter-counts", () => HttpResponse.json({ ...counts, statuses: [{ status: "PendingApproval", count: 1 }] })));
    renderRouteWithProviders("/plataforma", { as: "platform-operator" });
    expect(await screen.findByText("7 organizaciones · 1 espera aprobación")).toBeVisible(); expect(screen.getByLabelText("Sin dato")).toHaveTextContent("—"); expect(screen.getByText("1 de 1")).toBeVisible();
  });
  it.each([false, true])("vacío filtered=%s ofrece el texto y la recuperación del tablero", async (filtered) => {
    server.use(http.get("/api/platform/tenants/paged", () => HttpResponse.json(list([]))));
    renderRouteWithProviders(filtered ? "/plataforma?status=Closed" : "/plataforma", { as: "platform-operator" });
    expect(await screen.findByText(filtered ? "Ninguna organización coincide con los filtros" : "Todavía no hay organizaciones")).toBeVisible();
    expect(screen.queryByRole("button", { name: "Limpiar filtros" }) !== null).toBe(filtered);
  });
  it("un error ofrece Reintentar y un 403 bloquea la vista", async () => {
    const user = userEvent.setup(); let failing = true;
    server.use(http.get("/api/platform/tenants/paged", () => failing ? HttpResponse.json({ detail: "Error" }, { status: 500 }) : HttpResponse.json(list())));
    const first = renderRouteWithProviders("/plataforma", { as: "platform-operator" });
    await user.click(await screen.findByRole("button", { name: "Reintentar" })); failing = false; await user.click(screen.getByRole("button", { name: "Reintentar" })); expect(await screen.findByRole("link", { name: "Grupo Delta" })).toBeVisible(); first.unmount();
    server.use(http.get("/api/platform/tenants/paged", () => HttpResponse.json({ code: "General.Forbidden" }, { status: 403 })));
    renderRouteWithProviders("/plataforma", { as: "platform-operator" }); expect(await screen.findByRole("heading", { name: "No tenés permiso para ver esta página" })).toBeVisible();
  });
  it("en en-US traduce la pantalla y presenta la fecha con esa cultura", async () => {
    const { queryClient } = renderRouteWithProviders("/plataforma", { as: "platform-operator" }); await screen.findByRole("link", { name: "Grupo Delta" });
    await act(async () => { queryClient.setQueryData(currentUserQueryKey, { ...platformOperator, culture: "en-US" }); });
    expect(await screen.findByRole("heading", { name: "Organizations", level: 1 })).toBeVisible(); await waitFor(() => expect(screen.getByText(/Created/)).toHaveTextContent("Created 01/12/2026 · Self service")); expect(screen.getByRole("button", { name: "Create organization" })).toBeVisible();
  });
});
