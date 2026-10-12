import { screen } from "@testing-library/react";
import { http, HttpResponse } from "msw";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import type { AssistantStateResponse } from "@/modules/assistant/api/types";
import { server } from "@/test/mocks/server";
import { businessManager, mountSettings, settingsHandlers } from "../settings/settingsTestSupport";

beforeAll(async () => { await import("../pages/RegisteredAssistant"); await import("./OrganizationAssistantUsagePage"); });
beforeEach(() => settingsHandlers());
const state: AssistantStateResponse = { configured: true, canConfigure: true, models: [], quickQueries: [], dailyLimit: 50, remainingMessages: 39,
  dailyResetAtUtc: "2026-10-12T00:00:00Z", noticeVersion: "v1", noticeAccepted: true, retentionDays: 30, maxAttachmentBytes: 10485760, maxAttachments: 5,
  monthlyBudgetProgress: { fraction: 1.1, status: "LimitReached" } };
function chat() {
  server.use(http.get("/api/organization/assistant", () => HttpResponse.json(state)),
    http.get("/api/organization/assistant/conversations", () => HttpResponse.json({ items: [], nextCursor: null })));
}
describe("Ver uso respeta la ruta instalada y su permiso independiente", () => {
  it("desde el tope mensual lleva a Uso de la organización", async () => {
    chat(); server.use(http.get("/api/organization/assistant/usage", () => HttpResponse.json({ month: "2026-10", cost: { amount: 0, currency: "USD" }, totalQueries: 0, peopleCount: 0,
      budgetProgress: null, organizationCount: null, rows: { items: [], page: 1, pageSize: 10, totalCount: 0 } })));
    const me = { ...businessManager, effectivePermissions: { ...businessManager.effectivePermissions, organization: ["assistant.use", "assistant.configure"] } };
    const app = mountSettings(me, "/org/asistente");
    await app.user.click(await screen.findByRole("button", { name: "Ver uso" }));
    expect(await screen.findByText("Sin uso este mes")).toBeVisible(); expect(app.router.state.location.pathname).toBe("/org/asistente/uso");
  });
  it("chat solo conserva el aviso del tope sin conceder Uso", async () => {
    chat(); const me = { ...businessManager, effectivePermissions: { ...businessManager.effectivePermissions, organization: ["assistant.use"] } };
    mountSettings(me, "/org/asistente");
    await screen.findByText(/llegó al tope del mes del asistente/); expect(screen.queryByRole("button", { name: "Ver uso" })).not.toBeInTheDocument();
  });
});
