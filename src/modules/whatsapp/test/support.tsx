import { render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router";
import { AppProviders } from "@/app/providers";
import { routesForHost } from "@/app/routes";
import { moduleComposition } from "@/app/moduleComposition";
import { currentUserQueryKey } from "@/auth/useCurrentUser";
import { createQueryClient } from "@/shared/api/queryClient";
import type { MeResponse } from "@/shared/api/types";
import { mainSiteHost } from "@/tenancy/publicSite";
import { PublicSiteHostContext } from "@/tenancy/usePublicSite";
import { fixtureAuth } from "@/test/mocks/authContext";
import { businessE6Admin, consumerWithoutOrganizations, platformOperator } from "@/test/mocks/currentUsers";
import { meHandlerFor } from "@/test/mocks/handlers";
import { server } from "@/test/mocks/server";
import { platformWhatsAppPermissions, whatsappPermissions, type PlatformWhatsAppPermission, type WhatsAppPermission } from "../access";

/** La Dueña con el módulo prendido y los cuatro permisos de entrada (D3). */
export const whatsappOwner: MeResponse = {
  ...businessE6Admin, features: ["whatsapp"],
  effectivePermissions: { ...businessE6Admin.effectivePermissions, organization: [...businessE6Admin.effectivePermissions.organization, ...whatsappPermissions] },
};

/** Alguien de la organización con solo algunos permisos de WhatsApp (y ninguno del núcleo). */
export function whatsappMember(...permissions: readonly WhatsAppPermission[]): MeResponse {
  return { ...businessE6Admin, features: ["whatsapp"], permissions: [...permissions], effectivePermissions: { platform: [], organization: [...permissions], companies: {} } };
}

/** Un operador de Plataforma con los dos permisos de WhatsApp, o los que se pidan. */
export function whatsappOperator(...permissions: readonly PlatformWhatsAppPermission[]): MeResponse {
  const own = permissions.length ? permissions : platformWhatsAppPermissions;
  return { ...platformOperator, effectivePermissions: { ...platformOperator.effectivePermissions, platform: [...platformOperator.effectivePermissions.platform, ...own] } };
}

/** Una persona en su perfil personal con el módulo prendido. */
export const whatsappPerson: MeResponse = { ...consumerWithoutOrganizations, features: ["whatsapp"] };

/**
 * Monta la app entera en `path`, con las rutas, el marco y los providers reales, como `mountSettings` del asistente.
 * Los pedidos de la pantalla se atienden con `server.use(...)` en cada test (MSW falla con lo que no tiene handler).
 */
export function mountWhatsApp(me: MeResponse, path: string) {
  server.use(meHandlerFor(me));
  const client = createQueryClient({ queries: { retry: false }, mutations: { retry: false } });
  client.setQueryData(currentUserQueryKey, me);
  const router = createMemoryRouter(routesForHost(mainSiteHost), { initialEntries: [path] });
  const fixture = me.access === "platform" ? "platform-operator" : me.access === "consumer" ? "consumer-empty" : "business-e6-admin";
  const result = render(<PublicSiteHostContext.Provider value={mainSiteHost}>
    <AppProviders client={client} authContext={fixtureAuth(fixture)} modules={moduleComposition}><RouterProvider router={router} /></AppProviders>
  </PublicSiteHostContext.Provider>);
  return { ...result, client, router, user: userEvent.setup() };
}
