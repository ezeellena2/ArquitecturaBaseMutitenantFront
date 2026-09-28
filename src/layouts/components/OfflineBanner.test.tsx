import { render, screen } from "@testing-library/react";
import { I18nextProvider } from "react-i18next";
import { beforeAll, describe, expect, it } from "vitest";
import i18n, { configureI18n } from "@/shared/i18n";
import { OfflineBanner } from "./OfflineBanner";

beforeAll(async () => {
  await configureI18n([
    { code: "es-AR", languageCode: "es", fallbackCulture: null, isEnabled: true, isDefault: true },
    { code: "en-US", languageCode: "en", fallbackCulture: "es-AR", isEnabled: true, isDefault: false },
  ]);
});

describe("OfflineBanner", () => {
  it("anuncia el aviso en español y usa el token del texto", () => {
    render(<I18nextProvider i18n={i18n}><OfflineBanner /></I18nextProvider>);

    expect(screen.getByRole("status", { name: "Sin conexión" })).toHaveClass("bg-[var(--t1)]");
  });
});
