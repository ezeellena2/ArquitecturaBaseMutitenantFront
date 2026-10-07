import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createMemoryRouter, RouterProvider } from "react-router";
import type { User } from "oidc-client-ts";
import type { AuthContextProps } from "react-oidc-context";
import { AppProviders } from "@/app/providers";
import { routesForHost } from "@/app/routes";
import { createQueryClient } from "@/shared/api/queryClient";
import { siteOfHost } from "@/tenancy/publicSite";
import { etapa7PersonalUser } from "./etapa7VisualFixtures";
import "@fontsource-variable/inter";
import "@/index.css";

// Entrada de captura aislada, como visualApp: monta los árboles y componentes reales sin tocar la sesión del producto.
const params = new URLSearchParams(globalThis.location.search);
const fixture = params.get("as") ?? "anonymous";
if (fixture !== "anonymous" && fixture !== "personal") throw new Error("Fixture de Etapa 7 desconocido");
const route = params.get("route") ?? "/";
if (!route.startsWith("/") || route.startsWith("//")) throw new Error("Ruta visual inválida");
if (siteOfHost(globalThis.location.host).kind === "unknown") throw new Error("El host visual no coincide con VITE_AUTH_ISSUER");
const user = fixture === "personal" ? {
  access_token: "visual-etapa7-personal",
  profile: { sub: etapa7PersonalUser.id, access: etapa7PersonalUser.access, tenant_id: etapa7PersonalUser.activeTenantId },
} as unknown as User : undefined;
const authContext = {
  isAuthenticated: Boolean(user), isLoading: false, user,
  signinSilent: async () => user ?? null,
  signinRedirect: async () => {}, signoutRedirect: async () => {}, removeUser: async () => {},
} as unknown as AuthContextProps;
const router = createMemoryRouter(routesForHost(globalThis.location.host), { initialEntries: [route] });
const root = document.getElementById("root");
if (!root) throw new Error("Falta raíz visual");
createRoot(root).render(<StrictMode>
  <AppProviders client={createQueryClient()} authContext={authContext}><RouterProvider router={router} /></AppProviders>
</StrictMode>);
