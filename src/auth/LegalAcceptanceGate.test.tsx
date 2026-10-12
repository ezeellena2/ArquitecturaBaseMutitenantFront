import { act, render, screen, waitFor } from "@testing-library/react";
import { useEffect, type ReactNode } from "react";
import { User, UserManager } from "oidc-client-ts";
import { useAuth, type AuthContextProps } from "react-oidc-context";
import userEvent from "@testing-library/user-event";
import { HttpResponse, http } from "msw";
import { RouterProvider, createMemoryRouter } from "react-router";
import { toast } from "sonner";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AppProviders } from "@/app/providers";
import { routes } from "@/app/routes";
import { createQueryClient } from "@/shared/api/queryClient";
import { changeCulture, configureI18n } from "@/shared/i18n";
import { fixtureAuth } from "@/test/mocks/authContext";
import { consumerWithoutOrganizations, platformOperator } from "@/test/mocks/currentUsers";
import { currentUserQueryKey } from "./useCurrentUser";
import { authConfig } from "./authConfig";
import { recoveryAccess } from "./recoveryAccess";
import { legalDocumentsQueryKey } from "@/areas/platform/legal/api/legalDocuments";
import type { MeResponse } from "@/shared/api/types";
import { referenceDataFixture } from "@/test/mocks/handlers";
import { server } from "@/test/mocks/server";

beforeEach(async () => {
  await configureI18n(referenceDataFixture().cultures);
  await changeCulture("es-AR");
});

afterEach(() => { vi.restoreAllMocks(); });

// Como renderRouteWithProviders, pero con el /api/me de la prueba: el de `as` respondería primero.
function renderWithSession(path: string) {
  const client = createQueryClient({ queries: { retry: false }, mutations: { retry: false } });
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  return render(<AppProviders client={client} authContext={fixtureAuth("consumer-empty")}><RouterProvider router={router} /></AppProviders>);
}

