import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { HttpResponse, http } from "msw";
import type { ReactNode } from "react";
import { AuthContext, type AuthContextProps } from "react-oidc-context";
import { MemoryRouter } from "react-router";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { configureI18n } from "@/shared/i18n";
import { referenceDataFixture } from "@/test/mocks/handlers";
import { server } from "@/test/mocks/server";
import { BusinessSignupPage } from "./BusinessSignupPage";

vi.mock("@/shared/time/browserTimeZone", () => ({ browserTimeZone: () => "America/Argentina/Buenos_Aires" }));

beforeAll(async () => { await configureI18n(referenceDataFixture().cultures); });

const signinRedirect = vi.fn(() => Promise.resolve());

beforeEach(() => {
  signinRedirect.mockClear();
  server.use(
    http.get("/api/auth/methods", () => HttpResponse.json({ channels: [{ key: "email", countries: [] }] })),
    http.get("/api/auth/external/google/antiforgery", () => HttpResponse.json({ requestToken: "test-form-token" })),
  );
});

function show(url = "/registro/empresa", viewport = 390) {
  Object.defineProperty(window, "innerWidth", { configurable: true, value: viewport });
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  const auth = { isAuthenticated: false, isLoading: false, signinRedirect } as unknown as AuthContextProps;
  const wrapper = ({ children }: { children: ReactNode }) => <AuthContext.Provider value={auth}>
    <QueryClientProvider client={client}><MemoryRouter initialEntries={[url]}>{children}</MemoryRouter></QueryClientProvider>
  </AuthContext.Provider>;
  return render(<BusinessSignupPage />, { wrapper });
}

