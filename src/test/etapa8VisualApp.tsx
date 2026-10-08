import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createMemoryRouter, RouterProvider } from "react-router";
import type { AuthContextProps } from "react-oidc-context";
import { AppProviders } from "@/app/providers";
import { routes } from "@/app/routes";
import { createQueryClient } from "@/shared/api/queryClient";
import { fixtureAuth } from "./mocks/authContext";
import { currentUsers, type CurrentUserFixture } from "./mocks/currentUsers";
import "@fontsource-variable/inter";
import "@/index.css";

// Sólo entrada visual de tests: los componentes y providers son los del producto.
const params = new URLSearchParams(globalThis.location.search);
const fixture = params.get("as") ?? "anonymous";
if (fixture !== "anonymous" && !(fixture in currentUsers)) throw new Error("Fixture E8 desconocido");
const route = params.get("route") ?? "/login";
if (!route.startsWith("/") || route.startsWith("//")) throw new Error("Ruta visual inválida");
const anonymous = {
  isAuthenticated: false, isLoading: false, user: undefined,
  signinSilent: async () => null, signinRedirect: async () => {}, signoutRedirect: async () => {}, removeUser: async () => {},
} as unknown as AuthContextProps;
const authContext = fixture === "anonymous" ? anonymous : { ...fixtureAuth(fixture as CurrentUserFixture), removeUser: async () => {} };
// El enlace de prueba conserva su fragmento real, nunca lo coloca en la query del arnés.
const initialRoute = route === "/login/enlace" ? `${route}${globalThis.location.hash}` : route;
const router = createMemoryRouter(routes, { initialEntries: [initialRoute] });
const root = document.getElementById("root");
if (!root) throw new Error("Falta raíz visual");
createRoot(root).render(<StrictMode><AppProviders client={createQueryClient()} authContext={authContext}><RouterProvider router={router} /></AppProviders></StrictMode>);
