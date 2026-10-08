import { act, fireEvent, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { StrictMode } from "react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import { changeCulture, configureI18n } from "@/shared/i18n";
import type { ApiSchemas } from "@/shared/api/types";
import { meHandlerFor, referenceDataFixture } from "@/test/mocks/handlers";
import { platformOperator } from "@/test/mocks/currentUsers";
import { server } from "@/test/mocks/server";
import { asPhone } from "@/test/utils/phone";
import { renderRouteWithProviders, renderWithProviders } from "@/test/utils/renderWithProviders";
import { routes } from "@/app/routes";
import { currentUserQueryKey } from "@/auth/useCurrentUser";
import { recoveriesQueryRoot } from "../api/recoveries";

type Recovery = ApiSchemas["PlatformRecoveryResponse"];
const pending: Recovery = { id: "r1", createdAtUtc: "2026-09-27T13:20:00Z", accountId: "pablo", accountName: "Pablo Ortiz", previousMethodType: "Email", previousMethod: "pa•••@kappa.ejemplo.com", newMethodType: "Email", newMethod: "pa•••@gmail.com", status: "Pending", version: 12 };
const noAccount: Recovery = { ...pending, id: "r2", accountId: null, accountName: null, previousMethod: "ma•••@omega.ejemplo.com", newMethod: "ma•••@gmail.com" };
const resolved: Recovery = { ...pending, id: "r3", accountId: "rosa", accountName: "Rosa Luna", status: "Approved", decidedAtUtc: "2026-09-28T13:00:00Z", decidedBy: "Laura Díaz", reason: "Confirmó sus datos por videollamada." };
const counts = { total: 4, statuses: [{ status: "Pending", count: 2 }, { status: "Approved", count: 1 }, { status: "Rejected", count: 1 }] };
function list(items: Recovery[] = [pending, noAccount, resolved], pageSize = 10) { return { items, page: 1, pageSize, totalCount: items.length, totalPages: items.length ? 1 : 0, hasPrevious: false, hasNext: false }; }
async function open(user: ReturnType<typeof userEvent.setup>, label = "Revisar", name = "Pablo Ortiz") {
  const trigger = await screen.findByRole("button", { name: `Acciones de ${name}` }); trigger.focus(); await user.keyboard("{ArrowDown}");
  await user.click(await screen.findByRole("menuitem", { name: label })); return screen.getByRole("dialog");
}
async function send(user: ReturnType<typeof userEvent.setup>, label = "Aprobar") {
  await user.type(screen.getByRole("textbox", { name: "Motivo" }), "Revisión"); await user.click(within(screen.getByRole("dialog")).getByRole("button", { name: label }));
}
beforeAll(async () => { await import("./RecoveriesPage"); });
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });
beforeEach(async () => {
  await configureI18n(referenceDataFixture().cultures); await changeCulture("es-AR");
  server.use(http.get("/api/platform/recoveries/paged", () => HttpResponse.json(list())), http.get("/api/platform/recoveries/filter-counts", () => HttpResponse.json(counts)));
});