describe("BusinessSignupPage", () => {
  it("muestra la aprobación de términos y el alta por correo en móvil y escritorio", async () => {
    const originalWidth = window.innerWidth;
    try {
      for (const viewport of [390, 1440]) {
        const { unmount } = show("/registro/empresa", viewport);
        expect(screen.getByRole("heading", { name: "Registrá tu empresa" })).toBeVisible();
        expect(screen.getByRole("checkbox", { name: /Acepto los Términos y la Política de privacidad/ })).not.toBeChecked();
        expect(screen.getByRole("button", { name: "Continuar" })).toBeEnabled();
        expect(screen.queryByRole("alert")).not.toBeInTheDocument();
        expect(screen.getByRole("textbox", { name: "Tu correo electrónico" })).toBeVisible();
        fireEvent.click(screen.getByRole("checkbox", { name: /Acepto los Términos/ }));
        expect(screen.queryByRole("button", { name: "Seguir con Google" })).not.toBeInTheDocument();
        unmount();
      }
    } finally {
      Object.defineProperty(window, "innerWidth", { configurable: true, value: originalWidth });
    }
  });

  it("sin aceptar, Continuar y Google piden la aceptación debajo de la casilla y no envían nada", async () => {
    let requests = 0;
    server.use(
      http.get("/api/auth/methods", () => HttpResponse.json({ channels: [{ key: "email", countries: [] }, { key: "google", countries: [] }] })),
      http.post("/api/auth/business-signup/code", () => { requests += 1; return HttpResponse.json({ resendAfterSeconds: 60 }, { status: 202 }); }),
    );
    show();
    fireEvent.change(screen.getByRole("textbox", { name: "Tu correo electrónico" }), { target: { value: "mariana@example.com" } });
    fireEvent.click(screen.getByRole("button", { name: "Continuar" }));

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent("Aceptá los Términos y la Política de privacidad.");
    expect(screen.getByRole("checkbox", { name: /Acepto los Términos/ }).closest("label")?.nextElementSibling).toBe(alert);
    expect(requests).toBe(0);

    fireEvent.click(screen.getByRole("checkbox", { name: /Acepto los Términos/ }));
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("checkbox", { name: /Acepto los Términos/ }));
    const google = await screen.findByRole("button", { name: "Seguir con Google" });
    await waitFor(() => expect(google).toBeEnabled());
    fireEvent.click(google);
    expect(await screen.findByRole("alert")).toHaveTextContent("Aceptá los Términos y la Política de privacidad.");
  });

  it("verifica el correo y crea organización con slug disponible y CUIT opcional", async () => {
    let signupBody: unknown;
    let createBody: unknown;
    let createAuthorization: string | null = "unset";
    server.use(
      http.post("/api/auth/business-signup/code", async ({ request }) => {
        signupBody = await request.json();
        return HttpResponse.json({ resendAfterSeconds: 60 }, { status: 202 });
      }),
      http.post("/api/auth/business-signup/verify", () => new HttpResponse(null, { status: 204 })),
      http.get("/api/public-site/slug-availability", () => HttpResponse.json({ slug: "acme", availability: "Available" })),
      http.post("/api/auth/business-signup", async ({ request }) => {
        createBody = await request.json();
        createAuthorization = request.headers.get("authorization");
        return HttpResponse.json({ tenantId: "tenant-id", organizationName: "Acme", slug: "acme",
          requiresApproval: false, firstCompanyId: "company-id", status: "Active" });
      }),
    );

    show();
    fireEvent.click(screen.getByRole("checkbox", { name: /Acepto los Términos/ }));
    fireEvent.change(screen.getByRole("textbox", { name: "Tu correo electrónico" }), { target: { value: " ANA@Example.com " } });
    fireEvent.click(screen.getByRole("button", { name: "Continuar" }));
    expect(await screen.findByRole("heading", { name: "Revisá tu correo" })).toBeVisible();
    expect(signupBody).toMatchObject({ email: "ana@example.com", acceptedTerms: true,
      culture: "es-AR", timeZoneId: "America/Argentina/Buenos_Aires" });
    const codeGroup = screen.getByRole("group", { name: "Código" });
    fireEvent.paste(within(codeGroup).getByRole("textbox", { name: "Código 1" }), { clipboardData: { getData: () => "123456" } });
    fireEvent.click(screen.getByRole("button", { name: "Verificar" }));
    expect(await screen.findByRole("heading", { name: "Tu organización" })).toBeVisible();

    fireEvent.change(screen.getByRole("textbox", { name: "Nombre de la organización" }), { target: { value: "Acme" } });
    fireEvent.change(screen.getByRole("textbox", { name: /Dirección de tu página/ }), { target: { value: "ACME" } });
    fireEvent.change(screen.getByRole("textbox", { name: "Primera empresa" }), { target: { value: "Acme Argentina" } });
    expect(await screen.findByRole("status")).toHaveTextContent("Disponible");
    expect(screen.getByText(".plataforma.com")).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Crear organización" }));

    expect(await screen.findByRole("heading", { name: "Acme está lista" })).toBeVisible();
    expect(createBody).toEqual({ organizationName: "Acme", slug: "acme", firstCompanyName: "Acme Argentina",
      taxId: null, acceptedTerms: true });
    expect(createAuthorization).toBeNull();
    expect(signinRedirect).not.toHaveBeenCalled();
  });

  it("después de Google, «Recibimos el pedido» dice el correo al que avisamos, en negrita como el tablero", async () => {
    server.use(
      http.get("/api/public-site/slug-availability", () => HttpResponse.json({ slug: "acme", availability: "Available" })),
      http.post("/api/auth/business-signup", () => HttpResponse.json({ tenantId: "tenant-id", organizationName: "Acme",
        slug: "acme", requiresApproval: true, firstCompanyId: "company-id", status: "PendingApproval",
        notificationEmail: "valentina.ruiz@gmail.com" })),
    );
    show("/registro/empresa?google=complete");
    expect(await screen.findByRole("heading", { name: "Tu organización" })).toBeVisible();
    fireEvent.change(screen.getByRole("textbox", { name: "Nombre de la organización" }), { target: { value: "Acme" } });
    fireEvent.change(screen.getByRole("textbox", { name: /Dirección de tu página/ }), { target: { value: "acme" } });
    fireEvent.change(screen.getByRole("textbox", { name: "Primera empresa" }), { target: { value: "Acme Argentina" } });
    expect(await screen.findByRole("status")).toHaveTextContent("Disponible");
    fireEvent.click(screen.getByRole("button", { name: "Crear organización" }));

    expect(await screen.findByRole("heading", { name: "Recibimos el pedido" })).toBeVisible();
    const detail = screen.getByText((_, element) => element?.tagName === "P"
      && element.textContent === "Revisamos Acme y te avisamos a valentina.ruiz@gmail.com cuando esté aprobada.");
    expect(within(detail).getByText("valentina.ruiz@gmail.com").tagName).toBe("STRONG");
  });

  it("muestra el rechazo del slug y no permite crear la organización", async () => {
    server.use(http.get("/api/public-site/slug-availability", () => HttpResponse.json({ slug: "admin", availability: "Reserved" })));
    const created = vi.fn();
    server.use(http.post("/api/auth/business-signup", () => { created(); return HttpResponse.json({}); }));
    show("/registro/empresa?google=complete");
    expect(await screen.findByRole("heading", { name: "Tu organización" })).toBeVisible();
    fireEvent.change(screen.getByRole("textbox", { name: "Nombre de la organización" }), { target: { value: "Acme" } });
    fireEvent.change(screen.getByRole("textbox", { name: /Dirección de tu página/ }), { target: { value: "admin" } });
    fireEvent.change(screen.getByRole("textbox", { name: "Primera empresa" }), { target: { value: "Acme Argentina" } });
    expect(await screen.findByText("Esa dirección está reservada.")).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Crear organización" }));
    await waitFor(() => expect(created).not.toHaveBeenCalled());
  });

  it("envía a Google con acceso empresarial y retorno a la organización", async () => {
    server.use(http.get("/api/auth/methods", () => HttpResponse.json({ channels: [
      { key: "email", countries: [] }, { key: "google", countries: [] },
    ] })));
    show();
    fireEvent.click(screen.getByRole("checkbox", { name: /Acepto los Términos/ }));
    const google = await screen.findByRole("button", { name: "Seguir con Google" });
    await waitFor(() => expect(google).toBeEnabled());
    const form = (google as HTMLButtonElement).form!;
    expect(form).toHaveAttribute("action", "/api/auth/external/google");
    expect(new FormData(form).get("access")).toBe("business");
    expect(new FormData(form).get("returnTo")).toBe("/registro/empresa");
  });
});
