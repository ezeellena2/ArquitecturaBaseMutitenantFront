import { describe, expect, it } from "vitest";
import type { AssistantStateResponse, AssistantUsagePageResponse, MeResponse } from "@/shared/api/types";
import { galleryMonthlyBudgetScenario, usageScenario } from "@/test/etapa8bVisualFixtures";

describe("preparación visual de Uso, independiente de operatividad Back", () => {
  it.each(["Asistente-Org", "M-Asistente-Org"])("%s prepara el tope del servidor con Ver uso, sin provocar un 429", (board) => {
    const app = galleryMonthlyBudgetScenario(board)!;
    const state = app.responses.find((item) => item.path === "/api/organization/assistant")!.body as AssistantStateResponse;
    expect(state.monthlyBudgetProgress).toEqual({ fraction: 1, status: "LimitReached" });
    expect(app.readyTexts).toContain("Ver uso");
    expect(app.responses.some((item) => item.status === 429 || item.method === "POST")).toBe(false);
    const me = app.responses.find((item) => item.path === "/api/me")!.body as MeResponse;
    expect(me.effectivePermissions.organization).toContain("assistant.configure");
    expect(app.actions.map((action) => "name" in action ? action.name : undefined)).toContain("Mi consulta");
  });
  it.each(["Asistente-Uso-Org", "M-Asistente-Uso-Org", "Plat-Asistente-Uso", "M-Plat-Asistente-Uso"])("%s prepara la ruta y el único GET mensual publicado", (board) => {
    const platform = board.includes("Plat-"); const app = usageScenario(board, platform ? "Por organización" : "Por día")!;
    expect(app.captureMode).toBe("harness");
    const usage = app.responses.filter((item) => item.path.endsWith("/assistant/usage"));
    expect(usage).toHaveLength(1); expect(usage[0].method).toBe("GET");
    const data = usage[0].body as AssistantUsagePageResponse;
    expect(data.month).toBe("2026-10"); expect(data.rows.items[0].inputTokens).toBe(2457600000);
    expect(app.responses.some((item) => item.path.endsWith("/assistant/settings") || item.path.endsWith("/assistant"))).toBe(false);
    const me = app.responses.find((item) => item.path === "/api/me")!.body as MeResponse;
    if (platform) expect(me.moduleCapabilities?.find((item) => item.key === "assistant")?.canReadUsage).toBe(true);
  });
  it.each([["Cerca del tope", "NearLimit", 0.84], ["Llegó al tope", "LimitReached", 1]] as const)("%s transporta estado y fracción explícitos", (state, status, fraction) => {
    const app = usageScenario("Asistente-Uso-Org", state)!;
    const data = app.responses.find((item) => item.path.endsWith("/assistant/usage"))!.body as AssistantUsagePageResponse;
    expect(data.budgetProgress).toEqual({ fraction, status });
  });
  it("no fabrica un estado no dibujado ni declara capturas o prueba real", () => {
    expect(galleryMonthlyBudgetScenario("Asistente-Personal")).toBeUndefined();
    expect(usageScenario("Asistente-Uso-Org", "Inventado")).toBeUndefined();
    expect(usageScenario("Asistente-Org", "Por día")).toBeUndefined();
    expect(usageScenario("Plat-Asistente-Uso", "Por persona")).toBeUndefined();
    expect(usageScenario("M-Asistente-Uso-Org", "Llegó al tope")).toBeUndefined();
    const app = usageScenario("Plat-Asistente-Uso", "Sin uso este mes")!;
    const data = app.responses.find((item) => item.path.endsWith("/assistant/usage"))!.body as AssistantUsagePageResponse;
    expect(data.rows.items).toEqual([]); expect(data.organizationCount).toBe(0); expect(app.readyText).toBe("Sin uso este mes");
  });
});
