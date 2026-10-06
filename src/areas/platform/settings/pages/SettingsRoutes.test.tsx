import { act, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { changeCulture, configureI18n } from "@/shared/i18n";
import { platformOperator } from "@/test/mocks/currentUsers";
import { meHandlerFor, referenceDataFixture } from "@/test/mocks/handlers";
import { platformSettingsFixture } from "@/test/mocks/platformSettings";
import { server } from "@/test/mocks/server";
import { renderRouteWithProviders } from "@/test/utils/renderWithProviders";

beforeAll(async () => { await import("./PlatformSettingsPage"); });
beforeEach(async () => { await configureI18n(referenceDataFixture().cultures); await changeCulture("es-AR"); });
describe("Ruta real de Configuración", () => {
  it("sin settings.manage no consulta GET ni PUT", async () => {
    let calls = 0; server.use(http.get("/api/platform/settings", () => { calls++; return HttpResponse.json(platformSettingsFixture); }), http.put("/api/platform/settings", () => { calls++; return HttpResponse.json({ version: 2 }); }));
    renderRouteWithProviders("/plataforma/configuracion", { as: "platform-operator-reader" });
    expect(await screen.findByRole("heading", { name: "No tenés permiso para ver esta página" })).toBeVisible(); expect(calls).toBe(0);
  });
  it("403 principal reemplaza pantalla por Sin permiso", async () => {
    server.use(http.get("/api/platform/settings", () => HttpResponse.json({ code: "Authorization.Forbidden", detail: "No autorizado" }, { status: 403 })));
    renderRouteWithProviders("/plataforma/configuracion", { as: "platform-operator" });
    expect(await screen.findByRole("heading", { name: "No tenés permiso para ver esta página" })).toBeVisible(); expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  });
  it("carga inicial y error local con Reintentar; permiso único basta", async () => {
    let reads = 0; let release: (() => void) | undefined;
    server.use(http.get("/api/platform/settings", async () => { reads++; if (reads === 1) { await new Promise<void>((resolve) => { release = resolve; }); return HttpResponse.error(); } return HttpResponse.json(platformSettingsFixture); }));
    const user = userEvent.setup(); const page = renderRouteWithProviders("/plataforma/configuracion", { as: "platform-operator" });
    server.use(meHandlerFor({ ...platformOperator, effectivePermissions: { ...platformOperator.effectivePermissions, platform: ["platform.settings.manage"] } }));
    await waitFor(() => expect(release).toBeDefined()); expect(screen.getByRole("status")).toHaveTextContent("Cargando"); await act(async () => { release?.(); });
    await user.click(await screen.findByRole("button", { name: "Reintentar" })); expect(await screen.findByRole("textbox", { name: "Correo de ventas" })).toBeVisible(); expect(reads).toBe(2); expect(page.router.state.location.pathname).toBe("/plataforma/configuracion");
  });
});
