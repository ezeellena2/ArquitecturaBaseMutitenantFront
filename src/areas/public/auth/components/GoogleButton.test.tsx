import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, render, screen, waitFor } from "@testing-library/react";
import { HttpResponse, http } from "msw";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { changeCulture, configureI18n } from "@/shared/i18n";
import { server } from "@/test/mocks/server";
import { GoogleButton } from "./GoogleButton";

vi.mock("@/shared/time/browserTimeZone", () => ({ browserTimeZone: () => "America/Argentina/Buenos_Aires" }));

beforeAll(async () => {
  await configureI18n([
    { code: "es-AR", languageCode: "es", fallbackCulture: null, isEnabled: true, isDefault: true },
    { code: "en-US", languageCode: "en", fallbackCulture: "es-AR", isEnabled: true, isDefault: false },
  ]);
});

function show(button: React.ReactNode) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={client}>{button}</QueryClientProvider>);
}

describe("GoogleButton", () => {
  it("usa la ruta authorize local y conserva la puerta empresarial", async () => {
    server.use(http.get("/api/auth/methods", () => HttpResponse.json({ channels: [{ key: "email", countries: [] }, { key: "google", countries: [] }] })));
    show(<GoogleButton mode="login" access="business" returnUrl="/connect/authorize?client_id=web&response_type=code" />);
    const link = await screen.findByRole("link", { name: "Ingresar con Google" });
    expect(link).toHaveAttribute("href", "/api/auth/external/google?returnUrl=%2Fconnect%2Fauthorize%3Fclient_id%3Dweb%26response_type%3Dcode&access=business");
    expect(link).toHaveClass("bg-[var(--lado-activo)]");
    expect(link).not.toHaveClass("bg-background");
  });

  it("oculta Google cuando la API no registra ese canal", async () => {
    const requested = vi.fn();
    server.use(http.get("/api/auth/methods", () => { requested(); return HttpResponse.json({ channels: [{ key: "email", countries: [] }] }); }));
    show(<GoogleButton mode="login" access="consumer" returnUrl="/connect/authorize?client_id=web" />);
    await waitFor(() => expect(requested).toHaveBeenCalledOnce());
    expect(screen.queryByRole("link", { name: /Google/ })).not.toBeInTheDocument();
  });

  it("en Registro exige la aceptación y la incluye en el challenge junto al retorno interno", async () => {
    server.use(http.get("/api/auth/methods", () => HttpResponse.json({ channels: [{ key: "google", countries: [] }] })));
    const view = show(<GoogleButton mode="signup" acceptedTerms={false} returnTo="/catalogo?grupo=1" />);
    expect(await screen.findByRole("button", { name: "Registrarte con Google" })).toBeDisabled();
    view.rerender(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><GoogleButton mode="signup" acceptedTerms returnTo="/catalogo?grupo=1" /></QueryClientProvider>);
    const link = await screen.findByRole("link", { name: "Registrarte con Google" });
    expect(link).toHaveAttribute("href", "/api/auth/external/google?signup=true&acceptedTerms=true&returnTo=%2Fcatalogo%3Fgrupo%3D1&culture=es-AR&timeZoneId=America%2FArgentina%2FBuenos_Aires");
  });

  it("envía la cultura efectiva al alta Google sin alterar la puerta de ingreso", async () => {
    server.use(http.get("/api/auth/methods", () => HttpResponse.json({ channels: [{ key: "google", countries: [] }] })));
    await act(async () => changeCulture("en-US"));
    try {
      show(<GoogleButton mode="signup" acceptedTerms returnTo="/" />);
      const link = await screen.findByRole("link", { name: "Sign up with Google" });
      const url = new URL(link.getAttribute("href")!, location.origin);
      expect(url.searchParams.get("culture")).toBe("en-US");
      expect(url.searchParams.get("timeZoneId")).toBe("America/Argentina/Buenos_Aires");
    } finally {
      await act(async () => changeCulture("es-AR"));
    }
  });
});