describe("LegalAcceptanceGate", () => {
  // «Criterio · Avisos»: el mismo error nunca va en dos lugares. Si /api/me falla no se puede mostrar nada: la
  // «Pantalla de error» con «Reintentar», sin el aviso rojo de abajo. «Reintentar» lo vuelve a pedir.
  it("si falla /api/me, sale la pantalla de error con «Reintentar» y nada más", async () => {
    const user = userEvent.setup();
    const errorToast = vi.spyOn(toast, "error");
    let fail = true;
    server.use(http.get("/api/me", () => fail
      ? HttpResponse.json({ status: 500, title: "Error", traceId: "00-abc-01" }, { status: 500, headers: { "Content-Type": "application/problem+json" } })
      : HttpResponse.json(consumerWithoutOrganizations)));
    renderWithSession("/cuenta");

    expect(await screen.findByRole("heading", { name: "No pudimos abrir esta pantalla" })).toBeVisible();
    expect(screen.getAllByRole("alert")).toHaveLength(1);
    expect(errorToast).not.toHaveBeenCalled();

    fail = false;
    await user.click(screen.getByRole("button", { name: "Reintentar" }));
    expect(await screen.findByRole("heading", { name: "Mi cuenta" })).toBeVisible();
    expect(screen.queryByRole("heading", { name: "No pudimos abrir esta pantalla" })).not.toBeInTheDocument();
  });

  it.each([false, true])("mantiene bloqueado Platform mientras Me fresco está demorado tras 403, sin loop ni cambio OIDC (refetch falla %s)", async (failFreshRead) => {
    await import("@/areas/platform/legal/pages/LegalDocumentsPage");
    await import("@/areas/public/legal/pages/AcceptTermsPage");
    const manager = new UserManager(authConfig);
    await manager.storeUser(new User({ access_token: "test-legal-platform", id_token: "test-legal-platform-id", token_type: "Bearer", scope: authConfig.scope,
      expires_at: Math.floor(Date.now() / 1000) + 3600,
      profile: { iss: authConfig.authority, aud: "web", sub: platformOperator.id, iat: 1, exp: 4102444800, access: "platform" } }));
    let auth: AuthContextProps | undefined;
    function AuthReady({ children }: { children: ReactNode }) {
      const current = useAuth();
      useEffect(() => { auth = current; }, [current]);
      return current.isLoading || !current.isAuthenticated ? null : children;
    }
    let blocked = false; let accepted = false; let meCalls = 0; let legalCalls = 0; let pendingMe = false; let fail = failFreshRead;
    let releaseMe!: () => void;
    const held = new Promise<void>((resolve) => { releaseMe = resolve; });
    const headers: Array<string | null> = []; const oidcCalls: string[] = [];
    const pending: MeResponse = { ...platformOperator, pendingLegalDocuments: [{ id: "privacy-v3", kind: "Privacy", version: 3 }] };
    const groups = [{ kind: "Privacy", currentVersion: 3, currentEffectiveAtUtc: "2026-10-11T03:00:00Z",
      versions: [{ id: "privacy-v3", version: 3, effectiveAtUtc: "2026-10-11T03:00:00Z", isCurrent: true }] }];
    server.use(http.get("/api/me", async ({ request }) => {
      headers.push(request.headers.get("authorization")); meCalls++;
      if (blocked && !accepted) {
        pendingMe = true; await held;
        if (fail) { fail = false; return HttpResponse.json({ status: 500, title: "Error", traceId: "test-legal-me" }, { status: 500 }); }
        return HttpResponse.json(pending);
      }
      return HttpResponse.json(platformOperator);
    }), http.get("/api/platform/legal-documents", async ({ request }) => {
      headers.push(request.headers.get("authorization")); legalCalls++;
      // Una lectura repetida queda demorada también: el fallo se ve en las aserciones, sin un loop ilimitado del test.
      if (blocked && !accepted && legalCalls > 2) await held;
      return blocked && !accepted ? HttpResponse.json({ code: "Legal.AcceptanceRequired", status: 403 }, { status: 403 }) : HttpResponse.json(groups);
    }), http.post("/api/legal/accept", async ({ request }) => {
      headers.push(request.headers.get("authorization")); expect(await request.json()).toEqual({ documents: [{ id: "privacy-v3", version: 3 }] });
      accepted = true; return new HttpResponse(null, { status: 204 });
    }), http.all("*/connect/*", ({ request }) => { oidcCalls.push(new URL(request.url).pathname); return HttpResponse.json({}, { status: 400 }); }));
    const client = createQueryClient({ queries: { retry: false }, mutations: { retry: false } });
    const router = createMemoryRouter(routes, { initialEntries: ["/plataforma/legales"] });
    const locations: string[] = []; const unsubscribe = router.subscribe((state) => locations.push(state.location.pathname));
    const view = render(<AppProviders client={client}><AuthReady><RouterProvider router={router} /></AuthReady></AppProviders>);
    try {
      expect(await screen.findByRole("heading", { name: "Documentos legales" })).toBeVisible();
      await waitFor(() => expect(legalCalls).toBe(1));
      blocked = true;
      await act(async () => { void client.invalidateQueries({ queryKey: legalDocumentsQueryKey }); });
      await waitFor(() => expect(pendingMe).toBe(true));
      await act(async () => { await Promise.resolve(); });
      expect(screen.queryByRole("heading", { name: "Documentos legales" })).not.toBeInTheDocument();
      expect(meCalls).toBe(2);
      expect(legalCalls).toBe(2);
      await act(async () => { releaseMe(); });
      if (failFreshRead) {
        expect(await screen.findByRole("heading", { name: "No pudimos abrir esta pantalla" })).toBeVisible();
        expect(screen.queryByRole("heading", { name: "Documentos legales" })).not.toBeInTheDocument();
        await userEvent.setup().click(screen.getByRole("button", { name: "Reintentar" }));
      }
      expect(await screen.findByRole("heading", { name: "Actualizamos los términos" })).toBeVisible();
      expect(router.state.location.pathname).toBe("/aceptar-terminos");
      expect(locations.filter((path, index) => path === "/plataforma/legales" && locations[index - 1] === "/aceptar-terminos")).toHaveLength(0);
      expect(auth?.user?.profile.access).toBe("platform"); expect(recoveryAccess("/aceptar-terminos")).toBe("platform");
      expect(client.getQueryData<MeResponse>(currentUserQueryKey)?.access).toBe("platform");
      const user = userEvent.setup(); await user.click(screen.getByRole("checkbox")); await user.click(screen.getByRole("button", { name: "Aceptar y seguir" }));
      expect(await screen.findByRole("heading", { name: "Documentos legales" })).toBeVisible();
      expect(headers.every((value) => value === "Bearer test-legal-platform")).toBe(true);
      expect(oidcCalls).toEqual([]);
    } finally { releaseMe(); unsubscribe(); view.unmount(); client.clear(); await auth?.removeUser(); await manager.removeUser(); }
  });
});
