import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { HttpResponse, http } from "msw";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
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

beforeEach(() => server.use(http.get("/api/auth/external/google/antiforgery",
  () => HttpResponse.json({ requestToken: "test-form-token" }))));

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

  it("en Registro sin aceptar queda habilitado y al tocarlo pide la aceptación sin salir", async () => {
    server.use(http.get("/api/auth/methods", () => HttpResponse.json({ channels: [{ key: "google", countries: [] }] })));
    const onTermsRequired = vi.fn();
    const submitted = vi.fn();
    show(<GoogleButton mode="signup" acceptedTerms={false} onTermsRequired={onTermsRequired} returnTo="/" />);
    const button = await screen.findByRole("button", { name: "Registrarte con Google" });
    await waitFor(() => expect(button).toBeEnabled());
    (button as HTMLButtonElement).form!.addEventListener("submit", (event) => { event.preventDefault(); submitted(); });

    fireEvent.click(button);

    expect(onTermsRequired).toHaveBeenCalledOnce();
    expect(submitted).not.toHaveBeenCalled();
  });

  it("en Registro con aceptación navega por POST con antiforgery y retorno interno", async () => {
    server.use(http.get("/api/auth/methods", () => HttpResponse.json({ channels: [{ key: "google", countries: [] }] })));
    const onTermsRequired = vi.fn();
    show(<GoogleButton mode="signup" acceptedTerms onTermsRequired={onTermsRequired} returnTo="/catalogo?grupo=1" />);
    const button = await screen.findByRole("button", { name: "Registrarte con Google" });
    await waitFor(() => expect(button).toBeEnabled());
    const submitted = vi.fn();
    (button as HTMLButtonElement).form!.addEventListener("submit", (event) => { event.preventDefault(); submitted(); });
    fireEvent.click(button);
    expect(submitted).toHaveBeenCalledOnce();
    expect(onTermsRequired).not.toHaveBeenCalled();
    const form = (button as HTMLButtonElement).form!;
    expect(form).toHaveAttribute("method", "post");
    expect(form).toHaveAttribute("action", "/api/auth/external/google");
    expect(new FormData(form).get("__RequestVerificationToken")).toBe("test-form-token");
    expect(new FormData(form).get("acceptedTerms")).toBe("true");
    expect(new FormData(form).get("returnTo")).toBe("/catalogo?grupo=1");
    expect(screen.queryByRole("link", { name: "Registrarte con Google" })).not.toBeInTheDocument();
  });

  it("envía la cultura efectiva al alta Google sin alterar la puerta de ingreso", async () => {
    server.use(http.get("/api/auth/methods", () => HttpResponse.json({ channels: [{ key: "google", countries: [] }] })));
    await act(async () => changeCulture("en-US"));
    try {
      show(<GoogleButton mode="signup" acceptedTerms onTermsRequired={() => {}} returnTo="/" />);
      const button = await screen.findByRole("button", { name: "Sign up with Google" });
      await waitFor(() => expect(button).toBeEnabled());
      const form = (button as HTMLButtonElement).form!;
      expect(new FormData(form).get("culture")).toBe("en-US");
      expect(new FormData(form).get("timeZoneId")).toBe("America/Argentina/Buenos_Aires");
    } finally {
      await act(async () => changeCulture("es-AR"));
    }
  });
});
