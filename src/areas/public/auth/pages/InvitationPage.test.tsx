import { QueryClient } from "@tanstack/react-query";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { HttpResponse, http } from "msw";
import type { User } from "oidc-client-ts";
import type { AuthContextProps } from "react-oidc-context";
import { createMemoryRouter, RouterProvider } from "react-router";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import { AppProviders } from "@/app/providers";
import { changeCulture, configureI18n } from "@/shared/i18n";
import type { InvitationPreviewResponse } from "@/shared/api/types";
import { server } from "@/test/mocks/server";
import { businessUser } from "@/test/mocks/currentUsers";
import { InvitationPage } from "./InvitationPage";

const invitationToken = "opaque-invitation-token-probe";
const basePreview: InvitationPreviewResponse = {
  state: "NoAccount",
  organizationId: "tenant-invited",
  organizationName: "Grupo Delta",
  email: "invitada@example.test",
  inviterName: "Lucía Fernández",
  issuedAtUtc: "2026-09-30T12:00:00Z",
  expiresAtUtc: "2026-10-07T12:00:00Z",
  canUseEmailCode: false,
  canUseGoogle: false,
  needsPersonalLoginMethod: false,
};

let previewResponse = basePreview;
let previewRequests: Array<{ url: string; body: unknown; antiforgery: string | null }> = [];
let acceptRequests: Array<{ url: string; body: unknown; antiforgery: string | null; idempotencyKey: string | null }> = [];
let signinRedirect: ReturnType<typeof vi.fn>;
let signoutRedirect: ReturnType<typeof vi.fn>;

beforeAll(async () => {
  await configureI18n([
    { code: "es-AR", languageCode: "es", fallbackCulture: null, isEnabled: true, isDefault: true },
    { code: "en-US", languageCode: "en", fallbackCulture: "es-AR", isEnabled: true, isDefault: false },
  ], "es-AR");
});

beforeEach(() => {
  previewResponse = basePreview;
  previewRequests = [];
  acceptRequests = [];
  signinRedirect = vi.fn(async () => {});
  signoutRedirect = vi.fn(async () => {});
  server.use(
    http.get("/api/me", () => HttpResponse.json(businessUser)),
    http.get("/api/auth/external/google/antiforgery", () => HttpResponse.json({ requestToken: "test-antiforgery" })),
    http.post("/api/invitations/preview", async ({ request }) => {
      previewRequests.push({
        url: request.url,
        body: await request.json(),
        antiforgery: request.headers.get("RequestVerificationToken"),
      });
      return HttpResponse.json(previewResponse);
    }),
    http.post("/api/invitations/accept", async ({ request }) => {
      acceptRequests.push({
        url: request.url,
        body: await request.json(),
        antiforgery: request.headers.get("RequestVerificationToken"),
        idempotencyKey: request.headers.get("Idempotency-Key"),
      });
      return HttpResponse.json({ organizationId: "tenant-invited", createdAccount: true, needsPersonalLoginMethod: true });
    }),
  );
});

function show(options: { entry?: string; signedInAs?: "business" | "consumer" } = {}) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  const user = options.signedInAs ? {
    access_token: "test-session-token",
    profile: {
      sub: "current-user",
      access: options.signedInAs,
      tenant_id: options.signedInAs === "business" ? "own-organization" : undefined,
      email: "lucia@example.test",
      name: "Lucía",
    },
  } as unknown as User : undefined;
  const auth = {
    isAuthenticated: user !== undefined,
    isLoading: false,
    user,
    signinRedirect,
    signoutRedirect,
    signinSilent: async () => user,
  } as unknown as AuthContextProps;
  const router = createMemoryRouter([
    { path: "/invitacion", element: <InvitationPage /> },
    { path: "/org", element: <main>{"Destino organización"}</main> },
    { path: "/cuenta", element: <main>{"Destino cuenta"}</main> },
    { path: "/", element: <main>{"Destino personal"}</main> },
  ], { initialEntries: [options.entry ?? `/invitacion#${invitationToken}`] });
  const view = render(<AppProviders client={client} authContext={auth}><RouterProvider router={router} /></AppProviders>);
  return { ...view, client, router, auth };
}

