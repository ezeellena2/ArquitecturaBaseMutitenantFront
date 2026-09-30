import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { HttpResponse, http } from "msw";
import { I18nextProvider } from "react-i18next";
import type { ReactNode } from "react";
import { beforeAll, describe, expect, it, vi } from "vitest";
import i18n, { configureI18n } from "@/shared/i18n";
import { server } from "@/test/mocks/server";
import { EmailCodeForm } from "./EmailCodeForm";

beforeAll(async () => {
  await configureI18n([
    { code: "es-AR", languageCode: "es", fallbackCulture: null, isEnabled: true, isDefault: true },
    { code: "en-US", languageCode: "en", fallbackCulture: "es-AR", isEnabled: true, isDefault: false },
  ]);
});

function renderForm(onCodeRequested = vi.fn()) {
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <I18nextProvider i18n={i18n}><QueryClientProvider client={client}>{children}</QueryClientProvider></I18nextProvider>
  );
  return { onCodeRequested, ...render(<EmailCodeForm onCodeRequested={onCodeRequested} />, { wrapper: Wrapper }) };
}

describe("EmailCodeForm", () => {
  it("valida el correo en su campo antes de pedir un código", async () => {
    let requests = 0;
    server.use(http.post("/api/auth/login-code", () => { requests++; return HttpResponse.json({ resendAfterSeconds: 60 }); }));
    renderForm();

    fireEvent.change(screen.getByRole("textbox", { name: "Correo electrónico" }), { target: { value: "ana@" } });
    fireEvent.click(screen.getByRole("button", { name: "Enviar código" }));

    expect(await screen.findByText("Ingresá un correo electrónico válido.")).toBeVisible();
    expect(requests).toBe(0);
  });

  it("normaliza y pide el código; pasa al mismo formulario sin revelar si la cuenta existe", async () => {
    let submitted: unknown;
    let key: string | null = null;
    server.use(http.post("/api/auth/login-code", async ({ request }) => {
      submitted = await request.json();
      key = request.headers.get("Idempotency-Key");
      return HttpResponse.json({ resendAfterSeconds: 60 }, { status: 202 });
    }));
    const { onCodeRequested } = renderForm();

    fireEvent.change(screen.getByRole("textbox", { name: "Correo electrónico" }), { target: { value: " ANA@Example.com " } });
    fireEvent.click(screen.getByRole("button", { name: "Enviar código" }));

    await waitFor(() => expect(onCodeRequested).toHaveBeenCalledOnce());
    expect(submitted).toEqual({ email: "ana@example.com" });
    expect(key).toMatch(/[\w-]+/);
    expect(onCodeRequested).toHaveBeenCalledWith(expect.objectContaining({ kind: "code", destination: "ana@example.com" }));
  });

  it("sitúa el error del servidor en el campo y 429 muestra cuenta regresiva sin reenvío automático", async () => {
    let requests = 0;
    server.use(http.post("/api/auth/login-code", () => {
      requests++;
      if (requests === 1) return HttpResponse.json({ code: "Validation.Invalid", errors: { email: ["Revisá el correo."] } }, { status: 400 });
      return HttpResponse.json({ code: "Auth.LoginCode.TooManyRequests", retryAfter: 42 }, { status: 429 });
    }));
    renderForm();
    fireEvent.change(screen.getByRole("textbox", { name: "Correo electrónico" }), { target: { value: "ana@example.com" } });
    fireEvent.click(screen.getByRole("button", { name: "Enviar código" }));
    expect(await screen.findByText("Revisá el correo.")).toBeVisible();

    fireEvent.click(screen.getByRole("button", { name: "Enviar código" }));
    expect(await screen.findByRole("button", { name: "Reintentá en 0:42" })).toBeDisabled();
    expect(screen.getByText("Pediste demasiados códigos. Probá de nuevo más tarde.")).toBeVisible();
    expect(requests).toBe(2);
  });

  it("muestra el límite por IP con el texto del mapa y el Retry-After", async () => {
    server.use(http.post("/api/auth/login-code", () => HttpResponse.json({ code: "Http.TooManyRequests", retryAfter: 30 }, { status: 429 })));
    renderForm();
    fireEvent.change(screen.getByRole("textbox", { name: "Correo electrónico" }), { target: { value: "ana@example.com" } });
    fireEvent.click(screen.getByRole("button", { name: "Enviar código" }));

    expect(await screen.findByText("Demasiadas solicitudes desde esta red.")).toBeVisible();
    expect(screen.getByRole("button", { name: "Reintentá en 0:30" })).toBeDisabled();
  });
});
