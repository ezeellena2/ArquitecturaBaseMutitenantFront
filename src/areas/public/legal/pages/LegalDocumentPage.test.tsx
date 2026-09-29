import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { HttpResponse, http } from "msw";
import type { ReactNode } from "react";
import { MemoryRouter } from "react-router";
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
import { SiteLayout } from "@/layouts/SiteLayout";
import { FormatProvider } from "@/shared/format/useFormat";
import { changeCulture, configureI18n } from "@/shared/i18n";
import { server } from "@/test/mocks/server";
import { LegalDocumentPage } from "./LegalDocumentPage";

const demonstration = {
  "es-AR": {
    terms: "DOCUMENTO DE DEMOSTRACIÓN. Esta plantilla no incluye términos legales. Reemplazá este texto antes de publicar.",
    privacy: "DOCUMENTO DE DEMOSTRACIÓN. Esta plantilla no incluye una política de privacidad. Reemplazá este texto antes de publicar.",
  },
  "en-US": {
    terms: "DEMONSTRATION DOCUMENT. This template does not include legal terms. Replace this text before publishing.",
    privacy: "DEMONSTRATION DOCUMENT. This template does not include a privacy policy. Replace this text before publishing.",
  },
} as const;

beforeAll(async () => {
  await configureI18n([
    { code: "es-AR", languageCode: "es", fallbackCulture: null, isEnabled: true, isDefault: true },
    { code: "en-US", languageCode: "en", fallbackCulture: "es-AR", isEnabled: true, isDefault: false },
  ]);
});
afterEach(async () => { await changeCulture("es-AR"); });

function show(kind: "terms" | "privacy") {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={client}><FormatProvider><MemoryRouter><SiteLayout variant="legal">{children}</SiteLayout></MemoryRouter></FormatProvider></QueryClientProvider>;
  return render(<LegalDocumentPage kind={kind} />, { wrapper });
}

describe("LegalDocumentPage", () => {
  it("lee Términos vigentes y muestra la versión real, fecha y cuerpo a 1440", async () => {
    server.use(http.get("/api/legal/terms", () => HttpResponse.json({ id: "terms-id", kind: "Terms", version: 1, effectiveAtUtc: "2026-09-01T15:00:00Z", culture: "es-AR", text: demonstration["es-AR"].terms })));
    const { container } = show("terms");
    expect(await screen.findByRole("heading", { name: "Términos y condiciones" })).toBeVisible();
    expect(screen.getByText(/Versión/)).toHaveTextContent("Versión 1 · vigente desde 01/09/2026");
    expect(screen.getByRole("article", { name: "Términos y condiciones" })).toHaveTextContent(demonstration["es-AR"].terms);
    expect(await axe(container)).toHaveNoViolations();
  });

  it("lee Privacidad en la cultura de la pantalla a 390 sin fijar versión de muestra", async () => {
    await changeCulture("en-US");
    let requestedCulture: string | null = null;
    server.use(http.get("/api/legal/privacy", ({ request }) => {
      requestedCulture = request.headers.get("accept-language");
      return HttpResponse.json({ id: "privacy-id", kind: "Privacy", version: 1, effectiveAtUtc: "2026-09-01T15:00:00Z", culture: "en-US", text: demonstration["en-US"].privacy });
    }));
    const originalWidth = window.innerWidth;
    Object.defineProperty(window, "innerWidth", { configurable: true, value: 390 });
    try {
      const { container } = show("privacy");
      expect(await screen.findByRole("heading", { name: "Privacy Policy" })).toBeVisible();
      expect(screen.getByText(/Version/)).toHaveTextContent("Version 1 · effective since 09/01/2026");
      expect(screen.getByRole("article", { name: "Privacy Policy" })).toHaveTextContent(demonstration["en-US"].privacy);
      expect(requestedCulture).toBe("en-US");
      expect(await axe(container)).toHaveNoViolations();
    } finally { Object.defineProperty(window, "innerWidth", { configurable: true, value: originalWidth }); }
  });

  it.each([
    ["privacy", "es-AR", "Política de privacidad", demonstration["es-AR"].privacy],
    ["terms", "en-US", "Terms and Conditions", demonstration["en-US"].terms],
  ] as const)("muestra %s v1 de demostración en %s", async (kind, culture, title, text) => {
    await changeCulture(culture);
    server.use(http.get(`/api/legal/${kind}`, () => HttpResponse.json({ id: `${kind}-id`, kind, version: 1, effectiveAtUtc: "2026-09-01T15:00:00Z", culture, text })));
    show(kind);
    expect(await screen.findByRole("article", { name: title })).toHaveTextContent(text);
  });
});