describe("InvitationPage", () => {
  it("consulta el token del fragmento por JSON, limpia la URL y acepta una identidad nueva sin Personal", async () => {
    const originalWidth = window.innerWidth;
    Object.defineProperty(window, "innerWidth", { configurable: true, value: 390 });
    const replaceState = vi.spyOn(window.history, "replaceState");
    try {
      const { container, client } = show();
      expect(await screen.findByRole("heading", { name: "Te sumás a Grupo Delta" })).toBeVisible();
      expect(screen.getByText("La invitación es para invitada@example.test.")).toBeVisible();
      expect(screen.getByText("Lucía Fernández te invitó")).toBeVisible();
      expect(screen.queryByText("Empresa")).not.toBeInTheDocument();
      expect(screen.queryByText("Roles")).not.toBeInTheDocument();
      expect(await axe(container)).toHaveNoViolations();

      expect(replaceState).toHaveBeenCalledWith(null, "", "/invitacion");
      expect(previewRequests).toHaveLength(1);
      expect(previewRequests[0]).toEqual({
        url: expect.stringMatching(/\/api\/invitations\/preview$/),
        body: { token: invitationToken },
        antiforgery: "test-antiforgery",
      });
      expect(JSON.stringify(client.getQueryCache().getAll().map((query) => query.queryKey)))
        .not.toContain(invitationToken);

      const consent = screen.getByRole("checkbox", { name: /Términos y la Política de privacidad/ });
      expect(consent).not.toBeChecked();
      const accept = screen.getByRole("button", { name: "Aceptar invitación" });
      expect(accept).toBeDisabled();
      fireEvent.click(consent);
      fireEvent.click(accept);

      expect(await screen.findByRole("heading", { name: "Te sumaste a Grupo Delta" })).toBeVisible();
      expect(acceptRequests).toHaveLength(1);
      expect(acceptRequests[0].url).toMatch(/\/api\/invitations\/accept$/);
      expect(acceptRequests[0].body).toEqual({ token: invitationToken, acceptedTerms: true });
      expect(acceptRequests[0].antiforgery).toBe("test-antiforgery");
      expect(acceptRequests[0].idempotencyKey).toMatch(/^[0-9a-f-]{36}$/i);
      expect(await axe(container)).toHaveNoViolations();
      expect(screen.getByRole("button", { name: "Agregar ahora" })).toBeVisible();
      expect(screen.getByRole("button", { name: "Más tarde" })).toBeVisible();
    } finally {
      replaceState.mockRestore();
      Object.defineProperty(window, "innerWidth", { configurable: true, value: originalWidth });
    }
  });

  it("reabre el ingreso como persona con el retorno fijo a /invitacion y deja la invitación protegida", async () => {
    previewResponse = { ...basePreview, state: "SignInRequired", canUseEmailCode: true, canUseGoogle: true };
    const { container } = show({ entry: "/invitacion" });
    expect(await screen.findByRole("heading", { name: "Te sumás a Grupo Delta" })).toBeVisible();
    const login = screen.getByRole("button", { name: "Ingresá para aceptar" });
    fireEvent.click(login);
    await waitFor(() => expect(signinRedirect).toHaveBeenCalledOnce());
    const options = signinRedirect.mock.calls[0][0] as { state: { returnTo: string }; extraQueryParams: { access: string } };
    expect(options.state.returnTo).toBe("/invitacion");
    expect(options.extraQueryParams.access).toBe("consumer");
    expect(JSON.stringify(options)).not.toContain(invitationToken);
    expect(acceptRequests).toHaveLength(0);
    expect(await axe(container)).toHaveNoViolations();
  });

  it("vuelve a consultar una nueva invitación en la misma ruta sin guardar tokens en claves", async () => {
    const { client, router } = show();
    expect(await screen.findByRole("heading", { name: "Te sumás a Grupo Delta" })).toBeVisible();
    const anotherToken = "another-opaque-invitation-token";
    await act(async () => router.navigate(`/invitacion#${anotherToken}`));
    await waitFor(() => expect(previewRequests).toHaveLength(2));
    expect(previewRequests[1].body).toEqual({ token: anotherToken });
    expect(JSON.stringify(client.getQueryCache().getAll().map((query) => query.queryKey)))
      .not.toContain(anotherToken);
  });

  it("acepta con la sesión propia sin volver a pedir ingreso ni mostrar términos", async () => {
    previewResponse = { ...basePreview, state: "Ready", canUseEmailCode: true };
    const { container } = show({ signedInAs: "business" });
    expect(await screen.findByRole("heading", { name: "Te sumás a Grupo Delta" })).toBeVisible();
    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Aceptar invitación" }));
    expect(await screen.findByRole("heading", { name: "Te sumaste a Grupo Delta" })).toBeVisible();
    expect(acceptRequests[0].body).toEqual({ token: invitationToken, acceptedTerms: false });
    expect(signinRedirect).not.toHaveBeenCalled();
    expect(await axe(container)).toHaveNoViolations();
  });

  it("acepta una segunda invitación sin reutilizar la confirmación ni la organización anterior", async () => {
    previewResponse = { ...basePreview, state: "Ready" };
    const { router } = show();
    fireEvent.click(await screen.findByRole("button", { name: "Aceptar invitación" }));
    expect(await screen.findByRole("heading", { name: "Te sumaste a Grupo Delta" })).toBeVisible();

    previewResponse = { ...basePreview, state: "Ready", organizationId: "second-organization", organizationName: "Grupo Norte" };
    server.use(http.post("/api/invitations/accept", async ({ request }) => {
      expect(await request.json()).toEqual({ token: "second-invitation", acceptedTerms: false });
      return HttpResponse.json({ organizationId: "second-organization", createdAccount: false, needsPersonalLoginMethod: false });
    }));
    await act(async () => router.navigate("/invitacion#second-invitation"));
    expect(await screen.findByRole("heading", { name: "Te sumás a Grupo Norte" })).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Aceptar invitación" }));
    expect(await screen.findByRole("heading", { name: "Te sumaste a Grupo Norte" })).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Entrar a la organización" }));
    await waitFor(() => expect(signinRedirect).toHaveBeenCalledWith(expect.objectContaining({
      extraQueryParams: { access: "business", tenant: "second-organization" },
    })));
  });

  it("pide nuevamente consentimiento al abrir otra invitación", async () => {
    const { router } = show();
    const consent = await screen.findByRole("checkbox", { name: /Términos y la Política de privacidad/ });
    fireEvent.click(consent);
    expect(consent).toBeChecked();
    await act(async () => router.navigate("/invitacion#second-invitation"));
    expect(await screen.findByRole("checkbox", { name: /Términos y la Política de privacidad/ })).not.toBeChecked();
    expect(screen.getByRole("button", { name: "Aceptar invitación" })).toBeDisabled();
  });

  it("ignora una aceptación que responde después de abrir otra invitación", async () => {
    let finishAcceptance!: () => void;
    const pending = new Promise<void>((resolve) => { finishAcceptance = resolve; });
    let acceptanceStarted!: () => void;
    const started = new Promise<void>((resolve) => { acceptanceStarted = resolve; });
    server.use(http.post("/api/invitations/accept", async () => {
      acceptanceStarted();
      await pending;
      return HttpResponse.json({ organizationId: "tenant-invited", createdAccount: false, needsPersonalLoginMethod: false });
    }));
    previewResponse = { ...basePreview, state: "Ready" };
    const { router, client } = show();
    fireEvent.click(await screen.findByRole("button", { name: "Aceptar invitación" }));
    await started;
    previewResponse = { ...basePreview, state: "Ready", organizationName: "Grupo Norte" };
    try {
      await act(async () => router.navigate("/invitacion#second-invitation"));
      expect(await screen.findByRole("heading", { name: "Te sumás a Grupo Norte" })).toBeVisible();
    } finally { finishAcceptance(); }
    await waitFor(() => expect(client.isMutating()).toBe(0));
    expect(screen.getByRole("heading", { name: "Te sumás a Grupo Norte" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Aceptar invitación" })).toBeEnabled();
  });

  it("permite salir y seguir con la cuenta invitada o volver al acceso actual sin aceptar", async () => {
    previewResponse = { ...basePreview, state: "WrongSession", currentAccountEmail: "lucia@example.test" };
    const { container, router } = show({ signedInAs: "business" });
    expect(await screen.findByText("Entraste como lucia@example.test y la invitación es para invitada@example.test.")).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Salir y seguir como invitada@example.test" }));
    await waitFor(() => expect(signoutRedirect).toHaveBeenCalledOnce());
    const options = signoutRedirect.mock.calls[0][0] as { post_logout_redirect_uri: string; extraQueryParams: { preserveInvitation: string } };
    expect(options.post_logout_redirect_uri).toBe(`${window.location.origin}/invitacion`);
    expect(options.extraQueryParams.preserveInvitation).toBe("true");
    expect(acceptRequests).toHaveLength(0);

    fireEvent.click(screen.getByRole("button", { name: "Seguir como Lucía" }));
    await waitFor(() => expect(router.state.location.pathname).toBe("/org"));
    expect(await screen.findByText("Destino organización")).toBeVisible();
    expect(acceptRequests).toHaveLength(0);
    expect(await axe(container)).toHaveNoViolations();
  });

  it.each([
    ["Expired", "Esta invitación venció", "Pedile a Lucía Fernández que te mande otra."],
    ["Invalid", "Esta invitación ya no sirve", "Puede que ya la hayas aceptado o que la hayan revocado. Si ya la aceptaste, entrá con tu correo."],
    ["OrganizationSuspended", "Grupo Delta no está disponible", "La organización está suspendida por ahora. Probá más tarde."],
  ] as const)("presenta el estado %s con una salida clara", async (state, title, description) => {
    previewResponse = { ...basePreview, state };
    const { container } = show({ entry: "/invitacion" });
    expect(await screen.findByRole("heading", { name: title })).toBeVisible();
    expect(screen.getByText(description)).toBeVisible();
    expect(screen.getByRole("link", { name: "Ir al ingreso" })).toHaveAttribute("href", "/login");
    expect(screen.queryByRole("button", { name: "Aceptar invitación" })).not.toBeInTheDocument();
    expect(await axe(container)).toHaveNoViolations();
  });

  it("conserva el acceso business en las acciones de la confirmación aceptada", async () => {
    previewResponse = { ...basePreview, state: "Accepted", needsPersonalLoginMethod: true };
    const { container } = show({ entry: "/invitacion" });
    expect(await screen.findByRole("heading", { name: "Te sumaste a Grupo Delta" })).toBeVisible();
    expect(screen.getByRole("status")).toHaveTextContent("Agregá un método de ingreso propio");
    fireEvent.click(screen.getByRole("button", { name: "Agregar ahora" }));
    await waitFor(() => expect(signinRedirect).toHaveBeenCalledOnce());
    expect(signinRedirect).toHaveBeenCalledWith(expect.objectContaining({
      state: { returnTo: "/cuenta" },
      extraQueryParams: { access: "business", tenant: "tenant-invited" },
    }));
    expect(await axe(container)).toHaveNoViolations();
  });

  it("usa recursos en inglés para estados y fechas cuando cambia la cultura", async () => {
    await act(async () => changeCulture("en-US"));
    previewResponse = { ...basePreview, state: "SignInRequired" };
    try {
      const { container } = show({ entry: "/invitacion" });
      expect(await screen.findByRole("heading", { name: "Join Grupo Delta" })).toBeVisible();
      expect(screen.getByRole("button", { name: "Sign in to accept" })).toBeVisible();
      expect(screen.getByText("Expires")).toBeVisible();
      expect(await axe(container)).toHaveNoViolations();
    } finally {
      await act(async () => changeCulture("es-AR"));
    }
  });
});
