import { render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router";
import { http, HttpResponse } from "msw";
import { AppProviders } from "@/app/providers";
import { routesForHost } from "@/app/routes";
import { moduleComposition } from "@/app/moduleComposition";
import { currentUserQueryKey } from "@/auth/useCurrentUser";
import { createQueryClient } from "@/shared/api/queryClient";
import type { AssistantModelPriceResponse, MeResponse, OrganizationAssistantSettingsResponse, PlatformAssistantSettingsResponse } from "@/shared/api/types";
import type { ModuleRegistration } from "@/shared/modules/types";
import { mainSiteHost } from "@/tenancy/publicSite";
import { PublicSiteHostContext } from "@/tenancy/usePublicSite";
import { fixtureAuth } from "@/test/mocks/authContext";
import { businessE6Admin, platformOperator } from "@/test/mocks/currentUsers";
import { meHandlerFor, referenceDataFixture } from "@/test/mocks/handlers";
import { server } from "@/test/mocks/server";

export const businessManager: MeResponse = { ...businessE6Admin, features: ["assistant"], effectivePermissions: { organization: ["assistant.configure"], platform: [], companies: {} } };
export const platformManager: MeResponse = { ...platformOperator, effectivePermissions: { organization: [], platform: [], companies: {} }, moduleCapabilities: [{ key: "assistant", available: false, canConfigure: true, canReadUsage: false }] };
export const firstModel: AssistantModelPriceResponse = { id: "11111111-1111-4111-8111-111111111111", name: "Modelo de prueba A", provider: "Anthropic", providerModelId: "test-a", inputPricePerMillion: { amount: 0.125, currency: "USD" }, outputPricePerMillion: { amount: 1, currency: "USD" }, isActive: true, version: 3 };
export const secondModel: AssistantModelPriceResponse = { ...firstModel, id: "22222222-2222-4222-8222-222222222222", name: "Modelo de prueba B", providerModelId: "test-b" };
export const organizationSettings = (): OrganizationAssistantSettingsResponse => ({ mode: "PlatformKey", modelId: firstModel.id, effort: "medium", dailyMessageLimit: 50, monthlyBudget: { amount: 100, currency: "USD" }, allowOwnKey: true, hasAlertRecipient: true, retentionDays: 30, hasKey: true, maskedKeySuffix: "last", version: 10, platformKeyModels: [firstModel], ownKeyModels: [firstModel, secondModel] });
export const platformSettings = (): PlatformAssistantSettingsResponse => ({ defaultModelId: firstModel.id, allowedModelIds: [firstModel.id], effort: "medium", dailyMessageLimit: 50, monthlyOrganizationBudget: { amount: 100, currency: "USD" }, personalEnabled: false, retentionDays: 30, hasKey: true, maskedKeySuffix: "last", version: 20 });
export function settingsHandlers(org = organizationSettings(), platform = platformSettings()) {
  const reference = referenceDataFixture();
  server.use(http.get("/api/reference-data", () => HttpResponse.json({ ...reference, currencies: [...reference.currencies, { ...reference.currencies[0], code: "USD", name: "Dólar estadounidense", displaySymbol: "USD", symbol: "$", minorUnits: 2 }] })),
    http.get("/api/organization/assistant/settings", () => HttpResponse.json(org)),
    http.get("/api/platform/assistant/settings", () => HttpResponse.json(platform)),
    http.get("/api/platform/assistant/models", ({ request }) => { const query = new URL(request.url).searchParams; return HttpResponse.json({ items: [firstModel, secondModel], page: Number(query.get("page") ?? 1), pageSize: Number(query.get("pageSize") ?? 10), totalCount: 2 }); }));
}
export function mountSettings(me = businessManager, path = me.access === "platform" ? "/plataforma/asistente/configuracion" : "/org/asistente/configuracion", modules: readonly ModuleRegistration[] = moduleComposition) {
  server.use(meHandlerFor(me));
  const client = createQueryClient({ queries: { retry: false }, mutations: { retry: false } });
  client.setQueryData(currentUserQueryKey, me);
  const router = createMemoryRouter(routesForHost(mainSiteHost), { initialEntries: [path] });
  const result = render(<PublicSiteHostContext.Provider value={mainSiteHost}><AppProviders client={client} authContext={fixtureAuth(me.access === "platform" ? "platform-operator" : "business-e6-admin")} modules={modules}><RouterProvider router={router} /></AppProviders></PublicSiteHostContext.Provider>);
  return { ...result, client, router, user: userEvent.setup() };
}
