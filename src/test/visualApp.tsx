import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createMemoryRouter, RouterProvider } from "react-router";
import { AppProviders } from "@/app/providers";
import { PlatformLayout } from "@/layouts/PlatformLayout";
import { routes } from "@/app/routes";
import { SessionStatusPage } from "@/auth/SessionStatusPage";
import { DeletionRequestedPage } from "@/areas/personal/account/components/DeletionRequestedPage";
import { LoginPage } from "@/areas/public/auth/pages/LoginPage";
import { ApiError } from "@/shared/api/ApiError";
import { createQueryClient } from "@/shared/api/queryClient";
import { publishAccessError } from "@/shared/api/accessErrorStore";
import { currentUsers, type CurrentUserFixture } from "./mocks/currentUsers";
import { fixtureAuth } from "./mocks/authContext";
import "@fontsource-variable/inter";
import "@/index.css";

const params = new URLSearchParams(window.location.search);
const fixture = params.get("as") ?? "visual-personal";
if (!(fixture in currentUsers)) throw new Error(`Fixture visual desconocido: ${fixture}`);
const route = params.get("route") ?? "/";
if (!route.startsWith("/") || route.startsWith("//")) throw new Error("Ruta visual inválida");
const as = fixture as CurrentUserFixture;
const unavailable = params.get("unavailable");
const unavailableCodes = {
  suspended: "Tenancy.Tenant.Suspended",
  pending: "Tenancy.Tenant.PendingApproval",
  closed: "Tenancy.Tenant.Closed",
} as const;
if (unavailable) {
  const code = unavailableCodes[unavailable as keyof typeof unavailableCodes];
  const current = currentUsers[as];
  const organization = current.organizations.find((item) => item.id === current.activeTenantId);
  if (!code || !organization) throw new Error("Estado visual de organización inválido");
  publishAccessError(new ApiError(403, { code, tenantId: organization.id, organizationName: organization.name }));
}
const session = params.get("session");
const sessionPages = {
  cancelled: <LoginPage access="consumer" completeLogin={() => {}} />,
  deletion: <DeletionRequestedPage date="27/10/2026" />,
  starting: <SessionStatusPage status="starting" />,
  "switching-business": <SessionStatusPage status="switching" targetName="Grupo Delta" />,
  "switching-personal": <SessionStatusPage status="switching" targetName="Personal" />,
  closing: <SessionStatusPage status="closing" />,
  error: <SessionStatusPage status="error" />,
};
const sessionPage = session ? sessionPages[session as keyof typeof sessionPages] : undefined;
if (session && !sessionPage) throw new Error("Estado visual de sesión inválido");
const frame = params.get("frame");
if (frame && (frame !== "platform" || currentUsers[as].access !== "platform" || session)) throw new Error("Marco visual inválido");
// T20b compara el marco real mientras las páginas de T21–T23 todavía no se montan. No agrega contenido de prueba.
const router = sessionPage
  ? createMemoryRouter([{ path: "*", element: sessionPage }], { initialEntries: [session === "cancelled" ? route : "/"] })
  : frame === "platform" ? createMemoryRouter([{ path: "*", element: <PlatformLayout /> }], { initialEntries: [route] })
  : createMemoryRouter(routes, { initialEntries: [route] });
// El cliente de la app, con sus avisos globales (red, 5xx y 429) y sus opciones: la captura muestra lo que ve la persona.
const client = createQueryClient();
const root = document.getElementById("root");
if (!root) throw new Error("Falta raíz visual");
createRoot(root).render(<StrictMode><AppProviders client={client} authContext={fixtureAuth(as)}><RouterProvider router={router} /></AppProviders></StrictMode>);
