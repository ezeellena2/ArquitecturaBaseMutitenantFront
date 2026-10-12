import { domainPage } from "@/test/mocks/domainPage";
import { screen, within } from "@testing-library/react";
import type userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import type { ApiSchemas } from "@/shared/api/types";
import { changeCulture, configureI18n } from "@/shared/i18n";
import { referenceDataFixture } from "@/test/mocks/handlers";
import { server } from "@/test/mocks/server";
import { renderRouteWithProviders } from "@/test/utils/renderWithProviders";

// Catálogo y respuestas exclusivamente de prueba; Features.All del producto permanece vacío.
export const TestFeatures: ApiSchemas["PlatformFeatureResponse"][] = [
  { key: "WhatsApp", enabled: true, source: "Plan", version: 3 },
  { key: "Módulo B", enabled: true, source: "Trial", expiresOn: "2026-10-27", version: 0 },
];
export const testOrganization: ApiSchemas["PlatformTenantDetailResponse"] = {
  id: "delta", name: "Grupo Delta", slug: "delta", status: "Active", source: "SelfService", createdAtUtc: "2026-01-12T11:40:00Z",
  companyCount: 3, memberCount: 11, version: 2, owners: [], lastStateChange: null,
};
export const testDomain: ApiSchemas["OrganizationDomainResponse"] = {
  id: "domain-1", domain: "delta.ejemplo.com", status: "Pending", txtRecordName: "delta.ejemplo.com", txtRecordValue: "ab-verificacion=7f3c9a2e41b8d605",
  createdAtUtc: "2026-01-12T11:40:00Z", verifiedAtUtc: null, version: 4, managedEmailCount: 1,
};
export const testPublicPage: ApiSchemas["PlatformPublicSiteResponse"] = {
  slug: "delta", name: "Grupo Delta", isPublished: true, version: 5, publishedAtUtc: "2026-02-15T11:40:00Z", publishBlockedAtUtc: null, publishBlockedReason: null,
};
export async function setupTabs() {
  await configureI18n(referenceDataFixture().cultures); await changeCulture("es-AR");
  server.use(
    http.get("/api/platform/tenants/delta", () => HttpResponse.json(testOrganization)),
    http.get("/api/platform/tenants/delta/history", () => HttpResponse.json({ items: [], hasMore: false })),
    http.get("/api/platform/tenants/delta/features", () => HttpResponse.json(TestFeatures)),
    http.get("/api/platform/tenants/delta/domains/paged", () => HttpResponse.json(domainPage([testDomain]))),
    http.get("/api/platform/tenants/delta/public-site", () => HttpResponse.json(testPublicPage)),
  );
}
export const renderTabs = () => renderRouteWithProviders("/plataforma/organizaciones/delta", { as: "platform-operator" });
export async function openTab(user: ReturnType<typeof userEvent.setup>, name: string) { await user.click(await screen.findByRole("tab", { name: new RegExp(`^${name}(?: \\d+)?$`) })); }
export async function menuAction(user: ReturnType<typeof userEvent.setup>, resource: string, label: string) {
  const trigger = await screen.findByRole("button", { name: `Acciones de ${resource}` });
  trigger.focus(); await user.keyboard("{Enter}");
  await user.click(await screen.findByRole("menuitem", { name: label }));
}
export async function submitReason(user: ReturnType<typeof userEvent.setup>, label: string, reason = "Revisión") {
  const dialog = await screen.findByRole("dialog");
  await user.type(within(dialog).getByRole("textbox", { name: "Motivo" }), reason);
  await user.click(within(dialog).getByRole("button", { name: label }));
}
export const problem = (code = "General.ConcurrencyConflict", detail = "Alguien cambió este dato.", status = 409) => HttpResponse.json({ code, detail, traceId: "test" }, { status });