describe("Recuperaciones de Plataforma", () => {
  it("banda global, datos tapados, fecha UTC, vínculo por accountId y axe", async () => {
    const { container } = renderRouteWithProviders("/plataforma/recuperaciones", { as: "platform-operator" });
    expect(await screen.findByRole("heading", { name: "Recuperaciones", level: 1 })).toBeVisible();
    expect(await screen.findByText("4 pedidos · 2 pendientes")).toBeVisible();
    expect(screen.getByRole("link", { name: "Pablo Ortiz" })).toHaveAttribute("href", "/plataforma/cuentas/pablo");
    expect(screen.getByText("Sin cuenta")).toBeVisible(); expect(screen.getAllByText("pa•••@gmail.com").length).toBeGreaterThan(0);
    expect(screen.getAllByText("27/09/2026 10:20").length).toBeGreaterThan(0); expect(await axe(container)).toHaveNoViolations();
  });
  it("accountId presente con nombre null conserva vacío y permite aprobar; nombre presente sin id no inventa cuenta", async () => {
    const user = userEvent.setup(); server.use(http.get("/api/platform/recoveries/paged", () => HttpResponse.json(list([{ ...pending, accountName: null }, { ...noAccount, accountName: "Nombre residual" }]))));
    renderRouteWithProviders("/plataforma/recuperaciones", { as: "platform-operator" });
    expect(await screen.findByRole("link", { name: "Sin dato" })).toHaveAttribute("href", "/plataforma/cuentas/pablo");
    expect(screen.queryByText("Nombre residual")).not.toBeInTheDocument();
    await open(user, "Revisar", "27/09/2026 10:20"); expect(within(screen.getByRole("dialog")).getByRole("button", { name: "Aprobar" })).toBeEnabled(); expect(within(screen.getByRole("dialog")).queryByText("Ninguna")).not.toBeInTheDocument();
  });
  it("sin pedidos: banda y vacío, sin pie", async () => {
    server.use(http.get("/api/platform/recoveries/paged", () => HttpResponse.json(list([]))), http.get("/api/platform/recoveries/filter-counts", () => HttpResponse.json({ total: 0, statuses: [] })));
    renderRouteWithProviders("/plataforma/recuperaciones", { as: "platform-operator" });
    expect(await screen.findByText("Sin pedidos")).toBeVisible(); expect(await screen.findByText("No hay pedidos de recuperación")).toBeVisible(); expect(screen.queryByRole("combobox", { name: "Filas por página" })).not.toBeInTheDocument(); expect(screen.queryByText("0 de 0")).not.toBeInTheDocument();
  });
  it("sin coincidencias permite limpiar y conserva banda global desacoplada", async () => {
    server.use(http.get("/api/platform/recoveries/paged", ({ request }) => HttpResponse.json(new URL(request.url).searchParams.has("search") ? list([]) : list())));
    const user = userEvent.setup(); const { router } = renderRouteWithProviders("/plataforma/recuperaciones?search=nada", { as: "platform-operator" });
    expect(await screen.findByText("Ningún pedido coincide con los filtros")).toBeVisible(); expect(screen.getByText("4 pedidos · 2 pendientes")).toBeVisible(); expect(screen.queryByRole("combobox", { name: "Filas por página" })).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Limpiar filtros" })); await screen.findByRole("link", { name: "Pablo Ortiz" }); expect(router.state.location.search).toBe("");
  });
  it("Estado ofrece conteos y búsqueda llega a la API con el filtro, reiniciando página", async () => {
    const urls: URL[] = []; server.use(http.get("/api/platform/recoveries/paged", ({ request }) => { urls.push(new URL(request.url)); return HttpResponse.json(list()); }));
    const user = userEvent.setup(); const { router } = renderRouteWithProviders("/plataforma/recuperaciones", { as: "platform-operator" });
    const filter = await screen.findByRole("button", { name: "Estado: todos" }); filter.focus(); await user.keyboard("{ArrowDown}");
    expect(await screen.findByRole("menuitemradio", { name: /Pendientes/ })).toHaveTextContent("Pendientes2"); await user.click(screen.getByRole("menuitemradio", { name: /Pendientes/ }));
    await user.type(screen.getByRole("searchbox", { name: "Buscar por cuenta, correo o teléfono" }), "Pablo");
    await waitFor(() => expect(urls.some((url) => url.searchParams.get("search") === "Pablo" && url.searchParams.get("status") === "Pending")).toBe(true));
    expect(router.state.location.search).toContain("status=Pending"); expect(router.state.location.search).not.toContain("page=2");
  });
  it.each([1, 50])("%s filas conserva pie y tamaño del servidor", async (size) => {
    const rows = Array.from({ length: size }, (_, index) => ({ ...pending, id: `r${index}`, accountId: `p${index}`, accountName: `Persona ${index}` }));
    server.use(http.get("/api/platform/recoveries/paged", () => HttpResponse.json(list(rows, size === 50 ? 50 : 10))));
    renderRouteWithProviders(`/plataforma/recuperaciones${size === 50 ? "?pageSize=50" : ""}`, { as: "platform-operator" });
    await screen.findByRole("link", { name: "Persona 0" }); expect(screen.getAllByRole("row")).toHaveLength(size + 1); expect(screen.getByText(size === 1 ? "1 de 1" : "1–50 de 50")).toBeVisible();
  });
  it("revisión: Pedido en cuerpo, grilla y motivo obligatorio para ambas acciones", async () => {
    const user = userEvent.setup(); const { container } = renderRouteWithProviders("/plataforma/recuperaciones", { as: "platform-operator" }); const dialog = await open(user);
    expect(within(dialog).getByText("Pedido del 27/09/2026 10:20")).toBeVisible(); expect(within(dialog).getByText("Entraba con")).toBeVisible(); expect(within(dialog).getByText("pa•••@gmail.com · verificado")).toBeVisible();
    expect(within(dialog).getByText("Si lo aprobás, el método nuevo pasa a ser el principal de la cuenta y le avisamos a la persona.")).toBeVisible();
    for (const label of ["Aprobar", "Rechazar"]) { await user.click(within(dialog).getByRole("button", { name: label })); expect(await within(dialog).findByText("Escribí el motivo.")).toBeVisible(); }
    expect(await axe(container)).toHaveNoViolations();
  });
  it("sin cuenta sólo se puede rechazar; no se reconstruyen métodos", async () => {
    const user = userEvent.setup(); renderRouteWithProviders("/plataforma/recuperaciones", { as: "platform-operator" }); const dialog = await open(user, "Revisar", "Sin cuenta");
    expect(within(dialog).getByText("Ninguna")).toBeVisible(); expect(within(dialog).getByText("No hay ninguna cuenta con el método de antes. Solo se puede rechazar.")).toBeVisible(); expect(within(dialog).getByRole("button", { name: "Aprobar" })).toBeDisabled(); expect(within(dialog).getByRole("button", { name: "Rechazar" })).toBeEnabled();
  });
  it.each(["approve", "reject"] as const)("%s manda versión inicial, conserva la respuesta antes del GET y no vuelve a Revisar", async (action) => {
    const user = userEvent.setup(); const received: { body: unknown; key: string | null }[] = []; let written = false; let release: (() => void) | undefined;
    server.use(http.get("/api/platform/recoveries/paged", async () => { if (written) await new Promise<void>((resolve) => { release = resolve; }); return HttpResponse.json(list([{ ...pending, version: written ? 99 : 12 }])); }),
      http.post(`/api/platform/recoveries/r1/${action}`, async ({ request }) => { received.push({ body: await request.json(), key: request.headers.get("Idempotency-Key") }); written = true; return HttpResponse.json({ version: 37 }); }));
    const { queryClient } = renderRouteWithProviders("/plataforma/recuperaciones", { as: "platform-operator" }); await open(user); await send(user, action === "approve" ? "Aprobar" : "Rechazar");
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(received).toEqual([{ body: { version: 12, reason: "Revisión" }, key: expect.any(String) }]);
    expect(queryClient.getQueriesData({ queryKey: [...recoveriesQueryRoot, "paged"] })[0][1]).toMatchObject({ items: [{ id: "r1", version: 37, status: action === "approve" ? "Approved" : "Rejected" }] });
    await act(async () => { release?.(); }); await open(user, "Ver detalle"); expect(within(screen.getByRole("dialog")).queryByRole("button", { name: "Aprobar" })).not.toBeInTheDocument(); expect(within(screen.getByRole("dialog")).getByText("Revisión")).toBeVisible();
  });
  it.each(["approve", "reject"] as const)("%s muestra sólo su progreso y apaga las dos decisiones", async (action) => {
    const user = userEvent.setup(); let release: (() => void) | undefined;
    server.use(http.post(`/api/platform/recoveries/r1/${action}`, async () => { await new Promise<void>((resolve) => { release = resolve; }); return HttpResponse.json({ version: 37 }); }));
    renderRouteWithProviders("/plataforma/recuperaciones", { as: "platform-operator" }); await open(user); await send(user, action === "approve" ? "Aprobar" : "Rechazar");
    await waitFor(() => expect(release).toBeDefined()); expect(screen.getByRole("button", { name: action === "approve" ? "Aprobando…" : "Rechazando…" })).toBeDisabled(); expect(screen.getByRole("button", { name: action === "approve" ? "Rechazar" : "Aprobar" })).toBeDisabled(); expect(screen.getByRole("textbox", { name: "Motivo" })).toBeDisabled();
    await user.click(screen.getByRole("button", { name: "Cancelar" })); await act(async () => { release?.(); });
  });
  it.each([
    ["NoAccount", "No hay ninguna cuenta con el método de antes. Solo se puede rechazar."],
    ["MethodInUse", "Ese correo ya es de otra cuenta."],
    ["MethodAlreadyOnAccount", "Ese correo ya es un método de esa cuenta."],
    ["OperatorAccount", "La cuenta es de un operador de la plataforma: no se recupera desde acá."],
    ["AlreadyResolved", "Ese pedido ya se resolvió."],
    ["NotFound", "No encontramos el pedido."],
    ["General.ConcurrencyConflict", "Rechazo General.ConcurrencyConflict"],
  ])("%s vive en la franja traducida por código y conserva motivo", async (code, message) => {
    const fullCode = code.includes(".") ? code : `Platform.AccountRecovery.${code}`; const user = userEvent.setup();
    server.use(http.post("/api/platform/recoveries/r1/approve", () => HttpResponse.json({ code: fullCode, detail: `Rechazo ${code}` }, { status: code === "NotFound" ? 404 : 409 })));
    renderRouteWithProviders("/plataforma/recuperaciones", { as: "platform-operator" }); await open(user); await send(user);
    expect(await within(screen.getByRole("dialog")).findByRole("alert")).toHaveTextContent(message); expect(screen.getByRole("textbox", { name: "Motivo" })).toHaveValue("Revisión"); expect(screen.queryByRole("status", { name: /Rechazo/ })).not.toBeInTheDocument();
  });
  it.each(["Platform.AccountRecovery.AlreadyResolved", "General.ConcurrencyConflict"])("%s relee al cerrar aun tras corregir motivo", async (code) => {
    let reads = 0; const user = userEvent.setup(); server.use(http.get("/api/platform/recoveries/paged", () => { reads++; return HttpResponse.json(list()); }), http.post("/api/platform/recoveries/r1/approve", () => HttpResponse.json({ code, detail: "Conflicto" }, { status: 409 })));
    renderRouteWithProviders("/plataforma/recuperaciones", { as: "platform-operator" }); await open(user); await send(user); await within(screen.getByRole("dialog")).findByRole("alert");
    await user.type(screen.getByRole("textbox", { name: "Motivo" }), " corregido"); await user.click(screen.getByRole("button", { name: "Cancelar" })); await waitFor(() => expect(reads).toBe(2));
  });
  it("resuelto muestra datos reales y Cerrar, sin formulario", async () => {
    const user = userEvent.setup(); renderRouteWithProviders("/plataforma/recuperaciones", { as: "platform-operator" }); const dialog = await open(user, "Ver detalle", "Rosa Luna");
    expect(within(dialog).getByText("Laura Díaz")).toBeVisible(); expect(within(dialog).getByText(resolved.reason!)).toBeVisible(); expect(within(dialog).queryByRole("textbox")).not.toBeInTheDocument(); expect(within(dialog).getAllByRole("button", { name: "Cerrar" })).toHaveLength(2);
  });
  it("403 principal bloquea; error de lista permite reintentar", async () => {
    server.use(http.get("/api/platform/recoveries/paged", () => HttpResponse.json({ code: "Authorization.Forbidden" }, { status: 403 })));
    renderRouteWithProviders("/plataforma/recuperaciones", { as: "platform-operator" }); expect(await screen.findByRole("heading", { name: "No tenés permiso para ver esta página" })).toBeVisible();
  });
  it("390 tiene sólo Filtros, fecha corta y filas sin avatar; revisión con axe", async () => {
    asPhone(); const user = userEvent.setup(); const { container } = renderRouteWithProviders("/plataforma/recuperaciones", { as: "platform-operator" });
    await screen.findByText("Pablo Ortiz"); expect(screen.queryByRole("table")).not.toBeInTheDocument(); expect(screen.getByRole("button", { name: "Filtros" })).toBeVisible(); expect(screen.queryByRole("button", { name: "Buscar por cuenta, correo o teléfono" })).not.toBeInTheDocument(); expect(screen.getAllByText("27/09 10:20").length).toBeGreaterThan(0); expect(screen.getAllByText("pa•••@kappa.ejemplo.com → pa•••@gmail.com")[0]).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Acciones de Pablo Ortiz" })); await user.click(await screen.findByRole("menuitem", { name: "Revisar" })); await screen.findByRole("textbox", { name: "Motivo" }); expect(await axe(container)).toHaveNoViolations();
  });
  it("cambiar accountId abandona motivo, aunque siga Pendiente; volver no revive el diálogo", async () => {
    const user = userEvent.setup(); let row = pending;
    server.use(http.get("/api/platform/recoveries/paged", () => HttpResponse.json(list([row]))));
    const page = renderRouteWithProviders("/plataforma/recuperaciones", { as: "platform-operator" }); await open(user); await user.type(screen.getByRole("textbox", { name: "Motivo" }), "Borrador");
    row = { ...pending, accountId: null, accountName: null }; await act(async () => { await page.queryClient.invalidateQueries({ queryKey: recoveriesQueryRoot }); });
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument()); row = pending; await act(async () => { await page.queryClient.invalidateQueries({ queryKey: recoveriesQueryRoot }); }); expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
  it("relectura resuelta confirmada conserva operador/motivo reales de versión mayor", async () => {
    const user = userEvent.setup(); let written = false;
    server.use(http.get("/api/platform/recoveries/paged", () => HttpResponse.json(list([written ? { ...pending, status: "Approved", version: 55, reason: "Motivo persistido", decidedBy: "Operador real", decidedAtUtc: "2026-09-28T14:00:00Z" } : pending]))), http.post("/api/platform/recoveries/r1/approve", () => { written = true; return HttpResponse.json({ version: 37 }); }));
    const page = renderRouteWithProviders("/plataforma/recuperaciones", { as: "platform-operator" }); await open(user); await send(user); await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    await act(async () => { await page.queryClient.invalidateQueries({ queryKey: recoveriesQueryRoot }); }); await open(user, "Ver detalle"); expect(within(screen.getByRole("dialog")).getByText("Operador real")).toBeVisible(); expect(within(screen.getByRole("dialog")).getByText("Motivo persistido")).toBeVisible();
  });
  it("en-US traduce banda, fechas y estado; busca con Accept-Language efectivo", async () => {
    const page = renderRouteWithProviders("/plataforma/recuperaciones", { as: "platform-operator" }); await screen.findByRole("link", { name: "Pablo Ortiz" });
    await act(async () => { page.queryClient.setQueryData(currentUserQueryKey, { ...platformOperator, culture: "en-US" }); });
    expect(await screen.findByText("4 requests · 2 pending")).toBeVisible(); expect(screen.getAllByText("09/27/2026 10:20 AM").length).toBeGreaterThan(0); expect(screen.getAllByText("Pending").length).toBeGreaterThan(0);
  });
  it("error de lista reintenta y 403 de conteo secundario no bloquea", async () => {
    let reads = 0; const user = userEvent.setup(); server.use(http.get("/api/platform/recoveries/paged", () => ++reads === 1 ? HttpResponse.json({ code: "Test.List", detail: "Lectura rechazada" }, { status: 400 }) : HttpResponse.json(list())), http.get("/api/platform/recoveries/filter-counts", () => HttpResponse.json({ code: "Authorization.Forbidden" }, { status: 403 })));
    renderRouteWithProviders("/plataforma/recuperaciones", { as: "platform-operator" }); expect(await screen.findByText("Lectura rechazada")).toBeVisible(); await user.click(screen.getByRole("button", { name: "Reintentar" })); expect(await screen.findByRole("link", { name: "Pablo Ortiz" })).toBeVisible(); expect(screen.queryByRole("heading", { name: "No tenés permiso para ver esta página" })).not.toBeInTheDocument();
  });
  it.each(["success", "network", "server"] as const)("cancelar abandona respuesta tardía %s sin aviso ni cerrar un segundo diálogo", async (result) => {
    const user = userEvent.setup(); let release: (() => void) | undefined;
    server.use(http.post("/api/platform/recoveries/r1/approve", async () => { await new Promise<void>((resolve) => { release = resolve; }); return result === "network" ? HttpResponse.error() : result === "server" ? HttpResponse.json({ traceId: "late" }, { status: 500 }) : HttpResponse.json({ version: 37 }); }));
    const page = renderRouteWithProviders("/plataforma/recuperaciones", { as: "platform-operator" }); await open(user); await send(user); await waitFor(() => expect(release).toBeDefined()); await user.click(screen.getByRole("button", { name: "Cancelar" })); await open(user);
    await act(async () => { release?.(); }); await waitFor(() => expect(page.queryClient.getMutationCache().getAll().at(-1)?.state.error).toMatchObject({ name: "AbortError" }));
    expect(screen.getByRole("dialog")).toBeVisible(); expect(screen.getByRole("textbox", { name: "Motivo" })).toHaveValue(""); expect(screen.queryByText(/Aprobamos el pedido/)).not.toBeInTheDocument(); expect(screen.queryByText("No pudimos conectarnos. Revisá tu conexión.")).not.toBeInTheDocument(); expect(screen.queryByText("Algo salió mal. Probá de nuevo en un rato.")).not.toBeInTheDocument();
  });
  it("URL y permiso abandonan Retry; no se manda otra petición", async () => {
    let calls = 0; const user = userEvent.setup(); server.use(http.post("/api/platform/recoveries/r1/approve", () => { calls++; return HttpResponse.error(); }));
    const page = renderRouteWithProviders("/plataforma/recuperaciones", { as: "platform-operator" }); await open(user); await send(user); const retry = await screen.findByRole("button", { name: "Reintentar" });
    await act(async () => { await page.router.navigate("/plataforma/recuperaciones?status=Pending"); }); await act(async () => { fireEvent.click(retry); }); expect(calls).toBe(1); expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    await open(user); await send(user); const second = (await screen.findAllByRole("button", { name: "Reintentar" })).at(-1)!;
    server.use(meHandlerFor({ ...platformOperator, effectivePermissions: { ...platformOperator.effectivePermissions, platform: [] } })); await act(async () => { await page.queryClient.invalidateQueries({ queryKey: currentUserQueryKey }); }); await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument()); await act(async () => { fireEvent.click(second); }); expect(calls).toBe(2);
  });
  it("corregir motivo abandona Retry viejo y genera clave nueva para el borrador corregido", async () => {
    const user = userEvent.setup(); const keys: (string | null)[] = []; const bodies: unknown[] = [];
    server.use(http.post("/api/platform/recoveries/r1/approve", async ({ request }) => { keys.push(request.headers.get("Idempotency-Key")); bodies.push(await request.json()); return keys.length === 1 ? HttpResponse.error() : HttpResponse.json({ version: 37 }); }));
    renderRouteWithProviders("/plataforma/recuperaciones", { as: "platform-operator" }); await open(user); await send(user); const retry = await screen.findByRole("button", { name: "Reintentar" });
    await user.type(screen.getByRole("textbox", { name: "Motivo" }), " corregido"); await act(async () => { fireEvent.click(retry); }); expect(keys).toHaveLength(1); await user.click(screen.getByRole("button", { name: "Aprobar" })); await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument()); expect(keys).toHaveLength(2); expect(keys[1]).not.toBe(keys[0]); expect(bodies[1]).toEqual({ version: 12, reason: "Revisión corregido" });
  });
  it("GET de fondo con otra versión no cambia la base abierta", async () => {
    const user = userEvent.setup(); let version = 12; let body: unknown;
    server.use(http.get("/api/platform/recoveries/paged", () => HttpResponse.json(list([{ ...pending, version }]))), http.post("/api/platform/recoveries/r1/approve", async ({ request }) => { body = await request.json(); return HttpResponse.json({ code: "General.ConcurrencyConflict", detail: "Conflicto" }, { status: 409 }); }));
    const page = renderRouteWithProviders("/plataforma/recuperaciones", { as: "platform-operator" }); await open(user); version = 99; await act(async () => { await page.queryClient.invalidateQueries({ queryKey: recoveriesQueryRoot }); }); await send(user); await within(screen.getByRole("dialog")).findByText("Conflicto"); expect(body).toEqual({ version: 12, reason: "Revisión" });
  });
  it("volver al motivo anterior no revive el Retry de un borrador abandonado", async () => {
    const user = userEvent.setup(); const keys: (string | null)[] = [];
    server.use(http.post("/api/platform/recoveries/r1/approve", ({ request }) => { keys.push(request.headers.get("Idempotency-Key")); return keys.length === 1 ? HttpResponse.error() : HttpResponse.json({ version: 37 }); }));
    renderRouteWithProviders("/plataforma/recuperaciones", { as: "platform-operator" }); await open(user); await send(user); const retry = await screen.findByRole("button", { name: "Reintentar" });
    const reason = screen.getByRole("textbox", { name: "Motivo" }); await user.type(reason, " x"); await user.clear(reason); await user.type(reason, "Revisión"); await act(async () => { fireEvent.click(retry); });
    expect(keys).toHaveLength(1); expect(screen.getByRole("dialog")).toBeVisible(); await user.click(screen.getByRole("button", { name: "Aprobar" })); await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument()); expect(keys[1]).not.toBe(keys[0]);
  });
  it("cambiar Aprobar → Rechazar → Aprobar abandona ambos Retry anteriores y conserva el actual", async () => {
    const user = userEvent.setup(); const calls: { action: string; key: string | null }[] = [];
    server.use(http.post("/api/platform/recoveries/r1/:action", ({ request, params }) => { calls.push({ action: String(params.action), key: request.headers.get("Idempotency-Key") }); return calls.length < 4 ? HttpResponse.error() : HttpResponse.json({ version: 37 }); }));
    renderRouteWithProviders("/plataforma/recuperaciones", { as: "platform-operator" }); await open(user); await send(user); const first = await screen.findByRole("button", { name: "Reintentar" });
    await user.click(screen.getByRole("button", { name: "Rechazar" })); await waitFor(() => expect(screen.getAllByRole("button", { name: "Reintentar" })).toHaveLength(2)); const second = screen.getAllByRole("button", { name: "Reintentar" }).find((button) => button !== first)!;
    await user.click(screen.getByRole("button", { name: "Aprobar" })); await waitFor(() => expect(screen.getAllByRole("button", { name: "Reintentar" })).toHaveLength(3)); const current = screen.getAllByRole("button", { name: "Reintentar" }).find((button) => button !== first && button !== second)!;
    await act(async () => { fireEvent.click(first); fireEvent.click(second); }); expect(calls).toHaveLength(3);
    fireEvent.click(current); await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument()); expect(calls.map((call) => call.action)).toEqual(["approve", "reject", "approve", "approve"]); expect(new Set(calls.slice(0, 3).map((call) => call.key)).size).toBe(3); expect(calls[3].key).toBe(calls[2].key);
  });
  it.each([false, true])("Retry nativo conserva clave y resuelve aun sin observer (%s)", async (detached) => {
    const user = userEvent.setup(); const keys: (string | null)[] = []; const firstSuccess = detached ? 3 : 2;
    server.use(http.post("/api/platform/recoveries/r1/approve", ({ request }) => { keys.push(request.headers.get("Idempotency-Key")); return keys.length < firstSuccess ? HttpResponse.error() : HttpResponse.json({ version: 37 }); }));
    renderRouteWithProviders("/plataforma/recuperaciones", { as: "platform-operator" }); await open(user); await send(user); const retry = await screen.findByRole("button", { name: "Reintentar" });
    if (detached) { await user.click(screen.getByRole("button", { name: "Aprobar" })); await waitFor(() => expect(screen.getAllByRole("button", { name: "Reintentar" })).toHaveLength(2)); }
    fireEvent.click(retry); expect(await screen.findByText("Aprobamos el pedido. pa•••@gmail.com ya es el método principal de Pablo Ortiz y le avisamos.")).toBeVisible(); expect(keys).toHaveLength(firstSuccess); expect(new Set(keys).size).toBe(1); expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
  it.each([false, true])("InProgress termina una vez tras 31 pedidos/30 esperas, observer retirado=%s", async (detached) => {
    const user = userEvent.setup(); const keys: (string | null)[] = []; const networkFailures = detached ? 2 : 0; let polls = 0;
    server.use(http.post("/api/platform/recoveries/r1/approve", ({ request }) => { keys.push(request.headers.get("Idempotency-Key")); if (keys.length <= networkFailures) return HttpResponse.error(); polls++; return HttpResponse.json({ code: "Request.InProgress", detail: "El pedido sigue en curso." }, { status: 409 }); }));
    const page = renderRouteWithProviders("/plataforma/recuperaciones", { as: "platform-operator" }); await open(user); await user.type(screen.getByRole("textbox", { name: "Motivo" }), "Revisión"); let start: HTMLElement;
    if (detached) { await user.click(screen.getByRole("button", { name: "Aprobar" })); start = await screen.findByRole("button", { name: "Reintentar" }); await user.click(screen.getByRole("button", { name: "Aprobar" })); await waitFor(() => expect(screen.getAllByRole("button", { name: "Reintentar" })).toHaveLength(2)); } else start = screen.getByRole("button", { name: "Aprobar" });
    vi.useFakeTimers();
    try {
      await act(async () => { fireEvent.click(start); await vi.advanceTimersByTimeAsync(0); }); expect(polls).toBe(1);
      await act(async () => { await vi.advanceTimersByTimeAsync(29_000); }); expect(polls).toBe(30); expect(screen.queryByText("El pedido sigue en curso.")).not.toBeInTheDocument(); expect(page.queryClient.isMutating()).toBe(1);
      await act(async () => { await vi.advanceTimersByTimeAsync(1_000); await vi.advanceTimersByTimeAsync(50); }); expect(polls).toBe(31); expect(keys).toHaveLength(networkFailures + 31); expect(new Set(keys).size).toBe(1); expect(within(screen.getByRole("dialog")).getAllByText("El pedido sigue en curso.")).toHaveLength(1); expect(page.queryClient.isMutating()).toBe(0);
    } finally { vi.useRealTimers(); }
  });
  it("cancelar durante la espera InProgress termina la vida nativa sin otro pedido ni aviso", async () => {
    const user = userEvent.setup(); let calls = 0;
    server.use(http.post("/api/platform/recoveries/r1/approve", () => { calls++; return HttpResponse.json({ code: "Request.InProgress", detail: "En curso" }, { status: 409 }); }));
    const page = renderRouteWithProviders("/plataforma/recuperaciones", { as: "platform-operator" }); await open(user); await user.type(screen.getByRole("textbox", { name: "Motivo" }), "Revisión"); vi.useFakeTimers();
    try {
      await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Aprobar" })); await vi.advanceTimersByTimeAsync(0); }); expect(calls).toBe(1);
      await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Cancelar" })); await vi.advanceTimersByTimeAsync(60_000); }); expect(calls).toBe(1); expect(page.queryClient.isMutating()).toBe(0); expect(screen.queryByRole("dialog")).not.toBeInTheDocument(); expect(screen.queryByText("En curso")).not.toBeInTheDocument();
    } finally { vi.useRealTimers(); }
  });
  it("StrictMode prepara el dueño nativo y envía una sola decisión", async () => {
    const user = userEvent.setup(); let calls = 0;
    server.use(http.post("/api/platform/recoveries/r1/approve", () => { calls++; return HttpResponse.json({ version: 37 }); }));
    const router = createMemoryRouter(routes, { initialEntries: ["/plataforma/recuperaciones"] }); renderWithProviders(<StrictMode><RouterProvider router={router} /></StrictMode>, { as: "platform-operator" });
    await open(user); await send(user); await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument()); expect(calls).toBe(1);
  });
});

