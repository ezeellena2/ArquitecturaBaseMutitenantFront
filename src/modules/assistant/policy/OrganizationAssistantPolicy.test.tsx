import { act, configure, fireEvent, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Activity, lazy, useLayoutEffect, useState } from "react";
import { http, HttpResponse } from "msw";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import { currentUserQueryKey } from "@/auth/useCurrentUser";
import { tenantFeaturesQueryKey } from "@/areas/platform/tenants/api/tenants";
import type { AssistantPolicyResponse, MeResponse, PlatformFeatureResponse, UpdateAssistantPolicyRequest } from "@/shared/api/types";
import type { ModuleOrganizationUiProps, ModuleRegistration } from "@/shared/modules/types";
import { platformOperator } from "@/test/mocks/currentUsers";
import { meHandlerFor } from "@/test/mocks/handlers";
import { server } from "@/test/mocks/server";
import { asPhone } from "@/test/utils/phone";
import { mountSettings } from "../settings/settingsTestSupport";
import { assistantRegistration } from "../registration";
import { assistantPolicyQueryKey } from "../api/policy";
import { OrganizationAssistantPolicy } from "./OrganizationAssistantPolicy";

const me: MeResponse = { ...platformOperator, moduleCapabilities: [{ key: "assistant", available: false, canConfigure: false, canReadUsage: false }], effectivePermissions: { organization: [], companies: {}, platform: ["platform.tenants.read", "platform.tenants.manage"] } };
const organization = { id: "delta", name: "Organización real", slug: "delta", status: "Active", source: "SelfService", createdAtUtc: "2026-01-12T11:40:00Z", companyCount: 0, memberCount: 0, version: 2, owners: [], lastStateChange: null } as const;
const features: PlatformFeatureResponse[] = [{ key: "assistant", enabled: true, source: "Trial", expiresOn: "2026-10-27", version: 3 }, { key: "WhatsApp", enabled: true, source: "Plan", version: 8 }];
let policy: AssistantPolicyResponse; let bodies: UpdateAssistantPolicyRequest[]; let reads: number;
beforeEach(() => {
  configure({ reactStrictMode: false });
  vi.unstubAllGlobals(); policy = { allowOwnKey: false, version: 12 }; bodies = []; reads = 0;
  server.use(meHandlerFor(me),
    http.get("/api/platform/tenants/delta", () => HttpResponse.json(organization)),
    http.get("/api/platform/tenants/delta/history", () => HttpResponse.json({ items: [], hasMore: false })),
    http.get("/api/platform/tenants/delta/features", () => HttpResponse.json(features)),
    http.get("/api/platform/tenants/delta/assistant/policy", () => { reads++; return HttpResponse.json(policy); }),
    http.put("/api/platform/tenants/delta/assistant/policy", async ({ request }) => { expect(request.headers.get("Idempotency-Key")).toBeNull(); bodies.push(await request.json() as UpdateAssistantPolicyRequest); return HttpResponse.json({ version: 20 + bodies.length }); }));
});
afterEach(() => { configure({ reactStrictMode: false }); });
async function mount(account = me, modules: readonly ModuleRegistration[] = [assistantRegistration]) {
  const page = mountSettings(account, "/plataforma/organizaciones/delta", modules);
  await page.user.click(await screen.findByRole("tab", { name: /^(Módulos|Modules)/ }));
  return { ...page, queryClient: page.client };
}
async function action(user: ReturnType<typeof userEvent.setup>, label: string) {
  await user.click(await screen.findByRole("button", { name: "Acciones de Asistente" }));
  await user.click(await screen.findByRole("menuitem", { name: label }));
}
async function submit(user: ReturnType<typeof userEvent.setup>, label: string) {
  await user.type(screen.getByRole("textbox", { name: "Motivo" }), "Revisión");
  await user.click(within(screen.getByRole("dialog")).getByRole("button", { name: label }));
}
describe("policy del Asistente en fila real de Módulos", () => {
  it.each([false, true])("contribución ajena conserva input original, motivo, versión y foco de WhatsApp; retry %s", async (retryOriginal) => {
    const featureBodies: unknown[] = [];
    server.use(http.put("/api/platform/tenants/delta/features/WhatsApp", async ({ request }) => { expect(request.headers.get("Idempotency-Key")).toBeNull(); featureBodies.push(await request.json()); return retryOriginal && featureBodies.length === 1 ? HttpResponse.error() : HttpResponse.json({ version: 44 }); }));
    const page = await mount(); await screen.findByText("Con la clave de la plataforma");
    const originalTrigger = screen.getByRole("button", { name: "Acciones de WhatsApp" });
    await page.user.click(originalTrigger); await page.user.click(screen.getByRole("menuitem", { name: "Apagar" }));
    const originalField = screen.getByRole("textbox", { name: "Motivo" }); await page.user.type(originalField, "Motivo preservado");
    let originalRetry: HTMLElement | undefined;
    if (retryOriginal) {
      await page.user.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Apagar" }));
      originalRetry = await screen.findByRole("button", { name: "Reintentar" });
      await page.user.clear(originalField); await page.user.type(originalField, "Motivo editado");
    }
    let refetched = false;
    server.use(http.get("/api/platform/tenants/delta/features", () => { refetched = true; return HttpResponse.json(features.map((row) => row.key === "assistant" ? { ...row, enabled: false } : row)); }));
    await act(async () => { await page.queryClient.invalidateQueries({ queryKey: tenantFeaturesQueryKey("delta") }); });
    expect(refetched).toBe(true);
    await waitFor(() => expect(screen.queryByText("Con la clave de la plataforma")).not.toBeInTheDocument());
    expect(originalField.isConnected).toBe(true); expect(screen.getByRole("textbox", { name: "Motivo" })).toBe(originalField);
    expect(originalField).toHaveValue(retryOriginal ? "Motivo editado" : "Motivo preservado"); expect(originalTrigger.isConnected).toBe(true);
    if (originalRetry) await act(async () => { fireEvent.click(originalRetry); });
    else await page.user.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Apagar" }));
    await screen.findByText("Apagamos WhatsApp.");
    expect(featureBodies).toEqual(Array.from({ length: retryOriginal ? 2 : 1 }, () => ({ enabled: false, source: "Manual", expiresOn: null, version: 8, reason: "Motivo preservado" })));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    await waitFor(() => expect(originalTrigger).toHaveFocus());
  }, 15_000);
  it("resolución lazy ajena conserva el input y trigger originales de WhatsApp", async () => {
    let release: (() => void) | undefined;
    const contribution = assistantRegistration.organizationUi;
    if (!contribution) throw new Error("Contribución no registrada");
    const Content = lazy(() => new Promise<{ default: typeof OrganizationAssistantPolicy }>((resolve) => { release = () => resolve({ default: OrganizationAssistantPolicy }); }));
    const page = await mount(me, [{ ...assistantRegistration, organizationUi: { ...contribution, Content } }]);
    await waitFor(() => expect(release).toBeDefined());
    const originalTrigger = screen.getByRole("button", { name: "Acciones de WhatsApp" });
    await page.user.click(originalTrigger); await page.user.click(screen.getByRole("menuitem", { name: "Apagar" }));
    const originalField = screen.getByRole("textbox", { name: "Motivo" }); await page.user.type(originalField, "Motivo preservado");
    await act(async () => { release?.(); }); await screen.findByText("Con la clave de la plataforma");
    expect(originalField.isConnected).toBe(true); expect(screen.getByRole("textbox", { name: "Motivo" })).toBe(originalField); expect(originalField).toHaveValue("Motivo preservado");
    await page.user.click(screen.getByRole("button", { name: "Cancelar" })); await waitFor(() => expect(originalTrigger).toHaveFocus());
  }, 15_000);
  it("cambio sólo de WhatsApp conserva confirmación, versión y motivo del Asistente", async () => {
    const page = await mount(); await screen.findByText("Con la clave de la plataforma");
    const originalTrigger = screen.getByRole("button", { name: "Acciones de Asistente" });
    await action(page.user, "Permitir su propia clave");
    const originalField = screen.getByRole("textbox", { name: "Motivo" }); await page.user.type(originalField, "Motivo preservado");
    server.use(http.get("/api/platform/tenants/delta/features", () => HttpResponse.json(features.map((row) => row.key === "WhatsApp" ? { ...row, enabled: false, version: 40 } : row))));
    await act(async () => { await page.queryClient.invalidateQueries({ queryKey: tenantFeaturesQueryKey("delta") }); });
    await screen.findByText("Apagado");
    expect(originalField.isConnected).toBe(true); expect(screen.getByRole("textbox", { name: "Motivo" })).toBe(originalField); expect(originalField).toHaveValue("Motivo preservado");
    expect(originalTrigger.isConnected).toBe(true);
    await page.user.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Permitir" })); await screen.findByText("Organización real puede usar su propia clave.");
    expect(bodies).toEqual([{ allowOwnKey: true, version: 12, reason: "Motivo preservado" }]);
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument()); await waitFor(() => expect(originalTrigger).toHaveFocus());
  }, 15_000);
  it("StrictMode permite un PUT normal autorizado y conserva su resultado", async () => {
    configure({ reactStrictMode: true });
    const page = await mount(); await screen.findByText("Con la clave de la plataforma");
    await action(page.user, "Permitir su propia clave"); await submit(page.user, "Permitir");
    await waitFor(() => expect(bodies).toEqual([{ allowOwnKey: true, version: 12, reason: "Revisión" }]));
    expect(await screen.findByText("Organización real puede usar su propia clave.")).toBeVisible();
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(screen.getByText("Puede usar su clave")).toBeVisible();
  }, 15_000);
  it.each(["retry", "successCallback"])("nuevo setup tras cleanup no rehabilita %s del owner anterior", async (phase) => {
    configure({ reactStrictMode: true });
    let setMode: (mode: "visible" | "hidden") => void = () => { throw new Error("Activity no montada"); };
    function ActivityContent(props: ModuleOrganizationUiProps) {
      const [mode, changeMode] = useState<"visible" | "hidden">("visible");
      useLayoutEffect(() => { setMode = changeMode; }, []);
      return <Activity mode={mode}><OrganizationAssistantPolicy {...props} /></Activity>;
    }
    const contribution = assistantRegistration.organizationUi;
    if (!contribution) throw new Error("Contribución no registrada");
    let calls = 0; server.use(http.put("/api/platform/tenants/delta/assistant/policy", () => { calls++; return phase === "retry" ? HttpResponse.error() : HttpResponse.json({ version: 31 }); }));
    const page = await mount(me, [{ ...assistantRegistration, organizationUi: { ...contribution, Content: ActivityContent } }]);
    if (phase === "successCallback") page.queryClient.getMutationCache().config.onSuccess = async () => {
      // La respuesta ya terminó; reconectamos antes del callback de aceptación del diálogo.
      await act(async () => { setMode("hidden"); }); await act(async () => { setMode("visible"); });
    };
    await screen.findByText("Con la clave de la plataforma"); await action(page.user, "Permitir su propia clave"); await submit(page.user, "Permitir");
    if (phase === "retry") {
      const retry = await screen.findByRole("button", { name: "Reintentar" });
      // Activity desconecta y reconecta efectos conservando estado y refs, igual que el replay de StrictMode.
      await act(async () => { setMode("hidden"); }); await act(async () => { setMode("visible"); });
      await act(async () => { fireEvent.click(retry); });
    } else {
      await waitFor(() => expect(page.queryClient.getMutationCache().getAll().at(-1)?.state.status).toBe("error"));
      expect(screen.getByRole("dialog")).toBeVisible();
      expect(screen.getByRole("textbox", { name: "Motivo" })).toHaveValue("Revisión");
    }
    expect(calls).toBe(1);
    expect(screen.queryByText("Organización real puede usar su propia clave.")).not.toBeInTheDocument();
  }, 15_000);
  it("gestiona instalación available=false sin permisos de chat/configure, cuerpo/version propios y retorno del foco", async () => {
    const { user, container } = await mount();
    expect(await screen.findByText("Con la clave de la plataforma")).toBeVisible();
    await action(user, "Permitir su propia clave");
    expect(screen.getByRole("dialog")).toHaveTextContent("Organización real puede cargar su clave de Anthropic y fijar sus topes.");
    await submit(user, "Permitir");
    expect(await screen.findByText("Organización real puede usar su propia clave.")).toBeVisible();
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(screen.getByRole("button", { name: "Acciones de Asistente" })).toHaveFocus();
    expect(bodies).toEqual([{ allowOwnKey: true, version: 12, reason: "Revisión" }]);
    expect(screen.getByText("Plan")).toBeVisible(); expect(await axe(container)).toHaveNoViolations();
  });
  it("revoca con texto aprobado sin financiación automática, versión propia sobre GET ajeno y remount de pestaña", async () => {
    const page = await mount(); await screen.findByText("Con la clave de la plataforma");
    await action(page.user, "Permitir su propia clave"); await submit(page.user, "Permitir"); await screen.findByText("Organización real puede usar su propia clave.");
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    policy = { allowOwnKey: false, version: 88 };
    await act(async () => { await page.queryClient.invalidateQueries({ queryKey: assistantPolicyQueryKey(me, "delta") }); });
    await page.user.click(screen.getByRole("tab", { name: /^Dueños/ })); await page.user.click(screen.getByRole("tab", { name: /^Módulos/ }));
    await screen.findByText("Puede usar su clave"); await action(page.user, "Solo con la clave de la plataforma");
    expect(screen.getByRole("dialog")).toHaveTextContent("Organización real ya no podrá usar su propia clave. Si la está usando, tendrá que elegir la clave de la plataforma en Configuración del asistente para volver a hacer consultas con IA.");
    await submit(page.user, "Solo la de la plataforma"); await screen.findByText("Organización real ya no puede usar su propia clave.");
    expect(bodies[1]).toEqual({ allowOwnKey: false, version: 21, reason: "Revisión" });
  });
  it("read sin manage lee la descripción y no da acciones", async () => {
    await mount({ ...me, effectivePermissions: { ...me.effectivePermissions, platform: ["platform.tenants.read"] } });
    expect(await screen.findByText("Con la clave de la plataforma")).toBeVisible(); expect(reads).toBe(1);
    expect(screen.queryByRole("button", { name: "Acciones de Asistente" })).not.toBeInTheDocument();
  });
  it.each(["off", "closed", "absent", "unregistered", "noRead", "notInstalled"])("%s no consulta policy ni inventa acción", async (condition) => {
    if (condition === "off" || condition === "absent") server.use(http.get("/api/platform/tenants/delta/features", () => HttpResponse.json(condition === "off" ? features.map((row) => ({ ...row, enabled: false })) : [features[1]])));
    if (condition === "closed") server.use(http.get("/api/platform/tenants/delta", () => HttpResponse.json({ ...organization, status: "Closed" })));
    const account = condition === "noRead" ? { ...me, effectivePermissions: { ...me.effectivePermissions, platform: ["platform.tenants.manage"] } } : condition === "notInstalled" ? { ...me, moduleCapabilities: [] } : me;
    // noRead se prueba en el registro: la ruta de la ficha conserva su guarda de lectura.
    const page = condition === "noRead" ? await mount() : await mount(account, condition === "unregistered" ? [] : [assistantRegistration]);
    if (condition === "noRead") await act(async () => { page.queryClient.setQueryData(currentUserQueryKey, account); });
    expect(screen.queryByRole("menuitem", { name: "Permitir su propia clave" })).not.toBeInTheDocument();
    if (condition !== "noRead") expect(reads).toBe(0);
    page.unmount();
  });
  it("error de lectura visible con reintento sin default false", async () => {
    server.use(http.get("/api/platform/tenants/delta/assistant/policy", () => ++reads === 1 ? HttpResponse.json({ code: "Test.Policy", detail: "No se pudo leer la política" }, { status: 400 }) : HttpResponse.json(policy)));
    const { user } = await mount(); expect(await screen.findByText("No se pudo leer la política")).toBeVisible();
    await user.click(screen.getByRole("button", { name: "Acciones de Asistente" })); expect(screen.queryByRole("menuitem", { name: "Permitir su propia clave" })).not.toBeInTheDocument(); await user.keyboard("{Escape}");
    await user.click(screen.getByRole("button", { name: "Reintentar" })); expect(await screen.findByText("Con la clave de la plataforma")).toBeVisible();
  });
  it.each(["cancel", "unmount", "permission", "scope", "closed", "off"])("retry nativo abandonado después de %s no envía ni acepta éxito", async (condition) => {
    let calls = 0; server.use(http.put("/api/platform/tenants/delta/assistant/policy", () => { calls++; return HttpResponse.error(); }));
    const page = await mount(); await screen.findByText("Con la clave de la plataforma"); await action(page.user, "Permitir su propia clave"); await submit(page.user, "Permitir");
    const retry = await screen.findByRole("button", { name: "Reintentar" });
    if (condition === "cancel") await page.user.click(screen.getByRole("button", { name: "Cancelar" }));
    if (condition === "unmount") page.unmount();
    if (condition === "permission" || condition === "scope") await act(async () => { page.queryClient.setQueryData(currentUserQueryKey, condition === "scope" ? { ...me, id: "otro" } : { ...me, effectivePermissions: { ...me.effectivePermissions, platform: ["platform.tenants.read"] } }); });
    if (condition === "closed" || condition === "off") { server.use(http.get(`/api/platform/tenants/delta${condition === "off" ? "/features" : ""}`, () => HttpResponse.json(condition === "off" ? features.map((row) => ({ ...row, enabled: false })) : { ...organization, status: "Closed" }))); await act(async () => { await page.queryClient.invalidateQueries({ queryKey: ["platform-tenants"] }); }); }
    await act(async () => { fireEvent.click(retry); }); expect(calls).toBe(1);
  });
  it("perder y recuperar manage abandona definitivamente el formulario y su retry", async () => {
    let calls = 0; server.use(http.put("/api/platform/tenants/delta/assistant/policy", () => { calls++; return HttpResponse.error(); }));
    const page = await mount(); await screen.findByText("Con la clave de la plataforma"); await action(page.user, "Permitir su propia clave"); await submit(page.user, "Permitir");
    const retry = await screen.findByRole("button", { name: "Reintentar" });
    await act(async () => { page.queryClient.setQueryData(currentUserQueryKey, { ...me, effectivePermissions: { ...me.effectivePermissions, platform: ["platform.tenants.read"] } }); });
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    await act(async () => { page.queryClient.setQueryData(currentUserQueryKey, me); });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    await act(async () => { fireEvent.click(retry); }); expect(calls).toBe(1);
  });
  it("retry nativo conserva body/version originales aunque se edite el motivo y llegue otro GET", async () => {
    server.use(http.put("/api/platform/tenants/delta/assistant/policy", async ({ request }) => { bodies.push(await request.json() as UpdateAssistantPolicyRequest); return bodies.length === 1 ? HttpResponse.error() : HttpResponse.json({ version: 24 }); }));
    const page = await mount(); await screen.findByText("Con la clave de la plataforma"); await action(page.user, "Permitir su propia clave"); await submit(page.user, "Permitir");
    const retry = await screen.findByRole("button", { name: "Reintentar" });
    await page.user.clear(screen.getByRole("textbox", { name: "Motivo" })); await page.user.type(screen.getByRole("textbox", { name: "Motivo" }), "Otro motivo");
    policy = { allowOwnKey: true, version: 88 }; await act(async () => { await page.queryClient.invalidateQueries({ queryKey: assistantPolicyQueryKey(me, "delta") }); });
    await act(async () => { fireEvent.click(retry); }); await screen.findByText("Organización real puede usar su propia clave.");
    expect(bodies).toEqual([{ allowOwnKey: true, version: 12, reason: "Revisión" }, { allowOwnKey: true, version: 12, reason: "Revisión" }]);
  });
  it.each([false, true])("revocación de permiso entre dos renders abandona retry pero permite una acción nueva; StrictMode %s", async (strictMode) => {
    configure({ reactStrictMode: strictMode });
    let calls = 0; server.use(http.put("/api/platform/tenants/delta/assistant/policy", async ({ request }) => { calls++; bodies.push(await request.json() as UpdateAssistantPolicyRequest); return calls === 1 ? HttpResponse.error() : HttpResponse.json({ version: 30 }); }));
    const page = await mount(); await screen.findByText("Con la clave de la plataforma"); await action(page.user, "Permitir su propia clave"); await submit(page.user, "Permitir");
    const retry = await screen.findByRole("button", { name: "Reintentar" });
    await act(async () => {
      page.queryClient.setQueryData(currentUserQueryKey, { ...me, effectivePermissions: { ...me.effectivePermissions, platform: ["platform.tenants.read"] } });
      page.queryClient.setQueryData(currentUserQueryKey, me);
    });
    await act(async () => { fireEvent.click(retry); }); expect(calls).toBe(1);
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    await action(page.user, "Permitir su propia clave"); await submit(page.user, "Permitir");
    await screen.findByText("Organización real puede usar su propia clave.");
    expect(calls).toBe(2); expect(bodies).toEqual([{ allowOwnKey: true, version: 12, reason: "Revisión" }, { allowOwnKey: true, version: 12, reason: "Revisión" }]);
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    await act(async () => { fireEvent.click(retry); }); expect(calls).toBe(2);
    expect(screen.getByText("Puede usar su clave")).toBeVisible();
  }, 15_000);
  it("conflicto conserva motivo y versión del formulario; cerrar relee explícitamente policy", async () => {
    server.use(http.put("/api/platform/tenants/delta/assistant/policy", async ({ request }) => { bodies.push(await request.json() as UpdateAssistantPolicyRequest); return bodies.length === 1 ? HttpResponse.json({ code: "General.ConcurrencyConflict", detail: "Alguien cambió este dato." }, { status: 409 }) : HttpResponse.json({ version: 91 }); }));
    const page = await mount(); await screen.findByText("Con la clave de la plataforma"); await action(page.user, "Permitir su propia clave"); await submit(page.user, "Permitir");
    await screen.findByText("Alguien cambió este dato."); expect(screen.getByRole("textbox", { name: "Motivo" })).toHaveValue("Revisión");
    policy = { allowOwnKey: true, version: 90 }; await page.user.click(screen.getByRole("button", { name: "Cancelar" })); await screen.findByText("Puede usar su clave");
    await action(page.user, "Solo con la clave de la plataforma"); await submit(page.user, "Solo la de la plataforma"); await screen.findByText("Organización real ya no puede usar su propia clave.");
    expect(bodies[1]).toEqual({ allowOwnKey: false, version: 90, reason: "Revisión" });
  });
  it.each(["cancel", "unmount", "permission", "organization"])("respuesta tardía tras %s no escribe base ni avisa", async (condition) => {
    let release: (() => void) | undefined;
    server.use(http.put("/api/platform/tenants/delta/assistant/policy", async () => { await new Promise<void>((resolve) => { release = resolve; }); return HttpResponse.json({ version: 80 }); }));
    const page = await mount(); await screen.findByText("Con la clave de la plataforma"); await action(page.user, "Permitir su propia clave"); await submit(page.user, "Permitir"); await waitFor(() => expect(release).toBeDefined());
    if (condition === "cancel") await page.user.click(screen.getByRole("button", { name: "Cancelar" }));
    if (condition === "unmount") page.unmount();
    if (condition === "permission") await act(async () => { page.queryClient.setQueryData(currentUserQueryKey, { ...me, effectivePermissions: { ...me.effectivePermissions, platform: ["platform.tenants.read"] } }); });
    if (condition === "organization") { server.use(http.get("/api/platform/tenants/otra", () => HttpResponse.json({ ...organization, id: "otra", name: "Otra organización" })), http.get("/api/platform/tenants/otra/features", () => HttpResponse.json(features)), http.get("/api/platform/tenants/otra/history", () => HttpResponse.json({ items: [], hasMore: false }))); await act(async () => { await page.router.navigate("/plataforma/organizaciones/otra"); }); await screen.findByRole("heading", { name: "Otra organización" }); }
    if (condition === "cancel") await action(page.user, "Permitir su propia clave");
    await act(async () => { release?.(); });
    expect(screen.queryByText("Organización real puede usar su propia clave.")).not.toBeInTheDocument();
    if (condition === "cancel") { expect(screen.getByRole("dialog")).toBeVisible(); expect(screen.getByRole("textbox", { name: "Motivo" })).toHaveValue(""); }
  });
  it("390 usa la misma fila/hoja y confirmación, un solo diálogo y foco al volver", async () => {
    asPhone(); const page = await mount(); await screen.findByText(/Con la clave de la plataforma/); expect(screen.queryByRole("table")).not.toBeInTheDocument();
    await action(page.user, "Permitir su propia clave"); expect(screen.getAllByRole("dialog")).toHaveLength(1);
    expect(await axe(page.container)).toHaveNoViolations(); await page.user.click(screen.getByRole("button", { name: "Cancelar" }));
    await waitFor(() => expect(screen.getByRole("button", { name: "Acciones de Asistente" })).toHaveFocus());
  });
  it("Trial/WhatsApp mantienen sus rutas y versiones genéricas después de policy", async () => {
    const featureBodies: unknown[] = [];
    server.use(http.put("/api/platform/tenants/delta/features/:key", async ({ request }) => { featureBodies.push(await request.json()); return HttpResponse.json({ version: 44 }); }));
    const page = await mount(); await screen.findByText("Con la clave de la plataforma"); await action(page.user, "Permitir su propia clave"); await submit(page.user, "Permitir"); await screen.findByText("Organización real puede usar su propia clave."); await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    await action(page.user, "Extender prueba"); await submit(page.user, "Extender prueba"); await screen.findByText("Extendimos la prueba de Asistente."); await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    await page.user.click(screen.getByRole("button", { name: "Acciones de WhatsApp" })); await page.user.click(screen.getByRole("menuitem", { name: "Apagar" })); await submit(page.user, "Apagar"); await screen.findByText("Apagamos WhatsApp.");
    expect(featureBodies).toEqual([{ enabled: true, source: "Trial", expiresOn: "2026-10-27", version: 3, reason: "Revisión" }, { enabled: false, source: "Manual", expiresOn: null, version: 8, reason: "Revisión" }]);
  });
  it("carga policy no inventa default y catálogo pendiente no inventa una fila", async () => {
    let release: (() => void) | undefined; server.use(http.get("/api/platform/tenants/delta/assistant/policy", async () => { reads++; await new Promise<void>((resolve) => { release = resolve; }); return HttpResponse.json(policy); }));
    const page = await mount(); await waitFor(() => expect(release).toBeDefined()); expect(screen.queryByText("Con la clave de la plataforma")).not.toBeInTheDocument();
    await page.user.click(screen.getByRole("button", { name: "Acciones de Asistente" })); expect(screen.queryByRole("menuitem", { name: "Permitir su propia clave" })).not.toBeInTheDocument(); await page.user.keyboard("{Escape}"); page.unmount(); await act(async () => { release?.(); });
    server.use(http.get("/api/platform/tenants/delta/features", async () => { await new Promise<void>((resolve) => { release = resolve; }); return HttpResponse.json(features); }));
    reads = 0; const loading = await mount(); expect(screen.queryByText("Asistente")).not.toBeInTheDocument(); expect(reads).toBe(0); loading.unmount(); await act(async () => { release?.(); });
  });
  it("en-US interpola la organización en las dos promesas aprobadas", async () => {
    policy = { allowOwnKey: true, version: 12 }; const page = await mount({ ...me, culture: "en-US" });
    await screen.findByText("Can use its own key"); await page.user.click(screen.getByRole("button", { name: "Actions for Assistant" })); await page.user.click(screen.getByRole("menuitem", { name: "Only with the platform key" }));
    expect(screen.getByRole("dialog")).toHaveTextContent("Organización real will no longer be able to use its own key. If it is using that key, it will need to select the platform key in Assistant Settings to make AI requests again.");
    await page.user.type(screen.getByRole("textbox", { name: "Reason" }), "Review"); await page.user.click(screen.getByRole("button", { name: "Only the platform key" })); await screen.findByText("Organización real can no longer use its own key.");
    expect(bodies[0]).toEqual({ allowOwnKey: false, version: 12, reason: "Review" });
  });
});
