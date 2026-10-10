import { fireEvent, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HttpResponse, http } from "msw";
import { afterEach, beforeAll, beforeEach, expect, it } from "vitest";
import type { PreviewAccountRecoveryRequest, RequestLoginCodeRequest, RequestRecoveryCodeRequest, SignupRequest } from "@/shared/api/types";
import { configureI18n } from "@/shared/i18n";
import { referenceDataFixture } from "@/test/mocks/handlers";
import { server } from "@/test/mocks/server";
import { asPhone } from "@/test/utils/phone";
import { renderRouteWithProviders } from "@/test/utils/renderWithProviders";
import "./LoginPage";
import "./SignupPage";
import "./BusinessSignupPage";
import "./RecoverAccountPage";

// País todavía habilitado en el catálogo, retirado únicamente de las altas del canal.
const previousPhone = { country: "UY", number: "094 123 456" };
let restorePhone: () => void;

beforeAll(async () => configureI18n(referenceDataFixture().cultures));
beforeEach(() => {
  restorePhone = asPhone();
  const fixture = referenceDataFixture();
  server.use(
    http.get("/api/reference-data", () => HttpResponse.json({
      ...fixture,
      countries: [...fixture.countries, {
        code: "UY", alpha3: "URY", numericCode: "858", callingCode: "598",
        defaultCurrencyCode: null, defaultTimeZoneId: null,
        name: "Uruguay", isEnabled: true, sortOrder: 2,
      }],
    })),
    http.get("/api/auth/methods", () => HttpResponse.json({ channels: [
      { key: "email", countries: [] }, { key: "whatsapp", countries: ["AR"] },
    ] })),
  );
});
afterEach(() => restorePhone());

async function phoneInput() {
  fireEvent.click(await screen.findByRole("button", { name: "WhatsApp" }));
  const input = screen.getByRole("textbox", { name: /número de WhatsApp/i });
  await waitFor(() => expect(input).toBeEnabled());
  return input;
}

async function selectPreviousCountry() {
  const user = userEvent.setup();
  await user.click(screen.getByRole("combobox", { name: "País: Argentina, +54" }));
  await user.click(screen.getByRole("option", { name: "Uruguay +598" }));
  expect(screen.getByRole("combobox", { name: "País: Uruguay, +598" })).toBeVisible();
}

it.each(["/login", "/login/empresa"])("%s permite país retirado y número local de un método existente sin falsa invalidez", async (path) => {
  const requests: RequestLoginCodeRequest[] = [];
  server.use(http.post<never, RequestLoginCodeRequest>("/api/auth/login-code", async ({ request }) => {
    requests.push(await request.json());
    return HttpResponse.json({ resendAfterSeconds: 60 }, { status: 202 });
  }));
  renderRouteWithProviders(`${path}?${new URLSearchParams({ returnUrl: "/connect/authorize?client_id=web&state=original-state&code_challenge=original-pkce" })}`);
  const input = await phoneInput();
  await selectPreviousCountry();
  fireEvent.change(input, { target: { value: previousPhone.number } });
  expect(input).not.toHaveAttribute("aria-invalid", "true");
  // El pegado internacional también conserva el país del catálogo y emite un borrador nacional.
  fireEvent.change(input, { target: { value: "+598 94 123 456" } });
  expect(input).toHaveValue(previousPhone.number);
  expect(input).not.toHaveAttribute("aria-invalid", "true");
  fireEvent.click(screen.getByRole("button", { name: "Enviar código" }));
  expect(await screen.findByRole("heading", { name: "Revisá tu WhatsApp" })).toBeVisible();
  expect(requests).toEqual([{ phone: previousPhone, channel: "whatsapp" }]);
});

it("registro empresarial permite probar una identidad Phone existente de país retirado", async () => {
  const requests: SignupRequest[] = [];
  server.use(http.post<never, SignupRequest>("/api/auth/business-signup/code", async ({ request }) => {
    requests.push(await request.json());
    return HttpResponse.json({ resendAfterSeconds: 60 }, { status: 202 });
  }));
  renderRouteWithProviders("/registro/empresa");
  const input = await phoneInput();
  await selectPreviousCountry();
  fireEvent.change(input, { target: { value: previousPhone.number } });
  expect(input).not.toHaveAttribute("aria-invalid", "true");
  fireEvent.click(screen.getByRole("checkbox", { name: /Acepto los Términos/ }));
  fireEvent.click(screen.getByRole("button", { name: "Continuar" }));
  expect(await screen.findByRole("heading", { name: "Revisá tu WhatsApp" })).toBeVisible();
  expect(requests).toEqual([{ phone: previousPhone, channel: "whatsapp", acceptedTerms: true,
    culture: "es-AR", timeZoneId: expect.any(String) }]);
});

it("recuperación permite el país anterior retirado y vuelve al filtro del canal para el destino nuevo", async () => {
  const previews: PreviewAccountRecoveryRequest[] = [];
  const requests: RequestRecoveryCodeRequest[] = [];
  server.use(
    http.post<never, PreviewAccountRecoveryRequest>("/api/account-recovery/preview", async ({ request }) => {
      previews.push(await request.json());
      return new HttpResponse(null, { status: 204 });
    }),
    http.post<never, RequestRecoveryCodeRequest>("/api/account-recovery/code", async ({ request }) => {
      requests.push(await request.json());
      return HttpResponse.json({ resendAfterSeconds: 60 }, { status: 202 });
    }),
  );
  renderRouteWithProviders("/recuperar");
  const previous = await phoneInput();
  await selectPreviousCountry();
  fireEvent.change(previous, { target: { value: previousPhone.number } });
  expect(previous).not.toHaveAttribute("aria-invalid", "true");
  fireEvent.click(screen.getByRole("button", { name: "Seguir" }));
  await screen.findByRole("heading", { name: "¿Dónde te escribimos?" });
  expect(previews).toEqual([{ previousPhone }]);
  const next = await phoneInput();
  const user = userEvent.setup();
  await user.click(screen.getByRole("combobox", { name: "País: Argentina, +54" }));
  expect(screen.getAllByRole("option").map((option) => option.textContent)).toEqual(["Argentina +54"]);
  await user.keyboard("{Escape}");
  fireEvent.change(next, { target: { value: "+598 94 123 456" } });
  expect(next).toHaveAttribute("aria-invalid", "true");
  expect(screen.getByRole("combobox", { name: "País: Argentina, +54" })).toBeVisible();
  fireEvent.change(next, { target: { value: "011 15-2345-6789" } });
  expect(next).not.toHaveAttribute("aria-invalid", "true");
  fireEvent.click(screen.getByRole("button", { name: "Enviar código" }));
  expect(await screen.findByRole("heading", { name: "Revisá tu WhatsApp" })).toBeVisible();
  expect(requests).toEqual([{ phone: { country: "AR", number: "011 15-2345-6789" },
    channel: "whatsapp", nonce: expect.any(String) }]);
});

it("registro personal conserva únicamente los países del canal para números nuevos", async () => {
  renderRouteWithProviders("/registro");
  const input = await phoneInput();
  const user = userEvent.setup();
  await user.click(screen.getByRole("combobox", { name: "País: Argentina, +54" }));
  expect(screen.getAllByRole("option").map((option) => option.textContent)).toEqual(["Argentina +54"]);
  await user.keyboard("{Escape}");
  fireEvent.change(input, { target: { value: "+598 94 123 456" } });
  expect(input).toHaveAttribute("aria-invalid", "true");
  expect(screen.getByRole("combobox", { name: "País: Argentina, +54" })).toBeVisible();
});