it.each([false, true])("Phone E.164 y máscaras se conservan en lista y revisión (móvil=%s)", async (phone) => {
  if (phone) asPhone();
  const recovery: Recovery = { ...pending, previousMethodType: "Phone", previousMethod: "•••• 2204", newMethodType: "Phone", newMethod: "+5491123456789" };
  server.use(http.get("/api/platform/recoveries/paged", () => HttpResponse.json(list([recovery]))));
  const user = userEvent.setup(); const { container } = renderRouteWithProviders("/plataforma/recuperaciones", { as: "platform-operator" });
  expect(await screen.findByText("•••• 2204")).toBeVisible(); expect(await screen.findByText("011 15-2345-6789")).toBeVisible();
  expect(screen.queryByText("+5491123456789")).not.toBeInTheDocument();
  if (phone) await user.click(screen.getByRole("button", { name: /Pablo Ortiz.*2204/u }));
  const dialog = phone ? screen.getByRole("dialog") : await open(user);
  expect(within(dialog).getByText("•••• 2204")).toBeVisible(); expect(within(dialog).getByText("011 15-2345-6789")).toBeVisible();
  expect(within(dialog).getByRole("button", { name: "Aprobar" })).toBeEnabled(); expect(await axe(container)).toHaveNoViolations();
});
