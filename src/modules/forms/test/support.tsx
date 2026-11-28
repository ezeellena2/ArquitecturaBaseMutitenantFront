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
import { businessE6Admin } from "@/test/mocks/currentUsers";
import { meHandlerFor } from "@/test/mocks/handlers";
import { server } from "@/test/mocks/server";
import type { FormCatalogResponse } from "../api/types";
import type { FormsPermission } from "../registration";

/** Alguien de la organización con Formularios prendido, los permisos de catálogos que se pidan y, si se pide, WhatsApp. */
export function formsMember(permissions: readonly FormsPermission[], features: readonly string[] = ["forms", "whatsapp"]): MeResponse {
  return { ...businessE6Admin, features: [...features],
    effectivePermissions: { ...businessE6Admin.effectivePermissions, organization: [...businessE6Admin.effectivePermissions.organization, ...permissions] } };
}

/** La Dueña: «Administrar catálogos» incluye «Ver catálogos» (260). */
export const formsOwner = formsMember(["formcatalogs.read", "formcatalogs.manage"]);
export const formsReader = formsMember(["formcatalogs.read"]);

/** Lo que suma la E13 al detalle de un catálogo sin campos: la presentación por defecto, como la tiene un alta de antes (0060). */
export function withoutFields(): Pick<FormCatalogResponse, "fields" | "presentation" | "presentationIssues"> {
  return { fields: [], presentation: { title: ["text"], description: ["detail"] }, presentationIssues: { count: 0, examples: [] } };
}

/**
 * Monta la app entera en `path`, con las rutas, el marco y los providers reales, como `mountWhatsApp`. Los pedidos de la
 * pantalla se atienden con `server.use(...)` en cada test (MSW falla con lo que no tiene handler).
 */
export function mountForms(me: MeResponse, path: string) {
  server.use(meHandlerFor(me));
  const client = createQueryClient({ queries: { retry: false }, mutations: { retry: false } });
  client.setQueryData(currentUserQueryKey, me);
  const router = createMemoryRouter(routesForHost(mainSiteHost), { initialEntries: [path] });
  const result = render(<PublicSiteHostContext.Provider value={mainSiteHost}>
    <AppProviders client={client} authContext={fixtureAuth("business-e6-admin")} modules={moduleComposition}><RouterProvider router={router} /></AppProviders>
  </PublicSiteHostContext.Provider>);
  return { ...result, client, router, user: userEvent.setup() };
}
