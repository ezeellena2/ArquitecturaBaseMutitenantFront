import { QueryClient } from "@tanstack/react-query";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createMemoryRouter, RouterProvider } from "react-router";
import { AppProviders } from "@/app/providers";
import { routes } from "@/app/routes";
import { SessionStatusPage } from "@/auth/SessionStatusPage";
import { DeletionRequestedPage } from "@/areas/personal/account/components/DeletionRequestedPage";
import { LoginPage } from "@/areas/public/auth/pages/LoginPage";
import { ApiError } from "@/shared/api/ApiError";
import { publishAccessError } from "@/shared/api/accessErrorStore";
import { currentUsers, type CurrentUserFixture } from "./mocks/currentUsers";
import { fixtureAuth } from "./mocks/authContext";
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
const router = sessionPage
  ? createMemoryRouter([{ path: "*", element: sessionPage }], { initialEntries: [session === "cancelled" ? route : "/"] })
  : createMemoryRouter(routes, { initialEntries: [route] });
const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
const root = document.getElementById("root");
if (!root) throw new Error("Falta raíz visual");
createRoot(root).render(<StrictMode><AppProviders client={client} authContext={fixtureAuth(as)}><RouterProvider router={router} /></AppProviders></StrictMode>);
