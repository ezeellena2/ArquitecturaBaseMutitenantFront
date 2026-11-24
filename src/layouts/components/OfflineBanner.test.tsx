import { render, screen } from "@testing-library/react";
import { I18nextProvider } from "react-i18next";
import { beforeAll, describe, expect, it } from "vitest";
import i18n, { configureI18n } from "@/shared/i18n";
import { AppChromeProvider } from "@/shared/ui/app/AppChrome";
import { OfflineBanner } from "./OfflineBanner";

beforeAll(async () => {
  await configureI18n([
    { code: "es-AR", languageCode: "es", fallbackCulture: null, isEnabled: true, isDefault: true },
    { code: "en-US", languageCode: "en", fallbackCulture: "es-AR", isEnabled: true, isDefault: false },
  ]);
});

describe("OfflineBanner", () => {
  // Tablero Avisos («Sin conexión», .w-cartel.o-prob) y 210: en la compu, el cartel que bloquea, blanco, con el filo y el
  // ícono rojos y el texto en la tinta de siempre.
  it("anuncia el aviso en español, blanco con el filo y el ícono rojos", () => {
    render(<I18nextProvider i18n={i18n}><OfflineBanner /></I18nextProvider>);

    const banner = screen.getByRole("status", { name: "Sin conexión" });
    expect(banner).toHaveClass("bg-[var(--superficie)]", "text-[var(--t1)]", "border-l-[3px]", "border-l-[var(--peligro)]");
    expect(banner.querySelector("svg")).toHaveClass("text-[var(--peligro)]");
  });

  // Tablero M-Avisos («Sin conexión»): en el teléfono es la banda debajo de la barra, blanca con el filo rojo (210).
  it("en el teléfono es la banda de error", () => {
    render(<I18nextProvider i18n={i18n}><AppChromeProvider value={{ phone: true, parent: null, subtitle: null, hideBottomNav: () => {} }}><OfflineBanner /></AppChromeProvider></I18nextProvider>);

    expect(screen.getByRole("status", { name: "Sin conexión" })).toHaveClass("bg-[var(--superficie)]", "border-l-[var(--peligro)]", "text-[0.90625rem]");
  });
});
